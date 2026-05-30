import { useAuth } from './useAuth';
import { canApproveTicket, canCreatePR, canViewHolding, canManageUsers, canApproveQuote } from '../permissions/can';

export function usePermissions() {
  const { user } = useAuth();
  const role = (user?.role || 'pending') as string;

  return {
    canApproveTicket: () => canApproveTicket(role),
    canCreatePR: () => canCreatePR(role),
    canViewHolding: () => canViewHolding(role),
    canManageUsers: () => canManageUsers(role),
    canApproveQuote: () => canApproveQuote(role),
    role,
    isSuperAdmin: role === 'super_admin',
    isPending: role === 'pending',
  };
}
