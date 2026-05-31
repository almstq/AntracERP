import type { WorkflowDefinition } from '../types';
import type { WorkOrderStatus } from '../../../types/crm';

/**
 * Work Order workflow (CRM — Module C).
 * Auto-created when enquiry reaches quote_accepted.
 * Tracks job execution through to revenue collection.
 */
export const workOrderWorkflow: WorkflowDefinition<WorkOrderStatus> = {
  id: 'work_order',
  collection: 'workOrders',
  label: 'Work Order',
  initialState: 'active',
  states: [
    'active',
    'in_progress',
    'completed',
    'invoiced',
    'partially_paid',
    'fully_paid',
    'closed',
  ],
  terminalStates: ['closed'],
  statusLabels: {
    active: 'Active',
    in_progress: 'In Progress',
    completed: 'Completed',
    invoiced: 'Invoiced',
    partially_paid: 'Partially Paid',
    fully_paid: 'Fully Paid',
    closed: 'Closed',
  },
  transitions: [
    // Assets deployed to site → mark in_progress
    {
      from: 'active', to: 'in_progress', action: 'commence',
      label: 'Commence Work',
      allowedRoles: ['ops_staff', 'supervisor', 'gm', 'super_admin'],
      sideEffects: ['DEPLOY_ASSETS'],
      notify: ['gm', 'finance_wli'],
    },
    // Ops confirms work done → ready for invoicing
    {
      from: 'in_progress', to: 'completed', action: 'complete',
      label: 'Mark Completed',
      allowedRoles: ['ops_staff', 'supervisor', 'gm', 'super_admin'],
      requiresFields: ['completedAt'],
      notify: ['gm', 'finance_wli'],
    },
    // Finance raises invoice
    {
      from: 'completed', to: 'invoiced', action: 'raise_invoice',
      label: 'Raise Invoice',
      allowedRoles: ['finance_wli', 'gm', 'super_admin'],
      requiresFields: ['invoiceId'],
      notify: ['gm', 'antrac_finance'],
    },
    // Partial payment received
    {
      from: 'invoiced', to: 'partially_paid', action: 'record_partial_payment',
      label: 'Record Partial Payment',
      allowedRoles: ['finance_wli', 'gm', 'super_admin'],
      sideEffects: ['UPDATE_CUSTOMER_ROLLUPS'],
      notify: ['gm'],
    },
    // From partial: more partial
    {
      from: 'partially_paid', to: 'partially_paid', action: 'record_another_payment',
      label: 'Record Payment',
      allowedRoles: ['finance_wli', 'gm', 'super_admin'],
      sideEffects: ['UPDATE_CUSTOMER_ROLLUPS'],
      notify: ['gm'],
    },
    // Full payment (from invoiced or partially_paid)
    {
      from: 'invoiced', to: 'fully_paid', action: 'record_full_payment',
      label: 'Record Full Payment',
      allowedRoles: ['finance_wli', 'gm', 'super_admin'],
      sideEffects: ['UPDATE_CUSTOMER_ROLLUPS'],
      notify: ['gm', 'antrac_finance'],
    },
    {
      from: 'partially_paid', to: 'fully_paid', action: 'record_final_payment',
      label: 'Record Final Payment',
      allowedRoles: ['finance_wli', 'gm', 'super_admin'],
      sideEffects: ['UPDATE_CUSTOMER_ROLLUPS'],
      notify: ['gm', 'antrac_finance'],
    },
    // Close — releases assets, updates customer rollups
    {
      from: 'fully_paid', to: 'closed', action: 'close',
      label: 'Close Work Order',
      allowedRoles: ['gm', 'super_admin'],
      sideEffects: ['RELEASE_ASSETS', 'UPDATE_CUSTOMER_ROLLUPS'],
      notify: ['ops_staff', 'finance_wli'],
    },
  ],
};
