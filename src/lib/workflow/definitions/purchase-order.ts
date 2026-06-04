import type { WorkflowDefinition } from '../types';
import type { POStatus } from '../../../types/workflow-entities';

/**
 * Purchase Order workflow — PAY-FIRST model (Mustarq decision, 2026-06-01).
 * One PO per supplier. The full 4-tier HQ payment approval chain completes BEFORE
 * goods are collected, so no items are received until payment is settled:
 *   raised → supplier confirmed → payment request → Antrac Finance → CFO → Director
 *   → payment executed → WLI Finance confirms settlement → items collected (tax
 *   invoice) → PO closed (triggers delivery to the requestee).
 * Payment runs against the PO total (from the GM-awarded quote on the linked PR).
 */
export const purchaseOrderWorkflow: WorkflowDefinition<POStatus> = {
  id: 'purchase_order',
  collection: 'purchaseOrders',
  label: 'Purchase Order',
  initialState: 'raised',
  states: [
    'raised', 'supplier_confirmed', 'payment_request_sent',
    'antrac_finance_accepted', 'cfo_verified', 'director_approved',
    'payment_completed', 'wli_finance_confirmed', 'items_collected', 'po_closed',
  ],
  terminalStates: ['po_closed'],
  statusLabels: {
    raised: 'Raised',
    supplier_confirmed: 'Supplier Confirmed',
    payment_request_sent: 'Payment Requested',
    antrac_finance_accepted: 'Antrac Finance Accepted',
    cfo_verified: 'CFO Verified',
    director_approved: 'Director Approved',
    payment_completed: 'Payment Completed',
    wli_finance_confirmed: 'Payment Settled',
    items_collected: 'Items Collected',
    po_closed: 'Closed',
  },
  transitions: [
    // Proc or finance_wli confirms the supplier has acknowledged the PO.
    // By the time a PO is raised the supplier was already selected from the quote,
    // so finance_wli can pick this up directly and proceed to payment without
    // waiting for proc to act first.
    {
      from: 'raised', to: 'supplier_confirmed', action: 'confirm_supplier',
      label: 'Supplier Confirmed', allowedRoles: ['proc_staff', 'finance_wli', 'super_admin'],
      notify: ['finance_wli'],
    },
    // WLI finance packages the payment request to HQ Antrac Finance
    {
      from: 'supplier_confirmed', to: 'payment_request_sent', action: 'send_payment_request',
      label: 'Send Payment Request to HQ', allowedRoles: ['finance_wli', 'super_admin'],
      notify: ['antrac_finance'],
    },
    // HQ approval chain: Antrac Finance → CFO → Director
    {
      from: 'payment_request_sent', to: 'antrac_finance_accepted', action: 'antrac_accept',
      label: 'Accept', allowedRoles: ['antrac_finance', 'super_admin'],
      notify: ['cfo'],
    },
    {
      from: 'payment_request_sent', to: 'supplier_confirmed', action: 'antrac_reject',
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
    // Antrac Finance executes payment, uploads receipt
    {
      from: 'director_approved', to: 'payment_completed', action: 'complete_payment',
      label: 'Complete Payment', allowedRoles: ['antrac_finance', 'super_admin'],
      requiresFields: ['paymentReceipt'],
      notify: ['finance_wli', 'gm'],
    },
    // WLI finance confirms the payment is settled → releases collection to inventory
    {
      from: 'payment_completed', to: 'wli_finance_confirmed', action: 'confirm_settlement',
      label: 'Confirm Payment Settled', allowedRoles: ['finance_wli', 'super_admin'],
      notify: ['inventory_staff'],
    },
    // Inventory collects the goods AFTER payment; tax invoice + store + line mapping required
    {
      from: 'wli_finance_confirmed', to: 'items_collected', action: 'collect_items',
      label: 'Mark Collected', allowedRoles: ['inventory_staff', 'super_admin'],
      requiresFields: ['taxInvoice'],
      sideEffects: ['RECEIVE_INTO_INVENTORY'],
      notify: ['proc_staff', 'gm'],
    },
    // Proc closes the PO after items are collected → triggers delivery to site,
    // then CHECK_AND_CLOSE_PR auto-closes the parent PR if all sibling POs are done.
    {
      from: 'items_collected', to: 'po_closed', action: 'close_po',
      label: 'Close PO', allowedRoles: ['proc_staff', 'super_admin'],
      sideEffects: ['TRIGGER_DELIVERY', 'CHECK_AND_CLOSE_PR'],
      notify: ['gm', 'inventory_staff'],
    },
  ],
};
