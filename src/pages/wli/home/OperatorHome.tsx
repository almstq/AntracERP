import { Link } from 'react-router-dom';
import {
  Truck, Ticket, Plus, ChevronRight, AlertTriangle, Radio, Navigation, type LucideIcon,
} from 'lucide-react';
import { FleetMapView } from '../../../components/workflow/FleetMapView';
import { SiteOverview } from '../../../components/dashboard/SiteOverview';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useTicketList, useAssetList, useSiteList, useStaffList } from '../../../lib/hooks/useWorkflowData';
import { ticketWorkflow } from '../../../lib/workflow/definitions';
import { getAvailableTransitions, getStatusLabel } from '../../../lib/workflow/engine';

const STATUS_TINT: Record<string, string> = {
  submitted: 'b-info', diagnosed: 'b-warn', supervisor_checked: 'b-warn',
  gm_approved: 'b-accent', items_delivered: 'b-accent', resolved: 'b-pos',
  persists: 'b-danger', rejected: 'b-danger', closed: 'b-muted', draft: 'b-muted',
};

/** Operator landing — their site, their tickets, raise a new one. */
export function OperatorHome() {
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

  const myTickets = allTickets.filter((t) => t.raisedById === user?.uid);
  const openMine = myTickets.filter((t) => !['closed', 'rejected'].includes(t.status));
  // Tickets (mine or on my site) where I have an action to take.
  const actionable = allTickets.filter(
    (t) => (t.raisedById === user?.uid || (scope?.has(t.siteId) ?? true)) &&
      getAvailableTransitions(ticketWorkflow, t.status, 'operator').length > 0,
  );
  const downAssets = assets.filter((a) => a.operationalStatus === 'down' || a.operationalStatus === 'maintenance');

  const metrics: { label: string; value: number; tint: string; icon: LucideIcon }[] = [
    { label: 'My Open Tickets', value: openMine.length, tint: 'tint-danger', icon: Ticket },
    { label: 'Assets On Site', value: assets.length, tint: 'tint-info', icon: Truck },
    { label: 'Needs Attention', value: downAssets.length, tint: 'tint-warn', icon: AlertTriangle },
  ];
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const siteNames = sites.map((s) => s.name).join(', ');

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">My Site</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{siteNames || 'Well Land Investment'}</span>
            <span>·</span>
            <span className="num">{today}</span>
          </p>
        </div>
        <div className="head-actions">
          <Link className="btn btn-primary" to="/wli/tickets/new"><Plus /> Raise Ticket</Link>
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

      {/* Action required for me */}
      {actionable.length > 0 && (
        <div className="section">
          <div className="section-head"><h2>Action Required <span className="hint">{actionable.length}</span></h2></div>
          <div className="card"><div className="list">
            {actionable.map((t) => {
              const acts = getAvailableTransitions(ticketWorkflow, t.status, 'operator');
              return (
                <Link className="row" key={t.id} to={`/wli/tickets/${t.id}`}>
                  <span className="row-ic tint-danger"><Ticket /></span>
                  <div className="row-main">
                    <div className="row-t">
                      <span className="row-id">{t.displayId}</span>
                      <span className={`badge ${STATUS_TINT[t.status] ?? 'b-muted'}`}>{getStatusLabel(ticketWorkflow, t.status)}</span>
                    </div>
                    <div className="row-sub">{t.assetCode || '—'} · {t.description?.slice(0, 60)}</div>
                  </div>
                  <div className="row-end">
                    {acts.slice(0, 2).map((a) => <span key={a.action} className="badge b-accent">{a.label}</span>)}
                    <ChevronRight className="row-chev" />
                  </div>
                </Link>
              );
            })}
          </div></div>
        </div>
      )}

      {/* My tickets */}
      <div className="section">
        <div className="section-head">
          <h2>My Tickets</h2>
          <Link className="section-link" to="/wli/tickets">All tickets <ChevronRight /></Link>
        </div>
        <div className="card">
          {openMine.length === 0 ? (
            <div className="empty-note">No open tickets you've raised. Hit “Raise Ticket” when something needs attention.</div>
          ) : (
            <div className="list">
              {openMine.map((t) => (
                <Link className="row" key={t.id} to={`/wli/tickets/${t.id}`}>
                  <span className="row-ic tint-info"><Ticket /></span>
                  <div className="row-main">
                    <div className="row-t">
                      <span className="row-id">{t.displayId}</span>
                      <span className={`badge ${STATUS_TINT[t.status] ?? 'b-muted'}`}>{getStatusLabel(ticketWorkflow, t.status)}</span>
                      {t.urgency === 'critical' && <span className="badge b-danger">Critical</span>}
                    </div>
                    <div className="row-sub">{t.assetCode || '—'} · {t.description?.slice(0, 70)}</div>
                  </div>
                  <ChevronRight className="row-chev" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map of my site */}
      {sites.length > 0 && (
        <div className="section hero" style={{ gridTemplateColumns: '1fr' }}>
          <div className="map-card">
            <div className="map-embed"><FleetMapView sites={sites} assets={assets} staff={staff} height="100%" /></div>
            <div className="map-head">
              <span className="tag"><Radio /> {siteNames || 'Site'}</span>
              <span className="tag"><Navigation /> {assets.length} assets</span>
            </div>
          </div>
        </div>
      )}

      {/* Site detail */}
      <div className="section">
        <div className="section-head"><h2>Site Overview <span className="hint">Assets · crew · issues</span></h2></div>
        <SiteOverview sites={sites} assets={assets} staff={staff} tickets={allTickets.filter((t) => scope?.has(t.siteId) ?? true)} />
      </div>
    </div>
  );
}
