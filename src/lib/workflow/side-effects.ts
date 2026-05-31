/**
 * Side-effect handlers — run AFTER a transition commits. They create or advance
 * linked entities (PR/PO/child tickets) and mutate balances. Each receives a
 * context including `execute` so a handler can drive a linked workflow as the
 * 'system' actor (e.g. ACTIVATE_PR moves a PR on_hold→approved).
 *
 * PDF (RFQ/PO) and Gemini (price comparison) are intentionally stubbed.
 */
import { getById, listAll, createAuto, updateFields } from '../firebase/db';
import type { ExecuteFn, SideEffectTag, WorkflowActor } from './types';
import type {
  Ticket, PurchaseRequest, PRLineItem, PurchaseOrder, POLineItem,
  FuelRequest, InventoryBalance,
} from '../../types/workflow-entities';

export interface SideEffectContext {
  entityId: string;
  actor: WorkflowActor;
  execute: ExecuteFn;
}

const systemActor = (actor: WorkflowActor): WorkflowActor => ({
  id: 'system', role: 'system', name: actor.name ? `system (via ${actor.name})` : 'system',
});

/** Monthly display id: PREFIX-YYYYMM-NNN based on current collection volume. */
async function nextDisplayId(coll: string, prefix: string): Promise<string> {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const all = await listAll(coll);
  const seq = String(all.length + 1).padStart(3, '0');
  return `${prefix}-${ym}-${seq}`;
}

type Handler = (ctx: SideEffectContext) => Promise<void>;

