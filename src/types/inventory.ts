export type MovementType = 'receipt' | 'transfer_out' | 'transfer_in' | 'consumption' | 'adjustment';
export type MovementSourceType = 'po' | 'transfer' | 'ticket' | 'manual';
export type TransferStatus = 'requested' | 'in_transit' | 'received' | 'cancelled';
export type StoreType = 'main' | 'yard' | 'site' | 'transit';

/** Named stock-holding place attached to a site. Stock lives here, not on a site. */
export interface Store {
  id: string;
  code: string;             // STR-###
  name: string;
  siteId: string;
  siteName: string;         // denormalized for display
  type: StoreType;
  managerStaffId?: string;
  active: boolean;
  orgId: string;
  sbuId: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Permanent catalog entry — holds NO quantity. */
export interface InventoryItem {
  id: string;
  code: string;             // ITM-YYYYMM-###
  name: string;
  category: 'parts' | 'consumables' | 'tools' | 'other';
  uom: string;
  description?: string;
  avgCost: number;          // MVR, weighted moving average
  supplierIds: string[];
  createdFromPoId?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Quantity per item × store. Doc id = `${itemId}_${storeId}` for idempotent upsert. */
export interface StockBalance {
  id: string;
  itemId: string;
  storeId: string;
  qtyOnHand: number;
  uom: string;
  updatedAt: Date;
}

/** Append-only ledger entry. Never edited or deleted. qty is always positive. */
export interface StockMovement {
  id: string;
  itemId: string;
  type: MovementType;
  qty: number;              // absolute, always positive
  storeId?: string;         // for receipt / consumption / adjustment
  fromStoreId?: string;     // for transfers
  toStoreId?: string;       // for transfers
  unitCost?: number;
  totalCost?: number;
  sourceType: MovementSourceType;
  sourceId?: string;
  actorId: string;
  notes?: string;
  createdAt: Date;
}

export interface StockTransferLine {
  itemId: string;
  itemName: string;         // denormalized
  qty: number;
  uom: string;
}

/** Logistics entity: store → store movement with lifecycle. */
export interface StockTransfer {
  id: string;
  displayId: string;        // TRF-YYYYMM-###
  fromStoreId: string;
  fromStoreName: string;    // denormalized
  toStoreId: string;
  toStoreName: string;      // denormalized
  lineItems: StockTransferLine[];
  status: TransferStatus;
  raisedById: string;
  dispatchedById?: string;
  dispatchedAt?: Date;
  receivedById?: string;
  receivedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Input for the pick-or-create mapping during PO collection (Phase B). */
export interface PoReceiptLine {
  poLineIndex: number;
  itemId: string;           // existing item or newly created
  itemName: string;
  qty: number;
  uom: string;
  unitCost: number;
  supplierId: string;
}
