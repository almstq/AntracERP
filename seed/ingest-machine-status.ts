/**
 * Antrac ERP — Machine-status ingestion (suppliers + inventory items + asset
 * status fixes + backdated issue tickets) from the field report:
 *   "Machine Status as of 14/05/2026 till 02/06/2026"
 *
 * Idempotent: skips suppliers/items already present (by name) and tickets that
 * already exist (by assetCode + description). Asset status fixes and ticket
 * asset-links are matched against the live `assets` collection by make/model/site;
 * the dry-run prints every match so you can verify before committing.
 *
 * Usage:
 *   Dry run (writes nothing, prints the full plan + asset matches):
 *     npx tsx seed/ingest-machine-status.ts "<service-account.json>"
 *   Commit:
 *     npx tsx seed/ingest-machine-status.ts "<service-account.json>" --commit
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const args = process.argv.slice(2);
const serviceAccountPath = args.find((a) => !a.startsWith('--'));
const commit = args.includes('--commit');

if (!serviceAccountPath) {
  console.error('Usage: npx tsx seed/ingest-machine-status.ts "<service-account.json>" [--commit]');
  process.exit(1);
}

const ORG = 'antrac-holding';
const SBU = 'sbu-wli';
const REPORTED = new Date('2026-05-14T00:00:00Z'); // field-report "as of" date

// eslint-disable-next-line @typescript-eslint/no-require-imports
const serviceAccount = require(require('path').resolve(serviceAccountPath));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// ── 1. Suppliers ──────────────────────────────────────────────────────────────
interface SeedSupplier { name: string; country: string; categories: string[] }
const SUPPLIERS: SeedSupplier[] = [
  { name: 'ELM Marine', country: 'Maldives', categories: ['marine parts'] },
  { name: 'Welding Engineering Works (WEW)', country: 'Maldives', categories: ['fabrication', 'welding', 'service'] },
  { name: 'Leo Trade', country: 'Maldives', categories: ['tools', 'consumables'] },
  { name: 'Anam Trade', country: 'Maldives', categories: ['batteries', 'electrical'] },
  { name: 'Parts Master', country: 'Maldives', categories: ['parts'] },
  { name: 'Al Dahr', country: 'United Arab Emirates', categories: ['hydraulics', 'heavy-equipment parts'] },
];

// ── 2. Inventory items (category · uom · supplier-name hint) ─────────────────────
interface SeedItem { name: string; category: 'parts' | 'consumables' | 'tools' | 'other'; uom: string; supplier?: string }
const ITEMS: SeedItem[] = [
  { name: 'Grease gun', category: 'tools', uom: 'pcs' },
  { name: 'Pressure washer', category: 'tools', uom: 'pcs' },
  { name: 'Air compressor', category: 'tools', uom: 'pcs', supplier: 'Leo Trade' },
  { name: 'Oil spray gun', category: 'tools', uom: 'pcs', supplier: 'Leo Trade' },
  { name: 'Pressure air gun', category: 'tools', uom: 'pcs', supplier: 'Leo Trade' },
  { name: 'Welding machine', category: 'tools', uom: 'pcs' },
  { name: 'Grease', category: 'consumables', uom: 'kg', supplier: 'Leo Trade' },
  { name: 'Water hose 50ft', category: 'consumables', uom: 'roll', supplier: 'Leo Trade' },
  { name: 'Compressor hose 50ft', category: 'consumables', uom: 'roll', supplier: 'Leo Trade' },
  { name: 'Hose clip 10pcs', category: 'parts', uom: 'pack', supplier: 'Leo Trade' },
  { name: '3-core cable (extension cord)', category: 'consumables', uom: 'roll', supplier: 'Leo Trade' },
  { name: 'Grinding wheel 4"', category: 'consumables', uom: 'pcs', supplier: 'Leo Trade' },
  { name: 'Cup brush 4"', category: 'consumables', uom: 'pcs', supplier: 'Leo Trade' },
  { name: 'Under coat paint', category: 'consumables', uom: 'tin', supplier: 'Leo Trade' },
  { name: 'Wire clip (crocodile clip)', category: 'parts', uom: 'pcs', supplier: 'Leo Trade' },
  { name: 'Pin bolt 8" 16mm half-thread w/ lock nut', category: 'parts', uom: 'pcs' },
  { name: 'Welding rod', category: 'consumables', uom: 'box' },
  { name: 'Bucket shim 100mm(ID) x 160mm(OD) 2mm/3mm', category: 'parts', uom: 'pcs', supplier: 'Welding Engineering Works (WEW)' },
  { name: 'Battery 12V / 100A', category: 'parts', uom: 'pcs', supplier: 'Anam Trade' },
  { name: 'Battery clamp 8pcs', category: 'parts', uom: 'pack', supplier: 'Anam Trade' },
  { name: 'Cable lug 8pcs', category: 'parts', uom: 'pack', supplier: 'Anam Trade' },
  { name: 'Battery wires 20ft', category: 'consumables', uom: 'roll', supplier: 'Anam Trade' },
  { name: 'Boom steel bush (Komatsu PC350)', category: 'parts', uom: 'pcs', supplier: 'ELM Marine' },
  { name: 'Hydraulic pump (Komatsu PC350)', category: 'parts', uom: 'pcs', supplier: 'Al Dahr' },
  { name: 'Head gasket (Komatsu PC350)', category: 'parts', uom: 'pcs', supplier: 'Parts Master' },
  { name: 'Perspex sheet (cabin side glass)', category: 'parts', uom: 'sheet' },
  { name: 'Arm-to-bucket link bush', category: 'parts', uom: 'pcs', supplier: 'Welding Engineering Works (WEW)' },
  { name: 'Bucket bush', category: 'parts', uom: 'pcs', supplier: 'Welding Engineering Works (WEW)' },
  { name: 'Hydraulic hose (Kobelco SK380)', category: 'parts', uom: 'pcs', supplier: 'Welding Engineering Works (WEW)' },
  { name: 'Door glass (Volvo A40G)', category: 'parts', uom: 'pcs' },
];

// ── 3. Asset status fixes + 4. backdated tickets (matched to live assets) ────────
type Op = 'operational' | 'down' | 'maintenance' | 'idle';
interface MachineRecord {
  make: RegExp; model: RegExp; site: string;        // asset matcher
  op: Op;                                            // corrected operational status
  knownIssue: string;
  ticket: { description: string; urgency: 'critical' | 'urgent' | 'routine'; status: string };
}
const MACHINES: MachineRecord[] = [
  {
    make: /komatsu/i, model: /pc350/i, site: 'muthaafushi', op: 'maintenance',
    knownIssue: 'Boom steel bush replacement — part at ELM Marine (paid 1 Jun), fabricating at WEW.',
    ticket: { description: 'Boom steel bush needs replacement. Part available at ELM Marine — sent for payment 14 May, paid 1 Jun; fabricating at WEW.', urgency: 'urgent', status: 'gm_approved' },
  },
  {
    make: /kobelco/i, model: /sk380|380/i, site: 'muthaafushi', op: 'down',
    knownIssue: 'Battery burst; wiring/lugs, hyd. tank door hinges, cabin side glass (Perspex), arm-to-bucket & bucket bushes (fabricating), hydraulic hose.',
    ticket: { description: 'Multiple faults: battery to be replaced with wiring/lugs; hydraulic tank outer door hinges; cabin side glass (Perspex requested); arm-to-bucket link & bucket bush damage (fabricating); hydraulic hose damage (fabrication ongoing).', urgency: 'critical', status: 'gm_approved' },
  },
  {
    make: /volvo/i, model: /a40g/i, site: 'muthaafushi', op: 'maintenance',
    knownIssue: 'Door glass broken.',
    ticket: { description: 'The door glass is broken and needs to be fixed.', urgency: 'routine', status: 'submitted' },
  },
  {
    make: /cat|caterpillar/i, model: /745/i, site: 'bodufinolhu', op: 'maintenance',
    knownIssue: 'AC + start-motor power given directly (needs proper programming per Lkamal); back tyre damage.',
    ticket: { description: 'AC and start-motor power supply given directly — needs to be programmed properly (per Lkamal). Back tyre has damage.', urgency: 'urgent', status: 'diagnosed' },
  },
  {
    make: /komatsu/i, model: /pc350/i, site: 'bodufinolhu', op: 'maintenance',
    knownIssue: 'Machine slow — hydraulic pump replacement (2nd hydraulic pump quotation requested from Dubai).',
    ticket: { description: 'Machine running slow; hydraulic pump needs replacement. Second hydraulic pump quotation requested from Dubai.', urgency: 'routine', status: 'gm_approved' },
  },
];

// A second Bodufinolhu PC350 (High Bed) — only used if two PC350 exist at the site.
const MACHINE_PC350_HIGH: MachineRecord = {
  make: /komatsu/i, model: /pc350/i, site: 'bodufinolhu', op: 'maintenance',
  knownIssue: 'Slow — hydraulic pump (Al Dahr quote); head gasket overheating (Parts Master quote).',
  ticket: { description: 'Machine slow; hydraulic pump replacement (quotation requested from Al Dahr, Dubai). Head gasket to be replaced — overheats after a few hours (quote received from Parts Master).', urgency: 'urgent', status: 'gm_approved' },
};

async function main() {
  console.log(`\n=== Machine-status ingestion — ${commit ? 'COMMIT' : 'DRY RUN'} ===\n`);

  // Load live collections we reconcile against.
  const [supSnap, itemSnap, assetSnap, ticketSnap] = await Promise.all([
    db.collection('suppliers').get(),
    db.collection('inventoryItems').get(),
    db.collection('assets').get(),
    db.collection('tickets').get(),
  ]);
  const existingSuppliers = new Map(supSnap.docs.map((d) => [norm(String(d.data().name ?? '')), d.id]));
  const existingItems = new Set(itemSnap.docs.map((d) => norm(String(d.data().name ?? ''))));
  const assets = assetSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
  const existingTickets = ticketSnap.docs.map((d) => d.data() as Record<string, unknown>);

  const ym = '202605';
  let ticketSeq = ticketSnap.size;
  let itemSeq = itemSnap.size;

  // 1) Suppliers
  console.log('— Suppliers —');
  const supplierIdByName = new Map<string, string>();
  for (const s of SUPPLIERS) {
    const key = norm(s.name);
    if (existingSuppliers.has(key)) {
      supplierIdByName.set(s.name, existingSuppliers.get(key)!);
      console.log(`  skip (exists): ${s.name}`);
      continue;
    }
    const ref = db.collection('suppliers').doc();
    supplierIdByName.set(s.name, ref.id);
    console.log(`  + ${s.name} [${s.country}] — ${s.categories.join(', ')}`);
    if (commit) {
      await ref.set({ name: s.name, country: s.country, categories: s.categories, active: true, createdAt: FieldValue.serverTimestamp() });
    }
  }

  // 2) Inventory items
  console.log('\n— Inventory items —');
  for (const it of ITEMS) {
    if (existingItems.has(norm(it.name))) { console.log(`  skip (exists): ${it.name}`); continue; }
    itemSeq += 1;
    const code = `ITM-${ym}-${String(itemSeq).padStart(3, '0')}`;
    const supId = it.supplier ? supplierIdByName.get(it.supplier) : undefined;
    console.log(`  + ${code}  ${it.name}  (${it.category}/${it.uom})${it.supplier ? `  ← ${it.supplier}` : ''}`);
    if (commit) {
      await db.collection('inventoryItems').add({
        code, name: it.name, category: it.category, uom: it.uom,
        avgCost: 0, supplierIds: supId ? [supId] : [], active: true,
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  // 3 + 4) Asset status fixes + backdated tickets
  console.log('\n— Asset fixes + backdated tickets —');
  const usedAssetIds = new Set<string>();
  const records = [...MACHINES];
  // Add the High-Bed PC350 only if Bodufinolhu actually has a second PC350.
  const boduPc350 = assets.filter((a) => /komatsu/i.test(String(a.make)) && /pc350/i.test(String(a.model)) && a.currentSiteId === 'bodufinolhu');
  if (boduPc350.length > 1) records.push(MACHINE_PC350_HIGH);

  for (const r of records) {
    const match = assets.find((a) =>
      r.make.test(String(a.make)) && r.model.test(String(a.model)) &&
      a.currentSiteId === r.site && !usedAssetIds.has(a.id));
    if (!match) { console.log(`  ⚠ no asset match: ${r.make}/${r.model} @ ${r.site} — ticket skipped`); continue; }
    usedAssetIds.add(match.id);
    const code = String(match.code ?? match.id);
    const label = `${match.code} — ${match.make} ${match.model} (${match.type})`;

    // Asset status fix
    console.log(`  ~ asset ${code}: operationalStatus → ${r.op}`);
    if (commit) await db.collection('assets').doc(match.id).update({ operationalStatus: r.op, knownIssue: r.knownIssue });

    // Backdated ticket (idempotent by assetCode + description)
    const dup = existingTickets.some((t) => String(t.assetCode) === code && norm(String(t.description)) === norm(r.ticket.description));
    if (dup) { console.log(`    skip ticket (exists) for ${code}`); continue; }
    ticketSeq += 1;
    const displayId = `TKT-${ym}-${String(ticketSeq).padStart(3, '0')}`;
    console.log(`    + ${displayId}  ${code}  [${r.ticket.status}/${r.ticket.urgency}]  reported ${REPORTED.toISOString().slice(0, 10)}`);
    if (commit) {
      await db.collection('tickets').add({
        displayId, orgId: ORG, sbuId: SBU,
        assetId: match.id, assetCode: code, assetLabel: label,
        siteId: r.site, raisedById: 'system-import',
        reportedAt: Timestamp.fromDate(REPORTED),
        status: r.ticket.status, urgency: r.ticket.urgency,
        description: r.ticket.description,
        materialRequired: false, serviceRequired: false, materials: [], services: [], documents: [],
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  console.log(`\n=== ${commit ? 'DONE — committed.' : 'DRY RUN complete — re-run with --commit to write.'} ===\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
