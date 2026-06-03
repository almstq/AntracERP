import { Link } from 'react-router-dom';
import { Banknote, ChevronRight, Inbox, type LucideIcon } from 'lucide-react';
import { usePOList } from '../../lib/hooks/useWorkflowData';
import { purchaseOrderWorkflow as poWf } from '../../lib/workflow/definitions';
import { getAvailableTransitions } from '../../lib/workflow/engine';
import { useAuth } from '../../lib/hooks/useAuth';
import { ROLE_LABELS } from '../../lib/permissions/roles';
import type { POStatus } from '../../types/workflow-entities';

function poBadge(status: string): string {
  if (status === 'po_closed' || status === 'items_collected' || status === 'wli_finance_confirmed') return 'b-pos';
  if (status === 'payment_completed' || status === 'director_approved') return 'b-accent';
  if (status === 'raised' || status === 'supplier_confirmed') return 'b-info';
  return 'b-warn';
}

/** Holding-side payment approvals — the HQ chain (Antrac Finance → CFO → Director). */
export function PaymentApprovals() {
  const { effectiveRole } = useAuth();
  const { data: pos, loading } = usePOList();

  const awaiting = pos.filter((p) => getAvailableTransitions(poWf, p.status, effectiveRole).length > 0);
  const awaitingIds = new Set(awaiting.map((p) => p.id));
  // Everything still moving through the chain (for visibility), minus the ones I can act on.
  const inChain = pos.filter((p) => p.status !== 'po_closed' && !awaitingIds.has(p.id));

  const metrics: { label: string; value: number; tint: string; icon: LucideIcon }[] = [
    { label: 'Awaiting My Decision', value: awaiting.length, tint: 'tint-danger', icon: Inbox },
    { label: 'In Payment Chain', value: inChain.length, tint: 'tint-warn', icon: Banknote },
  ];
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  const row = (p: typeof pos[number], primary: boolean) => {
    const acts = getAvailableTransitions(poWf, p.status, effectiveRole);
    return (
      <Link className="row" key={p.id} to={`/holding/approvals/${p.id}`}>
        <span className={`row-ic ${primary ? 'tint-danger' : 'tint-warn'}`}><Banknote /></span>
        <div className="row-main">
          <div className="row-t">
            <span className="row-id">{p.displayId}</span>
            <span className={`badge ${poBadge(p.status)}`}>{poWf.statusLabels[p.status as POStatus]}</span>
          </div>
          <div className="row-sub">{p.supplierName} · {p.currency} {p.total?.toLocaleString?.() ?? p.total}</div>
        </div>
        <div className="row-end">
          {acts.slice(0, 2).map((a) => <span key={a.action} className="badge b-accent">{a.label}</span>)}
          <ChevronRight className="row-chev" />
        </div>
      </Link>
    );
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Payment Approvals</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{ROLE_LABELS[effectiveRole] ?? effectiveRole} · Antrac Holding Group</span>
            <span>·</span>
            <span className="num">{today}</span>
          </p>
        </div>
      </div>

      <div className="metrics" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div className="metric" key={m.label}>
              <div className="metric-top">
                <span className="metric-label">{m.label}</span>
                <span className={`metric-ic ${m.tint}`}><Icon /></span>
              </div>
              <div className="metric-val num">{m.value}</div>
            </div>
          );
        })}
      </div>

      <div className="section">
        <div className="section-head"><h2>Awaiting My Decision {awaiting.length > 0 && <span className="hint">{awaiting.length}</span>}</h2></div>
        <div className="card">
          {loading ? (
            <div className="empty-note">Loading…</div>
          ) : awaiting.length === 0 ? (
            <div className="empty-note">No purchase orders awaiting your approval.</div>
          ) : (
            <div className="list">{awaiting.map((p) => row(p, true))}</div>
          )}
        </div>
      </div>

      {inChain.length > 0 && (
        <div className="section">
          <div className="section-head"><h2>In the Payment Chain <span className="hint">{inChain.length}</span></h2></div>
          <div className="card"><div className="list">{inChain.map((p) => row(p, false))}</div></div>
        </div>
      )}
    </div>
  );
}
