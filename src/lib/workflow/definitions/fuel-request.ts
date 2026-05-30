import type { WorkflowDefinition } from '../types';
import type { FuelRequestStatus } from '../../../types/workflow-entities';

/**
 * WLI ↔ MPL Fuel & Water request workflow.
 * WLI requests, MPL supplies, Director signs off. MPL module is an approval
 * node only. Closing the request deducts the WLI inventory balance.
 */
export const fuelRequestWorkflow: WorkflowDefinition<FuelRequestStatus> = {
  id: 'fuel_request',
  collection: 'fuelRequests',
  label: 'Fuel / Water Request',
  initialState: 'draft',
  states: [
    'draft', 'submitted', 'inventory_checked', 'gm_approved', 'mpl_accepted',
    'director_approved', 'ready_for_collection', 'collected', 'closed', 'rejected',
  ],
  terminalStates: ['closed'],
  statusLabels: {
    draft: 'Draft',
    submitted: 'Submitted',
    inventory_checked: 'Inventory Checked',
    gm_approved: 'GM Approved',
    mpl_accepted: 'MPL Accepted',
    director_approved: 'Director Approved',
    ready_for_collection: 'Ready for Collection',
    collected: 'Collected',
    closed: 'Closed',
    rejected: 'Rejected',
  },
  transitions: [
    // Stage 1 — supervisor raises
    {
      from: 'draft', to: 'submitted', action: 'submit',
      label: 'Submit Request', allowedRoles: ['supervisor', 'super_admin'],
      notify: ['inventory_staff'],
    },
    // Stage 2 — WLI inventory checks balance
    {
      from: 'submitted', to: 'inventory_checked', action: 'inventory_accept',
      label: 'Accept (Balance OK)', allowedRoles: ['inventory_staff', 'super_admin'],
      requiresFields: ['availableQty'],
      notify: ['gm'],
    },
    {
      from: 'submitted', to: 'rejected', action: 'inventory_reject',
      label: 'Reject (Insufficient)', allowedRoles: ['inventory_staff', 'super_admin'],
      requiresNotes: true, isReject: true, notify: ['supervisor'],
    },
    // Stage 3 — GM approval
    {
      from: 'inventory_checked', to: 'gm_approved', action: 'gm_approve',
      label: 'Approve', allowedRoles: ['gm', 'super_admin'],
      notify: ['mpl_manager'],
    },
    {
      from: 'inventory_checked', to: 'rejected', action: 'gm_reject',
      label: 'Reject', allowedRoles: ['gm', 'super_admin'],
      requiresNotes: true, isReject: true, notify: ['supervisor'],
    },
    // Stage 4 — MPL manager accepts → forwards to Director
    {
      from: 'gm_approved', to: 'mpl_accepted', action: 'mpl_accept',
      label: 'Accept', allowedRoles: ['mpl_manager', 'super_admin'],
      notify: ['director'],
    },
    {
      from: 'gm_approved', to: 'rejected', action: 'mpl_reject',
      label: 'Reject', allowedRoles: ['mpl_manager', 'super_admin'],
      requiresNotes: true, isReject: true, notify: ['gm'],
    },
    // Stage 5 — Director final approval
    {
      from: 'mpl_accepted', to: 'director_approved', action: 'director_approve',
      label: 'Approve', allowedRoles: ['director', 'super_admin'],
      notify: ['mpl_manager'],
    },
    {
      from: 'mpl_accepted', to: 'rejected', action: 'director_reject',
      label: 'Reject', allowedRoles: ['director', 'super_admin'],
      requiresNotes: true, isReject: true, notify: ['mpl_manager', 'gm'],
    },
    // Stage 6 — MPL releases + sends collection notice
    {
      from: 'director_approved', to: 'ready_for_collection', action: 'send_collection_notice',
      label: 'Send Collection Notice', allowedRoles: ['mpl_manager', 'super_admin'],
      requiresFields: ['collectionPoint'],
      notify: ['supervisor'],
    },
    // Stage 7 — supervisor collects, then auto-close + deduct balance
    {
      from: 'ready_for_collection', to: 'collected', action: 'confirm_collection',
      label: 'Confirm Collection', allowedRoles: ['supervisor', 'super_admin'],
      requiresFields: ['quantityCollected'],
      notify: ['gm', 'inventory_staff'],
    },
    {
      from: 'collected', to: 'closed', action: 'close',
      label: 'Close Request', allowedRoles: ['supervisor', 'system', 'super_admin'],
      sideEffects: ['DEDUCT_INVENTORY_BALANCE'],
      notify: ['gm'],
    },
    // Rejected requests return to the supervisor, who can revise & resubmit
    {
      from: 'rejected', to: 'draft', action: 'reopen',
      label: 'Revise & Resubmit', allowedRoles: ['supervisor', 'super_admin'],
      requiresNotes: true,
    },
  ],
};
