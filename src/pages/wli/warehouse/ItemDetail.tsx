import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, ArrowLeftRight, Minus } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { useInventoryItem, useStockBalancesForItem, useStockMovementsForItem, useStores } from '../../../lib/hooks/useInventory';
import type { MovementType } from '../../../types/inventory';

const TYPE_CONFIG: Record<MovementType, { label: string; colour: string; Icon: typeof TrendingUp }> = {
  receipt:      { label: 'Receipt',       colour: 'text-green',  Icon: TrendingUp },
  transfer_in:  { label: 'Transfer In',   colour: 'text-blue',   Icon: TrendingUp },
  transfer_out: { label: 'Transfer Out',  colour: 'text-amber',  Icon: TrendingDown },
  consumption:  { label: 'Consumed',      colour: 'text-red',    Icon: Minus },
  adjustment:   { label: 'Adjustment',    colour: 'text-purple', Icon: ArrowLeftRight },
};

function fmtDate(d: Date | undefined): string {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('en-MV', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: item, loading } = useInventoryItem(id);
  const { data: balances } = useStockBalancesForItem(id);
  const { data: movements } = useStockMovementsForItem(id);
  const { data: stores } = useStores();

  const storeName = (storeId: string | undefined) =>
    storeId ? (stores.find((s) => s.id === storeId)?.name ?? storeId) : '—';

  const totalQty = balances.reduce((s, b) => s + (b.qtyOnHand ?? 0), 0);

  if (loading) return <div className="p-6 text-xs text-text-muted">Loading…</div>;
  if (!item) return <div className="p-6 text-xs text-red">Item not found.</div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <Link to="/wli/warehouse/items" className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary">
        <ArrowLeft size={14} /> Item Catalog
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary">{item.name}</h1>
          <p className="text-xs text-text-muted">{item.code} · {item.category} · {item.uom}</p>
          {item.description && <p className="text-xs text-text-secondary mt-1">{item.description}</p>}
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-text-primary">{totalQty} <span className="text-sm text-text-muted">{item.uom}</span></p>
          <p className="text-[10px] text-text-muted">total on hand</p>
          <p className="text-xs text-text-secondary mt-1">avg cost MVR {item.avgCost?.toFixed(2) ?? '0.00'}</p>
        </div>
      </div>

      {/* Stock by store */}
      <Card header={<span className="text-xs font-semibold">Stock by Store</span>}>
        {balances.length === 0 ? (
          <p className="text-xs text-text-muted py-2">No stock anywhere yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {balances.map((bal) => (
              <div key={bal.id} className="flex justify-between py-2">
                <span className="text-xs text-text-primary">{storeName(bal.storeId)}</span>
                <span className="text-xs font-medium text-text-primary">{bal.qtyOnHand} {item.uom}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Movement history */}
      <Card header={<span className="text-xs font-semibold">Movement Ledger</span>}>
        {movements.length === 0 ? (
          <p className="text-xs text-text-muted py-2">No movements yet — stock is posted here on first receipt.</p>
        ) : (
          <div className="divide-y divide-border">
            {movements.map((mv) => {
              const cfg = TYPE_CONFIG[mv.type] ?? TYPE_CONFIG.adjustment;
              const { Icon } = cfg;
              return (
                <div key={mv.id} className="flex items-center gap-3 py-2">
                  <Icon size={14} className={cfg.colour} />
                  <div className="flex-1">
                    <p className="text-xs text-text-primary">{cfg.label}</p>
                    <p className="text-[10px] text-text-muted">
                      {mv.type === 'receipt' || mv.type === 'consumption' || mv.type === 'adjustment'
                        ? storeName(mv.storeId)
                        : `${storeName(mv.fromStoreId)} → ${storeName(mv.toStoreId)}`}
                      {mv.sourceId ? ` · ${mv.sourceType} ${mv.sourceId.slice(0, 8)}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-text-primary">{mv.qty} {item.uom}</p>
                    {mv.unitCost != null && (
                      <p className="text-[10px] text-text-muted">MVR {(mv.qty * mv.unitCost).toFixed(2)}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted w-20 text-right">{fmtDate(mv.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
