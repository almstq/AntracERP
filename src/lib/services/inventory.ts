import { createAuto, updateFields, getById } from '../firebase/db';
import type { InventoryItem, MovementType } from '../../types/inventory';

export interface MovementInput {
  itemId: string;
  storeId: string;
  type: MovementType;
  quantity: number;
  referenceId?: string;
  performedBy: string;
  notes?: string;
}

/**
 * Records an inventory movement and updates the item's current stock level.
 */
export async function recordMovement(input: MovementInput): Promise<string> {
  const movementId = await createAuto('inventoryMovements', {
    ...input,
    timestamp: new Date().toISOString(),
  });

  // Update item stock level
  const item = await getById<InventoryItem>('inventoryItems', input.itemId);
  if (item) {
    let newStock = item.currentStock;
    if (input.type === 'IN') newStock += input.quantity;
    if (input.type === 'OUT') newStock -= input.quantity;
    // ADJUST and TRANSFER logic would go here
    
    await updateFields('inventoryItems', input.itemId, {
      currentStock: newStock,
      lastUpdated: new Date().toISOString(),
    });
  }

  return movementId;
}
