import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import PDFDocument from 'pdfkit';

admin.initializeApp();

// ─── Types (mirrored from client; keep in sync) ───────────────────────────────

interface WeekRange {
  start: Date;
  end: Date;
  weekLabel: string; // e.g. "2026-W23"
  dateRange: string; // e.g. "02 Jun – 08 Jun 2026"
}

function getMvWeekRange(): WeekRange {
  // MV is UTC+5. Sunday 23:59 MV = 18:59 UTC — the function fires just after week end.
  const now = new Date();
  const mvNow = new Date(now.getTime() + 5 * 60 * 60 * 1000); // shift to MV time

  // Week: Mon 00:00 MV → Sun 23:59 MV
  const dayOfWeek = mvNow.getDay(); // 0=Sun, 1=Mon … 6=Sat
  const daysToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monMV = new Date(mvNow);
  monMV.setDate(mvNow.getDate() + daysToMon);
  monMV.setHours(0, 0, 0, 0);

  const sunMV = new Date(monMV);
  sunMV.setDate(monMV.getDate() + 6);
  sunMV.setHours(23, 59, 59, 999);

  // Back to UTC for Firestore queries
  const start = new Date(monMV.getTime() - 5 * 60 * 60 * 1000);
  const end   = new Date(sunMV.getTime() - 5 * 60 * 60 * 1000);

  // ISO week number
  const jan4 = new Date(monMV.getFullYear(), 0, 4);
  const weekNum = Math.ceil(((monMV.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7);

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-MV', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Indian/Maldives' });

  return {
    start,
    end,
    weekLabel: `${monMV.getFullYear()}-W${String(weekNum).padStart(2, '0')}`,
    dateRange: `${fmt(monMV)} – ${fmt(sunMV)}`,
  };
}

// ─── PDF Builder ──────────────────────────────────────────────────────────────

