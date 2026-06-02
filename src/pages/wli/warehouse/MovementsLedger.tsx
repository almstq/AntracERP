import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { useAllStockMovements, useInventoryItems, useStores } from '../../../lib/hooks/useInventory';
import type { MovementType } from '../../../types/inventory';
import { PageContainer } from '../../../components/shared/PageContainer';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';

const TYPE_LABELS: Record<MovementType, string> = {
  receipt: 'Receipt',
  transfer_out: 'Transfer Out',
  transfer_in: 'Transfer In',
  consumption: 'Consumption',
  adjustment: 'Adjustment',
};

const TYPE_COLOURS: Record<MovementType, string> = {
  receipt: 'text-green bg-green/10',
  transfer_in: 'text-blue bg-blue/10',
  transfer_out: 'text-amber bg-amber/10',
  consumption: 'text-red bg-red/10',
  adjustment: 'text-purple bg-purple/10',
};

function fmtDate(d: Date | undefined): string {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('en-MV', { day: '2-digit', month: 'short' }) + ' ' +
    dt.toLocaleTimeString('en-MV', { hour: '2-digit', minute: '2-digit' });
}

export function MovementsLedger() {
  const { data: movements, loading } = useAllStockMovements();
  const { data: items } = useInventoryItems();
  const { data: stores } = useStores();

  const [filterType, setFilterType] = useState<MovementType | ''>('');
  const [filterStore, setFilterStore] = useState('');

  const filtered = movements.filter((mv) => {
    if (filterType && mv.type !== filterType) return false;
    if (filterStore) {
      const inStore = mv.storeId === filterStore || mv.fromStoreId === filterStore || mv.toStoreId === filterStore;
      if (!inStore) return false;
    }
    return true;
  });

  const itemName = (id: string) => items.find((it) => it.id === id)?.name ?? id.slice(0, 8);
  const storeName = (id: string | undefined) => id ? (stores.find((s) => s.id === id)?.name ?? id.slice(0, 8)) : '—';

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Movements Ledger</h1>
          <p className="text-xs text-text-muted">{loading ? 'Loading…' : `${filtered.length} movements`}</p>
        </div>
        <div className="flex gap-2">
          <select
            className="text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as MovementType | '')}
          >
            <option value="">All types</option>
            {(Object.keys(TYPE_LABELS) as MovementType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <select
            className="text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary"
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
          >
            <option value="">All stores</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <Card>
        {loading ? (
          <LoadingSpinner text="Loading…" />
        ) : filtered.length === 0 ? (
          <p className="text-xs text-text-muted py-4 text-center">No movements yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((mv) => (
              <div key={mv.id} className="flex items-center gap-3 px-3 py-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_COLOURS[mv.type]}`}>
                  {TYPE_LABELS[mv.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <Link to={`/wli/warehouse/items/${mv.itemId}`}
                    className="text-xs font-medium text-text-primary hover:underline">
                    {itemName(mv.itemId)}
                  </Link>
                  <p className="text-[10px] text-text-muted truncate">
                    {mv.type === 'transfer_out' || mv.type === 'transfer_in'
                      ? `${storeName(mv.fromStoreId)} → ${storeName(mv.toStoreId)}`
                      : storeName(mv.storeId)}
                    {mv.notes ? ` · ${mv.notes}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-text-primary">{mv.qty}</p>
                  {mv.totalCost != null && (
                    <p className="text-[10px] text-text-muted">MVR {mv.totalCost.toFixed(2)}</p>
                  )}
                </div>
                <span className="text-[10px] text-text-muted w-24 text-right shrink-0">{fmtDate(mv.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
