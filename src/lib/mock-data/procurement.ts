export interface MockRFQ {
  id: string;
  title: string;
  vendorCount: number;
  status: 'open' | 'evaluating' | 'awarded' | 'closed';
  dueDate: string;
  quotesReceived: number;
}

export const MOCK_RFQS: MockRFQ[] = [
  { id: 'RFQ-2026-0001', title: 'Hydraulic parts — Crane 3', vendorCount: 3, status: 'open', dueDate: '2026-05-30', quotesReceived: 2 },
  { id: 'RFQ-2026-0002', title: 'Generator maintenance kit', vendorCount: 2, status: 'evaluating', dueDate: '2026-06-02', quotesReceived: 2 },
];
