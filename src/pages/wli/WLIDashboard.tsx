import { Link } from 'react-router-dom';
import {
  MapPin, Truck, Ticket, ClipboardCheck, CheckCircle2, Ship, ChevronRight,
  SlidersHorizontal, Plus, Radio, Navigation, ShoppingCart, Package,
  type LucideIcon,
} from 'lucide-react';
import { FleetMapView } from '../../components/workflow/FleetMapView';
import { WeatherPanel } from '../../components/dashboard/WeatherPanel';
import { AiBrief } from '../../components/dashboard/AiBrief';
import { useAuth } from '../../lib/hooks/useAuth';
import { useTicketList, useAssetList, useSiteList, useStaffList, useActionInbox } from '../../lib/hooks/useWorkflowData';
import { ROLE_LABELS } from '../../lib/permissions/roles';

const KIND_META: Record<string, { icon: LucideIcon; tint: string; label: string }> = {
  ticket: { icon: Ticket, tint: 'tint-danger', label: 'Issue Ticket' },
  pr: { icon: ShoppingCart, tint: 'tint-warn', label: 'Purchase Request' },
  po: { icon: Package, tint: 'tint-pos', label: 'Purchase Order' },
};

export function WLIDashboard() {
  const { effectiveRole } = useAuth();
  const { data: tickets } = useTicketList();
  const { data: assets } = useAssetList();
  const { data: sites } = useSiteList();
  const { data: staff } = useStaffList();
  const role = effectiveRole;

  const projectSiteIds = new Set(sites.filter((s) => s.type === 'project').map((s) => s.id));
  const openTickets = tickets.filter((t) => !['closed', 'rejected'].includes(t.status));
  const criticalTickets = openTickets.filter((t) => t.urgency === 'critical');
  const approvals = tickets.filter((t) => t.status === 'supervisor_checked');
  const deployed = assets.filter((a) => projectSiteIds.has(a.currentSiteId));
  const available = assets.filter((a) => a.operationalStatus === 'operational' || a.operationalStatus === 'idle');

  const land = assets.filter((a) => a.assetClass !== 'vessel');
  const vessels = assets.filter((a) => a.assetClass === 'vessel');
  const { items: inbox } = useActionInbox(role);

  const fleet = (set: typeof assets) => {
    const ready = set.filter((a) => a.operationalStatus === 'operational').length;
    const dep = set.filter((a) => projectSiteIds.has(a.currentSiteId)).length;
    const down = set.filter((a) => a.operationalStatus !== 'operational' && a.operationalStatus !== 'idle').length;
    const idle = Math.max(0, set.length - dep - down);
    const pct = set.length ? Math.round((ready / set.length) * 100) : 0;
    return { ready, total: set.length, dep, idle, down, pct };
  };
  const landF = fleet(land);
  const vesselF = fleet(vessels);

  const metrics: { label: string; value: number; tint: string; icon: LucideIcon }[] = [
    { label: 'Active Sites', value: sites.length, tint: 'tint-accent', icon: MapPin },
    { label: 'Deployments', value: deployed.length, tint: 'tint-pos', icon: Truck },
    { label: 'Open Tickets', value: openTickets.length, tint: 'tint-danger', icon: Ticket },
    { label: 'Approvals', value: approvals.length, tint: 'tint-warn', icon: ClipboardCheck },
    { label: 'Available', value: available.length, tint: 'tint-info', icon: CheckCircle2 },
  ];

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="page">
      {/* Page header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Command Center</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{ROLE_LABELS[role] ?? role} · Well Land Investment</span>
            <span>·</span>
            <span className="num">{today}</span>
          </p>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost"><SlidersHorizontal /> Filters</button>
          <Link className="btn btn-primary" to="/wli/tickets/new"><Plus /> New Ticket</Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics">
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

      {/* Hero: map + AI */}
      <div className="section hero">
        <div className="map-card">
          <div className="map-embed"><FleetMapView sites={sites} assets={assets} staff={staff} height="100%" /></div>
          <div className="map-head">
            <span className="tag"><Radio /> Live Fleet · {sites.length} sites</span>
            <span className="tag"><Navigation /> {assets.length} assets tracked</span>
          </div>
        </div>
        <AiBrief
          variant="card"
          openTickets={openTickets.length}
          criticalTickets={criticalTickets.length}
          approvals={approvals.length}
          landReady={landF.ready} landTotal={land.length}
          vesselReady={vesselF.ready} vesselTotal={vessels.length}
          sites={sites.length}
        />
      </div>

      {/* Action Required */}
      <div className="section">
        <div className="section-head">
          <h2>Action Required {inbox.length > 0 && <span className="hint">{inbox.length} items</span>}</h2>
          <Link className="section-link" to="/wli/tickets">View inbox <ChevronRight /></Link>
        </div>
        <div className="card">
          {inbox.length === 0 ? (
            <div className="empty-note">Nothing awaiting you right now.</div>
          ) : (
            <div className="list">
              {inbox.slice(0, 8).map((it) => {
                const meta = KIND_META[it.kind] ?? KIND_META.ticket;
                const Icon = meta.icon;
                return (
                  <Link className="row" key={`${it.kind}-${it.id}`} to={it.to}>
                    <span className={`row-ic ${meta.tint}`}><Icon /></span>
                    <div className="row-main">
                      <div className="row-t">
                        <span className="row-id">{it.displayId}</span>
                        <span className="badge b-muted">{meta.label}</span>
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

      {/* Fleet Readiness */}
      <div className="section">
        <div className="section-head">
          <h2>Fleet Readiness</h2>
          <Link className="section-link" to="/wli/assets">Asset register <ChevronRight /></Link>
        </div>
        <div className="duo">
          <FleetCard title="Land Fleet" icon={Truck} tint="tint-pos" color="var(--positive)" f={landF} />
          <FleetCard title="Vessel Fleet" icon={Ship} tint="tint-info" color="var(--info)" f={vesselF} />
        </div>
      </div>

      {/* Weather */}
      <div className="section">
        <div className="section-head">
          <h2>Site Weather <span className="hint">Vessel safety</span></h2>
          <Link className="section-link" to="/wli/map">All sites <ChevronRight /></Link>
        </div>
        <WeatherPanel sites={sites} variant="helix" />
      </div>
    </div>
  );
}

function FleetCard({ title, icon: Icon, tint, color, f }: {
  title: string; icon: LucideIcon; tint: string; color: string;
  f: { ready: number; total: number; dep: number; idle: number; down: number; pct: number };
}) {
  const advisory = f.down > 0;
  return (
    <div className="card fleet-card">
      <div className="fleet-top">
        <div className="ft-l">
          <div className={`ft-ic ${tint}`}><Icon /></div>
          <h3>{title}</h3>
        </div>
        <span className={`badge ${advisory ? 'b-warn' : 'b-pos'}`}>
          <span className="bdot" />{advisory ? `${f.down} advisory` : 'Operational'}
        </span>
      </div>
      <div className="fleet-readout">
        <span className="big num" style={{ color }}>{f.ready}</span>
        <span className="tot">/ {f.total} operational</span>
        <span className="lbl num">{f.pct}%</span>
      </div>
      <div className="bar"><i style={{ width: `${f.pct}%`, background: color }} /></div>
      <div className="fleet-tags">
        <span className="minitag"><i style={{ background: 'var(--positive)' }} /> {f.dep} deployed</span>
        <span className="minitag"><i style={{ background: 'var(--info)' }} /> {f.idle} idle</span>
        <span className="minitag"><i style={{ background: 'var(--danger)' }} /> {f.down} maintenance</span>
      </div>
    </div>
  );
}
