/**
 * Role-scoping helpers — the single source of truth for "what can this role
 * see?" Used by the nav (which sections), the module switcher (which modules)
 * and the dashboards (which sites/assets/staff are in territory).
 *
 * Two roles see everything *within a module*: super_admin (system) and gm
 * (runs all of WLI). Module access itself is still gated separately, so a GM
 * never sees the Holding/MPL/EMS modules.
 */
import { ROLES, HOLDING_ROLES, WLI_ROLES, MPL_ROLES, EMS_ROLES } from './roles';

export type ModuleKey = 'holding' | 'wli' | 'mpl' | 'ems';

const MODULE_ROLES: Record<ModuleKey, readonly string[]> = {
  holding: HOLDING_ROLES,
  wli: WLI_ROLES,
  mpl: MPL_ROLES,
  ems: EMS_ROLES,
};

/** Roles that see every nav item inside a module they can access. */
const SEES_ALL = new Set<string>([ROLES.SUPER_ADMIN, ROLES.GM]);

/** Can this role open this module at all? */
export function canAccessModule(role: string, moduleKey: ModuleKey): boolean {
  if (role === ROLES.SUPER_ADMIN) return true;
  return MODULE_ROLES[moduleKey]?.includes(role) ?? false;
}

/**
 * Is a nav item/group visible to this role?
 * `allow` undefined → visible to everyone in the module.
 * super_admin sees everything. gm sees everything *except* entries explicitly
 * restricted to super_admin only (e.g. the Role Desks inspector).
 */
export function visibleFor(role: string, allow?: readonly string[]): boolean {
  if (!allow) return true;
  if (role === ROLES.SUPER_ADMIN) return true;
  const superOnly = allow.length === 1 && allow[0] === ROLES.SUPER_ADMIN;
  if (superOnly) return false;
  if (role === ROLES.GM) return true;
  return allow.includes(role);
}

/**
 * The set of site IDs a role operates over.
 * gm/super_admin → all sites. Otherwise the user's own siteIds.
 * Non-site-bound roles (finance, etc.) return an empty set — callers treat
 * empty-for-a-site-bound-role as "no territory" and empty-for-gm as "all".
 */
export function scopedSiteIds(
  role: string,
  userSiteIds: readonly string[],
  allSiteIds: readonly string[],
): Set<string> {
  if (SEES_ALL.has(role)) return new Set(allSiteIds);
  return new Set(userSiteIds);
}

/** True when this role is bound to specific sites (vs. org-wide like GM/finance). */
export function isSiteBound(role: string, userSiteIds: readonly string[]): boolean {
  return !SEES_ALL.has(role) && userSiteIds.length > 0;
}
