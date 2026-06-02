import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Truck, CheckCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useStockTransfer } from '../../../lib/hooks/useInventory';
import { dispatchTransfer, receiveTransfer } from '../../../lib/services/inventory';
import type { TransferStatus } from '../../../types/inventory';
import { useState } from 'react';
import { PageContainer } from '../../../components/shared/PageContainer';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';
import { useToast } from '../../../lib/context/ToastContext';

const STATUS_STYLE: Record<TransferStatus, string> = {
  requested:  'bg-amber/10 text-amber',
  in_transit: 'bg-blue/10 text-blue',
  received:   'bg-green/10 text-green',
  cancelled:  'bg-bg-surface text-text-muted',
};
const STATUS_LABEL: Record<TransferStatus, string> = {
  requested: 'Requested', in_transit: 'In Transit', received: 'Received', cancelled: 'Cancelled',
};

function fmtDate(d: Date | undefined): string {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('en-MV', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + dt.toLocaleTimeString('en-MV', { hour: '2-digit', minute: '2-digit' });
}

export function TransferDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, effectiveRole } = useAuth();
  const { data: transfer, loading, refresh } = useStockTransfer(id);
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function dispatch() {
    if (!transfer || !user) return;
    setBusy(true); setErr(null);
    try { await dispatchTransfer(transfer.id, user.uid); refresh(); toast('success', 'Transfer dispatched'); }
    catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setErr(msg);
      toast('error', msg);
    }
    finally { setBusy(false); }
  }

  async function receive() {
    if (!transfer || !user) return;
    setBusy(true); setErr(null);
    try { await receiveTransfer(transfer, user.uid); refresh(); toast('success', 'Transfer received, stock updated'); }
    catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setErr(msg);
      toast('error', msg);
    }
    finally { setBusy(false); }
  }

  if (loading) return <LoadingSpinner text="Loading…" />;
  if (!transfer) return <div className="p-6 text-xs text-red">Transfer not found.</div>;

  const canDispatch = transfer.status === 'requested' &&
    ['inventory_staff', 'supervisor', 'gm', 'super_admin'].includes(effectiveRole ?? '');
  const canReceive = transfer.status === 'in_transit' &&
    ['inventory_staff', 'supervisor', 'gm', 'super_admin'].includes(effectiveRole ?? '');

  return (
    <PageContainer className="max-w-3xl space-y-4">
      <Link to="/wli/warehouse/transfers" aria-label="Back to transfers" className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary">
        <ArrowLeft size={14} /> Transfers
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary">{transfer.displayId}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-text-muted">{transfer.fromStoreName}</span>
            <ArrowRight size={12} className="text-text-muted" />
            <span className="text-xs text-text-muted">{transfer.toStoreName}</span>
          </div>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLE[transfer.status]}`}>
          {STATUS_LABEL[transfer.status]}
        </span>
      </div>

      {/* Line items */}
      <Card header={<span className="text-xs font-semibold">Items</span>}>
        <div className="divide-y divide-border">
          {transfer.lineItems.map((line, i) => (
            <div key={i} className="flex justify-between py-2">
              <div>
                <p className="text-xs font-medium text-text-primary">{line.itemName}</p>
                <p className="text-[10px] text-text-muted">{line.itemId.slice(0, 8)}</p>
              </div>
              <span className="text-xs font-medium text-text-primary">{line.qty} {line.uom}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Timeline */}
      <Card header={<span className="text-xs font-semibold">Timeline</span>}>
        <div className="space-y-2">
          <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-green/10 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle size={12} className="text-green" />
            </div>
            <div>
              <p className="text-xs text-text-primary">Transfer raised</p>
              <p className="text-[10px] text-text-muted">{fmtDate(transfer.createdAt)}</p>
            </div>
          </div>
          {transfer.dispatchedAt && (
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-blue/10 flex items-center justify-center shrink-0 mt-0.5">
                <Truck size={12} className="text-blue" />
              </div>
              <div>
                <p className="text-xs text-text-primary">Dispatched</p>
                <p className="text-[10px] text-text-muted">{fmtDate(transfer.dispatchedAt)}</p>
              </div>
            </div>
          )}
          {transfer.receivedAt && (
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-green/10 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle size={12} className="text-green" />
              </div>
              <div>
                <p className="text-xs text-text-primary">Received at {transfer.toStoreName}</p>
                <p className="text-[10px] text-text-muted">{fmtDate(transfer.receivedAt)}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {transfer.notes && (
        <p className="text-xs text-text-secondary">Notes: {transfer.notes}</p>
      )}

      {/* Actions */}
      {err && <p className="text-xs text-red">{err}</p>}
      {canDispatch && (
        <Button variant="primary" size="md" className="w-full" onClick={dispatch} disabled={busy}>
          <Truck size={14} /> {busy ? 'Dispatching…' : 'Mark Dispatched (In Transit)'}
        </Button>
      )}
      {canReceive && (
        <Button variant="primary" size="md" className="w-full" onClick={receive} disabled={busy}>
          <CheckCircle size={14} /> {busy ? 'Receiving…' : 'Confirm Receipt — Update Stock'}
        </Button>
      )}
    </PageContainer>
  );
}
