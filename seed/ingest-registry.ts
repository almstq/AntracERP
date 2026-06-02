/**
 * Antrac ERP — WL Ops Registry mass-ingestion (assets + staff).
 *
 * Reads the converted registry MD, maps fleet/marine → `assets` and staff → `staff`,
 * and writes to Firestore. See docs/REGISTRY_INGESTION_PLAN.md.
 *
 * Mode (decided 2026-06-02): REPLACE — clears existing assets + staff, imports fresh.
 * Duplicate WL-HV-0007 → import first, flag the second. Issues kept as `knownIssue`.
 *
 * Usage:
 *   Dry run (writes nothing, prints the full plan + flags):
 *     npx tsx seed/ingest-registry.ts "<service-account.json>"
 *   Commit (REPLACE assets + staff, then import):
 *     npx tsx seed/ingest-registry.ts "<service-account.json>" --commit
 *   Commit + wipe demo transactions (tickets/PRs/POs/workOrders):
 *     npx tsx seed/ingest-registry.ts "<service-account.json>" --commit --wipe-demo
 *   Custom MD path:
 *     ... --md "D:\\!starq\\.claude_code_sync\\WL_Ops_Command_Center_Claude_DB_Ingestion.md"
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
const serviceAccountPath = args.find((a) => !a.startsWith('--'));
const commit = args.includes('--commit');
const wipeDemo = args.includes('--wipe-demo');
const mdArg = args[args.indexOf('--md') + 1];
const MD_PATH = (args.includes('--md') && mdArg)
  ? mdArg
  : 'D:\\!starq\\.claude_code_sync\\WL_Ops_Command_Center_Claude_DB_Ingestion.md';

if (!serviceAccountPath) {
  console.error('Usage: npx ts-node --esm seed/ingest-registry.ts "<service-account.json>" [--commit] [--md <path>]');
  process.exit(1);
}

const ORG = 'antrac-holding';
const SBU = 'sbu-wli';

const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const clean = (v: unknown) => (v == null || v === '' || v === '—' || v === 'N/A' ? undefined : String(v).trim());

// ── source → ERP mappers ──────────────────────────────────────────────────────
function siteIdFor(loc?: string | null): string {
  const s = (loc ?? '').toLowerCase();
  if (/thilafushi/.test(s)) return 'thilafushi';
  if (/bodufinolhu/.test(s)) return 'bodufinolhu';
  if (/muthaafushi/.test(s)) return 'muthaafushi';
  if (/goidhoo/.test(s)) return 'goidhoo';
  if (/mal[eé]/.test(s)) return 'male-hq';
  return '';
}
function assetClassFor(type?: string | null): 'vehicle' | 'equipment' {
  const t = (type ?? '').toLowerCase();
  if (/truck|hauler|pickup|lorry|trailer/.test(t)) return 'vehicle';
  return 'equipment'; // excavators, cranes, loaders, bobcat, forklift, dozer …
}
function opStatusFor(status?: string | null): 'operational' | 'down' | 'maintenance' | 'idle' {
  const s = (status ?? '').toLowerCase();
  if (/grounded/.test(s)) return 'down';
  if (/drydock/.test(s)) return 'maintenance';
  if (/operational|active|running/.test(s)) return 'operational';
  return 'idle'; // standby, unknown, ordered/pending
}
function staffTypeFor(desig?: string | null): string | undefined {
  const d = (desig ?? '').toLowerCase();
  if (/gm|general manager/.test(d)) return undefined;
  if (/supervisor/.test(d)) return 'supervisor';
  if (/captain/.test(d)) return 'captain';
  if (/crew/.test(d)) return 'vessel_crew';
  if (/operator/.test(d)) return 'operator';
  if (/driver/.test(d)) return 'driver';
  if (/mechanic/.test(d)) return 'mechanic';
  if (/terminal/.test(d)) return 'terminal_staff';
  if (/welder|carpenter|helper/.test(d)) return 'support_staff';
  return 'support_staff';
}
function roleFor(desig?: string | null): string {
  const d = (desig ?? '').toLowerCase();
  if (/gm|general manager/.test(d)) return 'gm';
  if (/supervisor/.test(d)) return 'supervisor';
  if (/mechanic/.test(d)) return 'mechanic';
  return 'operator';
}

// ── MD parsing — pull the `### Records` JSON array for a named table ───────────
function extractTable(md: string, name: string): Record<string, unknown>[] {
  const head = md.indexOf('## Table: `' + name + '`');
  if (head < 0) return [];
  const rec = md.indexOf('### Records', head);
  const fence = md.indexOf('```json', rec);
  const start = md.indexOf('\n', fence) + 1;
  const end = md.indexOf('```', start);
  return JSON.parse(md.slice(start, end).trim());
}

async function main() {
  const md = readFileSync(resolve(MD_PATH), 'utf-8');
  const fleet = extractTable(md, 'fleet_status');
  const marine = extractTable(md, 'marine_vessels');
  const staffRows = extractTable(md, 'staff_register');
  const operators = extractTable(md, 'operators');

  const flags: string[] = [];

  // staff→asset assignments (operators table + marine captains)
  const assignment: Record<string, string> = {}; // empId → asset code
  for (const o of operators) {
    const emp = clean(o.staff_id), a = clean(o.assigned_asset_id);
    if (emp && a) assignment[emp] = a;
  }
  for (const v of marine) {
    const cap = String(v.captain_in_charge ?? '');
    const m = cap.match(/\(WL-EMP-(\d+)\)/);
    if (m) assignment['WL-EMP-' + m[1]] = String(v.vessel_id);
  }

  // ── Build assets ──
  const seen = new Set<string>();
  const assets: Record<string, unknown>[] = [];
  for (const r of fleet) {
    const code = clean(r.fleet_id);
    if (!code) continue;
    if (seen.has(code)) { flags.push(`DUPLICATE fleet_id ${code} (${r.vehicle_type}) — SKIPPED, assign a unique ID manually.`); continue; }
    seen.add(code);
    const loc = clean(r.current_location);
    const site = siteIdFor(loc);
    if (loc && !site) flags.push(`Asset ${code}: location "${loc}" → unmapped, currentSiteId left blank.`);
    const project = clean(r.assigned_project);
    const rentalRaw = String(r.rental_eligible ?? '').trim();
    const rentalEligible = /yes|✓|true/i.test(rentalRaw) ? true : /no|✗|false/i.test(rentalRaw) ? false : undefined;
    assets.push({
      id: slug(code), code, make: clean(r.brand) ?? '', model: clean(r.model) ?? '', type: clean(r.vehicle_type) ?? '',
      assetClass: assetClassFor(r.vehicle_type as string), orgId: ORG, sbuId: SBU,
      currentSiteId: site, operationalStatus: opStatusFor(r.status as string),
      commercialStatus: project ? 'deployed' : 'available',
      condition: clean(r.condition),
      rentalEligible,
      regNo: clean(r.reg_no), chassisNo: clean(r.chassis_no), engineNo: clean(r.engine_no),
      knownIssue: clean(r.known_issue),
      issueHistory: clean(r.issue_history),
      assignedProject: project,
      lastMaintenanceText: clean(r.last_maintenance),
      nextMaintDue: clean(r.next_maint_due),
      sourceId: code,
    });
  }
  for (const v of marine) {
    const code = clean(v.vessel_id);
    if (!code) continue;
    assets.push({
      id: slug(code), code, make: '', model: clean(v.name_ref) ?? '', type: clean(v.type) ?? 'Vessel',
      assetClass: 'vessel', orgId: ORG, sbuId: SBU,
      currentSiteId: '', operationalStatus: opStatusFor(v.status as string), commercialStatus: 'available',
      trackingId: code === 'WL-MV-0001' ? '18599' : undefined, // LCT 1 — FollowMe ID
      knownIssue: clean(v.known_issues_notes),
      regNo: clean(v.reg_no),
      hullImo: clean(v.hull_imo),
      engine1Serial: clean(v.engine_1_serial),
      engine2Serial: clean(v.engine_2_serial),
      capacityNotes: clean(v.capacity_notes),
      vesselPermitNo: clean(v.permit_no),
      vesselPermitExpiry: clean(v.permit_expiry),
      insuranceExpiry: clean(v.insurance_expiry),
      lastInspection: clean(v.last_inspection),
      drydockStart: clean(v.drydock_start),
      drydockEstEnd: clean(v.drydock_est_end),
      sourceId: code,
    });
  }

  // ── Build staff ──
  const staff: Record<string, unknown>[] = [];
  for (const s of staffRows) {
    const did = clean(s.staff_id);
    if (!did) continue;
    const assignedCode = assignment[did];
    // merge operator-table data for this staff member
    const opRow = operators.find((o) => clean(o.staff_id) === did);
    staff.push({
      id: slug(did), displayId: did, name: clean(s.full_name) ?? did,
      role: roleFor(s.designation as string), staffType: staffTypeFor(s.designation as string),
      designation: clean(s.designation) ?? '', orgId: ORG, sbuId: SBU,
      siteId: siteIdFor(clean(s.current_location)) || undefined,
      assignedAssetId: assignedCode ? slug(assignedCode) : undefined,
      status: 'active', employmentStatus: clean(s.status),
      nationality: clean(s.nationality), grade: clean(s.grade),
      joinedDateText: clean(s.joined_date), contactNo: clean(s.contact_no),
      category: clean(s.category),
      workPermitStatus: clean(s.work_permit_status),
      permitNo: clean(s.permit_no),
      permitExpiry: clean(s.permit_expiry),
      notes: clean(s.notes),
      licenceNoClass: opRow ? clean(opRow.licence_no_class) : undefined,
      documents: [], sourceId: did,
    });
  }

  // strip undefined (Firestore rejects undefined)
  const strip = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

  // ── Report ──
  console.log(`\n=== WL Ops Registry Ingestion (${commit ? 'COMMIT' : 'DRY RUN'}) ===`);
  console.log(`Source: ${MD_PATH}`);
  console.log(`Assets: ${assets.length}  (heavy ${assets.filter((a) => a.assetClass !== 'vessel').length}, marine ${assets.filter((a) => a.assetClass === 'vessel').length})`);
  console.log(`Staff:  ${staff.length}   (assigned to an asset: ${staff.filter((s) => s.assignedAssetId).length})`);
  console.log(`\nFlags (${flags.length}):`);
  flags.forEach((f) => console.log('  • ' + f));
  console.log('\nSample asset:', JSON.stringify(strip(assets[0]), null, 2));
  console.log('Sample staff:', JSON.stringify(strip(staff[0]), null, 2));

  if (!commit) {
    console.log(`\nDRY RUN — nothing written. Re-run with --commit to REPLACE assets+staff and import.`);
    if (wipeDemo) console.log('  (--wipe-demo present: tickets/PRs/POs/workOrders/enquiries would also be wiped)');
    return;
  }

  // ── COMMIT (REPLACE) ──
  const serviceAccount = JSON.parse(readFileSync(resolve(serviceAccountPath!), 'utf-8'));
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();

  async function wipe(col: string) {
    const snap = await db.collection(col).get();
    let n = 0;
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = db.batch();
      snap.docs.slice(i, i + 400).forEach((d) => { batch.delete(d.ref); n++; });
      await batch.commit();
    }
    console.log(`  wiped ${n} from ${col}`);
  }
  async function writeAll(col: string, rows: Record<string, unknown>[]) {
    for (let i = 0; i < rows.length; i += 400) {
      const batch = db.batch();
      rows.slice(i, i + 400).forEach((r) => {
        const { id, ...data } = r as { id: string };
        batch.set(db.collection(col).doc(id), { ...strip(data as Record<string, unknown>), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      });
      await batch.commit();
    }
    console.log(`  wrote ${rows.length} to ${col}`);
  }

  console.log('\nCOMMIT — REPLACE mode:');
  if (wipeDemo) {
    console.log('  --wipe-demo: clearing demo transactions…');
    await wipe('tickets');
    await wipe('purchaseRequests');
    await wipe('purchaseOrders');
    await wipe('workOrders');
    await wipe('enquiries');
    console.log('  demo transactions wiped.');
  }
  await wipe('assets');
  await wipe('staff');
  await writeAll('assets', assets);
  await writeAll('staff', staff);
  console.log('\n✓ Done. Refresh the Asset & Staff registers.');
}

main().catch((e) => { console.error(e); process.exit(1); });
