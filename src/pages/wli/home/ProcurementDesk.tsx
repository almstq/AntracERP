import { Link } from 'react-router-dom';
import {
  ShoppingCart, Package, Store, ChevronRight, Inbox, Plus, type LucideIcon,
} from 'lucide-react';
import {
  usePRList, usePOList, useSupplierList, useActionInbox,
} from '../../../lib/hooks/useWorkflowData';
import { purchaseRequestWorkflow, purchaseOrderWorkflow } from '../../../lib/workflow/definitions';
import { getStatusLabel } from '../../../lib/workflow/engine';

const KIND_META: Record<string, { icon: LucideIcon; tint: string }> = {
  pr: { icon: ShoppingCart, tint: 'tint-warn' },
  po: { icon: Package, tint: 'tint-pos' },
  ticket: { icon: ShoppingCart, tint: 'tint-accent' },
};

/** Procurement landing — source approved PRs, push POs, manage suppliers. */
export function ProcurementDesk() {
  const { data: prs } = usePRList();
  const { data: pos } = usePOList();
  const { data: suppliers } = useSupplierList();
  const { items: inbox } = useActionInbox('proc_staff');

  const openPRs = prs.filter((p) => p.status !== 'closed');
  const openPOs = pos.filter((p) => p.status !== 'po_closed');

  const metrics: { label: string; value: number; tint: string; icon: LucideIcon }[] = [
    { label: 'Awaiting Me', value: inbox.length, tint: 'tint-danger', icon: Inbox },
    { label: 'Open PRs', value: openPRs.length, tint: 'tint-warn', icon: ShoppingCart },
    { label: 'POs In Flight', value: openPOs.length, tint: 'tint-pos', icon: Package },
    { label: 'Suppliers', value: suppliers.filter((s) => s.active).length, tint: 'tint-info', icon: Store },
  ];
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Procurement Desk</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>Well Land Investment</span>
            <span>·</span>
            <span className="num">{today}</span>
          </p>
        </div>
        <div className="head-actions">
          <Link className="btn btn-ghost" to="/wli/suppliers"><Store /> Suppliers</Link>
          <Link className="btn btn-primary" to="/wli/procurement/requests/new"><Plus /> Raise PR</Link>
        </div>
      </div>

      <div className="metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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

      {/* Awaiting my action */}
      <div className="section">
        <div className="section-head"><h2>Action Required {inbox.length > 0 && <span className="hint">{inbox.length}</span>}</h2></div>
        <div className="card">
          {inbox.length === 0 ? (
            <div className="empty-note">Nothing awaiting procurement right now.</div>
          ) : (
            <div className="list">
              {inbox.map((it) => {
                const meta = KIND_META[it.kind] ?? KIND_META.pr;
                const Icon = meta.icon;
                return (
                  <Link className="row" key={`${it.kind}-${it.id}`} to={it.to}>
                    <span className={`row-ic ${meta.tint}`}><Icon /></span>
                    <div className="row-main">
                      <div className="row-t">
                        <span className="row-id">{it.displayId}</span>
                        <span className="badge b-muted">{it.kind.toUpperCase()}</span>
                      </div>
                      <div className="row-sub">{it.subtitle}</div>
                    </div>
                    <div className="row-end">
                      {it.actions.slice(0, 2).map((a) => <span key={a} className="badge b-accent">{a}</span>)}
                      <ChevronRight className="row-chev" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Open purchase requests */}
      <div className="section">
        <div className="section-head">
          <h2>Open Purchase Requests</h2>
          <Link className="section-link" to="/wli/procurement/requests">All PRs <ChevronRight /></Link>
        </div>
        <div className="card">
          {openPRs.length === 0 ? (
            <div className="empty-note">No open purchase requests.</div>
          ) : (
            <div className="list">
              {openPRs.map((p) => (
                <Link className="row" key={p.id} to={`/wli/procurement/requests/${p.id}`}>
                  <span className="row-ic tint-warn"><ShoppingCart /></span>
                  <div className="row-main">
                    <div className="row-t">
                      <span className="row-id">{p.displayId}</span>
                      <span className="badge b-warn">{getStatusLabel(purchaseRequestWorkflow, p.status)}</span>
                      {p.urgency === 'critical' && <span className="badge b-danger">Critical</span>}
                    </div>
                    <div className="row-sub">{p.lineItems?.length ?? 0} line item(s)</div>
                  </div>
                  <ChevronRight className="row-chev" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* POs in flight */}
      <div className="section">
        <div className="section-head">
          <h2>Purchase Orders In Flight</h2>
          <Link className="section-link" to="/wli/procurement/orders">All POs <ChevronRight /></Link>
        </div>
        <div className="card">
          {openPOs.length === 0 ? (
            <div className="empty-note">No purchase orders in flight.</div>
          ) : (
            <div className="list">
              {openPOs.map((p) => (
                <Link className="row" key={p.id} to={`/wli/procurement/orders/${p.id}`}>
                  <span className="row-ic tint-pos"><Package /></span>
                  <div className="row-main">
                    <div className="row-t">
                      <span className="row-id">{p.displayId}</span>
                      <span className="badge b-pos">{getStatusLabel(purchaseOrderWorkflow, p.status)}</span>
                    </div>
                    <div className="row-sub">{p.supplierName} · {p.currency} {p.total?.toLocaleString?.() ?? p.total}</div>
                  </div>
                  <ChevronRight className="row-chev" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
