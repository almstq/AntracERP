import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Truck, Ship, Wrench, MapPin, Briefcase, Activity, ChevronRight,
  Gauge, Pencil, Radio, ExternalLink, FileText, PackageCheck, Trash2, Anchor,
  Users, UserPlus, X, type LucideIcon,
} from 'lucide-react';
import { useAssetList, useSiteList, useTicketList, useStaffList } from '../../../lib/hooks/useWorkflowData';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useWorkOrderList } from '../../../lib/hooks/useCrmData';
import { STAFF_TYPE_LABEL, type Staff } from '../../../types/org';
import { updateAsset, deleteAsset, assignStaffAsset, unassignAsset } from '../../../lib/services/registry';
import { ticketWorkflow } from '../../../lib/workflow/definitions';
import type { TicketStatus } from '../../../types/workflow-entities';
import type { Asset, AssetClass } from '../../../types/asset';
import { ASSET_CLASSES, ASSET_CLASS_LABEL, followMeUrl } from '../../../types/asset';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';
import { FollowMeBadge } from '../../../components/shared/FollowMeBadge';
import { useFollowMeFleet, followMeStatusText } from '../../../lib/services/followme';
import { useToast } from '../../../lib/context/ToastContext';

const CLASS_ICON: Record<AssetClass, LucideIcon> = { vessel: Ship, vehicle: Truck, equipment: Wrench };
const OP_STATUSES: Asset['operationalStatus'][] = ['operational', 'idle', 'maintenance', 'down'];
const CONDITIONS = ['Good', 'Minor Issue', 'Issue', 'Unknown'];

const OP_BADGE: Record<string, string> = {
  operational: 'b-pos', idle: 'b-info', maintenance: 'b-warn', down: 'b-danger',
};
const COMM_BADGE: Record<string, string> = {
  available: 'b-muted', soft_reserved: 'b-warn', deployed: 'b-accent',
};
const COMM_LABEL: Record<string, string> = {
  available: 'Available', soft_reserved: 'Soft-reserved', deployed: 'Deployed',
};
function ticketBadge(s: string): string {
  if (s === 'closed') return 'b-muted';
  if (s === 'rejected') return 'b-danger';
  if (s === 'gm_approved' || s === 'resolved' || s === 'items_delivered') return 'b-pos';
  if (s === 'supervisor_checked') return 'b-accent';
  if (s === 'submitted' || s === 'diagnosed') return 'b-warn';
  return 'b-info';
}
const WO_BADGE: Record<string, string> = {
  active: 'b-info', in_progress: 'b-accent', completed: 'b-warn',
  invoiced: 'b-warn', partially_paid: 'b-pos', fully_paid: 'b-pos', closed: 'b-muted',
};

