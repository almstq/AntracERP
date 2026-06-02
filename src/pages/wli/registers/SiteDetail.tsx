import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Pencil, Boxes, Users, Ship, Truck, Wrench, Plus, X,
  ChevronRight, type LucideIcon,
} from 'lucide-react';
import { useSiteList, useAssetList, useStaffList } from '../../../lib/hooks/useWorkflowData';
import { useAuth } from '../../../lib/hooks/useAuth';
import { updateLocation, assignAssetLocation, assignStaffSite, assignStaffAsset } from '../../../lib/services/registry';
import { STAFF_TYPE_LABEL } from '../../../types/org';
import type { Site } from '../../../types/org';
import type { AssetClass } from '../../../types/asset';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';
import { useToast } from '../../../lib/context/ToastContext';

const TYPES: Site['type'][] = ['project', 'yard', 'office', 'vessel', 'depot', 'hq'];
const SITE_TYPE_LABEL: Record<string, string> = {
  project: 'Project Site', office: 'Office', yard: 'Yard', vessel: 'Vessel', depot: 'Depot', hq: 'HQ',
};
const CLASS_ICON: Record<AssetClass, LucideIcon> = { vessel: Ship, vehicle: Truck, equipment: Wrench };
const OP_BADGE: Record<string, string> = {
  operational: 'b-pos', idle: 'b-info', maintenance: 'b-warn', down: 'b-danger',
};

