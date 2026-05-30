
export function canApproveTicket(userRole: string): boolean {
  return ['gm', 'super_admin', 'director'].includes(userRole);
}

export function canCreatePR(userRole: string): boolean {
  // PR is auto-created at mechanic diagnosis; activation gated to GM.
  return ['gm', 'proc_staff', 'super_admin'].includes(userRole);
}

export function canViewHolding(userRole: string): boolean {
  return ['super_admin', 'director', 'cfo', 'antrac_finance', 'holding_hr'].includes(userRole);
}

export function canManageUsers(userRole: string): boolean {
  return ['super_admin', 'director'].includes(userRole);
}

export function canApproveQuote(userRole: string): boolean {
  return ['gm', 'super_admin', 'director'].includes(userRole);
}

export function canDispatchFuel(userRole: string): boolean {
  return ['mpl_manager', 'super_admin'].includes(userRole);
}

export function canViewSBU(userRole: string, sbuType: string): boolean {
  if (['super_admin', 'director'].includes(userRole)) return true;
  if (sbuType === 'wli') return ['gm', 'supervisor', 'mechanic', 'operator', 'proc_staff', 'finance_wli', 'inventory_staff'].includes(userRole);
  if (sbuType === 'mpl') return ['mpl_manager'].includes(userRole);
  if (sbuType === 'ems') return ['ems_manager'].includes(userRole);
  return false;
}