function fmtDate(d: Date | string | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** One crew member row with a remove control (used in the asset crew manager). */
function renderCrewRow(
  p: Staff & { id: string },
  canManage: boolean,
  onRemove: (id: string) => void,
) {
  return (
    <div key={p.id} className="linkrow" style={{ cursor: 'default' }}>
      <Link to={`/wli/staff/${p.id}`} style={{ minWidth: 0, flex: 1, textDecoration: 'none' }}>
        <div className="lr-id" style={{ fontFamily: 'var(--font-ui)' }}>{p.name}</div>
        <div className="lr-sub">{p.staffType ? STAFF_TYPE_LABEL[p.staffType] : p.role}{p.displayId ? ` · ${p.displayId}` : ''}</div>
      </Link>
      {canManage && (
        <button className="btn btn-ghost" style={{ padding: 4 }} title="Remove from asset" onClick={() => onRemove(p.id)}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/** Dropdown that assigns the picked staff to the asset, then resets. */
function CrewAdd({ label, options, onPick, disabled }: {
  label: string;
  options: (Staff & { id: string })[];
  onPick: (id: string) => void;
  disabled?: boolean;
}) {
  if (options.length === 0) return null;
  return (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
      <UserPlus size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <select
        className="w-full text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary"
        value=""
        disabled={disabled}
        onChange={(e) => { if (e.target.value) onPick(e.target.value); }}
      >
        <option value="">{label}</option>
        {options.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}{p.staffType ? ` (${STAFF_TYPE_LABEL[p.staffType]})` : ''}{p.assignedAssetId ? ' — reassign' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: assets, loading, refresh } = useAssetList();
  const { data: sites } = useSiteList();
  const { data: tickets } = useTicketList();
  const { data: workOrders } = useWorkOrderList();
  const { data: allStaff, refresh: refreshStaff } = useStaffList();
  const { positions, meta } = useFollowMeFleet();
  const { toast } = useToast();
  const { effectiveRole } = useAuth();
  const canManageAssets = effectiveRole === 'super_admin' || effectiveRole === 'gm';

  const asset = assets.find((a) => a.id === id);
  const siteName = (sid: string | undefined) => (sid ? sites.find((s) => s.id === sid)?.name ?? sid : '—');

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    make: '', model: '', type: '', assetClass: 'equipment' as AssetClass,
    operationalStatus: 'operational' as Asset['operationalStatus'], currentSiteId: '', trackingId: '',
    condition: '', knownIssue: '',
  });
  const setF = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function startEdit() {
    if (!asset) return;
    setForm({
      make: asset.make ?? '', model: asset.model ?? '', type: asset.type ?? '',
      assetClass: asset.assetClass, operationalStatus: asset.operationalStatus,
      currentSiteId: asset.currentSiteId ?? '', trackingId: asset.trackingId ?? '',
      condition: asset.condition ?? '', knownIssue: asset.knownIssue ?? '',
    });
    setEditing(true);
  }
  async function handleDelete() {
    if (!asset) return;
    const confirmed = window.confirm(`Delete "${asset.code} — ${asset.make} ${asset.model}"?\n\nThis cannot be undone. Any tickets linked to this asset will remain but lose their asset reference.`);
    if (!confirmed) return;
    setBusy(true);
    try {
      await deleteAsset(asset.id);
      toast('success', `${asset.code} deleted.`);
      navigate('/wli/assets');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Delete failed');
      setBusy(false);
    }
  }

  async function markDelivered() {
    if (!asset) return;
    setBusy(true);
    try {
      await updateAsset(asset.id, { pendingDelivery: false });
      toast('success', 'Asset marked as delivered — update site and status as needed.');
      refresh();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed');
    } finally { setBusy(false); }
  }

  async function handleUnassign() {
    if (!asset) return;
    if (!window.confirm(`Unassign ${asset.code} from its site? Its location becomes blank.`)) return;
    setBusy(true);
    try {
      await unassignAsset(asset.id);
      toast('success', `${asset.code} unassigned from site.`);
      refresh();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed');
    } finally { setBusy(false); }
  }

  async function save() {
    if (!asset) return;
    setBusy(true);
    try {
      await updateAsset(asset.id, { ...form, trackingId: form.trackingId.trim(), condition: form.condition || undefined, knownIssue: form.knownIssue || undefined });
      toast('success', 'Asset updated');
      setEditing(false);
      refresh();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Update failed');
    } finally { setBusy(false); }
  }

  async function addCrew(staffId: string) {
    if (!staffId || !asset) return;
    const p = allStaff.find((x) => x.id === staffId);
    // Reassign warning if currently posted to a different asset
    if (p?.assignedAssetId && p.assignedAssetId !== asset.id) {
      const onAsset = assets.find((a) => a.id === p.assignedAssetId);
      if (!window.confirm(`${p.name} is currently assigned to ${onAsset?.code ?? 'another asset'}.\n\nReassign them to ${asset.code}?`)) return;
    }
    setBusy(true);
    try {
      await assignStaffAsset(staffId, asset.id);
      toast('success', `${p?.name ?? 'Staff'} assigned to ${asset.code}`);
      refreshStaff();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed');
    } finally { setBusy(false); }
  }

  async function removeCrew(staffId: string) {
    const p = allStaff.find((x) => x.id === staffId);
    if (!window.confirm(`Remove ${p?.name} from ${asset!.code}?`)) return;
    setBusy(true);
    try {
      await assignStaffAsset(staffId, null);
      toast('success', `${p?.name ?? 'Staff'} unassigned`);
      refreshStaff();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed');
    } finally { setBusy(false); }
  }

  if (loading) return <div className="page"><LoadingSpinner text="Loading…" /></div>;
  if (!asset) return <div className="page"><p className="empty-note">Asset not found.</p></div>;

  const Icon = CLASS_ICON[asset.assetClass] ?? Wrench;

  // Repair history — every ticket raised against this asset.
  const repairs = tickets
    .filter((t) => t.assetId === id || t.assetCode === asset.code)
    .sort((a, b) => +new Date(b.updatedAt ?? 0) - +new Date(a.updatedAt ?? 0));
  const openRepairs = repairs.filter((t) => !['closed', 'rejected'].includes(t.status)).length;

  // Deployment history (sales) — work orders this asset was assigned to.
  const deployments = workOrders
    .map((wo) => ({ wo, wa: wo.assets?.find((a) => a.assetId === id) }))
    .filter((d) => !!d.wa)
    .sort((a, b) => +new Date(b.wa!.startDate ?? 0) - +new Date(a.wa!.startDate ?? 0));
  const daysDeployed = deployments.reduce((s, d) => s + (d.wa?.actualDays ?? 0), 0);

  // Crew — staff posted to this asset.
  const crew = allStaff.filter((p) => p.assignedAssetId === id);
  const isVessel = asset.assetClass === 'vessel';
  // For vessels, split into captain(s) vs deck crew by staffType.
  const captains = crew.filter((p) => p.staffType === 'captain');
  const deckCrew = crew.filter((p) => p.staffType !== 'captain');
  // Staff available to add (not already on this asset).
  const addableStaff = allStaff.filter((p) => p.assignedAssetId !== id);
  const addableCaptains = addableStaff.filter((p) => p.staffType === 'captain');
  const addableCrew = addableStaff.filter((p) => p.staffType !== 'captain');

  return (
    <div className="page">
      <Link to="/wli/assets" className="dback"><ArrowLeft /> Asset Register</Link>

      <div className="dhead">
        <div>
          <span className="eyebrow">{asset.code}</span>
          <h1 className="dtitle">{asset.make} {asset.model}</h1>
          <div className="dhead-badges">
            <span className="badge b-info"><Icon size={11} /> {ASSET_CLASS_LABEL[asset.assetClass]}</span>
            <span className={`badge ${OP_BADGE[asset.operationalStatus] ?? 'b-muted'}`}>
              <span className="bdot" />{asset.operationalStatus}
            </span>
            <span className={`badge ${COMM_BADGE[(asset.commercialStatus || 'available')] ?? 'b-muted'}`}>
              <span className="bdot" />{COMM_LABEL[(asset.commercialStatus || 'available')] ?? (asset.commercialStatus || 'available')}
            </span>
            {asset.pendingDelivery && (
              <span className="badge b-warn" title="Ordered but not yet physically delivered to a WLI site">⏳ Pending Delivery</span>
            )}
          </div>
        </div>
        <div className="dhead-actions">
          {!editing && asset.pendingDelivery && canManageAssets && (
            <button className="btn btn-primary" onClick={markDelivered} disabled={busy}>
              <PackageCheck size={14} /> Mark as Delivered
            </button>
          )}
          {!editing && <button className="btn btn-ghost" onClick={startEdit}><Pencil /> Edit</button>}
          {!editing && canManageAssets && asset.currentSiteId && (
            <button className="btn btn-ghost" onClick={handleUnassign} disabled={busy} title="Unassign from site">
              <X size={14} /> Unassign
            </button>
          )}
          {!editing && canManageAssets && (
            <button className="btn btn-ghost" onClick={handleDelete} disabled={busy} style={{ color: 'var(--danger)' }}>
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="detail">
        {/* Left — specs + history */}
        <div className="dcol">
          <div className="dcard">
            <div className="dcard-h"><h3><Gauge /> Specifications</h3></div>
            <div className="dcard-b">
              {editing ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div className="kv">
                    <div><div className="k">Make</div><Input value={form.make} onChange={(e) => setF('make', e.target.value)} placeholder="Make" /></div>
                    <div><div className="k">Model</div><Input value={form.model} onChange={(e) => setF('model', e.target.value)} placeholder="Model" /></div>
                    <div><div className="k">Type</div><Input value={form.type} onChange={(e) => setF('type', e.target.value)} placeholder="e.g. Generator" /></div>
                    <div><div className="k">Category</div>
                      <InputSelect value={form.assetClass} onChange={(e) => setF('assetClass', e.target.value)}>
                        {ASSET_CLASSES.map((c) => <option key={c} value={c}>{ASSET_CLASS_LABEL[c]}</option>)}
                      </InputSelect>
                    </div>
                    <div><div className="k">Operational</div>
                      <InputSelect value={form.operationalStatus} onChange={(e) => setF('operationalStatus', e.target.value)}>
                        {OP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </InputSelect>
                    </div>
                    <div><div className="k">Current Site</div>
                      <InputSelect value={form.currentSiteId} onChange={(e) => setF('currentSiteId', e.target.value)}>
                        <option value="">— Site —</option>
                        {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </InputSelect>
                    </div>
                    <div><div className="k">Condition</div>
                      <InputSelect value={form.condition} onChange={(e) => setF('condition', e.target.value)}>
                        <option value="">— Unknown —</option>
                        {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </InputSelect>
                    </div>
                    {form.assetClass === 'vessel' && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div className="k">followme.mv Tracking ID (live AIS position)</div>
                        <Input value={form.trackingId} onChange={(e) => setF('trackingId', e.target.value)} placeholder="e.g. 18599" />
                      </div>
                    )}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div className="k">Known Issue / Fault Notes</div>
                      <textarea
                        value={form.knownIssue}
                        onChange={(e) => setF('knownIssue', e.target.value)}
                        placeholder="Describe any known fault or issue…"
                        rows={3}
                        style={{ width: '100%', padding: '6px 10px', background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: 6, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', fontSize: 13, resize: 'vertical' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="primary" size="sm" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="kv">
                  <div><div className="k">Code</div><div className="v"><span className="mono">{asset.code}</span></div></div>
                  <div><div className="k">Category</div><div className="v">{ASSET_CLASS_LABEL[asset.assetClass]}</div></div>
                  <div><div className="k">Make</div><div className="v">{asset.make || '—'}</div></div>
                  <div><div className="k">Model</div><div className="v">{asset.model || '—'}</div></div>
                  <div><div className="k">Type</div><div className="v">{asset.type || '—'}</div></div>
                  <div><div className="k">Current Site</div><div className="v">{siteName(asset.currentSiteId)}</div></div>
                  {asset.condition && <div><div className="k">Condition</div><div className="v">{asset.condition}</div></div>}
                  {asset.regNo && <div><div className="k">Reg No</div><div className="v"><span className="mono">{asset.regNo}</span></div></div>}
                  {asset.chassisNo && <div><div className="k">Chassis No</div><div className="v"><span className="mono">{asset.chassisNo}</span></div></div>}
                  {asset.engineNo && <div><div className="k">Engine No</div><div className="v"><span className="mono">{asset.engineNo}</span></div></div>}
                  {asset.lastMaintenanceText && <div><div className="k">Last Maintenance</div><div className="v">{asset.lastMaintenanceText}</div></div>}
                  {asset.nextMaintDue && <div><div className="k">Next Maint Due</div><div className="v">{asset.nextMaintDue}</div></div>}
                  {asset.rentalEligible != null && <div><div className="k">Rental Eligible</div><div className="v">{asset.rentalEligible ? 'Yes' : 'No'}</div></div>}
                  {asset.assignedProject && <div style={{ gridColumn: '1 / -1' }}><div className="k">Assigned Project</div><div className="v">{asset.assignedProject}</div></div>}
                  {asset.knownIssue && <div style={{ gridColumn: '1 / -1' }}><div className="k">Known Issue / Fault Notes</div><div className="v" style={{ display: 'block', color: 'var(--warning)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{asset.knownIssue}</div></div>}
                  {asset.issueHistory && <div style={{ gridColumn: '1 / -1' }}><div className="k">Issue History</div><div className="v" style={{ display: 'block', lineHeight: 1.5, whiteSpace: 'pre-line', color: 'var(--text-secondary)' }}>{asset.issueHistory}</div></div>}
                </div>
              )}
            </div>
          </div>

          {/* Live vessel tracking (followme.mv) */}
          {asset.assetClass === 'vessel' && (
            <div className="dcard">
              <div className="dcard-h">
                <h3><Radio /> Live Tracking</h3>
                {asset.trackingId && (
                  <a className="h-link" href={followMeUrl(asset.trackingId)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    Open tracker <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <div className="dcard-b">
                {asset.trackingId ? (() => {
                  const pos = positions[asset.trackingId];
                  const hasPos = pos && pos.lat != null && pos.lng != null;
                  const status = followMeStatusText(meta);
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <div className="ft-ic tint-info" style={{ width: 44, height: 44 }}><Ship /></div>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <div className="lr-id" style={{ fontFamily: 'var(--font-ui)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                            Live AIS tracking · ID <span className="mono">{asset.trackingId}</span>
                            {pos?.online != null && (
                              <span className={`badge ${pos.online ? 'b-pos' : 'b-muted'}`}><span className="bdot" />{pos.online ? 'online' : 'offline'}</span>
                            )}
                          </div>
                          <div className="tc-sub" style={{ marginTop: 2 }}>Real-time vessel position via <b>FollowMe</b>.</div>
                        </div>
                        <a className="btn btn-primary" href={followMeUrl(asset.trackingId)} target="_blank" rel="noreferrer">
                          <Radio /> Open live tracker <ExternalLink />
                        </a>
                      </div>

                      {hasPos && (
                        <div className="kv" style={{ marginTop: 14, gridTemplateColumns: 'repeat(4, 1fr)' }}>
                          <div><div className="k">Latitude</div><div className="v"><span className="mono">{pos!.lat!.toFixed(4)}</span></div></div>
                          <div><div className="k">Longitude</div><div className="v"><span className="mono">{pos!.lng!.toFixed(4)}</span></div></div>
                          <div><div className="k">Speed</div><div className="v"><span className="mono">{pos!.speed ?? '—'}</span> kn</div></div>
                          <div><div className="k">Heading</div><div className="v"><span className="mono">{pos!.heading ?? '—'}</span>°</div></div>
                          {pos!.lastUpdate && <div style={{ gridColumn: '1 / -1' }}><div className="k">Last update</div><div className="v">{pos!.lastUpdate}</div></div>}
                        </div>
                      )}

                      {status && <p className="tc-sub" style={{ marginTop: 12, color: 'var(--warning)' }}>{status}</p>}

                      <div style={{ marginTop: 14, paddingTop: 11, borderTop: '1px solid var(--border-soft)' }}>
                        <FollowMeBadge />
                      </div>
                    </>
                  );
                })() : (
                  <p className="empty-note" style={{ padding: 0 }}>
                    No tracking ID yet. Click <b>Edit</b> and paste the vessel's FollowMe ID (e.g. 18599) to show its live position.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Marine vessel documents & compliance */}
          {asset.assetClass === 'vessel' && (asset.hullImo || asset.engine1Serial || asset.engine2Serial || asset.capacityNotes || asset.vesselPermitNo || asset.vesselPermitExpiry || asset.insuranceExpiry || asset.lastInspection || asset.drydockStart) && (
            <div className="dcard">
              <div className="dcard-h"><h3><FileText /> Vessel Documents & Compliance</h3></div>
              <div className="dcard-b">
                <div className="kv">
                  {asset.hullImo && <div><div className="k">Hull / IMO No</div><div className="v"><span className="mono">{asset.hullImo}</span></div></div>}
                  {asset.engine1Serial && <div><div className="k">Engine 1 Serial</div><div className="v"><span className="mono">{asset.engine1Serial}</span></div></div>}
                  {asset.engine2Serial && <div><div className="k">Engine 2 Serial</div><div className="v"><span className="mono">{asset.engine2Serial}</span></div></div>}
                  {asset.capacityNotes && <div style={{ gridColumn: '1 / -1' }}><div className="k">Capacity Notes</div><div className="v">{asset.capacityNotes}</div></div>}
                  {asset.vesselPermitNo && <div><div className="k">Permit No</div><div className="v"><span className="mono">{asset.vesselPermitNo}</span></div></div>}
                  {asset.vesselPermitExpiry && <div><div className="k">Permit Expiry</div><div className="v">{asset.vesselPermitExpiry}</div></div>}
                  {asset.insuranceExpiry && <div><div className="k">Insurance Expiry</div><div className="v">{asset.insuranceExpiry}</div></div>}
                  {asset.lastInspection && <div><div className="k">Last Inspection</div><div className="v">{asset.lastInspection}</div></div>}
                  {asset.drydockStart && <div><div className="k">Drydock Start</div><div className="v">{asset.drydockStart}</div></div>}
                  {asset.drydockEstEnd && <div><div className="k">Drydock Est. End</div><div className="v">{asset.drydockEstEnd}</div></div>}
                </div>
              </div>
            </div>
          )}

          {/* Repair history */}
          <div className="dcard">
            <div className="dcard-h">
              <h3><Wrench /> Repair History</h3>
              <span className="tc-sub">{repairs.length} ticket{repairs.length !== 1 ? 's' : ''}{openRepairs > 0 ? ` · ${openRepairs} open` : ''}</span>
            </div>
            <div className="dcard-b">
              {repairs.length === 0 ? (
                <p className="empty-note" style={{ padding: 0 }}>No repair tickets raised for this asset.</p>
              ) : repairs.map((t) => (
                <Link className="linkrow" key={t.id} to={`/wli/tickets/${t.id}`}>
                  <span className="lr-ic tint-danger"><Wrench /></span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="lr-id">{t.displayId}</div>
                    <div className="lr-sub">{t.description || '—'} · {fmtDate(t.updatedAt)}</div>
                  </div>
                  <span className={`badge ${ticketBadge(t.status)}`}><span className="bdot" />{ticketWorkflow.statusLabels[t.status as TicketStatus] ?? t.status}</span>
                  <ChevronRight className="lr-chev" />
                </Link>
              ))}
            </div>
          </div>

          {/* Deployment history (sales work orders) */}
          <div className="dcard">
            <div className="dcard-h">
              <h3><Briefcase /> Deployment History</h3>
              <span className="tc-sub">{deployments.length} work order{deployments.length !== 1 ? 's' : ''}{daysDeployed > 0 ? ` · ${daysDeployed} days` : ''}</span>
            </div>
            <div className="dcard-b">
              {deployments.length === 0 ? (
                <p className="empty-note" style={{ padding: 0 }}>Not deployed on any sales work order yet.</p>
              ) : deployments.map(({ wo, wa }) => (
                <Link className="linkrow" key={wo.id} to={`/wli/crm/work-orders/${wo.id}`}>
                  <span className="lr-ic tint-accent"><Briefcase /></span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="lr-id">{wo.displayId}</div>
                    <div className="lr-sub">{wo.customerName} · {fmtDate(wa?.startDate)}{wa?.endDate ? ` → ${fmtDate(wa.endDate)}` : ''}</div>
                  </div>
                  <span className={`badge ${WO_BADGE[wo.status] ?? 'b-info'}`}><span className="bdot" />{wo.status.replace(/_/g, ' ')}</span>
                  <ChevronRight className="lr-chev" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right — status summary */}
        <div className="dcol">
          <div className="dcard">
            <div className="dcard-h"><h3><Activity /> Status</h3></div>
            <div className="dcard-b">
              <div className="kv" style={{ gridTemplateColumns: '1fr' }}>
                <div>
                  <div className="k">Current Location</div>
                  <div className="v"><MapPin size={13} style={{ color: 'var(--accent)' }} /> {siteName(asset.currentSiteId)}</div>
                </div>
                <div>
                  <div className="k">Operational</div>
                  <div className="v"><span className={`badge ${OP_BADGE[asset.operationalStatus] ?? 'b-muted'}`}><span className="bdot" />{asset.operationalStatus}</span></div>
                </div>
                <div>
                  <div className="k">Commercial</div>
                  <div className="v"><span className={`badge ${COMM_BADGE[(asset.commercialStatus || 'available')] ?? 'b-muted'}`}><span className="bdot" />{COMM_LABEL[(asset.commercialStatus || 'available')] ?? (asset.commercialStatus || 'available')}</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="dcard">
            <div className="dcard-h">
              <h3>{isVessel ? <Anchor /> : <Users />} {isVessel ? 'Vessel Crew' : 'Assigned Crew'}</h3>
              <span className="tc-sub">{crew.length}</span>
            </div>
            <div className="dcard-b">
              {isVessel ? (
                <>
                  {/* Captain */}
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                      Captain · {captains.length}
                    </span>
                    {captains.length === 0
                      ? <p className="empty-note" style={{ padding: '4px 0 0' }}>No captain assigned.</p>
                      : <div style={{ marginTop: 6 }}>{captains.map((p) => renderCrewRow(p, canManageAssets, removeCrew))}</div>}
                    {canManageAssets && (
                      <CrewAdd label="+ Assign captain…" options={addableCaptains} onPick={addCrew} disabled={busy} />
                    )}
                  </div>
                  {/* Deck crew */}
                  <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                      Deck Crew · {deckCrew.length}
                    </span>
                    {deckCrew.length === 0
                      ? <p className="empty-note" style={{ padding: '4px 0 0' }}>No deck crew assigned.</p>
                      : <div style={{ marginTop: 6 }}>{deckCrew.map((p) => renderCrewRow(p, canManageAssets, removeCrew))}</div>}
                    {canManageAssets && (
                      <CrewAdd label="+ Add deck crew…" options={addableCrew} onPick={addCrew} disabled={busy} />
                    )}
                  </div>
                </>
              ) : (
                <>
                  {crew.length === 0
                    ? <p className="empty-note" style={{ padding: 0 }}>No staff posted to this asset.</p>
                    : <div>{crew.map((p) => renderCrewRow(p, canManageAssets, removeCrew))}</div>}
                  {canManageAssets && (
                    <CrewAdd label="+ Assign operator / driver…" options={addableStaff} onPick={addCrew} disabled={busy} />
                  )}
                </>
              )}
            </div>
          </div>

          <div className="dcard">
            <div className="dcard-h"><h3>Lifetime</h3></div>
            <div className="dcard-b">
              <div className="lineitem"><span className="li-t">Repair tickets</span><span className="li-v">{repairs.length}</span></div>
              <div className="lineitem"><span className="li-t">Open repairs</span><span className="li-v" style={{ color: openRepairs ? 'var(--danger)' : 'var(--text-muted)' }}>{openRepairs}</span></div>
              <div className="lineitem"><span className="li-t">Sales deployments</span><span className="li-v">{deployments.length}</span></div>
              <div className="lineitem"><span className="li-t">Days deployed</span><span className="li-v">{daysDeployed}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