async function buildSnapshotPdf(week: WeekRange): Promise<Buffer> {
  const db = getFirestore();

  const startTs = Timestamp.fromDate(week.start);
  const endTs   = Timestamp.fromDate(week.end);

  // Helper: query a collection for docs created or updated this week
  async function weekDocs(col: string, field = 'createdAt'): Promise<admin.firestore.DocumentData[]> {
    try {
      const snap = await db.collection(col)
        .where(field, '>=', startTs)
        .where(field, '<=', endTs)
        .orderBy(field, 'desc')
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      return []; // index may not exist yet; degrade gracefully
    }
  }

  const [tickets, prs, pos, fuelReqs, workOrders, uploads] = await Promise.all([
    weekDocs('tickets'),
    weekDocs('purchaseRequests'),
    weekDocs('purchaseOrders'),
    weekDocs('fuelRequests'),
    weekDocs('workOrders'),
    weekDocs('documents', 'uploadedAt'),
  ]);

  const closedTickets  = tickets.filter(t  => ['closed', 'rejected'].includes(t.status));
  const closedPos      = pos.filter(p      => p.status === 'po_closed');
  const closedFuel     = fuelReqs.filter(f => ['closed', 'rejected'].includes(f.status));
  const closedOrders   = workOrders.filter(w => w.status === 'closed');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const BLUE   = '#3B82F6';
    const MUTED  = '#71717A';
    const BORDER = '#33333A';

    // ── Header ──
    doc.rect(0, 0, doc.page.width, 80).fill('#09090B');
    doc.fillColor('#FAFAFA').fontSize(18).font('Helvetica-Bold')
      .text('Antrac ERP — Weekly Ops Snapshot', 48, 24);
    doc.fillColor(MUTED).fontSize(10)
      .text(`${week.weekLabel}  ·  ${week.dateRange}  ·  Generated automatically by starqOS`, 48, 50);

    doc.fillColor('#18181B').moveDown(2);

    // ── Summary bar ──
    const cols = [
      { label: 'Tickets', opened: tickets.length,   closed: closedTickets.length },
      { label: 'PRs',     opened: prs.length,        closed: 0 },
      { label: 'POs',     opened: pos.length,        closed: closedPos.length },
      { label: 'Fuel',    opened: fuelReqs.length,   closed: closedFuel.length },
      { label: 'W/Os',    opened: workOrders.length, closed: closedOrders.length },
      { label: 'Uploads', opened: uploads.length,    closed: 0 },
    ];

    doc.fillColor('#18181B').fontSize(12).font('Helvetica-Bold').text('Activity Summary', 48, doc.y);
    doc.moveDown(0.4);

    const colW = (doc.page.width - 96) / cols.length;
    let cx = 48;
    for (const c of cols) {
      doc.rect(cx, doc.y, colW - 6, 56).fill('#F0F1F4').stroke(BORDER);
      doc.fillColor(BLUE).fontSize(20).font('Helvetica-Bold').text(String(c.opened), cx + 8, doc.y - 50, { width: colW - 22, align: 'center' });
      doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(c.label, cx + 8, doc.y - 24, { width: colW - 22, align: 'center' });
      if (c.closed > 0) {
        doc.fillColor('#009588').fontSize(7).text(`${c.closed} closed`, cx + 8, doc.y - 12, { width: colW - 22, align: 'center' });
      }
      cx += colW;
    }
    doc.moveDown(5);

    // ── Section helper ──
    function section(title: string) {
      doc.addPage();
      doc.fillColor('#09090B').rect(0, 0, doc.page.width, 40).fill();
      doc.fillColor('#FAFAFA').fontSize(13).font('Helvetica-Bold').text(title, 48, 12);
      doc.fillColor('#18181B').moveDown(1.5);
    }

    function row(cells: string[], widths: number[], isHeader = false) {
      const y = doc.y;
      let x = 48;
      doc.fontSize(isHeader ? 8 : 7.5).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
      for (let i = 0; i < cells.length; i++) {
        doc.fillColor(isHeader ? MUTED : '#18181B').text(cells[i], x + 4, y + 3, { width: widths[i] - 8, lineBreak: false });
        x += widths[i];
      }
      doc.rect(48, y, widths.reduce((a, b) => a + b, 0), 18).stroke(BORDER);
      doc.y = y + 20;
    }

    function safeDate(val: unknown): string {
      if (!val) return '—';
      if (val instanceof Timestamp) return val.toDate().toLocaleDateString('en-MV');
      if (typeof val === 'string') return new Date(val).toLocaleDateString('en-MV');
      return '—';
    }

    // ── Transactions ──
    if (tickets.length > 0) {
      section('Issue Tickets');
      row(['ID', 'Asset / Description', 'Status', 'Urgency', 'Opened'], [70, 220, 100, 80, 80], true);
      for (const t of tickets.slice(0, 40)) {
        row([
          t.displayId ?? t.id.slice(0, 8),
          (t.description ?? '').slice(0, 40),
          t.status ?? '—',
          t.urgency ?? '—',
          safeDate(t.createdAt),
        ], [70, 220, 100, 80, 80]);
      }
    }

    if (pos.length > 0) {
      section('Purchase Orders');
      row(['PO ID', 'Supplier', 'Status', 'Amount', 'Opened'], [80, 180, 110, 90, 90], true);
      for (const p of pos.slice(0, 40)) {
        row([
          p.displayId ?? p.id.slice(0, 8),
          p.supplierName ?? '—',
          p.status ?? '—',
          p.totalAmount != null ? `${p.currency ?? 'MVR'} ${Number(p.totalAmount).toFixed(2)}` : '—',
          safeDate(p.createdAt),
        ], [80, 180, 110, 90, 90]);
      }
    }

    if (fuelReqs.length > 0) {
      section('Fuel / Water Requests');
      row(['ID', 'Item', 'Qty', 'Status', 'Opened'], [80, 200, 60, 100, 110], true);
      for (const f of fuelReqs.slice(0, 40)) {
        row([
          f.displayId ?? f.id.slice(0, 8),
          f.itemType ?? '—',
          f.quantity != null ? String(f.quantity) : '—',
          f.status ?? '—',
          safeDate(f.createdAt),
        ], [80, 200, 60, 100, 110]);
      }
    }

    if (workOrders.length > 0) {
      section('Work Orders (CRM)');
      row(['ID', 'Customer', 'Status', 'Invoice Total', 'Opened'], [80, 180, 100, 100, 90], true);
      for (const w of workOrders.slice(0, 40)) {
        row([
          w.displayId ?? w.id.slice(0, 8),
          w.customerName ?? '—',
          w.status ?? '—',
          w.invoiceTotal != null ? `MVR ${Number(w.invoiceTotal).toFixed(2)}` : '—',
          safeDate(w.createdAt),
        ], [80, 180, 100, 100, 90]);
      }
    }

    // ── Document Uploads ──
    section('Documents Uploaded This Week');
    row(['Filename', 'Entity', 'Type', 'Uploader', 'SHA-256 (first 16)', 'Uploaded'], [150, 80, 80, 90, 110, 80], true);
    for (const u of uploads.slice(0, 60)) {
      row([
        (u.name ?? '').slice(0, 28),
        `${u.entityCollection ?? ''}/${(u.entityDisplayId ?? '').slice(0, 8)}`,
        u.docType ?? '—',
        (u.uploadedByName ?? u.uploadedById ?? '—').slice(0, 18),
        u.sha256 ? u.sha256.slice(0, 16) : '— (legacy)',
        safeDate(u.uploadedAt),
      ], [150, 80, 80, 90, 110, 80]);
    }

    // ── Footer ──
    doc.addPage();
    doc.fillColor(MUTED).fontSize(8).font('Helvetica')
      .text(
        `Generated by starqOS / Antrac ERP on ${new Date().toISOString()} UTC.\n` +
        `This snapshot is an immutable operational record. Do not delete.\n` +
        `SHA-256 hashes prove file integrity at time of upload.\n` +
        `Week: ${week.weekLabel}  ·  ${week.dateRange}`,
        48, doc.page.height - 100, { align: 'center' },
      );

    doc.end();
  });
}

