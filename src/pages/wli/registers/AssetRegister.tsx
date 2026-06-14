import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { Truck, Ship, Wrench, Plus, X, Search, ChevronRight } from 'lucide-react';
import { useAssetList, useSiteList } from '../../../lib/hooks/useWorkflowData';
import { createAsset, assignAssetLocation, unassignAsset } from '../../../lib/services/registry';
import type { Asset, AssetClass } from '../../../types/asset';
import { ASSET_CLASSES, ASSET_CLASS_LABEL, ASSET_CLASS_PLURAL } from '../../../types/asset';
import { useAuth } from '../../../lib/hooks/useAuth';
import { isTerritoryScoped, canEdit } from '../../../lib/permissions/roleRegistry';
import { useToast } from '../../../lib/context/ToastContext';

const CLASSES = ASSET_CLASSES;
const STATUSES: Asset['operationalStatus'][] = ['operational', 'down', 'maintenance', 'idle'];
const COLS = '1.9fr 0.9fr 0.9fr 1.5fr 32px';

const STATUS_BADGE: Record<string, string> = {
  operational: 'b-pos', down: 'b-danger', maintenance: 'b-warn', idle: 'b-muted',
};

function ClassIcon({ c }: { c: AssetClass }) {
  if (c === 'vessel') return <Ship size={15} className="text-text-muted" />;
  if (c === 'vehicle') return <Truck size={15} className="text-text-muted" />;
  return <Wrench size={15} className="text-text-muted" />;
}

