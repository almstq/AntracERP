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
  { id: 'thilafushi', name: 'Thilafushi Yard', type: 'yard', orgId: 'antrac-holding', sbuId: 'sbu-wli', status: 'active', createdAt: now },
  { id: 'bodufinolhu', name: 'Bodufinolhu Site', type: 'project', orgId: 'antrac-holding', sbuId: 'sbu-wli', status: 'active', createdAt: now },
  { id: 'muthaafushi', name: 'Muthaafushi Site', type: 'project', orgId: 'antrac-holding', sbuId: 'sbu-wli', status: 'active', createdAt: now },
  { id: 'goidhoo', name: 'Goidhoo Site', type: 'project', orgId: 'antrac-holding', sbuId: 'sbu-wli', status: 'active', createdAt: now },
  { id: 'male-hq', name: 'Malé HQ', type: 'hq', orgId: 'antrac-holding', sbuId: 'sbu-wli', status: 'active', createdAt: now },
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
