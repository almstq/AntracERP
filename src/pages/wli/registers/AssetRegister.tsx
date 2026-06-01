import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Truck, Ship, Wrench, Plus } from 'lucide-react';
import { useAssetList, useSiteList } from '../../../lib/hooks/useWorkflowData';
import { createAsset, assignAssetLocation } from '../../../lib/services/registry';
import type { Asset, AssetClass } from '../../../types/asset';
import { PageContainer } from '../../../components/shared/PageContainer';

const CLASSES: AssetClass[] = ['vehicle', 'vessel', 'equipment'];
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
  const [form, setForm] = useState({ code: '', make: '', model: '', type: '', assetClass: 'equipment' as AssetClass, currentSiteId: '', operationalStatus: 'operational' as Asset['operationalStatus'] });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const field = 'text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary';
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function add() {
    if (!form.code.trim() || !form.currentSiteId) { setErr('Code and location required'); return; }
    setBusy(true); setErr(null);
    try {
      await createAsset(form);
      setForm({ code: '', make: '', model: '', type: '', assetClass: 'equipment', currentSiteId: '', operationalStatus: 'operational' });
      setAdding(false); refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  }

  async function reassign(assetId: string, siteId: string) {
    await assignAssetLocation(assetId, siteId); refresh();
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
            <input className={field} placeholder="Code (WL-HV-0020)" value={form.code} onChange={(e) => set('code', e.target.value)} />
            <input className={field} placeholder="Make" value={form.make} onChange={(e) => set('make', e.target.value)} />
            <input className={field} placeholder="Model" value={form.model} onChange={(e) => set('model', e.target.value)} />
            <input className={field} placeholder="Type" value={form.type} onChange={(e) => set('type', e.target.value)} />
            <select className={field} value={form.assetClass} onChange={(e) => set('assetClass', e.target.value)}>
              {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={field} value={form.currentSiteId} onChange={(e) => set('currentSiteId', e.target.value)}>
              <option value="">Location…</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className={field} value={form.operationalStatus} onChange={(e) => set('operationalStatus', e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button variant="primary" size="sm" onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
          </div>
          {err && <p className="text-xs text-red mt-2">{err}</p>}
        </Card>
      )}

      <Card>
        <div className="space-y-1">
          {assets.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <ClassIcon c={a.assetClass} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{a.code} — {a.make} {a.model}</p>
                  <p className="text-[10px] text-text-muted">{a.type} · {a.operationalStatus}</p>
                </div>
              </div>
              <select
                className="text-[10px] p-1.5 rounded bg-bg-surface border border-border text-text-secondary flex-shrink-0"
                value={a.currentSiteId}
                onChange={(e) => reassign(a.id, e.target.value)}
                title="Assign location"
              >
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}
