/**
 * Side-effect handlers — run AFTER a transition commits. They create or advance
 * linked entities (PR/PO/child tickets) and mutate balances. Each receives a
 * context including `execute` so a handler can drive a linked workflow as the
 * 'system' actor (e.g. ACTIVATE_PR moves a PR on_hold→approved).
 *
 * PDF (RFQ/PO) and Gemini (price comparison) are intentionally stubbed.
 */
import { getById, listAll, createAuto, updateFields, listWhere } from '../firebase/db';
import type { ExecuteFn, SideEffectTag, WorkflowActor } from './types';
import type {
  Ticket, PurchaseRequest, PRLineItem, PurchaseOrder, POLineItem,
  FuelRequest, InventoryBalance,
} from '../../types/workflow-entities';
import type { Enquiry, Quotation, WorkOrder, Invoice, Payment } from '../../types/crm';
import type { PoReceiptLine } from '../../types/inventory';
import { receiveIntoInventory, triggerDeliveryTransfer } from '../services/inventory';
import { getNextId } from '../utils/id';

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

  // PO items_collected → post receipt movements + upsert stock balances.
  // Reads po.inventoryReceipt (set by CollectItemsPanel before calling executeTransition).
  RECEIVE_INTO_INVENTORY: async ({ entityId, actor }) => {
    const po = await getById<PurchaseOrder & {
      inventoryReceipt?: { receivedStoreId: string; lines: PoReceiptLine[] };
    }>('purchaseOrders', entityId);
    if (!po?.inventoryReceipt) {
      console.warn(`[side-effect] RECEIVE_INTO_INVENTORY: no inventoryReceipt on PO ${entityId} — skipped.`);
      return;
    }
    const { receivedStoreId, lines } = po.inventoryReceipt;
    await receiveIntoInventory(lines, receivedStoreId, actor.id, entityId);
  },

  // PO closed → create a StockTransfer from the receiving store to the requestee site's store.
  // Also advances the parent ticket gm_approved → awaiting_delivery so "Confirm Items Received"
  // only unlocks after procurement actually completes.
  TRIGGER_DELIVERY: async ({ entityId, actor, execute }) => {
    const po = await getById<PurchaseOrder & {
      inventoryReceipt?: { receivedStoreId: string; receivedStoreName: string; lines: PoReceiptLine[] };
    }>('purchaseOrders', entityId);
    if (!po?.inventoryReceipt?.lines?.length) {
      console.info(`[side-effect] TRIGGER_DELIVERY: PO ${entityId} has no inventory receipt — skipping transfer.`);
      return;
    }
    const { receivedStoreId, receivedStoreName, lines } = po.inventoryReceipt;
    const ticket = po.ticketId ? await getById<Ticket>('tickets', po.ticketId) : null;
    const requesteeSiteId = ticket?.siteId ?? po.deliveryAddress;
    if (!requesteeSiteId || requesteeSiteId === 'unknown') {
      console.warn(`[side-effect] TRIGGER_DELIVERY: no requestee site for PO ${entityId}`);
      return;
    }
    const transferId = await triggerDeliveryTransfer(
      entityId, receivedStoreId, receivedStoreName, requesteeSiteId, lines, actor.id,
    );
    if (transferId) {
      console.info(`[side-effect] TRIGGER_DELIVERY: transfer ${transferId} created for PO ${entityId}`);
    }
    // Advance parent ticket to awaiting_delivery so the supervisor/operator can
    // confirm receipt — only valid if ticket is still in gm_approved.
    if (ticket?.id && ticket.status === 'gm_approved') {
      await execute({
        workflowId: 'ticket', entityId: ticket.id, to: 'awaiting_delivery',
        actor: systemActor(actor),
      }).catch((e) => console.warn('[side-effect] TRIGGER_DELIVERY: could not advance ticket:', e));
    }
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

  // ── CRM side-effects (Phase E) ─────────────────────────────────────────────

  // GM approves enquiry → soft-reserve proposed assets so they aren't double-booked.
  SOFT_RESERVE_ASSETS: async ({ entityId }) => {
    const enquiry = await getById<Enquiry>('enquiries', entityId);
    if (!enquiry) return;
    const assetIds = enquiry.assetRequests.flatMap(r => r.proposedAssetIds ?? []);
    for (const assetId of assetIds) {
      await updateFields('assets', assetId, { commercialStatus: 'soft_reserved' });
    }
  },

  // Enquiry accepted → auto-create Work Order from the linked Quotation.
  CREATE_WORK_ORDER: async ({ entityId }) => {
    const enquiry = await getById<Enquiry>('enquiries', entityId);
    if (!enquiry || enquiry.workOrderId) return; // idempotent
    const quotation = enquiry.quotationId
      ? await getById<Quotation>('quotations', enquiry.quotationId)
      : null;

    const existing = await listAll<WorkOrder>('workOrders');
    const displayId = getNextId(existing.map(w => w.displayId), 'workOrder');

    const woId = await createAuto('workOrders', {
      displayId,
      orgId: enquiry.orgId,
      sbuId: enquiry.sbuId,
      enquiryId: enquiry.id,
      quotationId: enquiry.quotationId ?? null,
      customerId: enquiry.customerId,
      customerName: enquiry.customerName,
      status: 'active',
      contractValue: quotation?.total ?? 0,
      advancePaid: 0,
      retentionHeld: 0,
      currency: quotation?.currency ?? 'MVR',
      assets: [],
      startDate: enquiry.mobilisationDate ?? new Date(),
      endDate: enquiry.demobilisationDate ?? null,
      invoiceIds: [],
      raisedById: 'system',
    } as Record<string, unknown>);

    await updateFields('enquiries', enquiry.id, { workOrderId: woId });
  },

  // WO commences → hard-deploy all WO assets (commercialStatus → deployed).
  DEPLOY_ASSETS: async ({ entityId }) => {
    const wo = await getById<WorkOrder>('workOrders', entityId);
    if (!wo) return;
    for (const a of wo.assets ?? []) {
      await updateFields('assets', a.assetId, { commercialStatus: 'deployed' });
    }
  },

  // WO closed → release all assets back to available.
  RELEASE_ASSETS: async ({ entityId }) => {
    const wo = await getById<WorkOrder>('workOrders', entityId);
    if (!wo) return;
    for (const a of wo.assets ?? []) {
      await updateFields('assets', a.assetId, { commercialStatus: 'available' });
    }
  },

  // Payment recorded / WO closed → recompute customer rollups from live data.
  UPDATE_CUSTOMER_ROLLUPS: async ({ entityId }) => {
    const wo = await getById<WorkOrder>('workOrders', entityId);
    if (!wo) return;

    const [invoices, payments, activeWOs] = await Promise.all([
      listWhere<Invoice>('invoices', 'customerId', '==', wo.customerId),
      listWhere<Payment>('payments', 'customerId', '==', wo.customerId),
      listWhere<WorkOrder>('workOrders', 'customerId', '==', wo.customerId),
    ]);

    const lifetimeRevenue = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
    const outstandingBalance = invoices
      .filter(inv => !['fully_paid', 'void'].includes(inv.status))
      .reduce((s, inv) => s + (inv.balance ?? 0), 0);
    const activeWorkOrders = activeWOs.filter(w => w.status !== 'closed').length;

    await updateFields('customers', wo.customerId, {
      lifetimeRevenue, outstandingBalance, activeWorkOrders,
    });
  },

  // Ticket closed → consume materials from the requestee site's store (best-effort).
  CONSUME_TICKET_MATERIALS: async ({ entityId, actor }) => {
    const ticket = await getById<Ticket & {
      consumptionLines?: Array<{ itemId: string; storeId: string; qty: number; uom: string }>;
    }>('tickets', entityId);
    if (!ticket?.consumptionLines?.length) return;
    const { consumeStock } = await import('../services/inventory');
    for (const line of ticket.consumptionLines) {
      await consumeStock({
        itemId: line.itemId, storeId: line.storeId,
        qty: line.qty, uom: line.uom,
        actorId: actor.id, sourceType: 'ticket', sourceId: entityId,
      }).catch((e) => console.warn('[side-effect] CONSUME_TICKET_MATERIALS line failed:', e));
    }
  },

  // PO po_closed → check if every PO on the parent PR is also po_closed;
  // if yes, auto-close the PR via the system actor.
  // This is the ONLY way a PR closes — proc_staff cannot close it manually.
  CHECK_AND_CLOSE_PR: async ({ entityId, actor, execute }) => {
    const po = await getById<PurchaseOrder>('purchaseOrders', entityId);
    if (!po?.purchaseRequestId) return;
    const pr = await getById<PurchaseRequest>('purchaseRequests', po.purchaseRequestId);
    if (!pr || pr.status === 'closed') return;

    // Load all sibling POs and verify every one is po_closed
    const siblingIds: string[] = pr.purchaseOrderIds ?? [];
    if (!siblingIds.length) return;
    const siblings = await Promise.all(siblingIds.map((id) => getById<PurchaseOrder>('purchaseOrders', id)));
    const allClosed = siblings.every((s) => s?.status === 'po_closed');
    if (!allClosed) return;

    await execute({
      workflowId: 'purchase_request', entityId: pr.id, to: 'closed',
      actor: systemActor(actor),
    });
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
