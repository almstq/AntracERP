export interface MockRFQ {
  id: string;
  title: string;
  vendorCount: number;
  status: 'open' | 'evaluating' | 'awarded' | 'closed';
  dueDate: string;
  quotesReceived: number;
}

export interface MockPurchaseOrder {
  id: string;
  vendor: string;
  rfqId: string | null;
  status: 'pending' | 'approved' | 'in_progress' | 'delivered' | 'rejected';
  total: number;
  itemCount: number;
  date: string;
}

export const MOCK_RFQS: MockRFQ[] = [
  { id: 'RFQ-2026-0001', title: 'Hydraulic parts — Crane 3', vendorCount: 3, status: 'open', dueDate: '2026-05-30', quotesReceived: 2 },
  { id: 'RFQ-2026-0002', title: 'Generator maintenance kit', vendorCount: 2, status: 'evaluating', dueDate: '2026-06-02', quotesReceived: 2 },
];

export const MOCK_PURCHASE_ORDERS: MockPurchaseOrder[] = [
  { id: 'PO-2026-0001', vendor: 'Marine Parts Pvt Ltd', rfqId: 'RFQ-2026-0001', status: 'delivered', total: 1085, itemCount: 4, date: '2026-05-20' },
  { id: 'PO-2026-0002', vendor: 'Industrial Supplies Co', rfqId: 'RFQ-2026-0002', status: 'in_progress', total: 2340, itemCount: 6, date: '2026-05-25' },
  { id: 'PO-2026-0003', vendor: 'TechParts Maldives', rfqId: null, status: 'pending', total: 560, itemCount: 2, date: '2026-05-28' },
];
