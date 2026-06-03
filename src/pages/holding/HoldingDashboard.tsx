import { Link } from 'react-router-dom';
import { Factory, Fuel, Settings, Banknote, Inbox, ChevronRight, type LucideIcon } from 'lucide-react';
import { usePOList } from '../../lib/hooks/useWorkflowData';
import { purchaseOrderWorkflow as poWf } from '../../lib/workflow/definitions';
import { getAvailableTransitions } from '../../lib/workflow/engine';
import { useAuth } from '../../lib/hooks/useAuth';
import type { POStatus } from '../../types/workflow-entities';

const sbuCards = [
  { name: 'WLI', desc: 'Well Land Investment', icon: Factory, tint: 'tint-info' },
  { name: 'MPL', desc: 'Maldives Petroleum Link', icon: Fuel, tint: 'tint-warn' },
  { name: 'EMS', desc: 'Expert Motor Service', icon: Settings, tint: 'tint-accent' },
];

function poBadge(status: string): string {
  if (status === 'po_closed' || status === 'items_collected' || status === 'wli_finance_confirmed') return 'b-pos';
  if (status === 'payment_completed' || status === 'director_approved') return 'b-accent';
  if (status === 'raised' || status === 'supplier_confirmed') return 'b-info';
  return 'b-warn';
}

export function HoldingDashboard() {
  const { effectiveRole } = useAuth();
  const { data: pos } = usePOList();

  const awaiting = pos.filter((p) => getAvailableTransitions(poWf, p.status, effectiveRole).length > 0);
  const inChain = pos.filter((p) => p.status !== 'po_closed');

  const metrics: { label: string; value: number; tint: string; icon: LucideIcon }[] = [
    { label: 'Awaiting My Approval', value: awaiting.length, tint: 'tint-danger', icon: Inbox },
    { label: 'POs In Payment Chain', value: inChain.length, tint: 'tint-warn', icon: Banknote },
    { label: 'Business Units', value: sbuCards.length, tint: 'tint-info', icon: Factory },
  ];
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Antrac Holding</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>Group overview</span>
            <span>·</span>
            <span className="num">{today}</span>
          </p>
        </div>
      </div>

      <div className="metrics" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
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

      {/* Awaiting my approval — the HQ payment chain */}
      <div className="section">
        <div className="section-head">
          <h2>Awaiting My Approval {awaiting.length > 0 && <span className="hint">{awaiting.length}</span>}</h2>
          <Link className="section-link" to="/holding/approvals">Payment approvals <ChevronRight /></Link>
        </div>
        <div className="card">
          {awaiting.length === 0 ? (
            <div className="empty-note">Nothing awaiting your approval right now.</div>
          ) : (
            <div className="list">
              {awaiting.slice(0, 6).map((p) => {
                const acts = getAvailableTransitions(poWf, p.status, effectiveRole);
                return (
                  <Link className="row" key={p.id} to={`/holding/approvals/${p.id}`}>
                    <span className="row-ic tint-danger"><Banknote /></span>
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
              })}
            </div>
          )}
        </div>
      </div>

      {/* Group units */}
      <div className="section">
        <div className="section-head"><h2>Business Units</h2></div>
        <div className="duo" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {sbuCards.map((sbu) => {
            const Icon = sbu.icon;
            return (
              <div className="card fleet-card" key={sbu.name}>
                <div className="fleet-top">
                  <div className="ft-l">
                    <div className={`ft-ic ${sbu.tint}`}><Icon /></div>
                    <h3>{sbu.name}</h3>
                  </div>
                </div>
                <div className="row-sub">{sbu.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
