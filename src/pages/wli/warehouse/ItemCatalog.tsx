import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useInventoryItems, useAllStockBalances } from '../../../lib/hooks/useInventory';
import { createItem } from '../../../lib/services/inventory';
import type { InventoryItem } from '../../../types/inventory';
import { PageContainer } from '../../../components/shared/PageContainer';

const CATS: InventoryItem['category'][] = ['parts', 'consumables', 'tools', 'other'];
const FIELD = 'text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary';

export function ItemCatalog() {
  const { data: items, loading, refresh } = useInventoryItems();
  const { data: balances } = useAllStockBalances();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'parts' as InventoryItem['category'], uom: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function add() {
    if (!form.name.trim()) { setErr('Name required'); return; }
    if (!form.uom.trim()) { setErr('Unit of measure required'); return; }
    setBusy(true); setErr(null);
    try {
      await createItem({ name: form.name, category: form.category, uom: form.uom, description: form.description || undefined });
      setForm({ name: '', category: 'parts', uom: '', description: '' });
      setAdding(false); refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  }

  /** Total on-hand across all stores for an item. */
  function totalQty(itemId: string): number {
    return balances.filter((b) => b.itemId === itemId).reduce((s, b) => s + (b.qtyOnHand ?? 0), 0);
  }

  const filtered = items.filter((it) =>
    !search || it.name.toLowerCase().includes(search.toLowerCase()) || it.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Item Catalog</h1>
          <p className="text-xs text-text-muted">{loading ? 'Loading…' : `${items.length} items`}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAdding((v) => !v)}>+ Add Item</Button>
      </div>

      <input
        className="text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary w-full mb-4"
        placeholder="Search by name or code…"
        value={search} onChange={(e) => setSearch(e.target.value)}
      />

      {adding && (
        <Card className="mb-4">
          <p className="text-xs font-medium text-text-primary mb-3">New Catalog Item</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
            <input className={FIELD} placeholder="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <select className={FIELD} value={form.category} onChange={(e) => set('category', e.target.value as InventoryItem['category'])}>
              {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className={FIELD} placeholder="UoM (pcs, m, kg…)" value={form.uom} onChange={(e) => set('uom', e.target.value)} />
            <input className={FIELD} placeholder="Description (optional)" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <Button variant="primary" size="sm" onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
          {err && <p className="text-xs text-red mt-2">{err}</p>}
        </Card>
      )}

      <Card>
        <div className="divide-y divide-border">
          {filtered.map((item) => {
            const qty = totalQty(item.id);
            return (
              <Link
                key={item.id}
                to={`/wli/warehouse/items/${item.id}`}
                className="flex items-center justify-between p-3 hover:bg-bg-surface transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Package size={16} className="text-text-muted" />
                  <div>
                    <p className="text-xs font-medium text-text-primary">{item.name}</p>
                    <p className="text-[10px] text-text-muted">{item.code} · {item.category} · {item.uom}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-medium text-text-primary">{qty} {item.uom}</p>
                    <p className="text-[10px] text-text-muted">avg MVR {item.avgCost?.toFixed(2) ?? '0.00'}</p>
                  </div>
                  <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary" />
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && !loading && (
            <p className="text-xs text-text-muted text-center py-4">
              {search ? 'No items match your search.' : 'No catalog items yet. Items are created at PO collection or added manually here.'}
            </p>
          )}
        </div>
      </Card>
    </PageContainer>
  );
}
