/**
 * Inventory & Warehouse service — implements the data model from INVENTORY_SCM_PLAN.md.
 *
 * Design principles:
 * - Items are permanent catalog entries (no quantity).
 * - Quantity lives in StockBalance, keyed ${itemId}_${storeId}.
 * - Every stock change posts an append-only StockMovement (never edited/deleted).
 * - Costing is weighted moving average, recomputed on each receipt.
 * - Stores are the foundation — stock can't exist without a store.
 */
import {
  runTransaction, doc, collection,
  serverTimestamp as fsTimestamp,
} from 'firebase/firestore';
import { getDbInstance } from '../firebase/client';
import { createAuto, updateFields, getById, listWhere } from '../firebase/db';
import type {
  Store, InventoryItem, StockBalance, StockTransfer,
  StockTransferLine, MovementType, MovementSourceType, PoReceiptLine,
} from '../../types/inventory';

function getDb() {
  const inst = getDbInstance();
  if (!inst) throw new Error('[inventory] Firebase not configured');
  return inst;
}

// ─── Sequence generator ───────────────────────────────────────────────────────
// Uses a _sequences/{key} counter doc so codes are short and sequential.

async function nextSeq(key: string): Promise<number> {
  const db = getDb();
  const ref = doc(db, '_sequences', key);
  let n = 0;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as { n?: number } | undefined;
    n = ((data?.n ?? 0) + 1);
    tx.set(ref, { n });
  });
  return n;
}

