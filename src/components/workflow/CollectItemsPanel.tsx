/**
 * Phase B — PO collection UI.
 * Renders when PO status = 'wli_finance_confirmed' for inventory_staff / super_admin.
 * Captures: receiving store + per-material-line pick-or-create item mapping.
 * Saves po.inventoryReceipt then fires the collect_items transition.
 * The RECEIVE_INTO_INVENTORY side-effect reads inventoryReceipt to post ledger entries.
 */
import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../lib/hooks/useAuth';
import { useStores, useInventoryItems } from '../../lib/hooks/useInventory';
import { createItem } from '../../lib/services/inventory';
import { updateFields } from '../../lib/firebase/db';
import { executeTransition } from '../../lib/workflow/executor';
import type { PurchaseOrder, POLineItem } from '../../types/workflow-entities';
import type { PoReceiptLine } from '../../types/inventory';

interface Props {
  po: PurchaseOrder & { id: string };
  onDone: () => void;
}

interface LineMapping {
  mode: 'pick' | 'create';
  itemId: string;
  newName: string;
  newCategory: 'parts' | 'consumables' | 'tools' | 'other';
}

const FIELD = 'text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary w-full';

export function CollectItemsPanel({ po, onDone }: Props) {
  const { user, effectiveRole } = useAuth();
  const { data: stores } = useStores();
  const { data: items } = useInventoryItems();

  // Services have uom='service' (set at PR creation); all other lines are materials.
  const materialLines = (po.lineItems ?? []).filter((l) => l.uom !== 'service');

  const [receivedStoreId, setReceivedStoreId] = useState('');
  const [taxInvoice, setTaxInvoice] = useState('');
  const [mappings, setMappings] = useState<LineMapping[]>(
    materialLines.map(() => ({ mode: 'pick', itemId: '', newName: '', newCategory: 'parts' })),
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const setMap = (i: number, patch: Partial<LineMapping>) =>
    setMappings((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  async function submit() {
    if (!user) return;
    if (!receivedStoreId) { setErr('Select a receiving store'); return; }
    if (!taxInvoice.trim()) { setErr('Tax invoice reference required'); return; }
    for (let i = 0; i < materialLines.length; i++) {
      const m = mappings[i];
      if (m.mode === 'pick' && !m.itemId) { setErr(`Select or create an item for line ${i + 1}`); return; }
      if (m.mode === 'create' && !m.newName.trim()) { setErr(`Enter item name for line ${i + 1}`); return; }
    }

    setBusy(true); setErr(null);
    try {
      // Resolve itemIds — create any new items first
      const resolvedLines: PoReceiptLine[] = [];
      for (let i = 0; i < materialLines.length; i++) {
        const poLine: POLineItem = materialLines[i];
        const m = mappings[i];
        let itemId = m.itemId;
        let itemName = items.find((it) => it.id === itemId)?.name ?? itemId;
        if (m.mode === 'create') {
          itemId = await createItem({
            name: m.newName.trim(),
            category: m.newCategory,
            uom: poLine.uom,
            createdFromPoId: po.id,
            supplierIds: [po.supplierId],
          });
          itemName = m.newName.trim();
        }
        resolvedLines.push({
          poLineIndex: i,
          itemId,
          itemName,
          qty: poLine.quantity,
          uom: poLine.uom,
          unitCost: poLine.unitPrice,
          supplierId: po.supplierId,
        });
      }

      const receivedStore = stores.find((s) => s.id === receivedStoreId);

      // Save receipt mapping to PO doc (side-effect reads this)
      await updateFields('purchaseOrders', po.id, {
        inventoryReceipt: {
          receivedStoreId,
          receivedStoreName: receivedStore?.name ?? receivedStoreId,
          lines: resolvedLines,
        },
      });

      // Fire the transition
      const res = await executeTransition({
        workflowId: 'purchase_order',
        entityId: po.id,
        to: 'items_collected',
        actor: {
          id: user.uid, role: effectiveRole, name: user.displayName,
          realRole: user.role, adminOverride: user.role === 'super_admin' && effectiveRole !== 'super_admin',
        },
        fields: { taxInvoice, receivedStoreId },
      });

      if (!res.success) { setErr(res.message); return; }
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  if (!['inventory_staff', 'super_admin'].includes(effectiveRole ?? '')) return null;

  return (
    <Card header={<span className="text-sm font-medium">Mark Items Collected</span>}>
      <div className="space-y-4">
        {/* Receiving store */}
        <div>
          <label className="text-[10px] text-text-muted mb-1 block">Receiving Store</label>
          <select className={FIELD} value={receivedStoreId} onChange={(e) => setReceivedStoreId(e.target.value)}>
            <option value="">— select store —</option>
            {stores.filter((s) => s.active).map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.siteName})</option>
            ))}
          </select>
        </div>

        {/* Tax invoice reference */}
        <div>
          <label className="text-[10px] text-text-muted mb-1 block">Tax Invoice Reference</label>
          <input className={FIELD} placeholder="Invoice #" value={taxInvoice} onChange={(e) => setTaxInvoice(e.target.value)} />
        </div>

        {/* Material line mappings */}
        {materialLines.length > 0 && (
          <div className="border-t border-border pt-3 space-y-3">
            <p className="text-[10px] text-text-muted">Map each material line to a catalog item:</p>
            {materialLines.map((line, i) => (
              <div key={i} className="bg-bg-surface rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-text-primary">{line.description}</p>
                  <span className="text-[10px] text-text-muted">{line.quantity} {line.uom} · MVR {line.unitPrice}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMap(i, { mode: 'pick', itemId: '' })}
                    className={`text-[10px] px-2 py-1 rounded ${mappings[i].mode === 'pick' ? 'bg-blue/20 text-blue' : 'text-text-muted'}`}
                  >
                    Pick existing
                  </button>
                  <button
                    onClick={() => setMap(i, { mode: 'create', itemId: '' })}
                    className={`text-[10px] px-2 py-1 rounded ${mappings[i].mode === 'create' ? 'bg-blue/20 text-blue' : 'text-text-muted'}`}
                  >
                    Create new
                  </button>
                </div>
                {mappings[i].mode === 'pick' ? (
                  <select className={FIELD} value={mappings[i].itemId} onChange={(e) => setMap(i, { itemId: e.target.value })}>
                    <option value="">— select catalog item —</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>{it.code} · {it.name} ({it.uom})</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input className={FIELD} placeholder="Item name" value={mappings[i].newName}
                      onChange={(e) => setMap(i, { newName: e.target.value })} />
                    <select className="text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary"
                      value={mappings[i].newCategory}
                      onChange={(e) => setMap(i, { newCategory: e.target.value as LineMapping['newCategory'] })}>
                      <option value="parts">Parts</option>
                      <option value="consumables">Consumables</option>
                      <option value="tools">Tools</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {materialLines.length === 0 && (
          <p className="text-xs text-text-muted">No material lines on this PO — only services (direct expense). Confirm collection below.</p>
        )}

        {err && <p className="text-xs text-red">{err}</p>}

        <div className="flex gap-2">
          <Button variant="primary" size="sm" className="flex-1" onClick={submit} disabled={busy}>
            {busy ? 'Processing…' : 'Confirm Collection'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
