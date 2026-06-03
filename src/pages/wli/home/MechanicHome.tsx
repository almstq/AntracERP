import { Link } from 'react-router-dom';
import {
  Wrench, Truck, Ship, ChevronRight, AlertTriangle, Stethoscope, type LucideIcon,
} from 'lucide-react';
import { FleetMapView } from '../../../components/workflow/FleetMapView';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useTicketList, useAssetList, useSiteList, useStaffList } from '../../../lib/hooks/useWorkflowData';
import { ticketWorkflow } from '../../../lib/workflow/definitions';
import { getAvailableTransitions, getStatusLabel } from '../../../lib/workflow/engine';

const STATUS_TINT: Record<string, string> = {
  submitted: 'b-info', diagnosed: 'b-warn', supervisor_checked: 'b-warn',
  gm_approved: 'b-accent', items_delivered: 'b-accent', resolved: 'b-pos',
  persists: 'b-danger', rejected: 'b-danger', closed: 'b-muted',
};

/** Mechanic landing — the repair board: what to diagnose, what's down, what's in repair. */
export function MechanicHome() {
  const { user } = useAuth();
  const { data: allTickets } = useTicketList();
  const { data: allAssets } = useAssetList();
  const { data: allSites } = useSiteList();
  const { data: allStaff } = useStaffList();

  const ids = user?.siteIds ?? [];
  const scope = ids.length ? new Set(ids) : null;
  const sites = scope ? allSites.filter((s) => scope.has(s.id)) : allSites;
  const assets = scope ? allAssets.filter((a) => scope.has(a.currentSiteId)) : allAssets;
  const staff = scope ? allStaff.filter((p) => p.siteId && scope.has(p.siteId)) : allStaff;
  const siteTickets = scope ? allTickets.filter((t) => scope.has(t.siteId)) : allTickets;

  const awaitingDiagnosis = siteTickets.filter((t) => t.status === 'submitted');
  // Anything else where the mechanic can act (confirm receipt, mark resolved/persists…).
  const otherActions = siteTickets.filter(
    (t) => t.status !== 'submitted' && getAvailableTransitions(ticketWorkflow, t.status, 'mechanic').length > 0,
  );
  const down = assets.filter((a) => a.operationalStatus === 'down');
  const inMaint = assets.filter((a) => a.operationalStatus === 'maintenance');

  const metrics: { label: string; value: number; tint: string; icon: LucideIcon }[] = [
    { label: 'Awaiting Diagnosis', value: awaitingDiagnosis.length, tint: 'tint-warn', icon: Stethoscope },
    { label: 'Open Actions', value: otherActions.length, tint: 'tint-accent', icon: Wrench },
    { label: 'Assets Down', value: down.length, tint: 'tint-danger', icon: AlertTriangle },
    { label: 'In Maintenance', value: inMaint.length, tint: 'tint-info', icon: Truck },
  ];
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const siteNames = sites.map((s) => s.name).join(', ');

  const ticketRow = (t: typeof siteTickets[number], primary = false) => {
    const acts = getAvailableTransitions(ticketWorkflow, t.status, 'mechanic');
    return (
      <Link className="row" key={t.id} to={`/wli/tickets/${t.id}`}>
        <span className={`row-ic ${primary ? 'tint-warn' : 'tint-accent'}`}><Wrench /></span>
        <div className="row-main">
          <div className="row-t">
            <span className="row-id">{t.displayId}</span>
            <span className={`badge ${STATUS_TINT[t.status] ?? 'b-muted'}`}>{getStatusLabel(ticketWorkflow, t.status)}</span>
            {t.urgency === 'critical' && <span className="badge b-danger">Critical</span>}
          </div>
          <div className="row-sub">{t.assetCode || '—'} · {t.description?.slice(0, 64)}</div>
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
          <h1 className="page-title">Repair Board</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{siteNames || 'Well Land Investment'}</span>
            <span>·</span>
            <span className="num">{today}</span>
          </p>
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

      {/* Awaiting diagnosis — the mechanic's primary queue */}
      <div className="section">
        <div className="section-head"><h2>Awaiting Diagnosis {awaitingDiagnosis.length > 0 && <span className="hint">{awaitingDiagnosis.length}</span>}</h2></div>
        <div className="card">
          {awaitingDiagnosis.length === 0
            ? <div className="empty-note">Nothing waiting on a diagnosis. 🔧</div>
            : <div className="list">{awaitingDiagnosis.map((t) => ticketRow(t, true))}</div>}
        </div>
      </div>

      {/* Other open actions */}
      {otherActions.length > 0 && (
        <div className="section">
          <div className="section-head"><h2>In Repair / Follow-up <span className="hint">{otherActions.length}</span></h2></div>
          <div className="card"><div className="list">{otherActions.map((t) => ticketRow(t))}</div></div>
        </div>
      )}

      {/* Down / maintenance assets */}
      <div className="section">
        <div className="section-head">
          <h2>Equipment Status</h2>
          <Link className="section-link" to="/wli/assets">Asset register <ChevronRight /></Link>
        </div>
        <div className="card">
          {down.length + inMaint.length === 0 ? (
            <div className="empty-note">All equipment on your site is operational.</div>
          ) : (
            <div className="list">
              {[...down, ...inMaint].map((a) => {
                const Icon = a.assetClass === 'vessel' ? Ship : Truck;
                const site = sites.find((s) => s.id === a.currentSiteId);
                return (
                  <Link className="row" key={a.id} to={`/wli/assets/${a.id}`}>
                    <span className={`row-ic ${a.operationalStatus === 'down' ? 'tint-danger' : 'tint-info'}`}><Icon /></span>
                    <div className="row-main">
                      <div className="row-t">
                        <span className="row-id">{a.code}</span>
                        <span className={`badge ${a.operationalStatus === 'down' ? 'b-danger' : 'b-info'}`}>
                          <span className="bdot" />{a.operationalStatus}
                        </span>
                      </div>
                      <div className="row-sub">{a.make} {a.model}{site ? ` · ${site.name}` : ''}{a.knownIssue ? ` · ${a.knownIssue.slice(0, 50)}` : ''}</div>
                    </div>
                    <ChevronRight className="row-chev" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      {sites.length > 0 && (
        <div className="section hero" style={{ gridTemplateColumns: '1fr' }}>
          <div className="map-card">
            <div className="map-embed"><FleetMapView sites={sites} assets={assets} staff={staff} height="100%" /></div>
            <div className="map-head"><span className="tag"><Wrench /> {siteNames || 'Site'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
