export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock?: number;
  lastUpdated: string;
}

export interface InventoryStore {
  id: string;
  name: string;
  locationId: string;
  type: 'MAIN' | 'SITE' | 'TRANSIT';
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  storeId: string;
  type: MovementType;
  quantity: number;
  referenceId?: string; // e.g. PO id or Ticket id
  timestamp: string;
  performedBy: string;
  notes?: string;
}
