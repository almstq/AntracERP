import { useParams, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { ArrowLeft, Download } from 'lucide-react';
import { useEntity } from '../../../lib/hooks/useWorkflowData';
import { Timeline } from '../../../components/workflow/Timeline';
import { TransitionPanel } from '../../../components/workflow/TransitionPanel';
import { buildPoHtml, downloadHtml } from '../../../lib/services/rfq';
import { purchaseOrderWorkflow as poWf } from '../../../lib/workflow/definitions';
import type { PurchaseOrder, POStatus } from '../../../types/workflow-entities';

const PAYMENT_CHAIN: POStatus[] = [
  'raised', 'supplier_confirmed', 'items_collected', 'payment_request_sent',
  'antrac_finance_accepted', 'cfo_verified', 'director_approved',
  'payment_completed', 'wli_finance_confirmed', 'po_closed',
];

export function PurchaseOrderDetail() {
  const { id } = useParams();
  const { data: po, loading, refresh } = useEntity<PurchaseOrder>('purchaseOrders', id);

  if (loading) return <div className="p-6 text-xs text-text-muted">Loading…</div>;
  if (!po) return <div className="p-6 text-xs text-text-muted">PO not found.</div>;

  const idx = PAYMENT_CHAIN.indexOf(po.status as POStatus);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wli/procurement/orders" className="text-text-muted hover:text-text-primary"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary">{po.displayId}</h1>
            <span className="text-[10px] px-2 py-1 rounded-full bg-bg-surface text-text-secondary">{poWf.statusLabels[po.status as POStatus]}</span>
          </div>
          <p className="text-xs text-text-muted">
            {po.supplierName} · PR <Link to={`/wli/procurement/requests/${po.purchaseRequestId}`} className="text-blue">view</Link>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card header={
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium">Order</span>
              <button onClick={() => downloadHtml(`${po.displayId}.html`, buildPoHtml(po))}
                className="flex items-center gap-1 text-[11px] text-blue hover:underline">
                <Download size={12} /> Download PO
              </button>
            </div>
          }>
            <div className="space-y-2 text-xs">
              {po.lineItems?.map((li, i) => (
                <div key={i} className="flex justify-between p-2 rounded-lg bg-bg-surface">
                  <span className="text-text-primary">{li.description}</span>
                  <span className="text-text-muted">×{li.quantity} {li.uom} @ {li.unitPrice} = {(li.quantity * li.unitPrice).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-border font-medium">
                <span className="text-text-primary">Total</span>
                <span className="text-text-primary">{po.currency} {po.total?.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Payment chain progress */}
          <Card header={<span className="text-sm font-medium">Payment Chain</span>}>
            <div className="space-y-1.5">
              {PAYMENT_CHAIN.map((st, i) => (
                <div key={st} className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${i <= idx ? 'bg-teal' : 'bg-border'}`} />
                  <span className={i <= idx ? 'text-text-primary' : 'text-text-muted'}>{poWf.statusLabels[st]}</span>
                </div>
              ))}
            </div>
          </Card>

          <Timeline collection="purchaseOrders" entityId={po.id} />
        </div>

        <div className="space-y-4">
          <TransitionPanel workflowId="purchase_order" entityId={po.id} status={po.status} onDone={refresh} />
        </div>
      </div>
    </div>
  );
}
