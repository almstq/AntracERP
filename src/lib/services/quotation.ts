/**
 * Quotation document generator — letterhead, scope, asset rate table,
 * mob/demob, GST 8%, total, payment terms, validity, GM signature.
 * Exported as standalone HTML (print-to-PDF).
 */
import type { Quotation, Customer } from '../../types/crm';
import { GST_RATE } from '../utils/money';
import { downloadHtml, printHtml } from './rfq';

export function buildQuotationHtml(q: Quotation, customer: Customer): string {
  const today = new Date();
  const validUntil = new Date(today.getTime() + q.validityDays * 86400000);
  const cur = q.currency;

  const lineRows = q.lineItems.map((li, i) => {
    const lineTotal = li.unitRate * li.quantity;
    return `
    <tr>
      <td style="padding:6px 8px;border:1px solid #ddd">${i + 1}</td>
      <td style="padding:6px 8px;border:1px solid #ddd">${li.assetType}${li.description ? ` — ${li.description}` : ''}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${li.quantity}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${li.unit}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${li.unitRate.toLocaleString('en-MV', { minimumFractionDigits: 2 })}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${lineTotal.toLocaleString('en-MV', { minimumFractionDigits: 2 })}</td>
    </tr>`;
  }).join('');

  const mobRow = q.mobilisationFee ? `
    <tr>
      <td colspan="5" style="padding:4px 8px;border:1px solid #ddd;text-align:right">Mobilisation Fee</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${q.mobilisationFee.toLocaleString('en-MV', { minimumFractionDigits: 2 })}</td>
    </tr>` : '';

  const demobRow = q.demobilisationFee ? `
    <tr>
      <td colspan="5" style="padding:4px 8px;border:1px solid #ddd;text-align:right">Demobilisation Fee</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${q.demobilisationFee.toLocaleString('en-MV', { minimumFractionDigits: 2 })}</td>
    </tr>` : '';

  const gstAmount = Math.round(q.subtotal * GST_RATE * 100) / 100;
  const paymentTermsText = buildPaymentTermsText(q);

  return `<!doctype html><html><head><meta charset="utf-8"><title>${q.displayId}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:760px;margin:32px auto;padding:0 24px">

  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1f4e79;padding-bottom:12px">
    <div>
      <h1 style="margin:0;font-size:20px;color:#1f4e79">WELL LAND INVESTMENT PVT LTD</h1>
      <p style="margin:2px 0;font-size:12px;color:#555">Antrac Holding Group · Malé, Republic of Maldives</p>
      <p style="margin:2px 0;font-size:11px;color:#888">Email: info@wli.mv · Tel: +960 XXX-XXXX</p>
    </div>
    <div style="text-align:right">
      <h2 style="margin:0;font-size:16px">QUOTATION</h2>
      <p style="margin:2px 0;font-size:13px"><b>${q.displayId}</b></p>
      <p style="margin:2px 0;font-size:11px;color:#555">Date: ${today.toLocaleDateString()}</p>
      <p style="margin:2px 0;font-size:11px;color:#555">Valid Until: ${validUntil.toLocaleDateString()}</p>
    </div>
  </div>

  <table style="width:100%;font-size:12px;margin-top:16px">
    <tr>
      <td style="vertical-align:top;width:50%">
        <b>To:</b> ${customer.name}${customer.tradeName ? ` (${customer.tradeName})` : ''}<br/>
        <b>Attn:</b> ${customer.contactPerson}<br/>
        ${customer.contactEmail ? `<b>Email:</b> ${customer.contactEmail}<br/>` : ''}
        ${customer.address ? `<b>Address:</b> ${customer.address}` : ''}
      </td>
      <td style="vertical-align:top">
        <b>Currency:</b> ${cur}<br/>
        <b>Payment Terms:</b> ${paymentTermsText}<br/>
        ${q.advancePercent ? `<b>Advance:</b> ${q.advancePercent}%<br/>` : ''}
        ${q.retentionPercent ? `<b>Retention:</b> ${q.retentionPercent}%` : ''}
      </td>
    </tr>
  </table>

  <p style="font-size:12px;margin-top:16px">We are pleased to submit our quotation for the provision of heavy equipment services as detailed below:</p>

  <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px">
    <thead>
      <tr style="background:#1f4e79;color:#fff">
        <th style="padding:6px 8px;border:1px solid #ddd;width:36px">#</th>
        <th style="padding:6px 8px;border:1px solid #ddd;text-align:left">Description</th>
        <th style="padding:6px 8px;border:1px solid #ddd">Qty</th>
        <th style="padding:6px 8px;border:1px solid #ddd">Unit</th>
        <th style="padding:6px 8px;border:1px solid #ddd">Rate (${cur})</th>
        <th style="padding:6px 8px;border:1px solid #ddd">Amount (${cur})</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
    <tfoot>
      ${mobRow}
      ${demobRow}
      <tr>
        <td colspan="5" style="padding:4px 8px;border:1px solid #ddd;text-align:right">Subtotal</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${q.subtotal.toLocaleString('en-MV', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td colspan="5" style="padding:4px 8px;border:1px solid #ddd;text-align:right">GST 8%</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${gstAmount.toLocaleString('en-MV', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr style="font-weight:bold">
        <td colspan="5" style="padding:6px 8px;border:1px solid #ddd;text-align:right">Grand Total (${cur})</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${q.total.toLocaleString('en-MV', { minimumFractionDigits: 2 })}</td>
      </tr>
    </tfoot>
  </table>

  <div style="margin-top:24px;font-size:12px;background:#f9f9f9;padding:12px;border-left:3px solid #1f4e79">
    <b>Terms & Conditions:</b>
    <ul style="margin:6px 0;padding-left:20px;line-height:1.6">
      <li>Rates quoted are in ${cur} and inclusive of operator, fuel and maintenance unless otherwise stated.</li>
      <li>Standby time billed at 50% of the applicable rate.</li>
      <li>Client to provide adequate access and site preparation.</li>
      <li>This quotation is valid for ${q.validityDays} days from the date above.</li>
      ${q.advancePercent ? `<li>An advance payment of ${q.advancePercent}% is required prior to mobilisation.</li>` : ''}
      ${q.retentionPercent ? `<li>Retention of ${q.retentionPercent}% shall be released upon completion and sign-off.</li>` : ''}
    </ul>
  </div>

  <div style="margin-top:48px;display:flex;justify-content:space-between;font-size:12px">
    <div style="border-top:1px solid #333;padding-top:4px;width:220px">
      General Manager<br/>Well Land Investment Pvt Ltd
    </div>
    <div style="border-top:1px solid #333;padding-top:4px;width:220px;text-align:right">
      Accepted by (Customer)<br/>Date: _________________
    </div>
  </div>

  <p style="font-size:10px;color:#aaa;margin-top:32px;text-align:center">
    Generated by Antrac ERP · ${today.toLocaleDateString()}
  </p>
</body></html>`;
}

function buildPaymentTermsText(q: Quotation): string {
  if (q.advancePercent && q.retentionPercent) {
    return `${q.advancePercent}% advance · ${100 - q.advancePercent - q.retentionPercent}% progress · ${q.retentionPercent}% retention on completion`;
  }
  if (q.advancePercent) return `${q.advancePercent}% advance, balance on completion`;
  return 'As per agreement';
}

export function downloadQuotation(q: Quotation, customer: Customer): void {
  downloadHtml(`${q.displayId}.html`, buildQuotationHtml(q, customer));
}

export function printQuotation(q: Quotation, customer: Customer): void {
  printHtml(buildQuotationHtml(q, customer), q.displayId);
}
