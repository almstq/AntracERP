import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Check, Package, Banknote, FileText, ShieldCheck } from 'lucide-react';
import { FileUpload } from '../../../components/shared/FileUpload';
import { Timeline } from '../../../components/workflow/Timeline';
import { TransitionPanel } from '../../../components/workflow/TransitionPanel';
import { CollectItemsPanel } from '../../../components/workflow/CollectItemsPanel';
import { buildPoHtml, downloadHtml, printHtml } from '../../../lib/services/rfq';
import { computeTotals, formatMoney, type Currency } from '../../../lib/utils/money';
import { purchaseOrderWorkflow as poWf } from '../../../lib/workflow/definitions';
import { useEntity, useTimeline } from '../../../lib/hooks/useWorkflowData';
import type { PurchaseOrder, POStatus } from '../../../types/workflow-entities';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';

const PAYMENT_CHAIN: POStatus[] = [
  'raised', 'supplier_confirmed', 'payment_request_sent',
  'antrac_finance_accepted', 'cfo_verified', 'director_approved',
  'payment_completed', 'wli_finance_confirmed', 'items_collected', 'po_closed',
];

function poBadge(status: string): string {
  if (status === 'po_closed' || status === 'items_collected' || status === 'wli_finance_confirmed') return 'b-pos';
  if (status === 'payment_completed' || status === 'director_approved') return 'b-accent';
  if (status === 'raised' || status === 'supplier_confirmed') return 'b-info';
  return 'b-warn';
}

function toDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (val.toDate && typeof val.toDate === 'function') return val.toDate();
  if (val.seconds != null) return new Date(val.seconds * 1000);
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function formatDuration(ms: number): string {
  if (ms < 0) return '—';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return '< 1m';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return `${hours}h ${remMins}m`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h`;
}

function formatTime(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PurchaseOrderDetail() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const inHolding = pathname.startsWith('/holding');
  const backTo = inHolding ? '/holding/approvals' : '/wli/procurement/orders';
  const backLabel = inHolding ? 'Payment Approvals' : 'Purchase Orders';
  
  const { data: po, loading, refresh } = useEntity<PurchaseOrder>('purchaseOrders', id);
  const { data: timelineEvents } = useTimeline('purchaseOrders', id);

  if (loading) return <div className="page"><LoadingSpinner text="Loading…" /></div>;
  if (!po) return <div className="page"><p className="empty-note">PO not found.</p></div>;

  const idx = PAYMENT_CHAIN.indexOf(po.status as POStatus);
  const totals = computeTotals(po.lineItems ?? []);
  const cur = (po.currency ?? 'MVR') as Currency;

  // Map each PAYMENT_CHAIN step to a timestamp
  const stepTimes: Record<string, Date | null> = {};
  stepTimes['raised'] = toDate(po.createdAt);

  if (timelineEvents && timelineEvents.length > 0) {
    for (const e of timelineEvents) {
      if (e.to) {
        stepTimes[e.to] = toDate(e.timestamp);
      }
    }
  }

  return (
    <div className="page">
      <Link to={backTo} className="dback"><ArrowLeft /> {backLabel}</Link>

      <div className="dhead">
        <div>
          <span className="eyebrow">{po.displayId}</span>
          <h1 className="dtitle">{po.supplierName}</h1>
          <div className="dhead-badges">
            <span className={`badge ${poBadge(po.status)}`}><span className="bdot" />{poWf.statusLabels[po.status as POStatus]}</span>
            <Link className="tc-sub" to={`${inHolding ? '/holding/procurement' : '/wli/procurement'}/requests/${po.purchaseRequestId}`} style={{ color: 'var(--accent)' }}>View source PR</Link>
          </div>
        </div>
        <div className="dhead-actions">
          <button className="btn btn-ghost" onClick={() => printHtml(buildPoHtml(po), po.displayId)}>
            <FileText size={14} /> Print PDF
          </button>
          <button className="btn btn-ghost" onClick={() => downloadHtml(`${po.displayId}.html`, buildPoHtml(po))}>
            <Download size={14} /> Download PO
          </button>
        </div>
      </div>

      <div className="detail">
        <div className="dcol">
          <div className="dcard">
            <div className="dcard-h"><h3><Package /> Order Details</h3><span className="tc-sub">{po.currency} {po.total?.toLocaleString()}</span></div>
            <div className="dcard-b">
              {po.lineItems?.map((li, i) => (
                <div className="lineitem" key={i}>
                  <div><div className="li-t">{li.description}</div><div className="li-s">×{li.quantity} {li.uom} @ {li.unitPrice}</div></div>
                  <div className="li-v">{(li.quantity * li.unitPrice).toLocaleString()}</div>
                </div>
              ))}
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div className="lineitem" style={{ padding: '6px 0', border: 'none' }}>
                  <span className="li-s">Subtotal</span><span className="li-v">{formatMoney(totals.subtotal, cur)}</span>
                </div>
                <div className="lineitem" style={{ padding: '6px 0', border: 'none' }}>
                  <span className="li-s">GST 8%</span><span className="li-v">{formatMoney(totals.gst, cur)}</span>
                </div>
                <div className="lineitem" style={{ padding: '6px 0', border: 'none' }}>
                  <span className="li-t" style={{ fontWeight: 600 }}>Grand Total</span>
                  <span className="li-v" style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatMoney(totals.total, cur)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="dcard">
            <div className="dcard-h"><h3><FileText /> Tax &amp; Delivery Compliance</h3></div>
            <div className="dcard-b">
              <div className="kv">
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="k">Buyer Details (WLI)</div>
                  <div className="v" style={{ display: 'block', lineHeight: '1.4' }}>
                    <b>WELL LAND INVESTMENT PVT LTD</b><br />
                    TIN: <span className="mono">{po.buyerTin || '1007799GST501'}</span><br />
                    Address: {po.buyerAddress || "H. Bonthi, 3rd Floor, Male', Republic of Maldives"}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                  <div className="k">Supplier Details</div>
                  <div className="v" style={{ display: 'block', lineHeight: '1.4' }}>
                    <b>{po.supplierName}</b><br />
                    TIN: <span className="mono">{po.supplierTin || '—'}</span><br />
                    Address: {po.supplierAddress || '—'}<br />
                    Contact: {po.supplierContact || '—'}
                  </div>
                </div>
                <div style={{ marginTop: 8 }}><div className="k">Delivery Address</div><div className="v">{po.deliveryAddress || '—'}</div></div>
                <div style={{ marginTop: 8 }}><div className="k">Delivery Deadline</div><div className="v">{po.deliveryDeadline ? new Date(po.deliveryDeadline).toLocaleDateString() : '—'}</div></div>
                <div style={{ marginTop: 8 }}><div className="k">Delivery Method</div><div className="v">{po.deliveryMethod || '—'}</div></div>
                <div style={{ marginTop: 8 }}><div className="k">Incoterms</div><div className="v" style={{ textTransform: 'uppercase' }}>{po.incoterms || '—'}</div></div>
                <div style={{ marginTop: 8 }}><div className="k">Delay Penalty</div><div className="v">{po.delayPenaltyTerms || '—'}</div></div>
                <div style={{ marginTop: 8 }}><div className="k">Payment Terms</div><div className="v">{po.paymentTerms || '—'}</div></div>
              </div>
            </div>
          </div>

          <div className="dcard">
            <div className="dcard-h"><h3><ShieldCheck /> Three-Way Match Audit</h3></div>
            <div className="dcard-b">
              <div className="kv">
                <div>
                  <div className="k">Match Status</div>
                  <div className="v">
                    <span className={`badge ${po.matchedStatus === 'matched' ? 'b-pos' : po.matchedStatus === 'variance_flagged' ? 'b-danger' : 'b-warn'}`}>
                      {po.matchedStatus ? po.matchedStatus.toUpperCase() : 'PENDING'}
                    </span>
                  </div>
                </div>
                <div><div className="k">GRN Reference</div><div className="v"><span className="mono">{po.grnId || '—'}</span></div></div>
                <div><div className="k">Supplier Invoice</div><div className="v"><span className="mono">{po.supplierInvoiceId || '—'}</span></div></div>
              </div>
            </div>
          </div>

          <div className="dcard">
            <div className="dcard-h"><h3>Workflow Signatures &amp; Stamps</h3></div>
            <div className="dcard-b">
              <div className="kv" style={{ marginBottom: 16 }}>
                <div>
                  <div className="k">Prepared By (Procurement)</div>
                  <div className="v">
                    {po.signatures?.prepared ? (
                      <span className="text-teal font-medium">✓ Signed: {po.signatures.prepared.name} ({new Date(po.signatures.prepared.date).toLocaleDateString()})</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="k">Verified By (CFO/Finance)</div>
                  <div className="v">
                    {po.signatures?.verified ? (
                      <span className="text-teal font-medium">✓ Signed: {po.signatures.verified.name} ({new Date(po.signatures.verified.date).toLocaleDateString()})</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="k">Approved By (Director)</div>
                  <div className="v">
                    {po.signatures?.approved ? (
                      <span className="text-teal font-medium">✓ Signed: {po.signatures.approved.name} ({new Date(po.signatures.approved.date).toLocaleDateString()})</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg bg-bg-base/40 text-center" style={{ minHeight: 120 }}>
                <span className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Company Seal Area</span>
                <span className="text-xs text-text-secondary font-medium">WELL LAND INVESTMENT PVT LTD</span>
              </div>
            </div>
          </div>

          {po.termsAndConditions && (
            <div className="dcard">
              <div className="dcard-h"><h3>Terms &amp; Conditions</h3></div>
              <div className="dcard-b">
                <p className="text-xs text-text-secondary whitespace-pre-line leading-relaxed">{po.termsAndConditions}</p>
              </div>
            </div>
          )}

          <div className="dcard">
            <div className="dcard-h"><h3><Banknote /> Payment Chain Timeline &amp; Analytics</h3><span className="tc-sub">pay-first</span></div>
            <div className="dcard-b">
              <div className="tl">
                {PAYMENT_CHAIN.map((st, i) => {
                  const state = i < idx ? 'done' : i === idx ? 'current' : 'pending';
                  const stepTime = stepTimes[st];
                  
                  // Compute duration from the nearest previous step that has a timestamp
                  let durationStr = '';
                  if (i > 0 && stepTime) {
                    let prevTime: Date | null = null;
                    let prevStepName = '';
                    for (let j = i - 1; j >= 0; j--) {
                      const stPrev = PAYMENT_CHAIN[j];
                      if (stepTimes[stPrev]) {
                        prevTime = stepTimes[stPrev];
                        prevStepName = poWf.statusLabels[stPrev] || stPrev;
                        break;
                      }
                    }
                    if (prevTime) {
                      const diff = stepTime.getTime() - prevTime.getTime();
                      durationStr = `${formatDuration(diff)} (since ${prevStepName})`;
                    }
                  }

                  return (
                    <div className={`tl-step ${state}`} key={st}>
                      <div className="tl-rail">
                        <span className="tl-dot">{state === 'done' ? <Check size={10} /> : null}</span>
                        <span className="tl-line" />
                      </div>
                      <div className="tl-c">
                        <div className="tl-title" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontWeight: state === 'current' ? 600 : 400 }}>{poWf.statusLabels[st as POStatus]}</span>
                          {stepTime && (
                            <span className="mono text-[10px] text-text-muted" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                              {formatTime(stepTime)}
                            </span>
                          )}
                        </div>
                        {durationStr && (
                          <div className="text-[10px] text-amber mt-0.5" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>⏱ Took {durationStr}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <FileUpload
            collection="purchaseOrders"
            entityId={po.id}
            entityDisplayId={po.displayId}
            attachments={(po as { attachments?: [] }).attachments ?? []}
            onUpdate={refresh}
            label="Tax Invoices & Receipts"
            accept="image/*,.pdf"
          />

          <Timeline collection="purchaseOrders" entityId={po.id} />
        </div>

        <div className="dcol">
          {po.status === 'wli_finance_confirmed'
            ? <CollectItemsPanel po={po} onDone={refresh} />
            : <TransitionPanel workflowId="purchase_order" entityId={po.id} status={po.status} onDone={refresh} signatures={po.signatures} />}
        </div>
      </div>
    </div>
  );
}
