import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Truck, Ship, ChevronRight, AlertCircle } from 'lucide-react';
import { NotificationBell } from '../../components/layout/NotificationBell';
import { FleetMapView } from '../../components/workflow/FleetMapView';
import { WeatherPanel } from '../../components/dashboard/WeatherPanel';
import { AiBrief } from '../../components/dashboard/AiBrief';
import { useTicketList, useAssetList, useSiteList, useStaffList, useActionInbox } from '../../lib/hooks/useWorkflowData';
import { ROLE_LABELS } from '../../lib/permissions/roles';

export function WLIDashboard() {
  const { effectiveRole } = useAuth();
  const { data: tickets } = useTicketList();
  const { data: assets } = useAssetList();
  const { data: sites } = useSiteList();
  const { data: staff } = useStaffList();

  const role = effectiveRole;
  const projectSiteIds = new Set(sites.filter((s) => s.type === 'project').map((s) => s.id));

  const openTickets = tickets.filter((t) => !['closed', 'rejected'].includes(t.status));
  const approvals = tickets.filter((t) => t.status === 'supervisor_checked');
  const deployed = assets.filter((a) => projectSiteIds.has(a.currentSiteId));
  const available = assets.filter((a) => a.operationalStatus === 'operational' || a.operationalStatus === 'idle');

  const land = assets.filter((a) => a.assetClass !== 'vessel');
  const vessels = assets.filter((a) => a.assetClass === 'vessel');
  const landReady = land.filter((a) => a.operationalStatus === 'operational').length;
  const vesselReady = vessels.filter((a) => a.operationalStatus === 'operational').length;

  const { items: inbox } = useActionInbox(role);

  const stats = [
    { label: 'SITES', value: sites.length, color: 'text-teal' },
    { label: 'DEPLOYMENTS', value: deployed.length, color: 'text-teal' },
    { label: 'OPEN TICKETS', value: openTickets.length, color: 'text-red' },
    { label: 'APPROVALS', value: approvals.length, color: 'text-amber' },
    { label: 'AVAILABLE', value: available.length, color: 'text-blue' },
  ];

  return (
    <div className="pb-8">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-bg-panel sticky top-0 z-10">
        <h1 className="text-base font-bold text-text-primary">Command Center</h1>
        <div className="flex items-center gap-3">
          <span className="text-[10px] px-2 py-1 rounded-full bg-bg-surface text-text-secondary">{ROLE_LABELS[role] ?? role}</span>
          <NotificationBell />
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        {/* AI Advisor + Map */}
        <div className="relative rounded-lg border border-border overflow-hidden">
          <AiBrief
            openTickets={openTickets.length}
            criticalTickets={openTickets.filter((t) => t.urgency === 'critical').length}
            approvals={approvals.length}
            landReady={landReady} landTotal={land.length}
            vesselReady={vesselReady} vesselTotal={vessels.length}
            sites={sites.length}
          />
          <FleetMapView sites={sites} assets={assets} staff={staff} height="38vh" />
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {stats.map((s) => (
            <Card key={s.label} className="text-center py-3">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[9px] tracking-wide text-text-muted mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Site Weather (vessel safety — wind + visibility) */}
        <WeatherPanel sites={sites} />

        {/* Action Required (Inbox) */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">Action Required (Inbox)</p>
          <Card>
            {inbox.length === 0 ? (
              <p className="text-xs text-text-muted p-1">Nothing awaiting you right now.</p>
            ) : (
              <div className="space-y-1">
                {inbox.slice(0, 8).map((it) => (
                  <Link key={`${it.kind}-${it.id}`} to={it.to} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-bg-surface">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AlertCircle size={15} className="text-amber flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{it.displayId} <span className="text-text-muted">· {it.subtitle}</span></p>
                        <p className="text-[10px] text-text-muted uppercase">{it.kind === 'pr' ? 'Purchase Request' : it.kind === 'po' ? 'Purchase Order' : 'Issue Ticket'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {it.actions.slice(0, 2).map((a) => <span key={a} className="text-[9px] px-2 py-0.5 rounded-full bg-blue/10 text-blue">{a}</span>)}
                      <ChevronRight size={14} className="text-text-muted" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Fleet Readiness */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">Fleet Readiness</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Truck size={16} className="text-teal" /><span className="text-xs font-medium text-text-primary">Land Fleet</span></div>
                <Link to="/wli/assets" className="text-[10px] text-blue flex items-center gap-0.5">View all <ChevronRight size={12} /></Link>
              </div>
              <p className="text-xs text-text-muted mt-2"><span className="text-text-primary font-semibold">{landReady}</span> / {land.length} operational</p>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Ship size={16} className="text-blue" /><span className="text-xs font-medium text-text-primary">Vessel Fleet</span></div>
                <Link to="/wli/assets" className="text-[10px] text-blue flex items-center gap-0.5">View all <ChevronRight size={12} /></Link>
              </div>
              <p className="text-xs text-text-muted mt-2"><span className="text-text-primary font-semibold">{vesselReady}</span> / {vessels.length} operational</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
