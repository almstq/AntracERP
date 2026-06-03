import { Link } from 'react-router-dom';
import {
  Warehouse, Boxes, Truck, ArrowLeftRight, ChevronRight, Inbox, Package, ShoppingCart, type LucideIcon,
} from 'lucide-react';
import { useActionInbox } from '../../../lib/hooks/useWorkflowData';
import { useStores, useInventoryItems, useAllStockBalances, useStockTransfers } from '../../../lib/hooks/useInventory';

const TRANSFER_TINT: Record<string, string> = {
  requested: 'b-warn', in_transit: 'b-info', received: 'b-pos', cancelled: 'b-muted',
};

/** Inventory landing — stock health, transfers in flight, parts to issue. */
export function WarehouseDesk() {
  const { data: stores } = useStores();
  const { data: items } = useInventoryItems();
  const { data: balances } = useAllStockBalances();
  const { data: transfers } = useStockTransfers();
  const { items: inbox } = useActionInbox('inventory_staff');

  const activeStores = stores.filter((s) => s.active);
  const inFlight = transfers.filter((t) => t.status === 'requested' || t.status === 'in_transit');

  const metrics: { label: string; value: number; tint: string; icon: LucideIcon }[] = [
    { label: 'Awaiting Me', value: inbox.length, tint: 'tint-danger', icon: Inbox },
    { label: 'Stores', value: activeStores.length, tint: 'tint-info', icon: Warehouse },
    { label: 'SKUs', value: items.length, tint: 'tint-accent', icon: Package },
    { label: 'Transfers In Flight', value: inFlight.length, tint: 'tint-warn', icon: ArrowLeftRight },
  ];
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Warehouse Desk</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>Well Land Investment</span>
            <span>·</span>
            <span className="num">{today}</span>
          </p>
        </div>
        <div className="head-actions">
          <Link className="btn btn-ghost" to="/wli/warehouse/stock"><Boxes /> Stock</Link>
          <Link className="btn btn-ghost" to="/wli/procurement/requests/new"><ShoppingCart /> Raise PR</Link>
          <Link className="btn btn-primary" to="/wli/warehouse/transfers/new"><Truck /> New Transfer</Link>
        </div>
      </div>

      <div className="metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div className="metric" key={m.label}>
              <div className="metric-top">
                <span className="metric-label">{m.label}</span>
                <span className={`metric-ic ${m.tint}`}><Icon /></span>
              </div>
              <div className="metric-val num">{m.value}</div>
            </div>
          );
        })}
      </div>

      {/* Awaiting my action (PRs needing a stock check, deliveries to receive…) */}
      <div className="section">
        <div className="section-head"><h2>Action Required {inbox.length > 0 && <span className="hint">{inbox.length}</span>}</h2></div>
        <div className="card">
          {inbox.length === 0 ? (
            <div className="empty-note">Nothing awaiting inventory right now.</div>
          ) : (
            <div className="list">
              {inbox.map((it) => (
                <Link className="row" key={`${it.kind}-${it.id}`} to={it.to}>
                  <span className="row-ic tint-warn"><Package /></span>
                  <div className="row-main">
                    <div className="row-t">
                      <span className="row-id">{it.displayId}</span>
                      <span className="badge b-muted">{it.kind.toUpperCase()}</span>
                    </div>
                    <div className="row-sub">{it.subtitle}</div>
                  </div>
                  <div className="row-end">
                    {it.actions.slice(0, 2).map((a) => <span key={a} className="badge b-accent">{a}</span>)}
                    <ChevronRight className="row-chev" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transfers in flight */}
      <div className="section">
        <div className="section-head">
          <h2>Transfers In Flight</h2>
          <Link className="section-link" to="/wli/warehouse/transfers">All transfers <ChevronRight /></Link>
        </div>
        <div className="card">
          {inFlight.length === 0 ? (
            <div className="empty-note">No transfers in flight.</div>
          ) : (
            <div className="list">
              {inFlight.map((t) => (
                <Link className="row" key={t.id} to={`/wli/warehouse/transfers/${t.id}`}>
                  <span className="row-ic tint-info"><ArrowLeftRight /></span>
                  <div className="row-main">
                    <div className="row-t">
                      <span className="row-id">{t.displayId}</span>
                      <span className={`badge ${TRANSFER_TINT[t.status] ?? 'b-muted'}`}>{t.status.replace('_', ' ')}</span>
                    </div>
                    <div className="row-sub">{t.fromStoreName} → {t.toStoreName} · {t.lineItems?.length ?? 0} item(s)</div>
                  </div>
                  <ChevronRight className="row-chev" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stores summary */}
      <div className="section">
        <div className="section-head">
          <h2>Stores</h2>
          <Link className="section-link" to="/wli/warehouse/stores">Stores register <ChevronRight /></Link>
        </div>
        <div className="card">
          {activeStores.length === 0 ? (
            <div className="empty-note">No stores yet — add one in the Stores Register.</div>
          ) : (
            <div className="list">
              {activeStores.map((store) => {
                const skus = balances.filter((b) => b.storeId === store.id && b.qtyOnHand > 0).length;
                return (
                  <Link className="row" key={store.id} to="/wli/warehouse/stock">
                    <span className="row-ic tint-info"><Warehouse /></span>
                    <div className="row-main">
                      <div className="row-t">
                        <span className="row-id">{store.name}</span>
                        <span className="badge b-muted">{store.type}</span>
                      </div>
                      <div className="row-sub">{store.siteName} · {skus} SKU(s) in stock</div>
                    </div>
                    <ChevronRight className="row-chev" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
