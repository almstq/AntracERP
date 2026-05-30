const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Ticket state machine — Phase 2A draft
 * Defines valid transitions and which roles can perform them.
 */

export type TicketStatus =
  | 'open'
  | 'mechanic_review'
  | 'supervisor_review'
  | 'gm_approved'
  | 'rejected'
  | 'closed';

export interface TicketTransition {
  from: TicketStatus;
  to: TicketStatus;
  allowedRoles: string[];
  label: string;
  requiresNotes: boolean;
  sideEffect?: string;
}

export const TRANSITIONS: TicketTransition[] = [
  { from: 'open', to: 'mechanic_review', allowedRoles: ['supervisor', 'gm', 'super_admin'], label: 'Assign to Mechanic', requiresNotes: false, sideEffect: 'NOTIFY_MECHANIC' },
  { from: 'open', to: 'rejected', allowedRoles: ['supervisor', 'gm', 'super_admin'], label: 'Reject', requiresNotes: true },
  { from: 'mechanic_review', to: 'supervisor_review', allowedRoles: ['mechanic', 'super_admin'], label: 'Submit for Supervisor Review', requiresNotes: true, sideEffect: 'NOTIFY_SUPERVISOR' },
  { from: 'mechanic_review', to: 'rejected', allowedRoles: ['mechanic', 'supervisor', 'gm', 'super_admin'], label: 'Reject', requiresNotes: true },
  { from: 'mechanic_review', to: 'open', allowedRoles: ['mechanic', 'super_admin'], label: 'Return to Open', requiresNotes: true },
  { from: 'supervisor_review', to: 'gm_approved', allowedRoles: ['supervisor', 'gm', 'super_admin'], label: 'Approve', requiresNotes: false, sideEffect: 'NOTIFY_GM' },
  { from: 'supervisor_review', to: 'rejected', allowedRoles: ['supervisor', 'gm', 'super_admin'], label: 'Reject', requiresNotes: true },
  { from: 'supervisor_review', to: 'mechanic_review', allowedRoles: ['supervisor', 'gm', 'super_admin'], label: 'Return to Mechanic', requiresNotes: true },
  { from: 'gm_approved', to: 'closed', allowedRoles: ['gm', 'super_admin'], label: 'Close', requiresNotes: false, sideEffect: 'CREATE_PR_AUTO' },
  { from: 'gm_approved', to: 'rejected', allowedRoles: ['gm', 'super_admin'], label: 'Reject', requiresNotes: true },
  { from: 'rejected', to: 'open', allowedRoles: ['gm', 'super_admin'], label: 'Reopen', requiresNotes: true },
  { from: 'closed', to: 'open', allowedRoles: ['gm', 'super_admin'], label: 'Reopen', requiresNotes: true },
];

export function getAvailableTransitions(currentStatus: TicketStatus, userRole: string): TicketTransition[] {
  return TRANSITIONS.filter(
    t => t.from === currentStatus && t.allowedRoles.includes(userRole)
  );
}

export function canTransition(currentStatus: TicketStatus, targetStatus: TicketStatus, userRole: string): boolean {
  return TRANSITIONS.some(
    t => t.from === currentStatus && t.to === targetStatus && t.allowedRoles.includes(userRole)
  );
}

// Mock transition execution — no real Firebase writes
export async function executeTransition(
  ticketId: string,
  from: TicketStatus,
  to: TicketStatus,
  role: string,
  notes: string,
): Promise<{ success: boolean; message: string }> {
  void { ticketId, from, to, role, notes };
  await delay(400);

  if (!canTransition(from, to, role)) {
    return { success: false, message: `Transition from ${from} to ${to} not allowed for role ${role}` };
  }

  const transition = TRANSITIONS.find(t => t.from === from && t.to === to);
  const sideEffectMsg = transition?.sideEffect ? ` (side effect: ${transition.sideEffect})` : '';

  return {
    success: true,
    message: `Ticket ${ticketId}: ${from} → ${to}${sideEffectMsg}`,
  };
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  mechanic_review: 'Mechanic Review',
  supervisor_review: 'Supervisor Review',
  gm_approved: 'GM Approved',
  rejected: 'Rejected',
  closed: 'Closed',
};