export function SiteDetail() {
  const { id } = useParams();
  const { data: sites, loading, refresh } = useSiteList();
  const { data: assets, refresh: refreshAssets } = useAssetList();
  const { data: staff, refresh: refreshStaff } = useStaffList();
  const { toast } = useToast();
  const { effectiveRole } = useAuth();
  const canManage = effectiveRole === 'super_admin' || effectiveRole === 'gm';

  const site = sites.find((s) => s.id === id);

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'project' as Site['type'], lat: '', lng: '', status: 'active' as Site['status'] });
  const setF = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const [addAssetId, setAddAssetId] = useState('');
  const [addStaffId, setAddStaffId] = useState('');

  function startEdit() {
    if (!site) return;
    setForm({
      name: site.name, type: site.type,
      lat: site.location?.lat != null ? String(site.location.lat) : '',
      lng: site.location?.lng != null ? String(site.location.lng) : '',
      status: site.status,
    });
    setEditing(true);
  }

  async function save() {
    if (!site) return;
    setBusy(true);
    try {
      await updateLocation(site.id, {
        name: form.name, type: form.type, status: form.status,
        lat: form.lat ? Number(form.lat) : undefined,
        lng: form.lng ? Number(form.lng) : undefined,
      });
      toast('success', 'Site updated');
      setEditing(false);
      refresh();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Update failed');
    } finally { setBusy(false); }
  }

  if (loading) return <div className="page"><LoadingSpinner text="Loading…" /></div>;
  if (!site) return <div className="page"><p className="empty-note">Site not found.</p></div>;

  // Assets currently at this site
  const siteAssets = assets.filter((a) => a.currentSiteId === site.id);
  const siteAssetIds = new Set(siteAssets.map((a) => a.id));
  const elsewhereAssets = assets.filter((a) => a.currentSiteId !== site.id);

  // Crew effective at this site: directly assigned OR via an asset that is here
  const crewHere = staff.filter(
    (p) => (p.assignedAssetId && siteAssetIds.has(p.assignedAssetId)) || (!p.assignedAssetId && p.siteId === site.id),
  );
  // Staff not effectively at this site (for the "add" dropdown)
  const assetById = new Map(assets.map((a) => [a.id, a]));
  const staffElsewhere = staff.filter((p) => {
    const eff = (p.assignedAssetId && assetById.get(p.assignedAssetId)?.currentSiteId) || p.siteId;
    return eff !== site.id;
  });

  const siteLabelOf = (sid: string | undefined) => (sid ? sites.find((s) => s.id === sid)?.name ?? sid : '—');

  async function moveAssetHere(assetId: string) {
    if (!assetId || !site) return;
    const a = assets.find((x) => x.id === assetId);
    const from = a?.currentSiteId ? siteLabelOf(a.currentSiteId) : null;
    if (from && !window.confirm(`Move ${a?.code} from "${from}" to "${site.name}"?`)) return;
    setBusy(true);
    try {
      await assignAssetLocation(assetId, site.id);
      toast('success', `${a?.code ?? 'Asset'} moved to ${site.name}`);
      setAddAssetId('');
      refreshAssets();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed');
    } finally { setBusy(false); }
  }

  async function removeAsset(assetId: string) {
    const a = assets.find((x) => x.id === assetId);
    if (!window.confirm(`Remove ${a?.code} from ${site!.name}? (Its location becomes unassigned.)`)) return;
    setBusy(true);
    try {
      await assignAssetLocation(assetId, '');
      toast('success', `${a?.code ?? 'Asset'} removed from site`);
      refreshAssets();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed');
    } finally { setBusy(false); }
  }

  async function addStaffHere(staffId: string) {
    if (!staffId || !site) return;
    const p = staff.find((x) => x.id === staffId);
    // Direct site posting: set siteId and clear any asset assignment elsewhere
    if (p?.assignedAssetId && !siteAssetIds.has(p.assignedAssetId)) {
      const onAsset = assetById.get(p.assignedAssetId);
      if (!window.confirm(`${p.name} is currently assigned to ${onAsset?.code ?? 'an asset'} elsewhere.\n\nPost them directly to ${site.name} and clear that asset assignment?`)) return;
    }
    setBusy(true);
    try {
      if (p?.assignedAssetId && !siteAssetIds.has(p.assignedAssetId)) await assignStaffAsset(staffId, null);
      await assignStaffSite(staffId, site.id);
      toast('success', `${p?.name ?? 'Staff'} posted to ${site.name}`);
      setAddStaffId('');
      refreshStaff();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed');
    } finally { setBusy(false); }
  }

  async function removeStaff(staffId: string) {
    const p = staff.find((x) => x.id === staffId);
    if (!window.confirm(`Remove ${p?.name} from ${site!.name}?`)) return;
    setBusy(true);
    try {
      // If on an asset at this site, detach from the asset; else clear direct site
      if (p?.assignedAssetId && siteAssetIds.has(p.assignedAssetId)) await assignStaffAsset(staffId, null);
      else await assignStaffSite(staffId, '');
      toast('success', `${p?.name ?? 'Staff'} removed from site`);
      refreshStaff();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="page">
      <Link to="/wli/locations" className="dback"><ArrowLeft /> Locations</Link>

      <div className="dhead">
        <div>
          <span className="eyebrow"><MapPin size={11} /> {SITE_TYPE_LABEL[site.type] ?? site.type}</span>
          <h1 className="dtitle">{site.name}</h1>
          <div className="dhead-badges">
            <span className={`badge ${site.status === 'active' ? 'b-pos' : 'b-muted'}`}><span className="bdot" />{site.status}</span>
            {site.location && (
              <span className="tc-sub"><MapPin size={11} /> {site.location.lat.toFixed(4)}, {site.location.lng.toFixed(4)}</span>
            )}
            <span className="tc-sub"><Boxes size={11} /> {siteAssets.length} assets</span>
            <span className="tc-sub"><Users size={11} /> {crewHere.length} crew</span>
          </div>
        </div>
        <div className="dhead-actions">
          {!editing && canManage && <button className="btn btn-ghost" onClick={startEdit}><Pencil /> Edit</button>}
        </div>
      </div>

      <div className="detail">
        {/* Left — assets at site */}
        <div className="dcol">
          <div className="dcard">
            <div className="dcard-h">
              <h3><Boxes /> Assets at Site</h3>
              <span className="tc-sub">{siteAssets.length}</span>
            </div>
            <div className="dcard-b">
              {siteAssets.length === 0
                ? <p className="empty-note" style={{ padding: 0 }}>No assets deployed here.</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {siteAssets.map((a) => {
                      const Icon = CLASS_ICON[a.assetClass] ?? Wrench;
                      return (
                        <div key={a.id} className="linkrow" style={{ cursor: 'default' }}>
                          <span className="lr-ic tint-info"><Icon /></span>
                          <Link to={`/wli/assets/${a.id}`} style={{ minWidth: 0, flex: 1, textDecoration: 'none' }}>
                            <div className="lr-id"><span className="mono">{a.code}</span></div>
                            <div className="lr-sub">{a.make} {a.model}</div>
                          </Link>
                          <span className={`badge ${OP_BADGE[a.operationalStatus] ?? 'b-muted'}`}><span className="bdot" />{a.operationalStatus}</span>
                          {canManage && (
                            <button className="btn btn-ghost" style={{ padding: 4 }} title="Remove from site" onClick={() => removeAsset(a.id)}>
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              {canManage && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
                  <InputSelect value={addAssetId} onChange={(e) => setAddAssetId(e.target.value)}>
                    <option value="">Move an asset here…</option>
                    {elsewhereAssets.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.make} {a.model}{a.currentSiteId ? ` (at ${siteLabelOf(a.currentSiteId)})` : ''}</option>
                    ))}
                  </InputSelect>
                  <Button variant="primary" size="sm" disabled={!addAssetId || busy} onClick={() => moveAssetHere(addAssetId)}>
                    <Plus size={14} /> Add
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — crew at site + edit */}
        <div className="dcol">
          {editing && (
            <div className="dcard">
              <div className="dcard-h"><h3><Pencil size={15} /> Edit Site</h3></div>
              <div className="dcard-b">
                <div style={{ display: 'grid', gap: 12 }}>
                  <div className="kv">
                    <div><div className="k">Name</div><Input value={form.name} onChange={(e) => setF('name', e.target.value)} /></div>
                    <div><div className="k">Type</div>
                      <InputSelect value={form.type} onChange={(e) => setF('type', e.target.value)}>
                        {TYPES.map((t) => <option key={t} value={t}>{SITE_TYPE_LABEL[t] ?? t}</option>)}
                      </InputSelect>
                    </div>
                    <div><div className="k">Status</div>
                      <InputSelect value={form.status} onChange={(e) => setF('status', e.target.value)}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </InputSelect>
                    </div>
                    <div><div className="k">Latitude</div><Input value={form.lat} onChange={(e) => setF('lat', e.target.value)} placeholder="e.g. 4.1755" /></div>
                    <div><div className="k">Longitude</div><Input value={form.lng} onChange={(e) => setF('lng', e.target.value)} placeholder="e.g. 73.5093" /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="primary" size="sm" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="dcard">
            <div className="dcard-h">
              <h3><Users /> Crew at Site</h3>
              <span className="tc-sub">{crewHere.length}</span>
            </div>
            <div className="dcard-b">
              {crewHere.length === 0
                ? <p className="empty-note" style={{ padding: 0 }}>No crew posted here.</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {crewHere.map((p) => {
                      const onAsset = p.assignedAssetId ? assetById.get(p.assignedAssetId) : undefined;
                      return (
                        <div key={p.id} className="linkrow" style={{ cursor: 'default' }}>
                          <Link to={`/wli/staff/${p.id}`} style={{ minWidth: 0, flex: 1, textDecoration: 'none' }}>
                            <div className="lr-id" style={{ fontFamily: 'var(--font-ui)' }}>{p.name}</div>
                            <div className="lr-sub">
                              {p.staffType ? STAFF_TYPE_LABEL[p.staffType] : p.role}
                              {onAsset ? ` · on ${onAsset.code}` : ' · site posting'}
                            </div>
                          </Link>
                          {canManage && (
                            <button className="btn btn-ghost" style={{ padding: 4 }} title="Remove from site" onClick={() => removeStaff(p.id)}>
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              {canManage && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
                  <InputSelect value={addStaffId} onChange={(e) => setAddStaffId(e.target.value)}>
                    <option value="">Post staff to this site…</option>
                    {staffElsewhere.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}{p.staffType ? ` (${STAFF_TYPE_LABEL[p.staffType]})` : ''}</option>
                    ))}
                  </InputSelect>
                  <Button variant="primary" size="sm" disabled={!addStaffId || busy} onClick={() => addStaffHere(addStaffId)}>
                    <Plus size={14} /> Add
                  </Button>
                </div>
              )}
              <p className="tc-sub" style={{ marginTop: 10, lineHeight: 1.5 }}>
                Tip: to put crew <i>on a specific asset</i>, open the asset and assign them there — they'll appear here automatically.
              </p>
            </div>
          </div>

          <div className="dcard">
            <div className="dcard-h"><h3>Summary</h3></div>
            <div className="dcard-b">
              <div className="lineitem"><span className="li-t">Assets deployed</span><span className="li-v">{siteAssets.length}</span></div>
              <div className="lineitem"><span className="li-t">Down / maintenance</span><span className="li-v" style={{ color: siteAssets.some((a) => a.operationalStatus === 'down' || a.operationalStatus === 'maintenance') ? 'var(--danger)' : 'var(--text-muted)' }}>
                {siteAssets.filter((a) => a.operationalStatus === 'down' || a.operationalStatus === 'maintenance').length}
              </span></div>
              <div className="lineitem"><span className="li-t">Crew on site</span><span className="li-v">{crewHere.length}</span></div>
            </div>
          </div>

          <div style={{ marginTop: 4 }}>
            <Link to="/wli/map" className="h-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              View on fleet map <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
