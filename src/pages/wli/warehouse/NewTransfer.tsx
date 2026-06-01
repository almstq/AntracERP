import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useStores, useInventoryItems } from '../../../lib/hooks/useInventory';
import { createTransfer } from '../../../lib/services/inventory';
import type { StockTransferLine } from '../../../types/inventory';

const FIELD = 'text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary w-full';

export function NewTransfer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: stores } = useStores();
  const { data: items } = useInventoryItems();

  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Array<{ itemId: string; qty: number; uom: string }>>([
    { itemId: '', qty: 1, uom: '' },
  ]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const activeStores = stores.filter((s) => s.active);

  function setLine<K extends keyof (typeof lines)[0]>(i: number, k: K, v: (typeof lines)[0][K]) {
    setLines((ls) => ls.map((l, j) => j === i ? { ...l, [k]: v } : l));
  }

  function addLine() { setLines((ls) => [...ls, { itemId: '', qty: 1, uom: '' }]); }
  function removeLine(i: number) { setLines((ls) => ls.filter((_, j) => j !== i)); }

  async function submit() {
    if (!user) return;
    if (!fromStoreId) { setErr('Select source store'); return; }
    if (!toStoreId) { setErr('Select destination store'); return; }
    if (fromStoreId === toStoreId) { setErr('Source and destination must be different'); return; }
    for (const [i, l] of lines.entries()) {
      if (!l.itemId) { setErr(`Select item for line ${i + 1}`); return; }
      if (l.qty <= 0) { setErr(`Qty must be > 0 for line ${i + 1}`); return; }
    }

    setBusy(true); setErr(null);
    try {
      const fromStore = stores.find((s) => s.id === fromStoreId)!;
      const toStore = stores.find((s) => s.id === toStoreId)!;
      const lineItems: StockTransferLine[] = lines.map((l) => {
        const item = items.find((it) => it.id === l.itemId)!;
        return { itemId: l.itemId, itemName: item.name, qty: l.qty, uom: l.uom || item.uom };
      });
      const transferId = await createTransfer({
        fromStoreId, fromStoreName: fromStore.name,
        toStoreId, toStoreName: toStore.name,
        lineItems, raisedById: user.uid,
        notes: notes || undefined,
      });
      navigate(`/wli/warehouse/transfers/${transferId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <Link to="/wli/warehouse/transfers" className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary">
        <ArrowLeft size={14} /> Transfers
      </Link>
      <h1 className="text-lg font-bold text-text-primary">New Transfer</h1>

      <Card>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-text-muted mb-1 block">From Store</label>
              <select className={FIELD} value={fromStoreId} onChange={(e) => setFromStoreId(e.target.value)}>
                <option value="">— select —</option>
                {activeStores.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.siteName})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-text-muted mb-1 block">To Store</label>
              <select className={FIELD} value={toStoreId} onChange={(e) => setToStoreId(e.target.value)}>
                <option value="">— select —</option>
                {activeStores.filter((s) => s.id !== fromStoreId).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.siteName})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-text-muted mb-1 block">Notes (optional)</label>
            <input className={FIELD} placeholder="Reason, reference…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card header={<span className="text-xs font-semibold">Line Items</span>}>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                className="flex-1 text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary"
                value={line.itemId}
                onChange={(e) => {
                  const item = items.find((it) => it.id === e.target.value);
                  setLine(i, 'itemId', e.target.value);
                  if (item) setLine(i, 'uom', item.uom);
                }}
              >
                <option value="">— item —</option>
                {items.map((it) => <option key={it.id} value={it.id}>{it.code} · {it.name}</option>)}
              </select>
              <input
                type="number" min={1} step={1}
                value={line.qty}
                onChange={(e) => setLine(i, 'qty', Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary text-right"
              />
              <span className="text-[10px] text-text-muted w-10">{line.uom || (items.find((it) => it.id === line.itemId)?.uom ?? 'uom')}</span>
              {lines.length > 1 && (
                <button onClick={() => removeLine(i)} className="text-text-muted hover:text-red">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addLine} className="flex items-center gap-1 text-[10px] text-blue hover:underline">
            <Plus size={12} /> Add line
          </button>
        </div>
      </Card>

      {err && <p className="text-xs text-red">{err}</p>}

      <Button variant="primary" size="md" onClick={submit} disabled={busy} className="w-full">
        {busy ? 'Creating…' : 'Create Transfer'}
      </Button>
    </div>
  );
}
