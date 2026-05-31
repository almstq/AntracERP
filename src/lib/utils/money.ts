export type Currency = 'MVR' | 'USD';

export const GST_RATE = 0.08;
export const DEFAULT_CURRENCY: Currency = 'MVR';
export const CURRENCIES: Currency[] = ['MVR', 'USD'];

export interface MoneyTotals {
  subtotal: number;
  gst: number;
  total: number;
}

export function computeTotals(items: { unitPrice: number; quantity: number }[]): MoneyTotals {
  const subtotal = items.reduce((s, li) => s + li.unitPrice * li.quantity, 0);
  const gst = Math.round(subtotal * GST_RATE * 100) / 100;
  const total = Math.round((subtotal + gst) * 100) / 100;
  return { subtotal, gst, total };
}

export function formatMoney(amount: number, currency?: Currency): string {
  const cur = currency ?? DEFAULT_CURRENCY;
  return `${cur} ${amount.toLocaleString('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
