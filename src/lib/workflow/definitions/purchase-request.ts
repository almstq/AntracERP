import type { WorkflowDefinition } from '../types';
import type { PRStatus } from '../../../types/workflow-entities';

/**
 * Purchase Request workflow (Stages 2, 4–8 of the issue-to-closure spec).
 * Created ON_HOLD at mechanic diagnosis; activated when the GM approves the
 * ticket (ACTIVATE_PR side effect → on_hold→approved). One PO per supplier is
 * spawned at po_raised.
 */
export const purchaseRequestWorkflow: WorkflowDefinition<PRStatus> = {
  id: 'purchase_request',
  collection: 'purchaseRequests',
  label: 'Purchase Request',
  initialState: 'on_hold',
  states: [
    'on_hold', 'approved', 'pr_accepted', 'rfq_sent',
    'quotes_under_review', 'gm_quote_approved', 'po_raised', 'closed',
  ],
  terminalStates: ['closed'],
  statusLabels: {
    on_hold: 'On Hold',
    approved: 'Approved',
    pr_accepted: 'Accepted',
    rfq_sent: 'RFQ Sent',
    quotes_under_review: 'Quotes Under Review',
    gm_quote_approved: 'Supplier Approved',
    po_raised: 'PO Raised',
    closed: 'Closed',
  },
  transitions: [
    // Activated by ticket GM approval (side-effect driven → 'system')
    {
      from: 'on_hold', to: 'approved', action: 'activate',
      label: 'Activate (GM Approved)', allowedRoles: ['system', 'gm', 'super_admin'],
      notify: ['proc_staff'],
    },
    // Stage 5 — proc staff accepts
    {
      from: 'approved', to: 'pr_accepted', action: 'accept_pr',
      label: 'Accept PR', allowedRoles: ['proc_staff', 'super_admin'],
      notify: ['gm'],
    },
    // Stage 6 — assign suppliers + send RFQs (one PDF per supplier)
    {
      from: 'pr_accepted', to: 'rfq_sent', action: 'send_rfq',
      label: 'Send RFQs', allowedRoles: ['proc_staff', 'super_admin'],
      requiresFields: ['assignedSuppliers'],
      sideEffects: ['GENERATE_RFQ'],
      notify: ['gm'],
    },
    // Stage 7 — proc forwards gathered quotes to GM for review
    {
      from: 'rfq_sent', to: 'quotes_under_review', action: 'open_review',
      label: 'Forward to GM for Review', allowedRoles: ['proc_staff', 'super_admin'],
      sideEffects: ['GENERATE_PRICE_COMPARE'],
      notify: ['gm'],
    },
    // GM (or proc) can send it back to gather more quotes
    {
      from: 'quotes_under_review', to: 'rfq_sent', action: 'need_more_quotes',
      label: 'Re-open for Quotes', allowedRoles: ['gm', 'proc_staff', 'super_admin'],
      requiresNotes: true, isReject: true, notify: ['proc_staff'],
    },
    {
      from: 'quotes_under_review', to: 'gm_quote_approved', action: 'approve_supplier',
      label: 'Approve Supplier(s)', allowedRoles: ['gm', 'super_admin'],
      requiresFields: ['selectedSuppliers'],
      notify: ['proc_staff'],
    },
    // Stage 8 — generate PO(s), one per selected supplier
    {
      from: 'gm_quote_approved', to: 'po_raised', action: 'raise_po',
      label: 'Raise PO', allowedRoles: ['proc_staff', 'super_admin'],
      sideEffects: ['CREATE_PO_PER_SUPPLIER'],
      notify: ['finance_wli', 'inventory_staff', 'gm'],
    },
    // Closed once all linked POs are closed
    {
      from: 'po_raised', to: 'closed', action: 'close_pr',
      label: 'Close PR', allowedRoles: ['proc_staff', 'system', 'super_admin'],
      notify: ['gm'],
    },
  ],
};
