import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Ticket as TicketIcon, ShoppingCart, Package, UserCheck, Users, MapPin, Truck, HardHat, Droplets, ArrowLeftRight, Briefcase } from 'lucide-react';
import { useActionInbox, useAssetList, useSiteList, useStaffList } from '../../lib/hooks/useWorkflowData';
import { useUsers } from '../../lib/hooks/useUsers';
import { getRole } from '../../lib/permissions/roleRegistry';
import { PageContainer } from '../../components/shared/PageContainer';
import { useAuth } from '../../lib/hooks/useAuth';

const ICON = { ticket: TicketIcon, pr: ShoppingCart, po: Package };

function getQuickActions(role: string): { label: string; to: string; icon: any }[] {
  const actions: { label: string; to: string; icon: any }[] = [];

  const canRaiseTicket = ['operator', 'mechanic', 'supervisor', 'ops_staff'].includes(role);
  const canRaisePR = ['supervisor', 'gm', 'proc_staff', 'finance_wli', 'inventory_staff', 'director', 'cfo', 'antrac_finance', 'holding_hr'].includes(role);
  const canRequestFuel = ['operator', 'supervisor', 'inventory_staff'].includes(role);
  const canNewTransfer = ['inventory_staff'].includes(role);
  const canNewEnquiry = ['sales_staff', 'ops_staff'].includes(role);
  const canNewDeployment = ['sales_staff', 'ops_staff'].includes(role);

  if (canRaiseTicket) {
    actions.push({ label: 'Raise Issue Ticket', to: '/wli/tickets/new', icon: TicketIcon });
  }
  if (canRaisePR) {
    actions.push({ label: 'Raise Purchase Request', to: '/wli/procurement/requests/new', icon: ShoppingCart });
  }
  if (canRequestFuel) {
    actions.push({ label: 'Request Fuel / Water', to: '/wli/fuel/requests/new', icon: Droplets });
  }
  if (canNewTransfer) {
    actions.push({ label: 'New Stock Transfer', to: '/wli/warehouse/transfers/new', icon: ArrowLeftRight });
  }
  if (canNewEnquiry) {
    actions.push({ label: 'New CRM Enquiry', to: '/wli/crm/enquiries/new', icon: Briefcase });
  }
  if (canNewDeployment) {
    actions.push({ label: 'New Fleet Deployment', to: '/wli/deployments/new', icon: Truck });
  }

  return actions;
}

