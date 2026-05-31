export const ORG_TYPES = {
  HOLDING: 'holding',
  SBU: 'sbu',
} as const;

export const SBU_TYPES = {
  WLI: 'wli',
  MPL: 'mpl',
  EMS: 'ems',
} as const;

/**
 * Roles aligned to the WLI Issue-to-Closure workflow (v1.0).
 * The 11 workflow actors map 1:1 to these role keys.
 * MPL/EMS/HR roles retained for the rest of the app.
 */
export const ROLES = {
  // Holding / HQ
  SUPER_ADMIN: 'super_admin',
  DIRECTOR: 'director',
  CFO: 'cfo',
  ANTRAC_FINANCE: 'antrac_finance',
  HOLDING_HR: 'holding_hr',
  // WLI workflow chain
  GM: 'gm',
  SUPERVISOR: 'supervisor',
  PROC_STAFF: 'proc_staff',
  FINANCE_WLI: 'finance_wli',
  INVENTORY_STAFF: 'inventory_staff',
  MECHANIC: 'mechanic',
  OPERATOR: 'operator',
  // CRM / Sales
  SALES_STAFF: 'sales_staff',
  OPS_STAFF: 'ops_staff',
  // Other SBUs
  MPL_MANAGER: 'mpl_manager',
  EMS_MANAGER: 'ems_manager',
  // Default
  PENDING: 'pending',
} as const;

export const ROLE_HIERARCHY: Record<string, number> = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.DIRECTOR]: 95,
  [ROLES.CFO]: 90,
  [ROLES.ANTRAC_FINANCE]: 85,
  [ROLES.HOLDING_HR]: 80,
  [ROLES.GM]: 70,
  [ROLES.MPL_MANAGER]: 70,
  [ROLES.EMS_MANAGER]: 70,
  [ROLES.SUPERVISOR]: 50,
  [ROLES.SALES_STAFF]: 48,
  [ROLES.OPS_STAFF]: 48,
  [ROLES.PROC_STAFF]: 45,
  [ROLES.FINANCE_WLI]: 45,
  [ROLES.INVENTORY_STAFF]: 40,
  [ROLES.MECHANIC]: 35,
  [ROLES.OPERATOR]: 30,
  [ROLES.PENDING]: 0,
};

/** Human-readable labels for UI. */
export const ROLE_LABELS: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.DIRECTOR]: 'Director',
  [ROLES.CFO]: 'CFO',
  [ROLES.ANTRAC_FINANCE]: 'Antrac Finance',
  [ROLES.HOLDING_HR]: 'Holding HR',
  [ROLES.GM]: 'General Manager',
  [ROLES.SUPERVISOR]: 'Site Supervisor',
  [ROLES.PROC_STAFF]: 'Procurement Staff',
  [ROLES.FINANCE_WLI]: 'WLI Finance',
  [ROLES.INVENTORY_STAFF]: 'Inventory Staff',
  [ROLES.MECHANIC]: 'Mechanic',
  [ROLES.OPERATOR]: 'Operator',
  [ROLES.SALES_STAFF]: 'Sales Staff',
  [ROLES.OPS_STAFF]: 'Operations Staff',
  [ROLES.MPL_MANAGER]: 'MPL Manager',
  [ROLES.EMS_MANAGER]: 'EMS Manager',
  [ROLES.PENDING]: 'Pending Approval',
};

export const HOLDING_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.DIRECTOR,
  ROLES.CFO,
  ROLES.ANTRAC_FINANCE,
  ROLES.HOLDING_HR,
];

export const WLI_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.GM,
  ROLES.SUPERVISOR,
  ROLES.MECHANIC,
  ROLES.OPERATOR,
  ROLES.PROC_STAFF,
  ROLES.FINANCE_WLI,
  ROLES.INVENTORY_STAFF,
  ROLES.SALES_STAFF,
  ROLES.OPS_STAFF,
];

export const MPL_ROLES = [ROLES.SUPER_ADMIN, ROLES.MPL_MANAGER];
export const EMS_ROLES = [ROLES.SUPER_ADMIN, ROLES.EMS_MANAGER];
