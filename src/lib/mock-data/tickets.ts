import type { MockTicket, MockUser, MockSite } from './types';

export const MOCK_USERS: MockUser[] = [
  { uid: 'user-super', displayName: 'Super Admin', email: 'admin@antrac.mv', role: 'super_admin', orgId: 'antrac-holding', siteIds: [] },
  { uid: 'user-operator', displayName: 'Janaka Operator', email: 'janaka@antrac.com', role: 'operator', orgId: 'sbu-wli', siteIds: ['thilafushi'] },
  { uid: 'user-mech', displayName: 'Hassan Mechanic', email: 'hassan@antrac.com', role: 'mechanic', orgId: 'sbu-wli', siteIds: ['thilafushi'] },
  { uid: 'user-super-v', displayName: 'Sampath Supervisor', email: 'sampath@antrac.com', role: 'supervisor', orgId: 'sbu-wli', siteIds: ['thilafushi'] },
  { uid: 'user-gm', displayName: 'Ibrahim GM', email: 'ibrahim@antrac.com', role: 'gm', orgId: 'sbu-wli', siteIds: ['thilafushi', 'bodufinolhu', 'muthaafushi', 'goidhoo'] },
  { uid: 'user-proc', displayName: 'Fathima Procurement', email: 'fathima@antrac.com', role: 'proc_staff', orgId: 'sbu-wli', siteIds: ['bodufinolhu'] },
  { uid: 'user-fin-wli', displayName: 'Aishath WLI Finance', email: 'aishath@antrac.com', role: 'finance_wli', orgId: 'sbu-wli', siteIds: [] },
  { uid: 'user-inv', displayName: 'Nasheed Inventory', email: 'nasheed@antrac.com', role: 'inventory_staff', orgId: 'sbu-wli', siteIds: ['thilafushi'] },
  { uid: 'user-antrac-fin', displayName: 'Mariyam Antrac Finance', email: 'mariyam@antrac.com', role: 'antrac_finance', orgId: 'antrac-holding', siteIds: [] },
  { uid: 'user-cfo', displayName: 'Shahid CFO', email: 'shahid@antrac.com', role: 'cfo', orgId: 'antrac-holding', siteIds: [] },
  { uid: 'user-director', displayName: 'Ali Director', email: 'director@antrac.com', role: 'director', orgId: 'antrac-holding', siteIds: [] },
];

export const MOCK_SITES: MockSite[] = [
  { id: 'thilafushi', name: 'Thilafushi', type: 'project' },
  { id: 'bodufinolhu', name: 'Bodufinolhu', type: 'project' },
  { id: 'muthaafushi', name: 'Muthaafushi', type: 'project' },
  { id: 'goidhoo', name: 'Goidhoo', type: 'project' },
  { id: 'male-hq', name: 'Malé HQ', type: 'hq' },
];

export const MOCK_TICKETS: MockTicket[] = [
  {
    id: 'ticket-1', displayId: 'IR-2026-0001',
    title: 'Crane hydraulic leak — Thilafushi',
    description: 'Crane 3 showing hydraulic fluid leak at the base joint. Leak rate increasing.',
    type: 'issue', severity: 'critical', status: 'open',
    siteId: 'thilafushi', raisedById: 'user-operator',
    items: [{ description: 'Inspect hydraulic line', quantity: 1, type: 'service' }],
    createdAt: '2026-05-27T08:00:00Z', updatedAt: '2026-05-27T08:00:00Z',
  },
  {
    id: 'ticket-2', displayId: 'IR-2026-0002',
    title: 'Generator preventive maintenance',
    description: 'Scheduled 500-hour maintenance for backup generator at Thilafushi.',
    type: 'maintenance', severity: 'medium', status: 'mechanic_review',
    siteId: 'thilafushi', raisedById: 'user-operator',
    items: [{ description: 'Oil change kit', quantity: 1, type: 'part' }, { description: 'Filter replacement', quantity: 1, type: 'part' }],
    createdAt: '2026-05-26T14:30:00Z', updatedAt: '2026-05-27T09:15:00Z',
  },
  {
    id: 'ticket-3', displayId: 'IR-2026-0003',
    title: 'Dozer track tension adjustment',
    description: 'Dozer D6 track tension needs adjustment and inspection.',
    type: 'service', severity: 'low', status: 'supervisor_review',
    siteId: 'thilafushi', raisedById: 'user-mech',
    items: [{ description: 'Track tension gauge reading', quantity: 1, type: 'service' }],
    createdAt: '2026-05-25T11:00:00Z', updatedAt: '2026-05-27T10:00:00Z',
  },
  {
    id: 'ticket-4', displayId: 'IR-2026-0004',
    title: 'Forklift transmission noise — Bodufinolhu',
    description: 'Forklift unit FL-004 making grinding noise in 2nd gear.',
    type: 'issue', severity: 'high', status: 'gm_approved',
    siteId: 'bodufinolhu', raisedById: 'user-operator',
    items: [{ description: 'Transmission rebuild kit', quantity: 1, type: 'part' }],
    createdAt: '2026-05-24T16:45:00Z', updatedAt: '2026-05-27T15:30:00Z',
  },
  {
    id: 'ticket-5', displayId: 'IR-2026-0005',
    title: 'Compressor service — Muthaafushi',
    description: 'Air compressor at Muthaafushi due for 250-hour service. Filter and oil change.',
    type: 'maintenance', severity: 'medium', status: 'closed',
    siteId: 'muthaafushi', raisedById: 'user-operator',
    items: [{ description: 'Air filter', quantity: 1, type: 'part' }, { description: 'Compressor oil 5L', quantity: 2, type: 'part' }],
    createdAt: '2026-05-22T09:00:00Z', updatedAt: '2026-05-26T17:00:00Z',
  },
  {
    id: 'ticket-6', displayId: 'IR-2026-0006',
    title: 'Welding machine cable replacement',
    description: 'Main power cable on welding machine WL-002 is frayed. Needs replacement.',
    type: 'issue', severity: 'high', status: 'rejected',
    siteId: 'thilafushi', raisedById: 'user-mech',
    items: [{ description: 'Heavy-duty power cable 10m', quantity: 1, type: 'part' }],
    createdAt: '2026-05-23T13:00:00Z', updatedAt: '2026-05-25T08:30:00Z',
  },
  {
    id: 'ticket-7', displayId: 'IR-2026-0007',
    title: 'Roller compactor vibration test — Goidhoo',
    description: 'Roller compactor RC-002 vibration measured at 10% above threshold. Testing needed.',
    type: 'service', severity: 'medium', status: 'open',
    siteId: 'goidhoo', raisedById: 'user-gm',
    items: [{ description: 'Vibration analysis', quantity: 1, type: 'service' }],
    createdAt: '2026-05-28T06:00:00Z', updatedAt: '2026-05-28T06:00:00Z',
  },
];