export function AssetRegister() {
  const { data: assets, loading, refresh } = useAssetList();
  const { data: sites } = useSiteList();
  const { user, effectiveRole } = useAuth();
  const scoped = isTerritoryScoped(effectiveRole);
  const editable = canEdit(effectiveRole, '/wli/assets');
  const territory = new Set(user?.siteIds ?? []);
  const inTerritory = (siteId?: string) => !scoped || (!!siteId && territory.has(siteId));
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ code: '', make: '', model: '', type: '', assetClass: 'equipment' as AssetClass, currentSiteId: '', operationalStatus: 'operational' as Asset['operationalStatus'], pendingDelivery: false });
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function add() {
    if (!form.code.trim() || (!form.currentSiteId && !form.pendingDelivery)) { setErr('Code and location required (or tick Pending Delivery)'); return; }
    setBusy(true); setErr(null);
    try {
      await createAsset(form);
      toast('success', 'Asset added');
      setForm({ code: '', make: '', model: '', type: '', assetClass: 'equipment', currentSiteId: '', operationalStatus: 'operational', pendingDelivery: false });
      setAdding(false); refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setErr(msg);
      toast('error', msg);
    }
    finally { setBusy(false); }
  }

  async function reassign(assetId: string, siteId: string) {
    const siteName = sites.find(s => s.id === siteId)?.name ?? siteId;
    if (!window.confirm(`Reassign this asset to "${siteName}"?`)) return;
    await assignAssetLocation(assetId, siteId); refresh();
  }

  async function unassign(assetId: string, code: string) {
    if (!window.confirm(`Unassign ${code} from its site? Its location becomes blank.`)) return;
    await unassignAsset(assetId); refresh();
  }

  const q = search.trim().toLowerCase();
  const matches = (a: Asset) => (!q || `${a.code} ${a.make} ${a.model} ${a.type}`.toLowerCase().includes(q)) && inTerritory(a.currentSiteId);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Asset Register</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : `${assets.length} assets`}</span>
          </p>
        </div>
        <div className="head-actions">
          {editable
            ? <Button variant="primary" size="sm" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add Asset</Button>
            : <span className="badge b-muted"><span className="bdot" />view only</span>}
        </div>
      </div>

      {adding && (
        <Card className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Input placeholder="Code (WL-HV-0020)" value={form.code} onChange={(e) => set('code', e.target.value)} />
            <Input placeholder="Make" value={form.make} onChange={(e) => set('make', e.target.value)} />
            <Input placeholder="Model" value={form.model} onChange={(e) => set('model', e.target.value)} />
            <Input placeholder="Type" value={form.type} onChange={(e) => set('type', e.target.value)} />
            <InputSelect value={form.assetClass} onChange={(e) => set('assetClass', e.target.value)}>
              {CLASSES.map((c) => <option key={c} value={c}>{ASSET_CLASS_LABEL[c]}</option>)}
            </InputSelect>
            <InputSelect value={form.currentSiteId} onChange={(e) => set('currentSiteId', e.target.value)} disabled={form.pendingDelivery}>
              <option value="">Location…</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </InputSelect>
            <InputSelect value={form.operationalStatus} onChange={(e) => set('operationalStatus', e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </InputSelect>
            <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer select-none col-span-2 md:col-span-1">
              <input
                type="checkbox"
                checked={form.pendingDelivery}
                onChange={(e) => setForm((f) => ({ ...f, pendingDelivery: e.target.checked, currentSiteId: e.target.checked ? '' : f.currentSiteId }))}
                className="accent-amber-400"
              />
              Pending Delivery (not yet at site)
            </label>
            <Button variant="primary" size="sm" onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
          </div>
          {err && <p className="text-xs text-red mt-2">{err}</p>}
        </Card>
      )}

      <div className="toolbar">
        <div className="search-wrap">
          <Search />
          <input placeholder="Search assets, makes, models…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {scoped && (
          <span className="badge b-info" title="You see only assets at your assigned sites">
            <span className="bdot" />your territory
          </span>
        )}
      </div>

      {CLASSES.map((cls) => {
        const inClass = assets.filter((a) => a.assetClass === cls && matches(a));
        if (inClass.length === 0) return null;
        return (
          <div key={cls} style={{ marginBottom: 22 }}>
            <div className="section-head" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClassIcon c={cls} />
              <h2 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ASSET_CLASS_PLURAL[cls]}</h2>
              <span className="hint">· {inClass.length}</span>
            </div>
            <div className="tbl">
              <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
                <span>Asset</span><span>Type</span><span>Status</span><span>Location</span><span />
              </div>
              {inClass.map((a) => (
                <div key={a.id} className="tbl-row" style={{ gridTemplateColumns: COLS, cursor: 'default' }}>
                  <Link to={`/wli/assets/${a.id}`} style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ClassIcon c={a.assetClass} />
                    <div style={{ minWidth: 0 }}>
                      <div className="tc-id" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {a.code} — {a.make} {a.model}
                        {a.pendingDelivery && <span className="badge b-warn" style={{ fontSize: 9, padding: '1px 5px' }}>Pending</span>}
                      </div>
                    </div>
                  </Link>
                  <div className="tc-txt">{a.type || '—'}</div>
                  <div>
                    <span className={`badge ${STATUS_BADGE[a.operationalStatus] ?? 'b-info'}`}>
                      <span className="bdot" />{a.operationalStatus}
                    </span>
                  </div>
                  <div>
                    {a.pendingDelivery ? (
                      <span className="tc-sub" style={{ fontStyle: 'italic' }}>Not at site</span>
                    ) : !editable ? (
                      <span className="tc-txt">{sites.find((s) => s.id === a.currentSiteId)?.name ?? 'Unassigned'}</span>
                    ) : (
                      <select
                        className="side-foot-sel"
                        style={{ width: '100%', fontSize: 11, padding: '4px 8px' }}
                        value={a.currentSiteId}
                        onChange={(e) => reassign(a.id, e.target.value)}
                        title="Assign location"
                      >
                        <option value="">Unassigned</option>
                        {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    )}
                  </div>
                  <div style={{ justifySelf: 'end' }}>
                    {editable && !a.pendingDelivery && a.currentSiteId ? (
                      <button
                        className="btn btn-ghost"
                        style={{ padding: 4 }}
                        title="Unassign from site"
                        onClick={() => unassign(a.id, a.code)}
                      ><X size={13} /></button>
                    ) : (
                      <Link to={`/wli/assets/${a.id}`}><ChevronRight className="tc-chev" /></Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
