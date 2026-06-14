/**
 * User access management — the Super Admin assigns a role (and sites) to a
 * pending sign-up. orgId is derived from the role so SA only picks role + sites.
 */
import { listAll, updateFields } from '../firebase/db';
import { HOLDING_ROLES, WLI_ROLES, MPL_ROLES, EMS_ROLES } from '../permissions/roles';
import { roleModules } from '../permissions/roleRegistry';

const ORG_FOR_MODULE: Record<string, string> = {
  holding: 'antrac-holding', wli: 'sbu-wli', mpl: 'sbu-mpl', ems: 'sbu-ems',
};

export interface AppUser {
  id: string;               // == uid
  email?: string;
  displayName?: string;
  role: string;
  roleId?: string;
  orgId?: string;
  siteIds?: string[];
  status?: 'active' | 'pending' | 'suspended';
  createdAt?: Date;
}

/** Which org a role belongs to (super_admin resolves to Holding via the first match). */
export function orgIdForRole(role: string): string {
  const firstRegistryModule = roleModules(role)[0];
  if (firstRegistryModule) return ORG_FOR_MODULE[firstRegistryModule] ?? '';
  if ((HOLDING_ROLES as readonly string[]).includes(role)) return 'antrac-holding';
  if ((WLI_ROLES as readonly string[]).includes(role)) return 'sbu-wli';
  if ((MPL_ROLES as readonly string[]).includes(role)) return 'sbu-mpl';
  if ((EMS_ROLES as readonly string[]).includes(role)) return 'sbu-ems';
  return '';
}

export async function listUsers(): Promise<AppUser[]> {
  return listAll<AppUser>('users');
}

export async function assignAccess(uid: string, role: string, siteIds: string[]): Promise<void> {
  await updateFields('users', uid, {
    role,
    roleId: role,
    orgId: orgIdForRole(role),
    siteIds,
    status: 'active',
  });
}
