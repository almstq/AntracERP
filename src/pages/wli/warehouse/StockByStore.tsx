import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { useStores, useInventoryItems, useAllStockBalances } from '../../../lib/hooks/useInventory';

export function StockByStore() {
  const { data: stores, loading: storesLoading } = useStores();
  const { data: items } = useInventoryItems();
  const { data: balances } = useAllStockBalances();
  const [selectedStore, setSelectedStore] = useState('');

  const activeStores = stores.filter((s) => s.active);
  const viewStore = selectedStore || (activeStores[0]?.id ?? '');

  const storeBalances = balances.filter((b) => b.storeId === viewStore);

  // Enrich with item details
  const rows = storeBalances.map((b) => {
    const item = items.find((it) => it.id === b.itemId);
    return { balance: b, item };
  }).filter((r) => r.item && r.balance.qtyOnHand > 0);

  const storeObj = stores.find((s) => s.id === viewStore);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Stock by Store</h1>
          {storeObj && <p className="text-xs text-text-muted">{storeObj.siteName} · {storeObj.type}</p>}
        </div>
        <select
          className="text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary"
          value={viewStore}
          onChange={(e) => setSelectedStore(e.target.value)}
        >
          {activeStores.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.siteName})</option>
          ))}
        </select>
      </div>

      <Card>
        {storesLoading ? (
          <p className="text-xs text-text-muted py-4 text-center">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-text-muted py-4 text-center">
            {activeStores.length === 0
              ? 'No stores yet — add stores in the Stores Register first.'
              : 'No stock in this store yet.'}
          </p>
        ) : (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-4 gap-2 px-3 py-2 text-[10px] text-text-muted font-medium">
              <span>Item</span><span>Category</span><span className="text-right">Qty</span><span className="text-right">Avg Cost</span>
            </div>
            {rows.map(({ balance, item }) => (
              <Link
                key={balance.id}
                to={`/wli/warehouse/items/${balance.itemId}`}
                className="grid grid-cols-4 gap-2 px-3 py-2 hover:bg-bg-surface transition-colors"
              >
                <div>
                  <p className="text-xs font-medium text-text-primary">{item!.name}</p>
                  <p className="text-[10px] text-text-muted">{item!.code}</p>
                </div>
                <span className="text-xs text-text-secondary self-center">{item!.category}</span>
                <span className="text-xs font-medium text-text-primary text-right self-center">
                  {balance.qtyOnHand} {item!.uom}
                </span>
                <span className="text-xs text-text-muted text-right self-center">
                  MVR {item!.avgCost?.toFixed(2) ?? '—'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* All stores summary */}
      {activeStores.length > 1 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {activeStores.map((store) => {
            const count = balances.filter((b) => b.storeId === store.id && b.qtyOnHand > 0).length;
            return (
              <button
                key={store.id}
                onClick={() => setSelectedStore(store.id)}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  store.id === viewStore
                    ? 'border-blue bg-blue/5'
                    : 'border-border hover:bg-bg-surface'
                }`}
              >
                <p className="text-xs font-medium text-text-primary">{store.name}</p>
                <p className="text-[10px] text-text-muted">{store.siteName} · {count} SKUs</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