function ym(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function nextStoreCode(): Promise<string> {
  const n = await nextSeq('stores');
  return `STR-${String(n).padStart(3, '0')}`;
}

async function nextItemCode(): Promise<string> {
  const n = await nextSeq('items');
  return `ITM-${ym()}-${String(n).padStart(3, '0')}`;
}

async function nextTransferCode(): Promise<string> {
  const n = await nextSeq('transfers');
  return `TRF-${ym()}-${String(n).padStart(3, '0')}`;
}

// ─── Stores ───────────────────────────────────────────────────────────────────

export interface CreateStoreInput {
  name: string;
  siteId: string;
  siteName: string;
  type: Store['type'];
  managerStaffId?: string;
  orgId?: string;
  sbuId?: string;
}

export async function createStore(input: CreateStoreInput): Promise<string> {
  const code = await nextStoreCode();
  let orgId = input.orgId;
  let sbuId = input.sbuId;

  if (!orgId || !sbuId) {
    try {
      const site = await getById<any>('sites', input.siteId);
      if (site) {
        orgId = orgId || site.orgId;
        sbuId = sbuId || site.sbuId;
      }
    } catch (e) {
      console.error('Failed to resolve site orgId/sbuId', e);
    }
  }

  // Fallbacks if not resolved
  orgId = orgId || 'antrac-holding';
  sbuId = sbuId || 'sbu-wli';

  return createAuto('stores', {
    code,
    ...input,
    orgId,
    sbuId,
    active: true,
  } as Record<string, unknown>);
}

export async function updateStore(
  id: string,
  data: Partial<Pick<Store, 'name' | 'type' | 'managerStaffId' | 'active'>>,
): Promise<void> {
  return updateFields('stores', id, data as Record<string, unknown>);
}

// ─── Inventory items ──────────────────────────────────────────────────────────

export interface CreateItemInput {
  name: string;
  category: InventoryItem['category'];
  uom: string;
  description?: string;
  supplierIds?: string[];
  createdFromPoId?: string;
}

export async function createItem(input: CreateItemInput): Promise<string> {
  const code = await nextItemCode();
  return createAuto('inventoryItems', {
    code, ...input,
    avgCost: 0,
    supplierIds: input.supplierIds ?? [],
    active: true,
  } as Record<string, unknown>);
}

export async function updateItem(
  id: string,
  data: Partial<Pick<InventoryItem, 'name' | 'category' | 'uom' | 'description' | 'active'>>,
): Promise<void> {
  return updateFields('inventoryItems', id, data as Record<string, unknown>);
}

// ─── Balance helpers ──────────────────────────────────────────────────────────

/** Read the current qtyOnHand for an item × store pair. Returns 0 if no doc exists. */
export async function getBalanceQty(itemId: string, storeId: string): Promise<number> {
  const bal = await getById<StockBalance>('stockBalances', `${itemId}_${storeId}`);
  return bal?.qtyOnHand ?? 0;
}

/**
 * Atomically post a StockMovement and upsert the StockBalance.
 * qty is always positive; direction is encoded in MovementType.
 * Returns the new qtyOnHand.
 */
async function postMovementTx(
  itemId: string,
  type: MovementType,
  sourceType: MovementSourceType,
  qty: number,
  uom: string,
  storeId: string,
  actorId: string,
  opts?: {
    fromStoreId?: string;
    toStoreId?: string;
    unitCost?: number;
    sourceId?: string;
    notes?: string;
  },
): Promise<number> {
  const db = getDb();
  const balanceId = `${itemId}_${storeId}`;
  const balRef = doc(db, 'stockBalances', balanceId);
  const movRef = doc(collection(db, 'stockMovements'));

  let newQty = 0;
  await runTransaction(db, async (tx) => {
    const balSnap = await tx.get(balRef);
    const balData = balSnap.data() as { qtyOnHand?: number } | undefined;
    const current = balData?.qtyOnHand ?? 0;
    const delta = type === 'transfer_out' || type === 'consumption' ? -qty : qty;
    newQty = Math.max(0, current + delta);

    tx.set(balRef, {
      itemId, storeId, qtyOnHand: newQty, uom,
      updatedAt: fsTimestamp(),
    }, { merge: true });

    tx.set(movRef, {
      itemId, type, qty, storeId,
      fromStoreId: opts?.fromStoreId ?? null,
      toStoreId: opts?.toStoreId ?? null,
      unitCost: opts?.unitCost ?? null,
      totalCost: opts?.unitCost != null ? qty * opts.unitCost : null,
      sourceType,
      sourceId: opts?.sourceId ?? null,
      actorId,
      notes: opts?.notes ?? null,
      createdAt: fsTimestamp(),
    });
  });
  return newQty;
}

/** Recompute weighted average cost on an InventoryItem (called after receipt, non-atomic). */
async function recomputeAvgCost(
  itemId: string,
  prevQty: number,
  rcvQty: number,
  unitPrice: number,
): Promise<void> {
  if (rcvQty <= 0) return;
  const item = await getById<InventoryItem>('inventoryItems', itemId);
  if (!item) return;
  const oldAvg = item.avgCost ?? 0;
  const newAvg = prevQty + rcvQty === 0
    ? unitPrice
    : (prevQty * oldAvg + rcvQty * unitPrice) / (prevQty + rcvQty);
  await updateFields('inventoryItems', itemId, { avgCost: newAvg });
}

// ─── Receipt (procurement → inventory) ───────────────────────────────────────

/**
 * Process PO receipt lines into inventory.
 * For each material line: post 'receipt' movement + upsert StockBalance + recompute avgCost.
 * Also links the supplier to the item (appends to supplierIds if not present).
 */
export async function receiveIntoInventory(
  lines: PoReceiptLine[],
  receivedStoreId: string,
  actorId: string,
  poId: string,
): Promise<void> {
  for (const line of lines) {
    const prevQty = await getBalanceQty(line.itemId, receivedStoreId);
    await postMovementTx(line.itemId, 'receipt', 'po', line.qty, line.uom, receivedStoreId, actorId, {
      unitCost: line.unitCost, sourceId: poId,
    });
    await recomputeAvgCost(line.itemId, prevQty, line.qty, line.unitCost);
    // Link supplier to item
    const item = await getById<InventoryItem>('inventoryItems', line.itemId);
    if (item && !item.supplierIds.includes(line.supplierId)) {
      await updateFields('inventoryItems', line.itemId, {
        supplierIds: [...item.supplierIds, line.supplierId],
      });
    }
  }
}

// ─── Consumption ──────────────────────────────────────────────────────────────

export interface ConsumeInput {
  itemId: string;
  storeId: string;
  qty: number;
  uom: string;
  actorId: string;
  sourceType?: MovementSourceType;
  sourceId?: string;
  notes?: string;
}

/** Decrement stock at a store (ticket resolved / manual issue). */
export async function consumeStock(input: ConsumeInput): Promise<number> {
  return postMovementTx(
    input.itemId, 'consumption',
    input.sourceType ?? 'manual',
    input.qty, input.uom, input.storeId, input.actorId,
    { sourceId: input.sourceId, notes: input.notes },
  );
}

// ─── Transfers ────────────────────────────────────────────────────────────────

export interface CreateTransferInput {
  fromStoreId: string;
  fromStoreName: string;
  toStoreId: string;
  toStoreName: string;
  lineItems: StockTransferLine[];
  raisedById: string;
  notes?: string;
}

export async function createTransfer(input: CreateTransferInput): Promise<string> {
  const displayId = await nextTransferCode();
  return createAuto('stockTransfers', {
    displayId,
    fromStoreId: input.fromStoreId,
    fromStoreName: input.fromStoreName,
    toStoreId: input.toStoreId,
    toStoreName: input.toStoreName,
    lineItems: input.lineItems,
    status: 'requested',
    raisedById: input.raisedById,
    notes: input.notes ?? null,
  } as Record<string, unknown>);
}

/** Dispatch a transfer (requested → in_transit). */
export async function dispatchTransfer(transferId: string, actorId: string): Promise<void> {
  await updateFields('stockTransfers', transferId, {
    status: 'in_transit',
    dispatchedById: actorId,
    dispatchedAt: new Date(),
  });
}

/**
 * Receive a transfer (in_transit → received).
 * Posts transfer_out from source + transfer_in to destination, updates both balances.
 */
export async function receiveTransfer(
  transfer: StockTransfer,
  actorId: string,
): Promise<void> {
  for (const line of transfer.lineItems) {
    // Decrement source store
    await postMovementTx(
      line.itemId, 'transfer_out', 'transfer',
      line.qty, line.uom, transfer.fromStoreId, actorId,
      { fromStoreId: transfer.fromStoreId, toStoreId: transfer.toStoreId, sourceId: transfer.id },
    );
    // Increment destination store
    await postMovementTx(
      line.itemId, 'transfer_in', 'transfer',
      line.qty, line.uom, transfer.toStoreId, actorId,
      { fromStoreId: transfer.fromStoreId, toStoreId: transfer.toStoreId, sourceId: transfer.id },
    );
  }
  await updateFields('stockTransfers', transfer.id, {
    status: 'received',
    receivedById: actorId,
    receivedAt: new Date(),
  });
}

/** Cancel a transfer (must still be 'requested'). */
export async function cancelTransfer(transferId: string): Promise<void> {
  await updateFields('stockTransfers', transferId, { status: 'cancelled' });
}

// ─── Trigger delivery (PO close → transfer HQ → requestee site store) ────────

/**
 * Called from the TRIGGER_DELIVERY side effect (PO closed).
 * Creates a StockTransfer from the receiving store (set at collection time) to the
 * requestee site's store. Destination = first active store at the requestee site.
 */
export async function triggerDeliveryTransfer(
  poId: string,
  receivedStoreId: string,
  receivedStoreName: string,
  requesteeSiteId: string,
  lineItems: PoReceiptLine[],
  actorId: string,
): Promise<string | null> {
  const siteStores = await listWhere<Store>('stores', 'siteId', '==', requesteeSiteId);
  const destStore = siteStores.find((s) => s.active && s.id !== receivedStoreId);
  if (!destStore || lineItems.length === 0) return null;

  const transferLines: StockTransferLine[] = lineItems.map((l) => ({
    itemId: l.itemId,
    itemName: l.itemName,
    qty: l.qty,
    uom: l.uom,
  }));

  return createTransfer({
    fromStoreId: receivedStoreId,
    fromStoreName: receivedStoreName,
    toStoreId: destStore.id,
    toStoreName: destStore.name,
    lineItems: transferLines,
    raisedById: actorId,
    notes: `Auto-created from PO ${poId} close`,
  });
}
