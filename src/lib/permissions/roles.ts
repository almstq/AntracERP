export const ORG_TYPES = {
  HOLDING: 'holding',
  SBU: 'sbu',
} as const;

export const SBU_TYPES = {
  WLI: 'wli',
  MPL: 'mpl',
  EMS: 'ems',
} as const;

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  DIRECTOR: 'director',
  HOLDING_FINANCE: 'holding_finance',
  HOLDING_HR: 'holding_hr',
  WLI_GM: 'wli_gm',
  WLI_SITE_MANAGER: 'wli_site_manager',
  WLI_MECHANIC: 'wli_mechanic',
  WLI_PROCUREMENT: 'wli_procurement',
  WLI_FINANCE: 'wli_finance',
  MPL_MANAGER: 'mpl_manager',
  EMS_MANAGER: 'ems_manager',
  PENDING: 'pending',
} as const;

export const ROLE_HIERARCHY: Record<string, number> = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.DIRECTOR]: 90,
  [ROLES.HOLDING_FINANCE]: 85,
  [ROLES.HOLDING_HR]: 80,
  [ROLES.WLI_GM]: 70,
  [ROLES.MPL_MANAGER]: 70,
  [ROLES.EMS_MANAGER]: 70,
  [ROLES.WLI_SITE_MANAGER]: 50,
  [ROLES.WLI_PROCUREMENT]: 40,
  [ROLES.WLI_FINANCE]: 40,
  [ROLES.WLI_MECHANIC]: 30,
  [ROLES.PENDING]: 0,
};

export const HOLDING_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.DIRECTOR,
  ROLES.HOLDING_FINANCE,
  ROLES.HOLDING_HR,
];

export const WLI_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.WLI_GM,
  ROLES.WLI_SITE_MANAGER,
  ROLES.WLI_MECHANIC,
  ROLES.WLI_PROCUREMENT,
  ROLES.WLI_FINANCE,
];

export const MPL_ROLES = [ROLES.SUPER_ADMIN, ROLES.MPL_MANAGER];
export const EMS_ROLES = [ROLES.SUPER_ADMIN, ROLES.EMS_MANAGER];