const handlers: Record<SideEffectTag, Handler> = {
  // Mechanic diagnosis → spawn PR ON_HOLD if materials/services are required.
  CREATE_PR_ON_HOLD: async ({ entityId }) => {
    const ticket = await getById<Ticket>('tickets', entityId);
    if (!ticket) return;
    if (!ticket.materialRequired && !ticket.serviceRequired) return;
    if (ticket.purchaseRequestId) return; // idempotent

    const lineItems: PRLineItem[] = [
      ...(ticket.materials ?? []).map((m, i) => ({
        ref: `M${i + 1}`, description: m.description, uom: m.uom,
        quantity: m.quantity, kind: 'material' as const, assignedSupplierIds: [],
      })),
      ...(ticket.services ?? []).map((s, i) => ({
        ref: `S${i + 1}`, description: s.description, uom: 'service',
        quantity: 1, kind: 'service' as const, assignedSupplierIds: [],
      })),
    ];

    const displayId = await nextDisplayId('purchaseRequests', 'PR');
    const prId = await createAuto('purchaseRequests', {
      displayId, ticketId: ticket.id, orgId: ticket.orgId, sbuId: ticket.sbuId,
      siteId: ticket.siteId, assetId: ticket.assetId ?? null, status: 'on_hold',
      urgency: ticket.urgency, lineItems, quotes: [], purchaseOrderIds: [],
    });
    await updateFields('tickets', ticket.id, { purchaseRequestId: prId });
  },

  // Ticket GM approval → activate the linked PR (on_hold → approved).
  ACTIVATE_PR: async ({ entityId, actor, execute }) => {
    const ticket = await getById<Ticket>('tickets', entityId);
    if (!ticket?.purchaseRequestId) return;
    const pr = await getById<PurchaseRequest>('purchaseRequests', ticket.purchaseRequestId);
    if (!pr || pr.status !== 'on_hold') return;
    await execute({
      workflowId: 'purchase_request', entityId: pr.id, to: 'approved',
      actor: systemActor(actor),
    });
  },

  // RFQ generation — PDF stubbed.
  GENERATE_RFQ: async ({ entityId }) => {
    console.info(`[side-effect] GENERATE_RFQ for PR ${entityId} — PDF generation stubbed (Phase: later).`);
  },

  // Price comparison — Gemini stubbed.
  GENERATE_PRICE_COMPARE: async ({ entityId }) => {
    console.info(`[side-effect] GENERATE_PRICE_COMPARE for PR ${entityId} — Gemini stubbed (Phase: later).`);
  },

  // PR po_raised → one PO per selected supplier.
  CREATE_PO_PER_SUPPLIER: async ({ entityId }) => {
    const pr = await getById<PurchaseRequest>('purchaseRequests', entityId);
    if (!pr) return;
    if (pr.purchaseOrderIds?.length) return; // idempotent

    const bySupplier = new Map<string, PRLineItem[]>();
    for (const li of pr.lineItems) {
      const sup = li.selectedSupplierId;
      if (!sup) continue;
      if (!bySupplier.has(sup)) bySupplier.set(sup, []);
      bySupplier.get(sup)!.push(li);
    }

    const poIds: string[] = [];
    for (const [supplierId, items] of bySupplier) {
      const poLines: POLineItem[] = items.map((li) => ({
        description: li.description, uom: li.uom, quantity: li.quantity,
        unitPrice: li.selectedUnitPrice ?? 0,
      }));
      const total = poLines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
      const displayId = await nextDisplayId('purchaseOrders', 'PO');
      const poId = await createAuto('purchaseOrders', {
        displayId, purchaseRequestId: pr.id, ticketId: pr.ticketId, orgId: pr.orgId,
        sbuId: pr.sbuId, supplierId, supplierName: supplierId, deliveryAddress: pr.siteId,
        status: 'raised', lineItems: poLines, total, currency: 'MVR', documents: [],
      });
      poIds.push(poId);
    }
    await updateFields('purchaseRequests', pr.id, { purchaseOrderIds: poIds });
  },

  // PO closed → notify inventory to deliver (delivery folded; notification handled in transition).
  TRIGGER_DELIVERY: async ({ entityId }) => {
    console.info(`[side-effect] TRIGGER_DELIVERY for PO ${entityId} — inventory notified to deliver to requestee.`);
  },

  // Ticket resolved/closed → close the linked PR and its POs (best-effort).
  CLOSE_LINKED_PR_PO: async ({ entityId, actor, execute }) => {
    const ticket = await getById<Ticket>('tickets', entityId);
    if (!ticket?.purchaseRequestId) return;
    const pr = await getById<PurchaseRequest>('purchaseRequests', ticket.purchaseRequestId);
    if (!pr) return;
    for (const poId of pr.purchaseOrderIds ?? []) {
      const po = await getById<PurchaseOrder>('purchaseOrders', poId);
      if (po && po.status !== 'po_closed') {
        await updateFields('purchaseOrders', poId, { status: 'po_closed' });
      }
    }
    if (pr.status !== 'closed') {
      await execute({
        workflowId: 'purchase_request', entityId: pr.id, to: 'closed',
        actor: systemActor(actor),
      }).catch(() => updateFields('purchaseRequests', pr.id, { status: 'closed' }));
    }
  },

  // Ticket persists → spawn a child ticket linked to the parent.
  SPAWN_CHILD_TICKET: async ({ entityId }) => {
    const parent = await getById<Ticket>('tickets', entityId);
    if (!parent) return;
    const displayId = await nextDisplayId('tickets', 'TKT');
    await createAuto('tickets', {
      displayId, parentTicketId: parent.id, orgId: parent.orgId, sbuId: parent.sbuId,
      assetId: parent.assetId ?? null, siteId: parent.siteId, raisedById: parent.raisedById,
      status: 'submitted', urgency: parent.urgency,
      description: `[Recurrence of ${parent.displayId}] ${parent.description}`,
      materialRequired: false, serviceRequired: false, materials: [], services: [],
      documents: [],
    });
  },

  // CRM stubs — handlers to be implemented in Phase E.
  SOFT_RESERVE_ASSETS: async ({ entityId }) => {
    console.info(`[side-effect] SOFT_RESERVE_ASSETS for enquiry ${entityId} — stub (Phase E).`);
  },
  CREATE_WORK_ORDER: async ({ entityId }) => {
    console.info(`[side-effect] CREATE_WORK_ORDER for enquiry ${entityId} — stub (Phase E).`);
  },
  DEPLOY_ASSETS: async ({ entityId }) => {
    console.info(`[side-effect] DEPLOY_ASSETS for work order ${entityId} — stub (Phase E).`);
  },
  RELEASE_ASSETS: async ({ entityId }) => {
    console.info(`[side-effect] RELEASE_ASSETS for work order ${entityId} — stub (Phase E).`);
  },
  UPDATE_CUSTOMER_ROLLUPS: async ({ entityId }) => {
    console.info(`[side-effect] UPDATE_CUSTOMER_ROLLUPS for work order ${entityId} — stub (Phase E).`);
  },

  // Fuel request closed → deduct WLI inventory balance.
  DEDUCT_INVENTORY_BALANCE: async ({ entityId }) => {
    const fr = await getById<FuelRequest>('fuelRequests', entityId);
    if (!fr) return;
    const balanceId = fr.requestType === 'water' ? 'water' : (fr.fuelType ?? 'diesel');
    const qty = fr.quantityCollected ?? fr.quantity;
    const bal = await getById<InventoryBalance>('inventoryBalances', balanceId);
    if (bal) {
      await updateFields('inventoryBalances', balanceId, {
        currentQty: Math.max(0, (bal.currentQty ?? 0) - qty), lastUpdated: new Date(),
      });
    } else {
      console.warn(`[side-effect] DEDUCT_INVENTORY_BALANCE: no balance doc "${balanceId}" — skipped.`);
    }
  },
};

/** Run all side effects declared on a transition, sequentially. Failures are logged, not thrown. */
export async function runSideEffects(
  tags: SideEffectTag[] | undefined,
  ctx: SideEffectContext,
): Promise<void> {
  if (!tags?.length) return;
  for (const tag of tags) {
    try {
      await handlers[tag](ctx);
    } catch (err) {
      console.error(`[side-effect] ${tag} failed for ${ctx.entityId}:`, err);
    }
  }
}