/** Generic actor desk: everything awaiting the role in the URL across all workflows. */
export function RoleInbox() {
  const { role = '' } = useParams();
  const { items, loading } = useActionInbox(role);
  const { data: users } = useUsers();
  const { user, actingRole, setActingRole, effectiveRole } = useAuth();

  useEffect(() => {
    if (user?.role === 'super_admin' && role && actingRole !== role) {
      setActingRole(role);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, user]);

  const { data: sites } = useSiteList();
  const { data: assets } = useAssetList();
  const { data: staff } = useStaffList();
  const label = getRole(role)?.label ?? role;
  const assigned = users.filter((u) => u.role === role);
  const siteIds = new Set(
    assigned.flatMap((u) => u.siteIds ?? []).concat(effectiveRole === role ? (user?.siteIds ?? []) : []),
  );
  const deskSites = sites.filter((s) => siteIds.size === 0 || siteIds.has(s.id));
  const deskAssets = assets.filter((a) => siteIds.size === 0 || siteIds.has(a.currentSiteId));
  const assetSite = new Map(assets.map((a) => [a.id, a.currentSiteId]));
  const deskStaff = staff.filter((p) => {
    const siteId = p.assignedAssetId ? assetSite.get(p.assignedAssetId) : p.siteId;
    return siteIds.size === 0 || (siteId ? siteIds.has(siteId) : false);
  });
  const siteName = (id?: string) => sites.find((s) => s.id === id)?.name ?? id ?? 'Unassigned';

  const quickActions = getQuickActions(role);

  return (
    <PageContainer>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-text-primary">{label} Desk</h1>
        <p className="text-xs text-text-muted">
          {loading ? 'Loading…' : `${items.length} action item(s) · ${deskSites.length} site(s) · ${deskAssets.length} asset(s) · ${deskStaff.length} staff`}
        </p>
      </div>

      {quickActions.length > 0 && (
        <Card className="mb-4" header={<span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Quick Actions</span>}>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((act) => {
              const ActionIcon = act.icon;
              return (
                <Link
                  key={act.to}
                  to={act.to}
                  className="btn btn-secondary flex items-center gap-2 text-xs"
                  style={{ padding: '6px 12px', borderRadius: '6px' }}
                >
                  <ActionIcon size={14} />
                  <span>{act.label}</span>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* Who actually holds this role — visible when an SA opens the desk. */}
      <Card className="mb-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {assigned.length > 0 ? (
            <>
              <UserCheck size={15} style={{ color: 'var(--positive)' }} />
              <span className="text-xs text-text-muted">Assigned to:</span>
              {assigned.map((u) => (
                <span key={u.id} className="badge b-pos" title={u.email}>
                  <span className="bdot" />{u.displayName || u.email}
                  {(u.siteIds?.length ?? 0) > 0 ? ` · ${u.siteIds!.map((id) => siteName(id)).join(', ')}` : ' · all sites'}
                </span>
              ))}
            </>
          ) : (
            <>
              <Users size={15} style={{ color: 'var(--warning)' }} />
              <span className="text-xs" style={{ color: 'var(--warning)' }}>
                No user is assigned to the {label} role yet.
              </span>
            </>
          )}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-3 mb-4">
        <Card>
          <div className="flex items-center gap-2 mb-2"><MapPin size={15} className="text-text-muted" /><strong className="text-xs">Assigned Sites</strong></div>
          <div className="space-y-1">
            {deskSites.slice(0, 6).map((s) => (
              <Link key={s.id} to={`/wli/locations/${s.id}`} className="block text-xs text-text-primary hover:text-blue">{s.name}</Link>
            ))}
            {deskSites.length === 0 && <p className="text-xs text-text-muted">No site territory assigned.</p>}
            {deskSites.length > 6 && <p className="text-[10px] text-text-muted">+{deskSites.length - 6} more</p>}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2"><Truck size={15} className="text-text-muted" /><strong className="text-xs">Assets In Territory</strong></div>
          <div className="space-y-1">
            {deskAssets.slice(0, 6).map((a) => (
              <Link key={a.id} to={`/wli/assets/${a.id}`} className="block text-xs text-text-primary hover:text-blue">
                {a.code} <span className="text-text-muted">· {a.operationalStatus}</span>
              </Link>
            ))}
            {deskAssets.length === 0 && <p className="text-xs text-text-muted">No assets in assigned territory.</p>}
            {deskAssets.length > 6 && <p className="text-[10px] text-text-muted">+{deskAssets.length - 6} more</p>}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2"><HardHat size={15} className="text-text-muted" /><strong className="text-xs">Staff In Territory</strong></div>
          <div className="space-y-1">
            {deskStaff.slice(0, 6).map((p) => (
              <Link key={p.id} to={`/wli/staff/${p.id}`} className="block text-xs text-text-primary hover:text-blue">
                {p.name} <span className="text-text-muted">· {p.designation || p.staffType || p.role}</span>
              </Link>
            ))}
            {deskStaff.length === 0 && <p className="text-xs text-text-muted">No staff in assigned territory.</p>}
            {deskStaff.length > 6 && <p className="text-[10px] text-text-muted">+{deskStaff.length - 6} more</p>}
          </div>
        </Card>
      </div>

      <Card>
        {!loading && items.length === 0 ? (
          <p className="text-xs text-text-muted p-2">Nothing awaiting the {label.toLowerCase()} right now.</p>
        ) : (
          <div className="space-y-1">
            {items.map((it) => {
              const Icon = ICON[it.kind];
              return (
                <Link key={`${it.kind}-${it.id}`} to={it.to} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Icon size={16} className="text-text-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{it.displayId} <span className="text-text-muted">· {it.subtitle}</span></p>
                      <p className="text-[10px] text-text-muted uppercase">{it.kind === 'pr' ? 'Purchase Request' : it.kind === 'po' ? 'Purchase Order' : 'Issue Ticket'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2 flex-wrap justify-end">
                    {it.actions.slice(0, 3).map((a) => (
                      <span key={a} className="text-[9px] px-2 py-1 rounded-full bg-blue/10 text-blue">{a}</span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
