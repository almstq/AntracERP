import { useAuth } from '../../lib/hooks/useAuth';
import { ROLES, ROLE_LABELS } from '../../lib/permissions/roles';
import { UserCheck } from 'lucide-react';

const TEST_ROLES = [
  ROLES.OPERATOR, ROLES.MECHANIC, ROLES.SUPERVISOR, ROLES.GM, ROLES.PROC_STAFF,
  ROLES.FINANCE_WLI, ROLES.INVENTORY_STAFF, ROLES.ANTRAC_FINANCE, ROLES.CFO,
  ROLES.DIRECTOR, ROLES.MPL_MANAGER,
];

/**
 * Test-only impersonation. Visible to super_admin. Stays authenticated as the
 * real super_admin (so Firestore writes pass the rules) while the workflow UI
 * behaves as the selected actor — lets one person walk the full multi-actor flow.
 */
export function ActorSwitcher() {
  const { user, actingRole, setActingRole } = useAuth();
  if (user?.role !== 'super_admin') return null;

  return (
    <div className="px-3 py-2 border-t border-border bg-amber/5">
      <div className="flex items-center gap-1.5 mb-1">
        <UserCheck size={12} className="text-amber" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-amber">Act As (test)</span>
      </div>
      <select
        value={actingRole ?? ''}
        onChange={(e) => setActingRole(e.target.value || null)}
        className="w-full text-[11px] p-1.5 rounded bg-bg-surface border border-border text-text-primary"
      >
        <option value="">Super Admin (self)</option>
        {TEST_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
      </select>
    </div>
  );
}
