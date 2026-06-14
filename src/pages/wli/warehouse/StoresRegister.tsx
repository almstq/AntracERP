import { useState } from 'react';
import { Warehouse } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { useStores } from '../../../lib/hooks/useInventory';
import { useSiteList } from '../../../lib/hooks/useWorkflowData';
import { createStore, updateStore } from '../../../lib/services/inventory';
import type { Store } from '../../../types/inventory';
import { useToast } from '../../../lib/context/ToastContext';

const STORE_TYPES: Store['type'][] = ['main', 'yard', 'site', 'transit'];
const COLS = '2fr 0.8fr 1fr';

export function StoresRegister() {
  const { data: stores, loading, refresh } = useStores();
  const { data: sites } = useSiteList();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', siteId: '', type: 'main' as Store['type'] });
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function add() {
    if (!form.name.trim()) { setErr('Name required'); return; }
    if (!form.siteId) { setErr('Site required'); return; }
    setBusy(true); setErr(null);
    try {
      const site = sites.find((s) => s.id === form.siteId);
      await createStore({ name: form.name, siteId: form.siteId, siteName: site?.name ?? '', type: form.type });
      toast('success', 'Store created');
      setForm({ name: '', siteId: '', type: 'main' });
      setAdding(false); refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setErr(msg);
      toast('error', msg);
    }
    finally { setBusy(false); }
  }

  async function toggleActive(store: Store & { id: string }) {
    const label = store.active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${label} "${store.name}"?`)) return;
    await updateStore(store.id, { active: !store.active });
    refresh();
  }

  const grouped = sites.map((site) => ({
    site,
    stores: stores.filter((s) => s.siteId === site.id),
  })).filter((g) => g.stores.length > 0);

  const unassigned = stores.filter((s) => !sites.find((site) => site.id === s.siteId));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Stores Register</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : `${stores.length} stores across ${sites.length} sites`}</span>
          </p>
        </div>
        <div className="head-actions">
          <Button variant="primary" size="sm" onClick={() => setAdding((v) => !v)}>+ Add Store</Button>
        </div>
      </div>

      {adding && (
        <Card className="mb-4">
          <p className="text-xs font-medium text-text-primary mb-3">New Store</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Input placeholder="Store name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <InputSelect value={form.siteId} onChange={(e) => set('siteId', e.target.value)}>
              <option value="">— Site —</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </InputSelect>
            <InputSelect value={form.type} onChange={(e) => set('type', e.target.value as Store['type'])}>
              {STORE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </InputSelect>
            <Button variant="primary" size="sm" onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
          </div>
          {err && <p className="text-xs text-red mt-2">{err}</p>}
        </Card>
      )}

      {stores.length === 0 && !loading && (
        <div className="tbl"><div className="tbl-empty">No stores yet. Add a store to a site to start tracking stock.</div></div>
      )}

      {grouped.map(({ site, stores: siteStores }) => (
        <div key={site.id} style={{ marginBottom: 22 }}>
          <div className="section-head" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{site.name}</h2>
            <span className="hint">· {siteStores.length} store{siteStores.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="tbl">
            <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
              <span>Store</span><span>Status</span><span />
            </div>
            {siteStores.map((store) => (
              <div key={store.id} className="tbl-row" style={{ gridTemplateColumns: COLS, cursor: 'default' }}>
                <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Warehouse size={15} className="text-text-muted" />
                  <div style={{ minWidth: 0 }}>
                    <div className="tc-id">{store.name}</div>
                    <div className="tc-desc">{store.code} · {store.type}</div>
                  </div>
                </div>
                <div><span className={`badge ${store.active ? 'b-pos' : 'b-muted'}`}><span className="bdot" />{store.active ? 'active' : 'inactive'}</span></div>
                <div style={{ justifySelf: 'end' }}>
                  <button onClick={() => toggleActive(store)} className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>
                    {store.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {unassigned.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div className="section-head"><h2 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unassigned Stores</h2></div>
          <div className="tbl">
            {unassigned.map((store) => (
              <div key={store.id} className="tbl-row" style={{ gridTemplateColumns: '1fr', cursor: 'default' }}>
                <div className="tc-txt">{store.name} ({store.code})</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
