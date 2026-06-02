import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Truck, Ship, Wrench, MapPin, Briefcase, Activity, ChevronRight,
  Gauge, Pencil, Radio, ExternalLink, type LucideIcon,
} from 'lucide-react';
import { useAssetList, useSiteList, useTicketList, useStaffList } from '../../../lib/hooks/useWorkflowData';
import { useWorkOrderList } from '../../../lib/hooks/useCrmData';
import { STAFF_TYPE_LABEL } from '../../../types/org';
import { updateAsset } from '../../../lib/services/registry';
import { ticketWorkflow } from '../../../lib/workflow/definitions';
import type { TicketStatus } from '../../../types/workflow-entities';
import type { Asset, AssetClass } from '../../../types/asset';
import { ASSET_CLASSES, ASSET_CLASS_LABEL, followMeUrl } from '../../../types/asset';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';
import { useToast } from '../../../lib/context/ToastContext';

const CLASS_ICON: Record<AssetClass, LucideIcon> = { vessel: Ship, vehicle: Truck, equipment: Wrench };
const OP_STATUSES: Asset['operationalStatus'][] = ['operational', 'idle', 'maintenance', 'down'];

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

export function AssetDetail() {
  const { id } = useParams();
  const { data: assets, loading, refresh } = useAssetList();
  const { data: sites } = useSiteList();
  const { data: tickets } = useTicketList();
  const { data: workOrders } = useWorkOrderList();
  const { data: allStaff } = useStaffList();
  const { toast } = useToast();

  const asset = assets.find((a) => a.id === id);
  const siteName = (sid: string | undefined) => (sid ? sites.find((s) => s.id === sid)?.name ?? sid : '—');

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    make: '', model: '', type: '', assetClass: 'equipment' as AssetClass,
    operationalStatus: 'operational' as Asset['operationalStatus'], currentSiteId: '', trackingId: '',
  });
  const setF = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function startEdit() {
    if (!asset) return;
    setForm({
      make: asset.make ?? '', model: asset.model ?? '', type: asset.type ?? '',
      assetClass: asset.assetClass, operationalStatus: asset.operationalStatus,
      currentSiteId: asset.currentSiteId ?? '', trackingId: asset.trackingId ?? '',
    });
    setEditing(true);
  }
  async function save() {
    if (!asset) return;
    setBusy(true);
    try {
      await updateAsset(asset.id, { ...form, trackingId: form.trackingId.trim() });
      toast('success', 'Asset updated');
      setEditing(false);
      refresh();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Update failed');
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
          </div>
        </div>
        <div className="dhead-actions">
          {!editing && <button className="btn btn-ghost" onClick={startEdit}><Pencil /> Edit</button>}
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
                    {form.assetClass === 'vessel' && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div className="k">followme.mv Tracking ID (live AIS position)</div>
                        <Input value={form.trackingId} onChange={(e) => setF('trackingId', e.target.value)} placeholder="e.g. 18599" />
                      </div>
                    )}
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
                {asset.trackingId ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div className="ft-ic tint-info" style={{ width: 44, height: 44 }}><Ship /></div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div className="lr-id" style={{ fontFamily: 'var(--font-ui)', fontSize: 13 }}>
                        Live AIS tracking · ID <span className="mono">{asset.trackingId}</span>
                      </div>
                      <div className="tc-sub" style={{ marginTop: 2 }}>
                        Real-time vessel position via <b>followme.mv</b>. Opens the live tracker in a new tab.
                      </div>
                    </div>
                    <a className="btn btn-primary" href={followMeUrl(asset.trackingId)} target="_blank" rel="noreferrer">
                      <Radio /> Open live tracker <ExternalLink />
                    </a>
                  </div>
                ) : (
                  <p className="empty-note" style={{ padding: 0 }}>
                    No tracking ID yet. Click <b>Edit</b> and paste the vessel’s followme.mv ID (e.g. 18599) to show its live position.
                  </p>
                )}
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
            <div className="dcard-h"><h3><Activity /> Assigned Crew</h3><span className="tc-sub">{crew.length}</span></div>
            <div className="dcard-b">
              {crew.length === 0
                ? <p className="empty-note" style={{ padding: 0 }}>No staff posted to this asset.</p>
                : crew.map((p) => (
                  <Link className="linkrow" key={p.id} to={`/wli/staff/${p.id}`}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="lr-id" style={{ fontFamily: 'var(--font-ui)' }}>{p.name}</div>
                      <div className="lr-sub">{p.staffType ? STAFF_TYPE_LABEL[p.staffType] : p.role}</div>
                    </div>
                    <ChevronRight className="lr-chev" />
                  </Link>
                ))}
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
