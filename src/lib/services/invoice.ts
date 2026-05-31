/**
 * Invoice document generator.
 * Letterhead, actuals table, less advance/retention, GST 8%, total due, payment terms.
 */
import type { Invoice, Customer, WorkOrder } from '../../types/crm';
import { downloadHtml } from './rfq';

const fmt = (n: number) => n.toLocaleString('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function buildInvoiceHtml(inv: Invoice, customer: Customer, wo: WorkOrder): string {
  const today = new Date();
  const cur = inv.currency;

  const lineRows = inv.lineItems.map((li, i) => `
    <tr>
      <td style="padding:6px 8px;border:1px solid #ddd">${i + 1}</td>
      <td style="padding:6px 8px;border:1px solid #ddd">${li.description}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${li.quantity} ${li.unit}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${fmt(li.unitRate)}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${fmt(li.amount)}</td>
    </tr>`).join('');

  const deductions = [
    inv.lessAdvance > 0 ? `
      <tr>
        <td colspan="4" style="padding:4px 8px;border:1px solid #ddd;text-align:right;color:#555">Less: Advance Paid</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:right;color:#555">(${fmt(inv.lessAdvance)})</td>
      </tr>` : '',
    inv.lessRetention > 0 ? `
      <tr>
        <td colspan="4" style="padding:4px 8px;border:1px solid #ddd;text-align:right;color:#555">Less: Retention (${wo.contractValue > 0 ? Math.round((inv.lessRetention / wo.contractValue) * 100) : 0}%)</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:right;color:#555">(${fmt(inv.lessRetention)})</td>
      </tr>` : '',
  ].join('');

  const statusBadge = inv.status === 'fully_paid'
    ? `<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:4px;font-size:11px">PAID</span>`
    : inv.status === 'overdue'
    ? `<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:4px;font-size:11px">OVERDUE</span>`
    : `<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:11px">OUTSTANDING</span>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>${inv.displayId}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:760px;margin:32px auto;padding:0 24px">

  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1f4e79;padding-bottom:12px">
    <div>
      <h1 style="margin:0;font-size:20px;color:#1f4e79">WELL LAND INVESTMENT PVT LTD</h1>
      <p style="margin:2px 0;font-size:12px;color:#555">Antrac Holding Group · Malé, Republic of Maldives</p>
    </div>
    <div style="text-align:right">
      <h2 style="margin:0;font-size:16px">TAX INVOICE</h2>
      <p style="margin:2px 0;font-size:13px"><b>${inv.displayId}</b></p>
      <p style="margin:2px 0;font-size:11px;color:#555">Date: ${today.toLocaleDateString()}</p>
      <p style="margin:2px 0;font-size:11px;color:#555">Due: ${new Date(inv.dueDate).toLocaleDateString()}</p>
      <div style="margin-top:4px">${statusBadge}</div>
    </div>
  </div>

  <table style="width:100%;font-size:12px;margin-top:16px">
    <tr>
      <td style="vertical-align:top;width:50%">
        <b>Bill To:</b><br/>
        ${customer.name}<br/>
        ${customer.contactPerson}<br/>
        ${customer.contactEmail ?? ''}<br/>
        ${customer.address ?? ''}
        ${customer.gstNumber ? `<br/><b>GST Reg:</b> ${customer.gstNumber}` : ''}
      </td>
      <td style="vertical-align:top">
        <b>Work Order:</b> ${wo.displayId}<br/>
        <b>Currency:</b> ${cur}<br/>
        <b>Balance Due:</b> <b>${cur} ${fmt(inv.balance)}</b>
        ${inv.amountPaid > 0 ? `<br/><span style="color:#059669">Amount Paid: ${cur} ${fmt(inv.amountPaid)}</span>` : ''}
      </td>
    </tr>
  </table>

  <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:16px">
    <thead>
      <tr style="background:#1f4e79;color:#fff">
        <th style="padding:6px 8px;border:1px solid #ddd;width:36px">#</th>
        <th style="padding:6px 8px;border:1px solid #ddd;text-align:left">Description</th>
        <th style="padding:6px 8px;border:1px solid #ddd">Qty / Unit</th>
        <th style="padding:6px 8px;border:1px solid #ddd">Rate (${cur})</th>
        <th style="padding:6px 8px;border:1px solid #ddd">Amount (${cur})</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="padding:4px 8px;border:1px solid #ddd;text-align:right">Subtotal</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${fmt(inv.subtotal)}</td>
      </tr>
      ${deductions}
      <tr>
        <td colspan="4" style="padding:4px 8px;border:1px solid #ddd;text-align:right">GST 8%</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${fmt(inv.gst)}</td>
      </tr>
      <tr style="font-weight:bold;background:#f0f9ff">
        <td colspan="4" style="padding:6px 8px;border:1px solid #ddd;text-align:right">Total Due (${cur})</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${fmt(inv.total)}</td>
      </tr>
      ${inv.amountPaid > 0 ? `
      <tr>
        <td colspan="4" style="padding:4px 8px;border:1px solid #ddd;text-align:right;color:#059669">Less: Amount Paid</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:right;color:#059669">(${fmt(inv.amountPaid)})</td>
      </tr>
      <tr style="font-weight:bold">
        <td colspan="4" style="padding:6px 8px;border:1px solid #ddd;text-align:right">Balance Due (${cur})</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${fmt(inv.balance)}</td>
      </tr>` : ''}
    </tfoot>
  </table>

  <div style="margin-top:20px;font-size:12px;background:#f9f9f9;padding:12px;border-left:3px solid #1f4e79">
    <b>Payment Details:</b><br/>
    Bank: Bank of Maldives · Account: XXXX-XXXX-XXXX<br/>
    Reference: <b>${inv.displayId}</b><br/>
    Please include the invoice number in your payment reference.
  </div>

  <p style="font-size:10px;color:#aaa;margin-top:32px;text-align:center">
    Generated by Antrac ERP · ${today.toLocaleDateString()} · Well Land Investment Pvt Ltd
  </p>
</body></html>`;
}

export function downloadInvoice(inv: Invoice, customer: Customer, wo: WorkOrder): void {
  downloadHtml(`${inv.displayId}.html`, buildInvoiceHtml(inv, customer, wo));
}
