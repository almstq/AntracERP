/**
 * Fuel & Water request service — CRUD for fuelRequests + inventoryBalances.
 */
import { listAll, listWhere, getById, createAuto } from '../firebase/db';
import { getNextId } from '../utils/id';
import { executeTransition } from '../workflow/executor';
import type { FuelRequest, InventoryBalance } from '../../types/workflow-entities';
import type { WorkflowActor } from '../workflow/types';

// ─── Fuel Requests ────────────────────────────────────────────────────────────

export async function listFuelRequests(sbuId = 'sbu-wli'): Promise<(FuelRequest & { id: string })[]> {
  return listWhere<FuelRequest>('fuelRequests', 'sbuId', '==', sbuId, 'createdAt');
}

export async function getFuelRequest(id: string): Promise<(FuelRequest & { id: string }) | null> {
  return getById<FuelRequest>('fuelRequests', id);
}

export interface CreateFuelRequestInput {
  requestType: FuelRequest['requestType'];
  fuelType?: FuelRequest['fuelType'];
  quantity: number;
  uom: FuelRequest['uom'];
  siteId: string;
  assetId?: string;
  urgency: FuelRequest['urgency'];
  notes?: string;
}

export async function createFuelRequest(
  input: CreateFuelRequestInput,
  actor: WorkflowActor,
): Promise<string> {
  const existing = await listAll<FuelRequest>('fuelRequests');
  const displayId = getNextId(existing.map(r => r.displayId), 'fuel');

  const id = await createAuto('fuelRequests', {
    displayId,
    orgId: 'antrac-holding',
    sbuId: 'sbu-wli',
    status: 'draft',
    requestType: input.requestType,
    fuelType: input.fuelType ?? null,
    quantity: input.quantity,
    uom: input.uom,
    siteId: input.siteId,
    assetId: input.assetId ?? null,
    urgency: input.urgency,
    notes: input.notes ?? null,
    raisedById: actor.id,
    documents: [],
  } as Record<string, unknown>);

  return id;
}

// ─── Inventory Balances ───────────────────────────────────────────────────────

export async function listInventoryBalances(): Promise<(InventoryBalance & { id: string })[]> {
  return listAll<InventoryBalance>('inventoryBalances');
}

export async function getInventoryBalance(id: string): Promise<(InventoryBalance & { id: string }) | null> {
  return getById<InventoryBalance>('inventoryBalances', id);
}

export { executeTransition };
