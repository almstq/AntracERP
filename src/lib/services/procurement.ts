/**
 * Procurement service — direct (group-level) Purchase Request creation.
 * Ticket-origin PRs are still spawned by the CREATE_PR_ON_HOLD side-effect;
 * this is the standalone path for authorised non-field roles to request
 * materials/services with a mandatory justification. PRs are SBU-tagged so the
 * same surface serves any business unit; approval routes to that SBU's GM.
 */
import { listAll, createAuto } from '../firebase/db';
import { getNextId } from '../utils/id';
import type { PurchaseRequest, PRLineItem, Urgency } from '../../types/workflow-entities';
import type { WorkflowActor } from '../workflow/types';

/**
 * Procurement request pages are shared between the WLI and Holding modules.
 * This resolves the right in-module base path from the current location so
 * back-links and row navigation stay inside the module you're browsing.
 */
export function procurementBase(pathname: string): string {
  return pathname.startsWith('/holding') ? '/holding/procurement' : '/wli/procurement';
}

export interface DirectPRLineInput {
  description: string;
  kind: 'material' | 'service';
  uom: string;
  quantity: number;
}

export interface CreatePurchaseRequestInput {
  title: string;
  reason: string;            // justification — why it's needed
  sbuId: string;             // target business unit
  siteId: string;            // where it's needed / delivery location
  urgency: Urgency;
  lineItems: DirectPRLineInput[];
}

export async function createPurchaseRequest(
  input: CreatePurchaseRequestInput,
  actor: WorkflowActor,
): Promise<string> {
  const existing = await listAll<PurchaseRequest>('purchaseRequests');
  const displayId = getNextId(existing.map((p) => p.displayId), 'pr');

  // Build refs per kind (M1, M2… / S1, S2…) to match the ticket-spawned shape.
  let mat = 0;
  let svc = 0;
  const lineItems: PRLineItem[] = input.lineItems.map((li) => ({
    ref: li.kind === 'service' ? `S${++svc}` : `M${++mat}`,
    description: li.description,
    uom: li.uom,
    quantity: li.quantity,
    kind: li.kind,
    assignedSupplierIds: [],
  }));

  const id = await createAuto('purchaseRequests', {
    displayId,
    origin: 'direct',
    ticketId: null,
    title: input.title,
    reason: input.reason,
    raisedById: actor.id,
    orgId: 'antrac-holding',
    sbuId: input.sbuId,
    siteId: input.siteId,
    assetId: null,
    status: 'on_hold',
    urgency: input.urgency,
    lineItems,
    quotes: [],
    purchaseOrderIds: [],
  } as Record<string, unknown>);

  return id;
}
