/**
 * Tiny CSV exporter — turns any array of flat row objects into a downloadable
 * .csv. Used by the report pages and registers so every record set the app
 * collects can be pulled out for finance / the board.
 */
export function exportCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    cols.join(','),
    ...rows.map((r) => cols.map((c) => esc(r[c])).join(',')),
  ].join('\r\n');

  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${stamp}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
