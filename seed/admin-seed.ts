/**
 * Antrac ERP — Phase 2B Admin Seed
 *
 * Usage:
 *   npx ts-node --esm seed/admin-seed.ts <uid> <path-to-service-account.json>
 *
 * Example:
 *   npx ts-node --esm seed/admin-seed.ts jD7xvbVpSTONcYRZM4EiXyQjjPx2 "C:\Users\Ali Musthaq\Downloads\antracerpjsonsecret"
 *
 * What this seeds:
 *   - orgs collection: antrac-holding + 3 SBUs
 *   - sites collection: 5 WLI sites
 *   - users collection: super_admin doc for the provided uid
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const [,, uid, serviceAccountPath] = process.argv;

if (!uid || !serviceAccountPath) {
  console.error('Usage: npx ts-node --esm seed/admin-seed.ts <uid> <path-to-service-account.json>');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(resolve(serviceAccountPath), 'utf-8'));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const now = FieldValue.serverTimestamp();

const ORGS = [
  { id: 'antrac-holding', name: 'Antrac Holding', type: 'holding', status: 'active', createdAt: now },
  { id: 'sbu-wli', name: 'Well Land Investment', type: 'sbu', sbuType: 'wli', parentId: 'antrac-holding', status: 'active', createdAt: now },
  { id: 'sbu-mpl', name: 'Maldives Petroleum Link', type: 'sbu', sbuType: 'mpl', parentId: 'antrac-holding', status: 'active', createdAt: now },
  { id: 'sbu-ems', name: 'Expert Motor Services', type: 'sbu', sbuType: 'ems', parentId: 'antrac-holding', status: 'active', createdAt: now },
];

const SITES = [
  { id: 'thilafushi', name: 'Thilafushi Yard', type: 'yard', orgId: 'antrac-holding', sbuId: 'sbu-wli', status: 'active', location: { lat: 4.1797, lng: 73.4360 }, createdAt: now },
  { id: 'bodufinolhu', name: 'Bodufinolhu Site', type: 'project', orgId: 'antrac-holding', sbuId: 'sbu-wli', status: 'active', location: { lat: 3.9200, lng: 73.5300 }, createdAt: now },
  { id: 'muthaafushi', name: 'Muthaafushi Site', type: 'project', orgId: 'antrac-holding', sbuId: 'sbu-wli', status: 'active', location: { lat: 4.9300, lng: 72.9600 }, createdAt: now },
  { id: 'goidhoo', name: 'Goidhoo Site', type: 'project', orgId: 'antrac-holding', sbuId: 'sbu-wli', status: 'active', location: { lat: 5.0247, lng: 72.9667 }, createdAt: now },
  { id: 'male-hq', name: 'Malé HQ', type: 'hq', orgId: 'antrac-holding', sbuId: 'sbu-wli', status: 'active', location: { lat: 4.1755, lng: 73.5093 }, createdAt: now },
];

const SUPPLIERS = [
  { id: 'iepl-india', name: 'IEPL India', country: 'India', categories: ['parts', 'hydraulic'], contactEmail: 'sales@iepl.in' },
  { id: 'parts-master', name: 'Parts Master', country: 'Maldives', categories: ['parts', 'consumables'], contactEmail: 'info@partsmaster.mv' },
  { id: 'rkl-trading', name: 'RKL Trading', country: 'Sri Lanka', categories: ['parts', 'tools'], contactEmail: 'orders@rkl.lk' },
  { id: 'island-hydraulics', name: 'Island Hydraulics', country: 'Maldives', categories: ['hydraulic', 'service'], contactEmail: 'service@islandhyd.mv' },
  { id: 'gulf-heavy-spares', name: 'Gulf Heavy Spares', country: 'UAE', categories: ['parts', 'electrical'], contactEmail: 'sales@gulfheavy.ae' },
];

const STAFF = [
  { id: 'st-001', displayId: 'ST-001', name: 'Janaka Perera', role: 'operator', designation: 'Heavy Vehicle Operator', siteId: 'thilafushi' },
  { id: 'st-002', displayId: 'ST-002', name: 'Sampath Silva', role: 'supervisor', designation: 'Site Supervisor', siteId: 'thilafushi' },
  { id: 'st-003', displayId: 'ST-003', name: 'Hassan Ali', role: 'mechanic', designation: 'Senior Mechanic', siteId: 'thilafushi' },
  { id: 'st-004', displayId: 'ST-004', name: 'Fathima Ibrahim', role: 'proc_staff', designation: 'Procurement Officer', siteId: 'male-hq' },
  { id: 'st-005', displayId: 'ST-005', name: 'Nasheed Moosa', role: 'inventory_staff', designation: 'Inventory Controller', siteId: 'thilafushi' },
  { id: 'st-006', displayId: 'ST-006', name: 'Ahmed Waheed', role: 'operator', designation: 'Crane Operator', siteId: 'bodufinolhu' },
];

// WLI Fleet / Vessel register — representative heavy equipment across sites.
const ASSETS = [
  { id: 'wl-hv-0002', code: 'WL-HV-0002', make: 'VOLVO', model: 'A40G', type: 'Hauler Dump Truck', assetClass: 'vehicle', currentSiteId: 'muthaafushi', operationalStatus: 'operational' },
  { id: 'wl-hv-0003', code: 'WL-HV-0003', make: 'CATERPILLAR', model: '320D', type: 'Excavator', assetClass: 'equipment', currentSiteId: 'bodufinolhu', operationalStatus: 'operational' },
  { id: 'wl-hv-0007', code: 'WL-HV-0007', make: 'LIEBHERR', model: 'LTM 1050', type: 'Mobile Crane', assetClass: 'equipment', currentSiteId: 'thilafushi', operationalStatus: 'operational' },
  { id: 'wl-hv-0008', code: 'WL-HV-0008', make: 'KOMATSU', model: 'PC350', type: 'High Bed Excavator', assetClass: 'equipment', currentSiteId: 'thilafushi', operationalStatus: 'down' },
  { id: 'wl-hv-0009', code: 'WL-HV-0009', make: 'KOBELCO', model: 'SK380', type: 'High Bed Excavator', assetClass: 'equipment', currentSiteId: 'thilafushi', operationalStatus: 'operational' },
  { id: 'wl-hv-0011', code: 'WL-HV-0011', make: 'BOMAG', model: 'BW211', type: 'Road Roller', assetClass: 'equipment', currentSiteId: 'goidhoo', operationalStatus: 'operational' },
  { id: 'wl-hv-0014', code: 'WL-HV-0014', make: 'CATERPILLAR', model: 'D6', type: 'Bulldozer', assetClass: 'equipment', currentSiteId: 'goidhoo', operationalStatus: 'idle' },
  { id: 'wl-hv-0018', code: 'WL-HV-0018', make: 'TOYOTA', model: '8FD30', type: 'Forklift', assetClass: 'vehicle', currentSiteId: 'bodufinolhu', operationalStatus: 'operational' },
  { id: 'wl-gn-0003', code: 'WL-GN-0003', make: 'CUMMINS', model: 'C150D5', type: 'Generator', assetClass: 'equipment', currentSiteId: 'muthaafushi', operationalStatus: 'operational' },
  { id: 'wl-vs-0001', code: 'WL-VS-0001', make: 'DAMEN', model: 'Stan 2606', type: 'Landing Craft', assetClass: 'vessel', currentSiteId: 'male-hq', operationalStatus: 'operational' },
];

async function seed() {
  console.log('[seed] Starting Antrac ERP seed...');
  console.log(`[seed] UID: ${uid}`);

  const batch = db.batch();

  // Orgs
  for (const org of ORGS) {
    const { id, ...data } = org;
    batch.set(db.collection('orgs').doc(id), data);
  }
  console.log(`[seed] Queued ${ORGS.length} orgs`);

  // Sites
  for (const site of SITES) {
    const { id, ...data } = site;
    batch.set(db.collection('sites').doc(id), data);
  }
  console.log(`[seed] Queued ${SITES.length} sites`);

  // Assets (fleet / vessel register)
  for (const asset of ASSETS) {
    const { id, ...data } = asset;
    batch.set(db.collection('assets').doc(id), { ...data, orgId: 'antrac-holding', sbuId: 'sbu-wli', createdAt: now });
  }
  console.log(`[seed] Queued ${ASSETS.length} assets`);

  // Suppliers
  for (const sup of SUPPLIERS) {
    const { id, ...data } = sup;
    batch.set(db.collection('suppliers').doc(id), { ...data, active: true, createdAt: now });
  }
  console.log(`[seed] Queued ${SUPPLIERS.length} suppliers`);

  // Staff register
  for (const s of STAFF) {
    const { id, ...data } = s;
    batch.set(db.collection('staff').doc(id), { ...data, orgId: 'antrac-holding', sbuId: 'sbu-wli', status: 'active', documents: [], createdAt: now, updatedAt: now });
  }
  console.log(`[seed] Queued ${STAFF.length} staff`);

  // Super admin user doc
  batch.set(db.collection('users').doc(uid), {
    email: 'a.musthaq@gmail.com',
    role: 'super_admin',
    orgId: 'antrac-holding',
    orgName: 'Antrac Holding',
    siteAssignments: [],
    createdAt: now,
  });
  console.log(`[seed] Queued super_admin user doc for ${uid}`);

  await batch.commit();

  console.log('[seed] Done. Firestore seeded successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
