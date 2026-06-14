/**
 * Seeds the 17 built-in roles into the role registry from the EXISTING nav +
 * permission rules, so behaviour is preserved 1:1 on first load and every
 * built-in becomes editable in the Roles & Permissions tab.
 *
 * This is the only module that bridges navConfig → roleRegistry, so the
 * registry itself stays import-clean (no cycle). Call seedBuiltinRoles() once
 * at startup, before the first render.
 */
import { ROLES, ROLE_LABELS } from './roles';
import { canAccessModule, visibleFor } from './scope';
import { MODULES } from '../../components/shell/navConfig';
import { seedBuiltins, type RoleDef, type Level, type Scope } from './roleRegistry';

// Roles confined to their own sites (territory-scoped) by default.
const TERRITORY_SCOPED = new Set<string>([
  ROLES.OPERATOR, ROLES.MECHANIC, ROLES.SUPERVISOR, ROLES.INVENTORY_STAFF, ROLES.PROC_STAFF,
]);

export function seedBuiltinRoles(): void {
  const defs: RoleDef[] = Object.keys(ROLE_LABELS).map((role) => {
    const modules = MODULES.filter((m) => canAccessModule(role, m.key)).map((m) => m.key);

    // Default level for a function this role can currently see:
    // super_admin / gm run their modules → 'manage'; everyone else → 'edit'
    // (preserves today's "if you can see it, you can act on it" behaviour).
    const defaultLevel: Level = role === ROLES.SUPER_ADMIN || role === ROLES.GM ? 'manage' : 'edit';

    const permissions: Record<string, Level> = {};
    for (const mod of MODULES) {
      if (!canAccessModule(role, mod.key)) continue;
      for (const group of mod.groups) {
        if (!visibleFor(role, group.allow)) continue;
        for (const item of group.items) {
          if (visibleFor(role, item.allow)) permissions[item.to] = defaultLevel;
        }
      }
    }

    const scope: Scope = TERRITORY_SCOPED.has(role) ? 'own_territory' : 'all';

    return {
      id: role,
      label: ROLE_LABELS[role],
      builtin: true,
      modules,
      permissions,
      scope,
      workflowActors: role === ROLES.PENDING ? [] : [role],
      createdAt: 0,
    };
  });

  seedBuiltins(defs);
}