// ─── Scheduled Function ───────────────────────────────────────────────────────

/**
 * Fires every Sunday at 23:59 MV time (UTC+5) = 18:59 UTC.
 * Cron: "59 18 * * 0"
 */
export const weeklyOpsSnapshot = onSchedule(
  {
    schedule: '59 18 * * 0',
    timeZone: 'UTC',
    region: 'asia-south1',
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async () => {
    const week = getMvWeekRange();
    console.log(`[weeklyOpsSnapshot] Generating ${week.weekLabel} — ${week.dateRange}`);

    const pdfBuffer = await buildSnapshotPdf(week);
    const fileName = `${week.weekLabel}.pdf`;
    const storagePath = `snapshots/${fileName}`;

    // Upload to Firebase Storage
    const bucket = getStorage().bucket();
    const fileRef = bucket.file(storagePath);
    await fileRef.save(pdfBuffer, {
      contentType: 'application/pdf',
      metadata: { cacheControl: 'private, max-age=31536000' },
    });
    await fileRef.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Write vault document
    const db = getFirestore();
    await db.collection('documents').add({
      name: `Weekly Snapshot ${week.weekLabel}.pdf`,
      url,
      storagePath,
      size: pdfBuffer.length,
      mimeType: 'application/pdf',
      docType: 'weekly_snapshot',
      entityCollection: 'system',
      entityId: week.weekLabel,
      entityDisplayId: week.weekLabel,
      uploadedAt: new Date().toISOString(),
      uploadedById: 'system',
      uploadedByName: 'starqOS (auto)',
      sha256: null, // server-side hash not computed; file is system-generated
    });

    console.log(`[weeklyOpsSnapshot] Done — ${storagePath} (${pdfBuffer.length} bytes)`);
  },
);
