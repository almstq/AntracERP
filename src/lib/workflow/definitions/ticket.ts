import type { WorkflowDefinition } from '../types';
import type { TicketStatus } from '../../../types/workflow-entities';

/**
 * WLI Issue Ticket workflow (Stages 1–4, 13–14 of the issue-to-closure spec).
 * The ticket is the spine: it stays open through procurement/payment and only
 * closes at Stage 14 when the requestee confirms the fix.
 *
 * Procurement runs on the linked PurchaseRequest/PurchaseOrder machines while
 * the ticket sits in `gm_approved`. Side effects bridge the entities.
 */
export const ticketWorkflow: WorkflowDefinition<TicketStatus> = {
  id: 'ticket',
  collection: 'tickets',
  label: 'Issue Ticket',
  initialState: 'draft',
  states: [
    'draft', 'submitted', 'diagnosed', 'supervisor_checked', 'gm_approved',
    'items_delivered', 'resolved', 'persists', 'closed', 'rejected',
  ],
  terminalStates: ['closed'],
  statusLabels: {
    draft: 'Draft',
    submitted: 'Submitted',
    diagnosed: 'Diagnosed',
    supervisor_checked: 'Supervisor Checked',
    gm_approved: 'GM Approved',
    items_delivered: 'Items Delivered',
    resolved: 'Resolved',
    persists: 'Issue Persists',
    closed: 'Closed',
    rejected: 'Rejected',
  },
  transitions: [
    // Stage 1 — operator raises
    {
      from: 'draft', to: 'submitted', action: 'submit',
      label: 'Submit Issue', allowedRoles: ['operator', 'super_admin'],
      notify: ['mechanic'],
    },
    // Stage 2 — mechanic diagnoses; PR auto-spawns on_hold if materials/services needed
    {
      from: 'submitted', to: 'diagnosed', action: 'submit_diagnosis',
      label: 'Submit Diagnosis', allowedRoles: ['mechanic', 'super_admin'],
      requiresNotes: true,
      sideEffects: ['CREATE_PR_ON_HOLD'],
      notify: ['supervisor'],
    },
    // Stage 3 — supervisor checks
    {
      from: 'diagnosed', to: 'supervisor_checked', action: 'supervisor_signoff',
      label: 'Verify & Sign Off', allowedRoles: ['supervisor', 'super_admin'],
      notify: ['gm'],
    },
    {
      from: 'diagnosed', to: 'submitted', action: 'return_to_mechanic_sup',
      label: 'Return to Mechanic', allowedRoles: ['supervisor', 'super_admin'],
      requiresNotes: true, isReject: true, notify: ['mechanic'],
    },
    // Stage 4 — GM approval; approving the ticket activates the PR (no 2nd approval)
    {
      from: 'supervisor_checked', to: 'gm_approved', action: 'gm_approve',
      label: 'Approve', allowedRoles: ['gm', 'super_admin'],
      sideEffects: ['ACTIVATE_PR'],
      notify: ['proc_staff'],
    },
    {
      from: 'supervisor_checked', to: 'rejected', action: 'gm_reject',
      label: 'Reject', allowedRoles: ['gm', 'super_admin'],
      requiresNotes: true, isReject: true, notify: ['operator', 'mechanic'],
    },
    {
      from: 'supervisor_checked', to: 'diagnosed', action: 'gm_request_info',
      label: 'Request Info', allowedRoles: ['gm', 'super_admin'],
      requiresNotes: true, isReject: true, notify: ['mechanic'],
    },
    // Stage 13 — requestee confirms receipt of delivered items
    {
      from: 'gm_approved', to: 'items_delivered', action: 'confirm_receipt',
      label: 'Confirm Items Received', allowedRoles: ['operator', 'mechanic', 'super_admin'],
      notify: ['gm', 'inventory_staff'],
    },
    // Stage 14 — resolution
    {
      from: 'items_delivered', to: 'resolved', action: 'mark_resolved',
      label: 'Mark Resolved', allowedRoles: ['operator', 'mechanic', 'super_admin'],
      requiresNotes: true,
    },
    {
      from: 'items_delivered', to: 'persists', action: 'mark_persists',
      label: 'Issue Persists', allowedRoles: ['operator', 'mechanic', 'super_admin'],
      requiresNotes: true, isReject: true,
      sideEffects: ['SPAWN_CHILD_TICKET'],
    },
    {
      from: 'resolved', to: 'closed', action: 'close',
      label: 'Close Ticket', allowedRoles: ['gm', 'operator', 'mechanic', 'super_admin'],
      sideEffects: ['CLOSE_LINKED_PR_PO'],
      notify: ['gm'],
    },
    {
      from: 'persists', to: 'closed', action: 'close_persisted',
      label: 'Close (Child Raised)', allowedRoles: ['gm', 'super_admin'],
      sideEffects: ['CLOSE_LINKED_PR_PO'],
      notify: ['gm'],
    },
    // Reopen
    {
      from: 'rejected', to: 'submitted', action: 'reopen',
      label: 'Reopen', allowedRoles: ['gm', 'super_admin'],
      requiresNotes: true, notify: ['mechanic'],
    },
  ],
};
