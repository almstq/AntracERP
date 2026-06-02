import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { Truck, Ship, Wrench, Plus, X } from 'lucide-react';
import { useAssetList, useSiteList } from '../../../lib/hooks/useWorkflowData';
import { createAsset, assignAssetLocation, unassignAsset } from '../../../lib/services/registry';
import type { Asset, AssetClass } from '../../../types/asset';
import { ASSET_CLASSES, ASSET_CLASS_LABEL, ASSET_CLASS_PLURAL } from '../../../types/asset';
import { PageContainer } from '../../../components/shared/PageContainer';
import { useToast } from '../../../lib/context/ToastContext';

const CLASSES = ASSET_CLASSES;
const STATUSES: Asset['operationalStatus'][] = ['operational', 'down', 'maintenance', 'idle'];

function ClassIcon({ c }: { c: AssetClass }) {
  if (c === 'vessel') return <Ship size={16} className="text-text-muted" />;
  if (c === 'vehicle') return <Truck size={16} className="text-text-muted" />;
  return <Wrench size={16} className="text-text-muted" />;
}

export function AssetRegister() {
  const { data: assets, loading, refresh } = useAssetList();
  const { data: sites } = useSiteList();
  const [adding, setAdding] = useState(false);
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

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Asset Register</h1>
          <p className="text-xs text-text-muted">{loading ? 'Loading…' : `${assets.length} assets`}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add Asset</Button>
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

      <div className="space-y-6">
        {CLASSES.map((cls) => {
          const inClass = assets.filter((a) => a.assetClass === cls);
          if (inClass.length === 0) return null;
          return (
            <div key={cls}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <ClassIcon c={cls} />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{ASSET_CLASS_PLURAL[cls]}</h2>
                <span className="text-[10px] text-text-muted">· {inClass.length}</span>
              </div>
              <Card>
                <div className="space-y-1">
                  {inClass.map((a) => (
                    <div key={a.id} className="flex items-center justify-between flex-wrap p-3 rounded-lg hover:bg-bg-surface gap-3">
                      <Link to={`/wli/assets/${a.id}`} className="flex items-center gap-3 min-w-0 flex-1 group">
                        <ClassIcon c={a.assetClass} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium text-text-primary truncate group-hover:text-blue">{a.code} — {a.make} {a.model}</p>
                            {a.pendingDelivery && <span className="badge b-warn" style={{ fontSize: 9, padding: '1px 5px' }}>Pending Delivery</span>}
                          </div>
                          <p className="text-[10px] text-text-muted">{a.type} · {a.operationalStatus}</p>
                        </div>
                      </Link>
                      {a.pendingDelivery
                        ? <span className="text-[10px] text-text-muted flex-shrink-0 italic">Not at site</span>
                        : (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <select
                              className="text-[10px] p-1.5 rounded bg-bg-surface border border-border text-text-secondary"
                              value={a.currentSiteId}
                              onChange={(e) => reassign(a.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              title="Assign location"
                            >
                              <option value="">Unassigned</option>
                              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {a.currentSiteId && (
                              <button
                                className="p-1 rounded text-text-muted hover:text-red"
                                title="Unassign from site"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); unassign(a.id, a.code); }}
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
