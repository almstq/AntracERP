/**
 * Procurement service — direct (group-level) Purchase Request creation.
 * Ticket-origin PRs are still spawned by the CREATE_PR_ON_HOLD side-effect;
 * this is the standalone path for authorised non-field roles to request
 * materials/services with a mandatory justification. PRs are SBU-tagged so the
 * same surface serves any business unit; approval routes to that SBU's GM.
 */
import { createAuto } from '../firebase/db';
import type { PRLineItem, Urgency } from '../../types/workflow-entities';
import type { WorkflowActor } from '../workflow/types';
import { generateSerial, indexDocument } from './registryIndex';

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
  uom: string;
  quantity: number;
  kind: 'material' | 'service';
  estimatedUnitPrice?: number;
}

export interface CreatePurchaseRequestInput {
  sbuId: string;
  siteId: string;
  title: string;
  reason: string;
  urgency: Urgency;
  lineItems: DirectPRLineInput[];
  costCenter?: string;
  requestedDeliveryDate?: Date;
}

export async function createPurchaseRequest(
  input: CreatePurchaseRequestInput,
  actor: WorkflowActor,
): Promise<string> {
  // Generate monotonic serial ID
  const { serialId: displayId, sequence, fiscalPeriod } = await generateSerial('PR', input.sbuId, input.siteId);

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
    estimatedUnitPrice: li.estimatedUnitPrice ?? undefined,
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
    costCenter: input.costCenter || null,
    requestedDeliveryDate: input.requestedDeliveryDate || null,
    signatures: {
      requester: { name: actor.name || 'Requester', date: new Date().toISOString() }
    },
  } as Record<string, unknown>);

  // Index document in central registryIndex
  await indexDocument({
    id: displayId,
    prefix: 'PR',
    sequence,
    fiscalPeriod,
    sbuId: input.sbuId,
    siteId: input.siteId,
    status: 'on_hold',
    createdBy: actor.id,
    targetCollection: 'purchaseRequests',
    targetId: id,
    link: `${input.sbuId === 'sbu-wli' ? '/wli/procurement' : '/holding/procurement'}/requests/${id}`,
  });

  return id;
}
