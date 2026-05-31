import type { WorkflowDefinition } from '../types';
import type { EnquiryStatus } from '../../../types/crm';

/**
 * Enquiry workflow (CRM revenue chain — Module B).
 * Sales logs enquiry → Ops checks availability → GM approves →
 * Finance drafts quotation → GM signs off → sent to customer →
 * customer accepts → Work Order auto-spawned.
 */
export const enquiryWorkflow: WorkflowDefinition<EnquiryStatus> = {
  id: 'enquiry',
  collection: 'enquiries',
  label: 'Sales Enquiry',
  initialState: 'logged',
  states: [
    'logged',
    'availability_checked',
    'gm_approved',
    'quotation_drafted',
    'quotation_approved',
    'quotation_sent',
    'quote_accepted',
    'quote_declined',
    'follow_up',
    'closed',
  ],
  terminalStates: ['quote_accepted', 'quote_declined', 'closed'],
  statusLabels: {
    logged: 'Logged',
    availability_checked: 'Availability Checked',
    gm_approved: 'GM Approved',
    quotation_drafted: 'Quotation Drafted',
    quotation_approved: 'Quotation Approved',
    quotation_sent: 'Quotation Sent',
    quote_accepted: 'Accepted → Work Order',
    quote_declined: 'Declined',
    follow_up: 'Follow-Up',
    closed: 'Closed',
  },
  transitions: [
    // Stage 1→2: Ops checks asset availability
    {
      from: 'logged', to: 'availability_checked', action: 'check_availability',
      label: 'Check Availability',
      allowedRoles: ['ops_staff', 'supervisor', 'gm', 'super_admin'],
      requiresFields: ['availabilityNotes'],
      notify: ['gm'],
    },
    // Stage 2→3: GM approves (soft-reserves assets)
    {
      from: 'availability_checked', to: 'gm_approved', action: 'gm_approve',
      label: 'Approve & Soft-Reserve Assets',
      allowedRoles: ['gm', 'super_admin'],
      sideEffects: ['SOFT_RESERVE_ASSETS'],
      notify: ['sales_staff', 'finance_wli'],
    },
    // GM can reject (go back to logged for re-assessment)
    {
      from: 'availability_checked', to: 'logged', action: 'gm_return',
      label: 'Return for Revision',
      allowedRoles: ['gm', 'super_admin'],
      requiresNotes: true, isReject: true,
      notify: ['sales_staff', 'ops_staff'],
    },
    // Stage 3→4: Finance drafts quotation
    {
      from: 'gm_approved', to: 'quotation_drafted', action: 'draft_quotation',
      label: 'Draft Quotation',
      allowedRoles: ['finance_wli', 'sales_staff', 'gm', 'super_admin'],
      requiresFields: ['quotationId'],
      notify: ['gm'],
    },
    // Stage 4→5: GM signs off on the quotation
    {
      from: 'quotation_drafted', to: 'quotation_approved', action: 'approve_quotation',
      label: 'Sign Off Quotation',
      allowedRoles: ['gm', 'super_admin'],
      notify: ['sales_staff', 'finance_wli'],
    },
    // GM can request revisions
    {
      from: 'quotation_drafted', to: 'gm_approved', action: 'revise_quotation',
      label: 'Revise Quotation',
      allowedRoles: ['gm', 'super_admin'],
      requiresNotes: true, isReject: true,
      notify: ['finance_wli', 'sales_staff'],
    },
    // Stage 5→6: Sales sends quotation to customer
    {
      from: 'quotation_approved', to: 'quotation_sent', action: 'send_quotation',
      label: 'Send to Customer',
      allowedRoles: ['sales_staff', 'gm', 'super_admin'],
      notify: ['gm'],
    },
    // Stage 6→7: Customer accepts → spawn Work Order
    {
      from: 'quotation_sent', to: 'quote_accepted', action: 'accept',
      label: 'Customer Accepted',
      allowedRoles: ['sales_staff', 'gm', 'super_admin'],
      sideEffects: ['CREATE_WORK_ORDER'],
      notify: ['gm', 'ops_staff', 'finance_wli'],
    },
    // Stage 6→declined: Customer declines
    {
      from: 'quotation_sent', to: 'quote_declined', action: 'decline',
      label: 'Customer Declined',
      allowedRoles: ['sales_staff', 'gm', 'super_admin'],
      requiresNotes: true, isReject: true,
      notify: ['gm'],
    },
    // Stage 6→follow_up: No response yet — mark for follow-up
    {
      from: 'quotation_sent', to: 'follow_up', action: 'follow_up',
      label: 'Mark for Follow-Up',
      allowedRoles: ['sales_staff', 'gm', 'super_admin'],
      notify: ['sales_staff'],
    },
    // Follow-up → resend
    {
      from: 'follow_up', to: 'quotation_sent', action: 'resend',
      label: 'Resend Quotation',
      allowedRoles: ['sales_staff', 'gm', 'super_admin'],
      notify: ['gm'],
    },
    // Follow-up → declined
    {
      from: 'follow_up', to: 'quote_declined', action: 'decline_after_followup',
      label: 'Mark as Declined',
      allowedRoles: ['sales_staff', 'gm', 'super_admin'],
      requiresNotes: true, isReject: true,
      notify: ['gm'],
    },
    // Archive a closed / declined enquiry
    {
      from: 'quote_declined', to: 'closed', action: 'archive',
      label: 'Archive',
      allowedRoles: ['sales_staff', 'gm', 'super_admin'],
    },
  ],
};
