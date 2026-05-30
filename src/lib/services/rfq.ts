/**
 * RFQ document generation. One RFQ per supplier, containing only that supplier's
 * assigned line items. Exported as a standalone HTML file (print-to-PDF for now);
 * proc sends it to the supplier out-of-band.
 */
import type { PurchaseRequest, PRLineItem } from '../../types/workflow-entities';

export function rfqNumber(pr: PurchaseRequest, supplierId: string): string {
  const tail = pr.displayId.replace(/^PR-/, '');
  return `RFQ-${tail}-${supplierId.slice(0, 4).toUpperCase()}`;
}

export function buildRfqHtml(
  pr: PurchaseRequest,
  supplier: { id: string; name: string },
  items: PRLineItem[],
): string {
  const rfqNo = rfqNumber(pr, supplier.id);
  const today = new Date();
  const deadline = new Date(today.getTime() + 5 * 86400000);
  const rows = items.map((li, i) => `
    <tr>
      <td style="padding:6px 8px;border:1px solid #ddd">${i + 1}</td>
      <td style="padding:6px 8px;border:1px solid #ddd">${li.description}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${li.quantity}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${li.uom}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">&nbsp;</td>
    </tr>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${rfqNo}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:760px;margin:32px auto;padding:0 24px">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1f4e79;padding-bottom:12px">
    <div>
      <h1 style="margin:0;font-size:20px;color:#1f4e79">WELL LAND INVESTMENT PVT LTD</h1>
      <p style="margin:2px 0;font-size:12px;color:#555">Antrac Holding Group · Malé, Maldives</p>
    </div>
    <div style="text-align:right">
      <h2 style="margin:0;font-size:16px">REQUEST FOR QUOTATION</h2>
      <p style="margin:2px 0;font-size:13px"><b>${rfqNo}</b></p>
    </div>
  </div>

  <table style="width:100%;font-size:12px;margin-top:16px">
    <tr>
      <td style="vertical-align:top;width:50%">
        <b>To:</b> ${supplier.name}<br/>
        <b>Date:</b> ${today.toLocaleDateString()}<br/>
        <b>Response by:</b> ${deadline.toLocaleDateString()}
      </td>
      <td style="vertical-align:top">
        <b>Ref PR:</b> ${pr.displayId}<br/>
        <b>Deliver to:</b> ${pr.siteId}<br/>
        <b>Urgency:</b> ${pr.urgency}
      </td>
    </tr>
  </table>

  <p style="font-size:12px;margin-top:16px">Please quote your best price and lead time for the following:</p>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr style="background:#1f4e79;color:#fff">
      <th style="padding:6px 8px;border:1px solid #ddd;width:36px">#</th>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:left">Item</th>
      <th style="padding:6px 8px;border:1px solid #ddd">Qty</th>
      <th style="padding:6px 8px;border:1px solid #ddd">UOM</th>
      <th style="padding:6px 8px;border:1px solid #ddd;width:120px">Unit Price (MVR)</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <p style="font-size:11px;color:#777;margin-top:24px">
    This RFQ is issued by Well Land Investment Pvt Ltd. Prices quoted are expected to remain valid for 30 days.
    Please include availability/lead time and applicable taxes.
  </p>
  <p style="font-size:11px;color:#777;margin-top:32px">Authorised: WLI Procurement · ${today.toLocaleDateString()}</p>
</body></html>`;
}

export function buildPoHtml(po: {
  displayId: string; supplierName: string; deliveryAddress: string; paymentTerms?: string;
  currency: string; total: number;
  lineItems: { description: string; uom: string; quantity: number; unitPrice: number }[];
}): string {
  const today = new Date();
  const rows = po.lineItems.map((li, i) => `
    <tr>
      <td style="padding:6px 8px;border:1px solid #ddd">${i + 1}</td>
      <td style="padding:6px 8px;border:1px solid #ddd">${li.description}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${li.quantity}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${li.uom}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${li.unitPrice.toLocaleString()}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${(li.unitPrice * li.quantity).toLocaleString()}</td>
    </tr>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${po.displayId}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:760px;margin:32px auto;padding:0 24px">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1f4e79;padding-bottom:12px">
    <div>
      <h1 style="margin:0;font-size:20px;color:#1f4e79">WELL LAND INVESTMENT PVT LTD</h1>
      <p style="margin:2px 0;font-size:12px;color:#555">Antrac Holding Group · Malé, Maldives</p>
    </div>
    <div style="text-align:right">
      <h2 style="margin:0;font-size:16px">PURCHASE ORDER</h2>
      <p style="margin:2px 0;font-size:13px"><b>${po.displayId}</b></p>
    </div>
  </div>

  <table style="width:100%;font-size:12px;margin-top:16px">
    <tr>
      <td style="vertical-align:top;width:50%"><b>Supplier:</b> ${po.supplierName}<br/><b>Date:</b> ${today.toLocaleDateString()}</td>
      <td style="vertical-align:top"><b>Deliver to:</b> ${po.deliveryAddress}<br/><b>Payment terms:</b> ${po.paymentTerms || 'As agreed'}</td>
    </tr>
  </table>

  <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:16px">
    <thead><tr style="background:#1f4e79;color:#fff">
      <th style="padding:6px 8px;border:1px solid #ddd;width:36px">#</th>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:left">Item</th>
      <th style="padding:6px 8px;border:1px solid #ddd">Qty</th>
      <th style="padding:6px 8px;border:1px solid #ddd">UOM</th>
      <th style="padding:6px 8px;border:1px solid #ddd">Unit Price</th>
      <th style="padding:6px 8px;border:1px solid #ddd">Total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr>
      <td colspan="5" style="padding:6px 8px;border:1px solid #ddd;text-align:right;font-weight:bold">Grand Total (${po.currency})</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;font-weight:bold">${po.total.toLocaleString()}</td>
    </tr></tfoot>
  </table>

  <div style="margin-top:48px;font-size:12px">
    <div style="display:inline-block;border-top:1px solid #333;padding-top:4px;width:220px">Authorised Signatory · WLI GM</div>
  </div>
  <p style="font-size:11px;color:#777;margin-top:24px">Issued by Well Land Investment Pvt Ltd · ${today.toLocaleDateString()}</p>
</body></html>`;
}

/** Trigger a browser download of an HTML string. */
export function downloadHtml(filename: string, html: string): void {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
