/**
 * Super Admin seed draft — Phase 2A
 * 
 * Run this script AFTER creating the Firebase Auth user manually.
 * Get the uid from Firebase Auth console, then run:
 *   npx ts-node seed/admin-seed.ts <uid>
 * 
 * This is a DRAFT — no real Firebase writes until Phase 2B.
 */

import type { Org, Site } from '../src/types/org';

// Seed data
const ORGS: Org[] = [
  { id: 'antrac-holding', name: 'Antrac Holding', type: 'holding', status: 'active', createdAt: new Date() },
  { id: 'sbu-wli', name: 'Well Land Investment', type: 'sbu', sbuType: 'wli', parentId: 'antrac-holding', status: 'active', createdAt: new Date() },
  { id: 'sbu-mpl', name: 'Maldives Petroleum Link', type: 'sbu', sbuType: 'mpl', parentId: 'antrac-holding', status: 'active', createdAt: new Date() },
  { id: 'sbu-ems', name: 'Expert Motor Service', type: 'sbu', sbuType: 'ems', parentId: 'antrac-holding', status: 'active', createdAt: new Date() },
];

const SITES: Omit<Site, 'id'>[] = [
  { name: 'Site A — Hulhumalé', type: 'project', orgId: 'antrac-holding', sbuId: 'sbu-wli', status: 'active', createdAt: new Date() },
  { name: 'Site B — Airport', type: 'project', orgId: 'antrac-holding', sbuId: 'sbu-wli', status: 'active', createdAt: new Date() },
  { name: 'Harbor Yard', type: 'yard', orgId: 'antrac-holding', sbuId: 'sbu-wli', status: 'active', createdAt: new Date() },
];

const SEED_USERS: { email: string; role: string; orgId: string; siteAssignments: string[] }[] = [
  { email: 'alie.mustarq@gmail.com', role: 'super_admin', orgId: 'antrac-holding', siteAssignments: [] },
  { email: 'ibrahim@antrac.com', role: 'wli_gm', orgId: 'sbu-wli', siteAssignments: ['site-a', 'site-b'] },
  { email: 'ahmed@antrac.com', role: 'wli_site_manager', orgId: 'sbu-wli', siteAssignments: ['site-a'] },
  { email: 'hassan@antrac.com', role: 'wli_mechanic', orgId: 'sbu-wli', siteAssignments: ['site-a'] },
];

console.log('[seed] Antrac ERP Super Admin seed draft');
console.log('[seed] Orgs:', ORGS.length);
console.log('[seed] Sites:', SITES.length);
console.log('[seed] Users:', SEED_USERS.length);
console.log('[seed] TODO: Create Firebase Auth user for alie.mustarq@gmail.com, then run with uid');
