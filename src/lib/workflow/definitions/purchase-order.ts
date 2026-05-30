import type { WorkflowDefinition } from '../types';
import type { POStatus } from '../../../types/workflow-entities';

/**
 * Purchase Order workflow (Stages 8–13 of the issue-to-closure spec).
 * One PO per supplier. Carries the 4-tier HQ payment approval chain:
 * WLI Finance → Antrac Finance → CFO → Director → execute → confirm → close.
 * Closing the PO triggers delivery of items to the original requestee.
 */
export const purchaseOrderWorkflow: WorkflowDefinition<POStatus> = {
  id: 'purchase_order',
  collection: 'purchaseOrders',
  label: 'Purchase Order',
  initialState: 'raised',
  states: [
    'raised', 'supplier_confirmed', 'items_collected', 'payment_request_sent',
    'antrac_finance_accepted', 'cfo_verified', 'director_approved',
    'payment_completed', 'wli_finance_confirmed', 'po_closed',
  ],
  terminalStates: ['po_closed'],
  statusLabels: {
    raised: 'Raised',
    supplier_confirmed: 'Supplier Confirmed',
    items_collected: 'Items Collected',
    payment_request_sent: 'Payment Requested',
    antrac_finance_accepted: 'Antrac Finance Accepted',
    cfo_verified: 'CFO Verified',
    director_approved: 'Director Approved',
    payment_completed: 'Payment Completed',
    wli_finance_confirmed: 'Receipt Confirmed',
    po_closed: 'Closed',
  },
  transitions: [
    // Stage 9 — supplier confirms availability
    {
      from: 'raised', to: 'supplier_confirmed', action: 'confirm_supplier',
      label: 'Supplier Confirmed', allowedRoles: ['proc_staff', 'inventory_staff', 'super_admin'],
      notify: ['inventory_staff'],
    },
    // Stage 9 — inventory collects; tax invoice + photo required
    {
      from: 'supplier_confirmed', to: 'items_collected', action: 'collect_items',
      label: 'Mark Collected', allowedRoles: ['inventory_staff', 'super_admin'],
      requiresFields: ['taxInvoice'],
      notify: ['finance_wli', 'gm'],
    },
    // Stage 10 — WLI finance packages payment request to HQ
    {
      from: 'items_collected', to: 'payment_request_sent', action: 'send_payment_request',
      label: 'Send Payment Request', allowedRoles: ['finance_wli', 'super_admin'],
      notify: ['antrac_finance'],
    },
    // Stage 11 — HQ approval chain: Antrac Finance → CFO → Director
    {
      from: 'payment_request_sent', to: 'antrac_finance_accepted', action: 'antrac_accept',
      label: 'Accept', allowedRoles: ['antrac_finance', 'super_admin'],
      notify: ['cfo'],
    },
    {
      from: 'payment_request_sent', to: 'items_collected', action: 'antrac_reject',
      label: 'Return to WLI Finance', allowedRoles: ['antrac_finance', 'super_admin'],
      requiresNotes: true, isReject: true, notify: ['finance_wli'],
    },
    {
      from: 'antrac_finance_accepted', to: 'cfo_verified', action: 'cfo_verify',
      label: 'Verify', allowedRoles: ['cfo', 'super_admin'],
      notify: ['director'],
    },
    {
      from: 'antrac_finance_accepted', to: 'payment_request_sent', action: 'cfo_reject',
      label: 'Return to Antrac Finance', allowedRoles: ['cfo', 'super_admin'],
      requiresNotes: true, isReject: true, notify: ['antrac_finance'],
    },
    {
      from: 'cfo_verified', to: 'director_approved', action: 'director_approve',
      label: 'Approve Payment', allowedRoles: ['director', 'super_admin'],
      notify: ['antrac_finance'],
    },
    {
      from: 'cfo_verified', to: 'antrac_finance_accepted', action: 'director_reject',
      label: 'Return to CFO', allowedRoles: ['director', 'super_admin'],
      requiresNotes: true, isReject: true, notify: ['cfo'],
    },
    // Stage 11 step 4 — Antrac Finance executes payment, uploads receipt
    {
      from: 'director_approved', to: 'payment_completed', action: 'complete_payment',
      label: 'Complete Payment', allowedRoles: ['antrac_finance', 'super_admin'],
      requiresFields: ['paymentReceipt'],
      notify: ['finance_wli', 'gm'],
    },
    // Stage 12 — WLI finance confirms receipt → proc staff closes PO
    {
      from: 'payment_completed', to: 'wli_finance_confirmed', action: 'confirm_receipt',
      label: 'Confirm Receipt', allowedRoles: ['finance_wli', 'super_admin'],
      notify: ['proc_staff'],
    },
    {
      from: 'wli_finance_confirmed', to: 'po_closed', action: 'close_po',
      label: 'Close PO', allowedRoles: ['proc_staff', 'super_admin'],
      sideEffects: ['TRIGGER_DELIVERY'],
      notify: ['gm', 'inventory_staff'],
    },
  ],
};
