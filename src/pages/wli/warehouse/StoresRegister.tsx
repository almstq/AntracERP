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
import { PageContainer } from '../../../components/shared/PageContainer';
import { useToast } from '../../../lib/context/ToastContext';

const STORE_TYPES: Store['type'][] = ['main', 'yard', 'site', 'transit'];

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
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Stores Register</h1>
          <p className="text-xs text-text-muted">
            {loading ? 'Loading…' : `${stores.length} stores across ${sites.length} sites`}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAdding((v) => !v)}>
          + Add Store
        </Button>
      </div>

      {adding && (
        <Card className="mb-4">
          <p className="text-xs font-medium text-text-primary mb-3">New Store</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Input placeholder="Store name" value={form.name}
              onChange={(e) => set('name', e.target.value)} />
            <InputSelect value={form.siteId} onChange={(e) => set('siteId', e.target.value)}>
              <option value="">— Site —</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </InputSelect>
            <InputSelect value={form.type} onChange={(e) => set('type', e.target.value as Store['type'])}>
              {STORE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </InputSelect>
            <Button variant="primary" size="sm" onClick={add} disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
          {err && <p className="text-xs text-red mt-2">{err}</p>}
        </Card>
      )}

      {/* Grouped by site */}
      <div className="space-y-4">
        {grouped.map(({ site, stores: siteStores }) => (
          <Card key={site.id} header={
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-primary">{site.name}</span>
              <span className="text-[10px] text-text-muted">{siteStores.length} store{siteStores.length !== 1 ? 's' : ''}</span>
            </div>
          }>
            <div className="space-y-1">
              {siteStores.map((store) => (
                <div key={store.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface">
                  <div className="flex items-center gap-3">
                    <Warehouse size={16} className="text-text-muted" />
                    <div>
                      <p className="text-xs font-medium text-text-primary">{store.name}</p>
                      <p className="text-[10px] text-text-muted">{store.code} · {store.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${store.active ? 'bg-green/10 text-green' : 'bg-bg-surface text-text-muted'}`}>
                      {store.active ? 'active' : 'inactive'}
                    </span>
                    <button onClick={() => toggleActive(store)}
                      className="text-[10px] text-text-muted hover:text-text-primary underline">
                      {store.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}

        {unassigned.length > 0 && (
          <Card header={<span className="text-xs font-semibold text-text-muted">Unassigned Stores</span>}>
            {unassigned.map((store) => (
              <div key={store.id} className="p-3 text-xs text-text-secondary">{store.name} ({store.code})</div>
            ))}
          </Card>
        )}

        {stores.length === 0 && !loading && (
          <Card>
            <p className="text-xs text-text-muted text-center py-4">No stores yet. Add a store to a site to start tracking stock.</p>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
