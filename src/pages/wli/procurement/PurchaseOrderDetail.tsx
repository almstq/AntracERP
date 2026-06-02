import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Check, Package, Banknote } from 'lucide-react';
import { FileUpload } from '../../../components/shared/FileUpload';
import { Timeline } from '../../../components/workflow/Timeline';
import { TransitionPanel } from '../../../components/workflow/TransitionPanel';
import { CollectItemsPanel } from '../../../components/workflow/CollectItemsPanel';
import { buildPoHtml, downloadHtml } from '../../../lib/services/rfq';
import { computeTotals, formatMoney, type Currency } from '../../../lib/utils/money';
import { purchaseOrderWorkflow as poWf } from '../../../lib/workflow/definitions';
import { useEntity } from '../../../lib/hooks/useWorkflowData';
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

export function PurchaseOrderDetail() {
  const { id } = useParams();
  const { data: po, loading, refresh } = useEntity<PurchaseOrder>('purchaseOrders', id);

  if (loading) return <div className="page"><LoadingSpinner text="Loading…" /></div>;
  if (!po) return <div className="page"><p className="empty-note">PO not found.</p></div>;

  const idx = PAYMENT_CHAIN.indexOf(po.status as POStatus);
  const totals = computeTotals(po.lineItems ?? []);
  const cur = (po.currency ?? 'MVR') as Currency;

  return (
    <div className="page">
      <Link to="/wli/procurement/orders" className="dback"><ArrowLeft /> Purchase Orders</Link>

      <div className="dhead">
        <div>
          <span className="eyebrow">{po.displayId}</span>
          <h1 className="dtitle">{po.supplierName}</h1>
          <div className="dhead-badges">
            <span className={`badge ${poBadge(po.status)}`}><span className="bdot" />{poWf.statusLabels[po.status as POStatus]}</span>
            <Link className="tc-sub" to={`/wli/procurement/requests/${po.purchaseRequestId}`} style={{ color: 'var(--accent)' }}>View source PR</Link>
          </div>
        </div>
        <div className="dhead-actions">
          <button className="btn btn-ghost" onClick={() => downloadHtml(`${po.displayId}.html`, buildPoHtml(po))}>
            <Download /> Download PO
          </button>
        </div>
      </div>

      <div className="detail">
        <div className="dcol">
          <div className="dcard">
            <div className="dcard-h"><h3><Package /> Order</h3><span className="tc-sub">{po.currency} {po.total?.toLocaleString()}</span></div>
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
            <div className="dcard-h"><h3><Banknote /> Payment Chain</h3><span className="tc-sub">pay-first</span></div>
            <div className="dcard-b">
              <div className="tl">
                {PAYMENT_CHAIN.map((st, i) => {
                  const state = i < idx ? 'done' : i === idx ? 'current' : 'pending';
                  return (
                    <div className={`tl-step ${state}`} key={st}>
                      <div className="tl-rail">
                        <span className="tl-dot">{state === 'done' ? <Check /> : null}</span>
                        <span className="tl-line" />
                      </div>
                      <div className="tl-c"><div className="tl-title">{poWf.statusLabels[st]}</div></div>
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
            : <TransitionPanel workflowId="purchase_order" entityId={po.id} status={po.status} onDone={refresh} />}
        </div>
      </div>
    </div>
  );
}
