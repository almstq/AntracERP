/**
 * Official document generation service for WLI.
 * Produces printer-friendly, clean, official formats for RFQs, POs, and Ticket Service Sheets
 * complying with Maldives Inland Revenue Authority (MIRA) GST audit standards.
 */
import type { PurchaseRequest, PRLineItem, Ticket } from '../../types/workflow-entities';
import { GST_RATE } from '../utils/money';

// WLI Corporate Constants
export const WLI_NAME = 'WELL LAND INVESTMENT PVT LTD';
export const WLI_SUB = 'Antrac Holding Group';
export const WLI_TIN = '1007799GST501';
export const WLI_ADDRESS = 'H. Bonthi, 3rd Floor, Male\', Republic of Maldives';
export const WLI_CONTACT = 'Email: procurement@antrac.com.mv | Tel: +960 331-0000';

export function rfqNumber(pr: PurchaseRequest, supplierId: string): string {
  const tail = pr.displayId.replace(/^PR-/, '');
  return `RFQ-${tail}-${supplierId.slice(0, 4).toUpperCase()}`;
}

function fmtDate(d: Date | string | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** RFQ HTML generator. */
export function buildRfqHtml(
  pr: PurchaseRequest,
  supplier: { id: string; name: string; tin?: string; address?: string; contactPhone?: string; contactEmail?: string },
  items: PRLineItem[],
): string {
  const rfqNo = rfqNumber(pr, supplier.id);
  const today = new Date();
  const deadline = new Date(today.getTime() + 5 * 86400000);
  
  const rows = items.map((li, i) => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd;text-align:center">${i + 1}</td>
      <td style="padding:8px;border:1px solid #ddd">${li.description}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center">${li.quantity}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center">${li.uom}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">&nbsp;</td>
    </tr>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${rfqNo}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:760px;margin:32px auto;padding:0 24px;line-height:1.4">
  <!-- Corporate Header -->
  <table style="width:100%;border-bottom:3px solid #1f4e79;padding-bottom:12px">
    <tr>
      <td>
        <h1 style="margin:0;font-size:22px;color:#1f4e79;font-weight:bold">${WLI_NAME}</h1>
        <p style="margin:2px 0;font-size:11px;color:#555">${WLI_SUB}</p>
        <p style="margin:2px 0;font-size:11px;color:#555">${WLI_ADDRESS}</p>
        <p style="margin:2px 0;font-size:11px;color:#555"><b>TIN:</b> ${WLI_TIN} | ${WLI_CONTACT}</p>
      </td>
      <td style="text-align:right;vertical-align:top">
        <h2 style="margin:0;font-size:16px;color:#333;font-weight:bold;letter-spacing:1px">REQUEST FOR QUOTATION</h2>
        <p style="margin:4px 0;font-size:14px;color:#1f4e79"><b>No: ${rfqNo}</b></p>
      </td>
    </tr>
  </table>

  <!-- Meta details -->
  <table style="width:100%;font-size:12px;margin-top:20px;border-collapse:collapse">
    <tr>
      <td style="vertical-align:top;width:50%;padding:4px">
        <h3 style="margin:0 0 6px;font-size:12px;color:#1f4e79;border-bottom:1px solid #ddd;padding-bottom:2px">SUPPLIER DETAILS</h3>
        <b>To:</b> ${supplier.name}<br/>
        ${supplier.address ? `<b>Address:</b> ${supplier.address}<br/>` : ''}
        ${supplier.tin ? `<b>GST TIN:</b> ${supplier.tin}<br/>` : ''}
        ${supplier.contactPhone || supplier.contactEmail ? `<b>Contact:</b> ${[supplier.contactPhone, supplier.contactEmail].filter(Boolean).join(' / ')}<br/>` : ''}
      </td>
      <td style="vertical-align:top;padding:4px;padding-left:20px">
        <h3 style="margin:0 0 6px;font-size:12px;color:#1f4e79;border-bottom:1px solid #ddd;padding-bottom:2px">RFQ INFORMATION</h3>
        <b>Date Issued:</b> ${today.toLocaleDateString()}<br/>
        <b>Response Deadline:</b> <span style="color:#d94338"><b>${fmtDate(pr.requestedDeliveryDate ?? deadline)}</b></span><br/>
        <b>Reference PR:</b> ${pr.displayId}<br/>
        <b>Deliver to:</b> ${pr.siteId.toUpperCase()}<br/>
        <b>Urgency:</b> <span style="text-transform:uppercase;font-weight:bold">${pr.urgency}</span>
      </td>
    </tr>
  </table>

  <p style="font-size:12px;margin-top:24px">Please quote your best unit price and lead time for the following items/services:</p>
  
  <!-- Items Table -->
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px">
    <thead>
      <tr style="background:#1f4e79;color:#fff">
        <th style="padding:8px;border:1px solid #ddd;width:36px;text-align:center">#</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:left">Item / Description</th>
        <th style="padding:8px;border:1px solid #ddd;width:80px;text-align:center">Qty</th>
        <th style="padding:8px;border:1px solid #ddd;width:80px;text-align:center">UOM</th>
        <th style="padding:8px;border:1px solid #ddd;width:140px;text-align:right">Unit Price (MVR)</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <p style="font-size:11px;color:#666;margin-top:32px;line-height:1.5">
    <b>Instructions:</b><br/>
    1. Prices quoted are expected to remain valid for a minimum of 30 days from submission.<br/>
    2. Please state clearly if GST is included or excluded, and specify lead time/availability.<br/>
    3. Return the completed quotation to the contact email above referencing RFQ No: <b>${rfqNo}</b>.
  </p>

  <hr style="border:none;border-top:1px solid #ddd;margin-top:40px"/>
  <table style="width:100%;font-size:11px;color:#777">
    <tr>
      <td>Issued by Well Land Investment Pvt Ltd · Procurement Desk</td>
      <td style="text-align:right">Date: ${today.toLocaleDateString()}</td>
    </tr>
  </table>
</body></html>`;
}

/** Purchase Order HTML generator complying with MIRA GST standard. */
export function buildPoHtml(po: {
  displayId: string;
  supplierName: string;
  deliveryAddress: string;
  paymentTerms?: string;
  currency: string;
  subtotal?: number;
  gst?: number;
  total: number;
  lineItems: { description: string; uom: string; quantity: number; unitPrice: number }[];
  buyerTin?: string;
  buyerAddress?: string;
  supplierTin?: string;
  supplierAddress?: string;
  supplierContact?: string;
  deliveryDeadline?: Date | string;
  deliveryMethod?: string;
  termsAndConditions?: string;
  signatures?: {
    prepared?: { name: string; date: Date | string };
    verified?: { name: string; date: Date | string };
    approved?: { name: string; date: Date | string };
  };
  incoterms?: string;
  delayPenaltyTerms?: string;
  matchedStatus?: string;
  grnId?: string;
  supplierInvoiceId?: string;
}): string {
  const subtotal = po.subtotal ?? po.lineItems.reduce((s, li) => s + li.unitPrice * li.quantity, 0);
  const gst = po.gst ?? Math.round(subtotal * GST_RATE * 100) / 100;
  const today = new Date();
  
  const rows = po.lineItems.map((li, i) => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd;text-align:center">${i + 1}</td>
      <td style="padding:8px;border:1px solid #ddd">${li.description}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center">${li.quantity}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center">${li.uom}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">${li.unitPrice.toLocaleString('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">${(li.unitPrice * li.quantity).toLocaleString('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${po.displayId}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:760px;margin:32px auto;padding:0 24px;line-height:1.4">
  <!-- Corporate Header -->
  <table style="width:100%;border-bottom:3px solid #1f4e79;padding-bottom:12px">
    <tr>
      <td>
        <h1 style="margin:0;font-size:22px;color:#1f4e79;font-weight:bold">${WLI_NAME}</h1>
        <p style="margin:2px 0;font-size:11px;color:#555">${WLI_SUB}</p>
        <p style="margin:2px 0;font-size:11px;color:#555">${po.buyerAddress || WLI_ADDRESS}</p>
        <p style="margin:2px 0;font-size:11px;color:#555"><b>TIN:</b> ${po.buyerTin || WLI_TIN} | ${WLI_CONTACT}</p>
      </td>
      <td style="text-align:right;vertical-align:top">
        <h2 style="margin:0;font-size:18px;color:#333;font-weight:bold;letter-spacing:1px">OFFICIAL PURCHASE ORDER</h2>
        <p style="margin:4px 0;font-size:14px;color:#1f4e79"><b>No: ${po.displayId}</b></p>
        <p style="margin:2px 0;font-size:11px;color:#555">Date: ${today.toLocaleDateString()}</p>
      </td>
    </tr>
  </table>

  <!-- Meta grids -->
  <table style="width:100%;font-size:12px;margin-top:20px;border-collapse:collapse">
    <tr>
      <td style="vertical-align:top;width:50%;padding:4px">
        <h3 style="margin:0 0 6px;font-size:12px;color:#1f4e79;border-bottom:1px solid #ddd;padding-bottom:2px">SUPPLIER</h3>
        <b>Name:</b> ${po.supplierName}<br/>
        <b>Address:</b> ${po.supplierAddress || '—'}<br/>
        <b>TIN:</b> ${po.supplierTin || '—'}<br/>
        <b>Contact:</b> ${po.supplierContact || '—'}
      </td>
      <td style="vertical-align:top;padding:4px;padding-left:20px">
        <h3 style="margin:0 0 6px;font-size:12px;color:#1f4e79;border-bottom:1px solid #ddd;padding-bottom:2px">SHIPPING & PAYMENT</h3>
        <b>Delivery Location:</b> ${po.deliveryAddress.toUpperCase()}<br/>
        <b>Delivery Date:</b> ${po.deliveryDeadline ? fmtDate(po.deliveryDeadline) : 'AS AGREED'}<br/>
        <b>Shipping Method:</b> ${po.deliveryMethod || 'SUPPLIER DELIVERY'}<br/>
        <b>Incoterms:</b> ${po.incoterms || 'EX-WORKS (EXW)'}<br/>
        <b>Payment Terms:</b> ${po.paymentTerms || 'AS AGREED'}
      </td>
    </tr>
  </table>

  <!-- Match Audits -->
  <table style="width:100%;font-size:10px;margin-top:8px;border-top:1px solid #eee;padding-top:4px">
    <tr>
      <td><b>Matching Audit Status:</b> <span style="text-transform:uppercase"><b>${po.matchedStatus || 'PENDING (3-WAY MATCH)'}</b></span></td>
      <td style="text-align:right">
        ${po.grnId ? `<b>GRN Ref:</b> ${po.grnId} &nbsp;&nbsp;` : ''}
        ${po.supplierInvoiceId ? `<b>Invoice Ref:</b> ${po.supplierInvoiceId}` : ''}
      </td>
    </tr>
  </table>

  <!-- Line items -->
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:16px">
    <thead>
      <tr style="background:#1f4e79;color:#fff">
        <th style="padding:8px;border:1px solid #ddd;width:36px;text-align:center">#</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:left">Description</th>
        <th style="padding:8px;border:1px solid #ddd;width:60px;text-align:center">Qty</th>
        <th style="padding:8px;border:1px solid #ddd;width:60px;text-align:center">UOM</th>
        <th style="padding:8px;border:1px solid #ddd;width:120px;text-align:right">Unit Price</th>
        <th style="padding:8px;border:1px solid #ddd;width:120px;text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="padding:6px 8px;border:1px solid #ddd;text-align:right">Subtotal (${po.currency})</td>
        <td colspan="2" style="padding:6px 8px;border:1px solid #ddd;text-align:right">${subtotal.toLocaleString('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td colspan="4" style="padding:6px 8px;border:1px solid #ddd;text-align:right">Maldives GST 8%</td>
        <td colspan="2" style="padding:6px 8px;border:1px solid #ddd;text-align:right">${gst.toLocaleString('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
      <tr style="font-weight:bold;background:#f5f8fa">
        <td colspan="4" style="padding:8px;border:1px solid #ddd;text-align:right">Grand Total (${po.currency})</td>
        <td colspan="2" style="padding:8px;border:1px solid #ddd;text-align:right;color:#1f4e79">${po.total.toLocaleString('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    </tfoot>
  </table>

  <!-- T&C Section -->
  <div style="margin-top:24px;border:1px solid #ddd;padding:12px;border-radius:4px;font-size:10.5px;color:#555;background:#fafafa">
    <h4 style="margin:0 0 6px;color:#333;font-size:11px"><b>Terms & Conditions:</b></h4>
    ${po.termsAndConditions || `1. Please acknowledge receipt of this Purchase Order immediately.
    <br/>2. Mention the PO Number: <b>${po.displayId}</b> on all delivery notes, invoices and packages.
    <br/>3. All goods supplied must conform to the specified description, brand and quality.
    <br/>4. Delay Penalty Clause: ${po.delayPenaltyTerms || '0.5% per day of delay up to a max of 10% will be deducted from invoice.'}
    <br/>5. WLI TIN must be referenced on all Tax Invoices.`}
  </div>

  <!-- Signatory blocks & Seal Area -->
  <table style="width:100%;margin-top:40px;font-size:11px;text-align:center">
    <tr>
      <td style="width:30%;vertical-align:top">
        <div style="border-top:1px solid #333;margin:40px 10px 0;padding-top:4px">
          <b>Prepared By</b><br/>
          <span>${po.signatures?.prepared?.name || 'WLI Procurement'}</span><br/>
          <span style="color:#777;font-size:10px">${po.signatures?.prepared?.date ? fmtDate(po.signatures.prepared.date) : ''}</span>
        </div>
      </td>
      <td style="width:30%;vertical-align:top">
        <div style="border-top:1px solid #333;margin:40px 10px 0;padding-top:4px">
          <b>Verified By</b><br/>
          <span>${po.signatures?.verified?.name || 'Antrac Finance / CFO'}</span><br/>
          <span style="color:#777;font-size:10px">${po.signatures?.verified?.date ? fmtDate(po.signatures.verified.date) : ''}</span>
        </div>
      </td>
      <td style="width:30%;vertical-align:top">
        <div style="border-top:1px solid #333;margin:40px 10px 0;padding-top:4px">
          <b>Approved By</b><br/>
          <span>${po.signatures?.approved?.name || 'WLI General Manager'}</span><br/>
          <span style="color:#777;font-size:10px">${po.signatures?.approved?.date ? fmtDate(po.signatures.approved.date) : ''}</span>
        </div>
      </td>
      <td style="width:10%;vertical-align:middle;text-align:right">
        <!-- Visual Seal box -->
        <div style="width:70px;height:70px;border:2px dashed #1f4e79;border-radius:50%;display:inline-flex;flex-direction:column;justify-content:center;align-items:center;color:#1f4e79;font-weight:bold;font-size:8px;text-align:center;padding:2px">
          WLI<br/>STAMP/SEAL
        </div>
      </td>
    </tr>
  </table>

  <p style="font-size:10px;color:#aaa;margin-top:30px;text-align:center">Generated by Antrac ERP · Well Land Investment Pvt Ltd</p>
</body></html>`;
}

/** New Ticket Service Sheet Print Template */
export function buildTicketPrintHtml(ticket: Ticket): string {
  
  const materialRows = (ticket.materials ?? []).map((m, i) => `
    <tr>
      <td style="padding:6px;border:1px solid #ddd;text-align:center">${i + 1}</td>
      <td style="padding:6px;border:1px solid #ddd">${m.description}</td>
      <td style="padding:6px;border:1px solid #ddd;text-align:center">${m.quantity}</td>
      <td style="padding:6px;border:1px solid #ddd;text-align:center">${m.uom}</td>
      <td style="padding:6px;border:1px solid #ddd">${m.notes || '—'}</td>
    </tr>`).join('');

  const serviceRows = (ticket.services ?? []).map((s, i) => `
    <tr>
      <td style="padding:6px;border:1px solid #ddd;text-align:center">${i + 1}</td>
      <td style="padding:6px;border:1px solid #ddd">${s.description}</td>
      <td style="padding:6px;border:1px solid #ddd;text-align:center;text-transform:capitalize">${s.specialistType}</td>
      <td style="padding:6px;border:1px solid #ddd;text-align:center">${s.estimatedDuration || '—'}</td>
    </tr>`).join('');

  const cleanChecked = ticket.resolutionChecklist?.clean ? '☑' : '☐';
  const photosChecked = ticket.resolutionChecklist?.photos ? '☑' : '☐';
  const toolsChecked = ticket.resolutionChecklist?.tools ? '☑' : '☐';
  const safetyChecked = ticket.resolutionChecklist?.safety ? '☑' : '☐';

  return `<!doctype html><html><head><meta charset="utf-8"><title>${ticket.displayId}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:760px;margin:32px auto;padding:0 24px;line-height:1.4;font-size:12px">
  <!-- Corporate Header -->
  <table style="width:100%;border-bottom:3px solid #1f4e79;padding-bottom:12px">
    <tr>
      <td>
        <h1 style="margin:0;font-size:20px;color:#1f4e79;font-weight:bold">${WLI_NAME}</h1>
        <p style="margin:2px 0;font-size:11px;color:#555">${WLI_SUB} · Fleet Operations</p>
      </td>
      <td style="text-align:right;vertical-align:top">
        <h2 style="margin:0;font-size:15px;color:#333;font-weight:bold;letter-spacing:1px">MAINTENANCE SERVICE SHEET</h2>
        <p style="margin:4px 0;font-size:13px;color:#1f4e79"><b>No: ${ticket.displayId}</b></p>
      </td>
    </tr>
  </table>

  <!-- Ticket Grid Details -->
  <table style="width:100%;margin-top:16px;border:1px solid #ddd;border-collapse:collapse;font-size:11px">
    <tr>
      <td style="padding:6px;border:1px solid #ddd;background:#f9f9f9;width:15%"><b>Date Reported:</b></td>
      <td style="padding:6px;border:1px solid #ddd;width:35%">${fmtDate(ticket.reportedAt ?? ticket.createdAt)}</td>
      <td style="padding:6px;border:1px solid #ddd;background:#f9f9f9;width:15%"><b>Asset Code:</b></td>
      <td style="padding:6px;border:1px solid #ddd;width:35%;font-weight:bold">${ticket.assetCode || '—'}</td>
    </tr>
    <tr>
      <td style="padding:6px;border:1px solid #ddd;background:#f9f9f9"><b>Urgency Level:</b></td>
      <td style="padding:6px;border:1px solid #ddd;text-transform:uppercase;font-weight:bold;color:${ticket.urgency === 'critical' ? '#d94338' : '#333'}">${ticket.urgency}</td>
      <td style="padding:6px;border:1px solid #ddd;background:#f9f9f9"><b>Asset Label:</b></td>
      <td style="padding:6px;border:1px solid #ddd">${ticket.assetLabel || '—'}</td>
    </tr>
    <tr>
      <td style="padding:6px;border:1px solid #ddd;background:#f9f9f9"><b>Work Location:</b></td>
      <td style="padding:6px;border:1px solid #ddd">${(ticket.siteId || '—').toUpperCase()} ${(ticket.location ? `(${ticket.location})` : '')}</td>
      <td style="padding:6px;border:1px solid #ddd;background:#f9f9f9"><b>Serial/Chassis No:</b></td>
      <td style="padding:6px;border:1px solid #ddd;font-family:monospace">${ticket.serialNumber || '—'}</td>
    </tr>
    <tr>
      <td style="padding:6px;border:1px solid #ddd;background:#f9f9f9"><b>Work Category:</b></td>
      <td style="padding:6px;border:1px solid #ddd;text-transform:uppercase">${ticket.workCategory || 'GENERAL'}</td>
      <td style="padding:6px;border:1px solid #ddd;background:#f9f9f9"><b>Meter Reading:</b></td>
      <td style="padding:6px;border:1px solid #ddd">${ticket.meterReading != null ? `${ticket.meterReading.toLocaleString()} Hours/Km` : '—'}</td>
    </tr>
  </table>

  <!-- Issue Description -->
  <h3 style="margin:20px 0 6px;font-size:12px;color:#1f4e79;border-bottom:1px solid #1f4e79;padding-bottom:2px">1. PROBLEM DESCRIPTION (REPORTED BY OPERATOR)</h3>
  <div style="padding:10px;border:1px solid #eee;background:#fafafa;border-radius:4px;min-height:40px">
    ${ticket.description}
    ${ticket.operatorRecommendation ? `<p style="margin:8px 0 0;font-size:11px;color:#666"><b>Operator Recommendation:</b> ${ticket.operatorRecommendation}</p>` : ''}
  </div>

  <!-- Diagnosis -->
  <h3 style="margin:20px 0 6px;font-size:12px;color:#1f4e79;border-bottom:1px solid #1f4e79;padding-bottom:2px">2. TECHNICAL DIAGNOSIS (BY MAINTENANCE TEAM)</h3>
  <div style="padding:10px;border:1px solid #eee;background:#fafafa;border-radius:4px;min-height:40px">
    ${ticket.diagnosis || '<span style="color:#999">No diagnosis logs recorded yet.</span>'}
    ${ticket.revisedRecommendation ? `<p style="margin:8px 0 0;font-size:11px;color:#666"><b>Revised Action Plan:</b> ${ticket.revisedRecommendation}</p>` : ''}
  </div>

  <!-- Required Parts Table -->
  ${ticket.materialRequired && ticket.materials?.length ? `
  <h3 style="margin:20px 0 6px;font-size:12px;color:#1f4e79;border-bottom:1px solid #1f4e79;padding-bottom:2px">3. REQUIRED PARTS & CONSUMABLES</h3>
  <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:6px">
    <thead>
      <tr style="background:#f0f0f0;color:#333;font-weight:bold">
        <th style="padding:6px;border:1px solid #ddd;width:30px;text-align:center">#</th>
        <th style="padding:6px;border:1px solid #ddd;text-align:left">Part Description</th>
        <th style="padding:6px;border:1px solid #ddd;width:60px;text-align:center">Qty</th>
        <th style="padding:6px;border:1px solid #ddd;width:60px;text-align:center">UOM</th>
        <th style="padding:6px;border:1px solid #ddd;text-align:left">Notes</th>
      </tr>
    </thead>
    <tbody>${materialRows}</tbody>
  </table>` : ''}

  <!-- Required Services Table -->
  ${ticket.serviceRequired && ticket.services?.length ? `
  <h3 style="margin:20px 0 6px;font-size:12px;color:#1f4e79;border-bottom:1px solid #1f4e79;padding-bottom:2px">4. SPECIALIST SERVICES / LABOR</h3>
  <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:6px">
    <thead>
      <tr style="background:#f0f0f0;color:#333;font-weight:bold">
        <th style="padding:6px;border:1px solid #ddd;width:30px;text-align:center">#</th>
        <th style="padding:6px;border:1px solid #ddd;text-align:left">Service Description</th>
        <th style="padding:6px;border:1px solid #ddd;width:100px;text-align:center">Specialist</th>
        <th style="padding:6px;border:1px solid #ddd;width:100px;text-align:center">Est. Duration</th>
      </tr>
    </thead>
    <tbody>${serviceRows}</tbody>
  </table>` : ''}

  <!-- Resolution & Checklist -->
  <h3 style="margin:20px 0 6px;font-size:12px;color:#1f4e79;border-bottom:1px solid #1f4e79;padding-bottom:2px">5. RESOLUTION & RECTIFICATION NOTES</h3>
  <div style="padding:10px;border:1px solid #eee;background:#fafafa;border-radius:4px;min-height:50px;margin-bottom:12px">
    ${ticket.resolutionNotes || '<span style="color:#999">Resolution logs pending completion.</span>'}
  </div>

  <table style="width:100%;font-size:11px;margin-top:12px">
    <tr>
      <td style="width:50%;vertical-align:top">
        <span style="font-size:13px;margin-right:6px">${cleanChecked}</span> Visual Inspection Cleaned<br/>
        <span style="font-size:13px;margin-right:6px">${photosChecked}</span> Before / After Photos Captured
      </td>
      <td style="width:50%;vertical-align:top">
        <span style="font-size:13px;margin-right:6px">${toolsChecked}</span> Tools and Spares Cleared<br/>
        <span style="font-size:13px;margin-right:6px">${safetyChecked}</span> Mechanical Safety Check Passed
      </td>
    </tr>
  </table>

  <!-- Operational Signatures -->
  <h3 style="margin:24px 0 6px;font-size:12px;color:#1f4e79;border-bottom:1px solid #1f4e79;padding-bottom:2px">6. OPERATIONAL VERIFICATION SIGN-OFF</h3>
  <table style="width:100%;margin-top:24px;font-size:11px;text-align:center">
    <tr>
      <td style="width:25%;vertical-align:top">
        <div style="border-top:1px solid #333;margin:30px 6px 0;padding-top:4px">
          <b>Operator / Reporter</b><br/>
          <span>${ticket.signatures?.operator?.name || 'Field Operator'}</span><br/>
          <span style="color:#777;font-size:10px">${ticket.signatures?.operator?.date ? fmtDate(ticket.signatures.operator.date) : ''}</span>
        </div>
      </td>
      <td style="width:25%;vertical-align:top">
        <div style="border-top:1px solid #333;margin:30px 6px 0;padding-top:4px">
          <b>Lead Mechanic</b><br/>
          <span>${ticket.signatures?.mechanic?.name || 'Maintenance Crew'}</span><br/>
          <span style="color:#777;font-size:10px">${ticket.signatures?.mechanic?.date ? fmtDate(ticket.signatures.mechanic.date) : ''}</span>
        </div>
      </td>
      <td style="width:25%;vertical-align:top">
        <div style="border-top:1px solid #333;margin:30px 6px 0;padding-top:4px">
          <b>Checked By (Supervisor)</b><br/>
          <span>${ticket.signatures?.supervisor?.name || 'Field Supervisor'}</span><br/>
          <span style="color:#777;font-size:10px">${ticket.signatures?.supervisor?.date ? fmtDate(ticket.signatures.supervisor.date) : ''}</span>
        </div>
      </td>
      <td style="width:25%;vertical-align:top">
        <div style="border-top:1px solid #333;margin:30px 6px 0;padding-top:4px">
          <b>Approved By (GM)</b><br/>
          <span>${ticket.signatures?.gm?.name || 'General Manager'}</span><br/>
          <span style="color:#777;font-size:10px">${ticket.signatures?.gm?.date ? fmtDate(ticket.signatures.gm.date) : ''}</span>
        </div>
      </td>
    </tr>
  </table>

  <p style="font-size:10px;color:#aaa;margin-top:32px;text-align:center">Generated by Antrac ERP · Well Land Investment Pvt Ltd</p>
</body></html>`;
}

/** Trigger browser download of HTML string. */
export function downloadHtml(filename: string, html: string): void {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Open a clean print window from a pre-built standalone HTML document and
 * trigger the browser's native print dialog. Much cleaner than window.print()
 * on the SPA because it uses the exact same HTML that `downloadHtml` would
 * produce — no sidebar, no dark-theme backgrounds, no action panels.
 */
export function printHtml(html: string, title = 'Antrac ERP Document'): void {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    // Fallback: download the file so the user can open it and print manually.
    downloadHtml(`${title}.html`, html);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  // Give the browser a moment to fully render the document before printing.
  win.onload = () => {
    win.focus();
    win.print();
    // Close the helper window after the print dialog dismisses.
    win.onafterprint = () => win.close();
  };
}

/** Purchase Request document HTML generator (internal summary sheet). */
export function buildPrHtml(pr: {
  displayId: string;
  title?: string;
  reason?: string;
  siteId?: string;
  sbuId?: string;
  urgency?: string;
  costCenter?: string;
  requestedDeliveryDate?: Date | string;
  stockChecked?: boolean;
  stockCheckedBy?: string;
  preferredSupplierName?: string;
  origin?: string;
  status?: string;
  lineItems?: { description: string; quantity: number; uom: string; estimatedUnitPrice?: number; ref?: string }[];
  createdAt?: Date | string;
  signatures?: {
    requester?: { name: string; date: string | Date };
    verifier?: { name: string; date: string | Date };
    gm?: { name: string; date: string | Date };
  };
}): string {
  const today = new Date();
  const rows = (pr.lineItems ?? []).map((li, i) => {
    const est = li.estimatedUnitPrice;
    const lineTotal = est != null ? (est * li.quantity).toLocaleString('en-MV', { minimumFractionDigits: 2 }) : '—';
    return `
    <tr>
      <td style="padding:8px;border:1px solid #ddd;text-align:center">${i + 1}</td>
      <td style="padding:8px;border:1px solid #ddd">${li.description}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center">${li.quantity}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center">${li.uom}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">${est != null ? est.toLocaleString('en-MV', { minimumFractionDigits: 2 }) : '—'}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">${lineTotal}</td>
    </tr>`;
  }).join('');

  const estTotal = (pr.lineItems ?? []).reduce((s, li) =>
    s + (li.estimatedUnitPrice != null ? li.estimatedUnitPrice * li.quantity : 0), 0);

  function sigBox(label: string, sig?: { name: string; date: string | Date }) {
    return `
    <td style="padding:8px;border:1px solid #ddd;width:33%;text-align:center;vertical-align:top">
      <div style="height:50px"></div>
      <div style="border-top:1px solid #333;margin:0 16px;padding-top:6px">
        <b style="font-size:11px">${label}</b><br/>
        <span style="color:#777;font-size:10px">${sig?.name ?? '_________________'}</span><br/>
        <span style="color:#777;font-size:10px">${sig?.date ? fmtDate(sig.date) : ''}</span>
      </div>
    </td>`;
  }

  return `<!doctype html><html><head><meta charset="utf-8"><title>${pr.displayId}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:760px;margin:32px auto;padding:0 24px;line-height:1.4">
  <!-- Corporate Header -->
  <table style="width:100%;border-bottom:3px solid #1f4e79;padding-bottom:12px">
    <tr>
      <td>
        <h1 style="margin:0;font-size:22px;color:#1f4e79;font-weight:bold">${WLI_NAME}</h1>
        <p style="margin:2px 0;font-size:11px;color:#555">${WLI_SUB}</p>
        <p style="margin:2px 0;font-size:11px;color:#555">${WLI_ADDRESS}</p>
        <p style="margin:2px 0;font-size:11px;color:#555"><b>TIN:</b> ${WLI_TIN} | ${WLI_CONTACT}</p>
      </td>
      <td style="text-align:right;vertical-align:top">
        <h2 style="margin:0;font-size:16px;color:#333;font-weight:bold;letter-spacing:1px">PURCHASE REQUEST</h2>
        <p style="margin:4px 0;font-size:14px;color:#1f4e79"><b>No: ${pr.displayId}</b></p>
        <p style="margin:2px 0;font-size:11px;color:#555">Date: ${today.toLocaleDateString()}</p>
        <p style="margin:2px 0;font-size:11px"><span style="background:#1f4e79;color:#fff;padding:2px 8px;border-radius:2px;text-transform:uppercase;font-size:10px">${pr.status ?? 'on_hold'}</span></p>
      </td>
    </tr>
  </table>

  <!-- Meta grid -->
  <table style="width:100%;font-size:12px;margin-top:20px;border-collapse:collapse">
    <tr>
      <td style="vertical-align:top;width:50%;padding:4px">
        <h3 style="margin:0 0 6px;font-size:12px;color:#1f4e79;border-bottom:1px solid #ddd;padding-bottom:2px">REQUEST DETAILS</h3>
        <b>Title:</b> ${pr.title || '—'}<br/>
        <b>Site:</b> ${(pr.siteId ?? '—').toUpperCase()}<br/>
        <b>SBU:</b> ${(pr.sbuId ?? '—').toUpperCase()}<br/>
        <b>Cost Center:</b> ${pr.costCenter || '—'}<br/>
        <b>Origin:</b> ${pr.origin ?? 'Direct'}<br/>
        <b>Stock Checked:</b> ${pr.stockChecked ? `Yes — by ${pr.stockCheckedBy || 'N/A'}` : 'No'}
      </td>
      <td style="vertical-align:top;padding:4px;padding-left:20px">
        <h3 style="margin:0 0 6px;font-size:12px;color:#1f4e79;border-bottom:1px solid #ddd;padding-bottom:2px">DELIVERY & URGENCY</h3>
        <b>Urgency:</b> <span style="text-transform:uppercase;font-weight:bold;color:${pr.urgency === 'critical' ? '#d94338' : '#333'}">${pr.urgency ?? '—'}</span><br/>
        <b>Requested Delivery:</b> ${pr.requestedDeliveryDate ? fmtDate(pr.requestedDeliveryDate) : 'As soon as possible'}<br/>
        ${pr.preferredSupplierName ? `<b>Preferred Supplier:</b> ${pr.preferredSupplierName}<br/>` : ''}
      </td>
    </tr>
  </table>

  ${pr.reason ? `
  <div style="margin-top:16px;padding:12px;border:1px solid #ddd;border-radius:4px;background:#fafafa;font-size:12px">
    <b>Justification / Reason:</b><br/>
    <span style="white-space:pre-line;color:#444">${pr.reason}</span>
  </div>` : ''}

  <!-- Line items -->
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:20px">
    <thead>
      <tr style="background:#1f4e79;color:#fff">
        <th style="padding:8px;border:1px solid #ddd;width:36px;text-align:center">#</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:left">Item / Description</th>
        <th style="padding:8px;border:1px solid #ddd;width:70px;text-align:center">Qty</th>
        <th style="padding:8px;border:1px solid #ddd;width:70px;text-align:center">UOM</th>
        <th style="padding:8px;border:1px solid #ddd;width:120px;text-align:right">Est. Unit (MVR)</th>
        <th style="padding:8px;border:1px solid #ddd;width:120px;text-align:right">Est. Total (MVR)</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr style="font-weight:bold;background:#f5f8fa">
        <td colspan="5" style="padding:8px;border:1px solid #ddd;text-align:right">Estimated Grand Total (MVR)</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;color:#1f4e79">${estTotal > 0 ? estTotal.toLocaleString('en-MV', { minimumFractionDigits: 2 }) : '—'}</td>
      </tr>
    </tfoot>
  </table>
  <p style="font-size:10px;color:#888;margin-top:4px">* Estimated prices are indicative only and subject to supplier quotation.</p>

  <!-- Signature block -->
  <table style="width:100%;margin-top:32px;border-collapse:collapse">
    <tr>
      ${sigBox('Requested By', pr.signatures?.requester)}
      ${sigBox('Verified By (Procurement)', pr.signatures?.verifier)}
      ${sigBox('Approved By (GM)', pr.signatures?.gm)}
    </tr>
  </table>

  <p style="font-size:10px;color:#aaa;margin-top:32px;text-align:center">Generated by Antrac ERP · Well Land Investment Pvt Ltd</p>
</body></html>`;
}

