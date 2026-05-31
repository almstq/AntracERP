const prefixes: Record<string, string> = {
  ticket: 'IR',
  pr: 'PR',
  rfq: 'RFQ',
  po: 'PO',
  asset: 'FL',
  staff: 'ST',
  customer: 'CUST',
  enquiry: 'ENQ',
  quotation: 'QTN',
  workOrder: 'WO',
  invoice: 'INV',
  payment: 'PMT',
};

export function generateDisplayId(prefix: string, sequence: number, year?: number): string {
  const p = prefixes[prefix] || prefix.toUpperCase();
  const y = year || new Date().getFullYear();
  const seq = String(sequence).padStart(4, '0');
  return `${p}-${y}-${seq}`;
}

export function getNextId(existingIds: string[], prefix: string, year?: number): string {
  const y = year || new Date().getFullYear();
  const p = prefixes[prefix] || prefix.toUpperCase();
  const pattern = new RegExp(`${p}-${y}-(\\d+)`);
  let max = 0;
  for (const id of existingIds) {
    const match = id.match(pattern);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return generateDisplayId(prefix, max + 1, y);
}
