/**
 * Antrac ERP — WLI Staff Register seed / upsert.
 *
 * Source: WLI_Staff_Roster.md (Rostro app export, 2026-06-02, 34 staff)
 * merged with WL-EMP IDs from WL_Ops_Command_Center_Claude_DB_Ingestion.md.
 *
 * New vs. ops-center:
 *   WL-EMP-0007  R L Walapita Godellage → full name fixed to Ruwan Lakmal Walapita Godellage
 *   WL-EMP-0032  Alkas Miah              (new)
 *   WL-EMP-0033  MD Sajib Sarkar         (new)
 *   WL-EMP-0034  MD Zohir                (new)
 *   WL-EMP-0035  Paulson Sahaya Rajan    (new)
 *   WL-EMP-0036  Regin Devathason        (new)
 *   WL-EMP-0037  Ripon Mia               (new)
 *
 * Mode: UPSERT by displayId — safe to re-run, does not wipe existing records or
 * clear asset assignments. Only the fields listed below are written/overwritten.
 *
 * Usage:
 *   Dry run (print plan, write nothing):
 *     npx tsx seed/seed-staff.ts "<service-account.json>"
 *   Commit:
 *     npx tsx seed/seed-staff.ts "<service-account.json>" --commit
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
const serviceAccountPath = args.find((a) => !a.startsWith('--'));
const commit = args.includes('--commit');

if (!serviceAccountPath) {
  console.error('Usage: npx tsx seed/seed-staff.ts "<service-account.json>" [--commit]');
  process.exit(1);
}

const ORG = 'antrac-holding';
const SBU = 'sbu-wli';

const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

type StaffEntry = {
  displayId: string;
  name: string;
  designation: string;
  staffType: string;
  role: string;
  employmentType?: 'local' | 'expat';
};

// prettier-ignore
const ROSTER: StaffEntry[] = [
  { displayId: 'WL-EMP-0001', name: 'Ali Shameem',                      designation: 'Senior Captain',                  staffType: 'captain',       role: 'operator' },
  { displayId: 'WL-EMP-0002', name: 'Anuar Hussain',                    designation: 'Crew, LCT 1',                     staffType: 'vessel_crew',   role: 'operator',    employmentType: 'expat' },
  { displayId: 'WL-EMP-0003', name: 'Nasrulla Ali',                     designation: 'Senior Captain',                  staffType: 'captain',       role: 'operator' },
  { displayId: 'WL-EMP-0004', name: 'Shahjalal',                        designation: 'Driver Cum Assistant Mechanic',   staffType: 'driver',        role: 'operator' },
  { displayId: 'WL-EMP-0005', name: 'MD Robel Miah',                    designation: 'Crew, Tug Boat',                  staffType: 'vessel_crew',   role: 'operator',    employmentType: 'expat' },
  { displayId: 'WL-EMP-0007', name: 'Ruwan Lakmal Walapita Godellage',  designation: 'Crane Operator',                  staffType: 'operator',      role: 'operator' },
  { displayId: 'WL-EMP-0008', name: 'Mohammad Nurul Amin',              designation: 'Welder',                          staffType: 'support_staff', role: 'operator' },
  { displayId: 'WL-EMP-0009', name: 'Janaka Prasath Ekanayake',         designation: 'Senior Supervisor',               staffType: 'supervisor',    role: 'supervisor' },
  { displayId: 'WL-EMP-0010', name: 'Sheikh Mohamed Farid Miah',        designation: 'Crew, LCT 1',                     staffType: 'vessel_crew',   role: 'operator',    employmentType: 'expat' },
  { displayId: 'WL-EMP-0011', name: 'MD Jakir Hossain',                 designation: 'Crew, LCT 1',                     staffType: 'vessel_crew',   role: 'operator',    employmentType: 'expat' },
  { displayId: 'WL-EMP-0012', name: 'Ala Uddin',                        designation: 'Crew, Tug Boat',                  staffType: 'vessel_crew',   role: 'operator',    employmentType: 'expat' },
  { displayId: 'WL-EMP-0013', name: 'Ibrahim Mohamed',                  designation: 'Supervisor Cum Mechanic',         staffType: 'supervisor',    role: 'supervisor' },
  { displayId: 'WL-EMP-0014', name: 'Mokhles',                          designation: 'Crew, Tug Boat',                  staffType: 'vessel_crew',   role: 'operator',    employmentType: 'expat' },
  { displayId: 'WL-EMP-0015', name: 'Mohammad Naim',                    designation: 'Terminal Staff',                  staffType: 'terminal_staff',role: 'operator' },
  { displayId: 'WL-EMP-0016', name: 'Asif Mia',                         designation: 'Terminal Staff',                  staffType: 'terminal_staff',role: 'operator' },
  { displayId: 'WL-EMP-0017', name: 'MD Kamrul Islam',                  designation: 'Helper-WL',                       staffType: 'support_staff', role: 'operator' },
  { displayId: 'WL-EMP-0018', name: 'Yeasin Miah',                      designation: 'Crew, Tug Boat',                  staffType: 'vessel_crew',   role: 'operator',    employmentType: 'expat' },
  { displayId: 'WL-EMP-0019', name: 'MD Moyna Mia',                     designation: 'Heavy Vehicle Driver',            staffType: 'driver',        role: 'operator' },
  { displayId: 'WL-EMP-0020', name: 'Eswararao Chekka',                 designation: 'Excavator Operator',              staffType: 'operator',      role: 'operator' },
  { displayId: 'WL-EMP-0021', name: 'Soundarraj Muniyappan',            designation: 'Excavator Operator',              staffType: 'operator',      role: 'operator' },
  { displayId: 'WL-EMP-0022', name: 'Abdul Haq',                        designation: 'Helper-WL',                       staffType: 'support_staff', role: 'operator' },
  { displayId: 'WL-EMP-0023', name: 'MD Ramjan Mia',                    designation: 'Helper-WL',                       staffType: 'support_staff', role: 'operator' },
  { displayId: 'WL-EMP-0024', name: 'MD Sayed Mia',                     designation: 'Carpenter',                       staffType: 'support_staff', role: 'operator' },
  { displayId: 'WL-EMP-0025', name: 'Uzzal Sutradhar',                  designation: 'Carpenter',                       staffType: 'support_staff', role: 'operator' },
  { displayId: 'WL-EMP-0026', name: 'Anish John',                       designation: 'Excavator Operator',              staffType: 'operator',      role: 'operator' },
  { displayId: 'WL-EMP-0027', name: 'Easa Qasim',                       designation: 'Crew, LCT 1',                     staffType: 'vessel_crew',   role: 'operator',    employmentType: 'local' },
  { displayId: 'WL-EMP-0028', name: 'Jackson Ndirangu Nginga',          designation: 'Mechanic-WL',                     staffType: 'mechanic',      role: 'mechanic' },
  { displayId: 'WL-EMP-0029', name: 'Feroskhan Meerasa',                designation: 'Excavator Operator',              staffType: 'operator',      role: 'operator' },
  // new — not in ops-center source doc
  { displayId: 'WL-EMP-0032', name: 'Alkas Miah',                       designation: 'Heavy Vehicle Driver',            staffType: 'driver',        role: 'operator' },
  { displayId: 'WL-EMP-0033', name: 'MD Sajib Sarkar',                  designation: 'Truck Driver',                    staffType: 'driver',        role: 'operator' },
  { displayId: 'WL-EMP-0034', name: 'MD Zohir',                         designation: 'Excavator Operator',              staffType: 'operator',      role: 'operator' },
  { displayId: 'WL-EMP-0035', name: 'Paulson Sahaya Rajan',             designation: 'Marine Mechanic, Supervisor',     staffType: 'mechanic',      role: 'mechanic' },
  { displayId: 'WL-EMP-0036', name: 'Regin Devathason',                 designation: 'Diesel Mechanic, WL',             staffType: 'mechanic',      role: 'mechanic' },
  { displayId: 'WL-EMP-0037', name: 'Ripon Mia',                        designation: 'Heavy Vehicle Driver',            staffType: 'driver',        role: 'operator' },
];

// Antrac Holding staff who oversee WLI sites (e.g. project managers).
// Kept under the Holding org + a separate SBU so they DON'T appear in the
// WLI 34-person roster, but are still selectable as a site in-charge.
const HOLDING_SBU = 'antrac-hq';
const HOLDING_STAFF: StaffEntry[] = [
  { displayId: 'ANT-EMP-0001', name: 'Sampath', designation: 'Project Manager', staffType: 'supervisor', role: 'supervisor' },
];

async function main() {
  console.log(`\n=== Staff Register Seed (${commit ? 'COMMIT — upsert' : 'DRY RUN'}) ===`);
  console.log(`WLI: ${ROSTER.length} · Holding: ${HOLDING_STAFF.length}\n`);

  const rows = [
    ...ROSTER.map((s) => ({ ...s, orgId: ORG, sbuId: SBU })),
    ...HOLDING_STAFF.map((s) => ({ ...s, orgId: ORG, sbuId: HOLDING_SBU })),
  ].map((s) => ({
    id: slug(s.displayId),
    displayId: s.displayId,
    name: s.name,
    designation: s.designation,
    staffType: s.staffType,
    role: s.role,
    orgId: s.orgId,
    sbuId: s.sbuId,
    status: 'active',
    ...((s as StaffEntry).employmentType ? { employmentType: (s as StaffEntry).employmentType } : {}),
    documents: [],
    sourceId: s.displayId,
  }));

  if (!commit) {
    rows.forEach((r) => console.log(`  ${r.displayId}  ${r.name}  (${r.designation})`));
    console.log(`\nDRY RUN — nothing written. Re-run with --commit to upsert.`);
    return;
  }

  const serviceAccount = JSON.parse(readFileSync(resolve(serviceAccountPath!), 'utf-8'));
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();

  let written = 0;
  for (let i = 0; i < rows.length; i += 400) {
    const batch = db.batch();
    rows.slice(i, i + 400).forEach(({ id, ...data }) => {
      batch.set(
        db.collection('staff').doc(id),
        { ...data, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }, // upsert — preserves assignedAssetId and any manual edits
      );
      written++;
    });
    await batch.commit();
  }

  console.log(`✓ Upserted ${written} staff records into Firestore.`);
  console.log('  Refresh the Staff Register page to see the full list.');
}

main().catch((e) => { console.error(e); process.exit(1); });
