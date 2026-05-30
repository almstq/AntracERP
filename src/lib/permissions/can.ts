
export function canApproveTicket(userRole: string): boolean {
  return ['wli_gm', 'wli_site_manager', 'super_admin', 'director'].includes(userRole);
}

export function canCreatePR(userRole: string): boolean {
  return ['wli_gm', 'wli_site_manager', 'wli_procurement', 'super_admin'].includes(userRole);
}

export function canViewHolding(userRole: string): boolean {
  return ['super_admin', 'director', 'holding_finance', 'holding_hr'].includes(userRole);
}

export function canManageUsers(userRole: string): boolean {
  return ['super_admin', 'director'].includes(userRole);
}

export function canApproveQuote(userRole: string): boolean {
  return ['wli_gm', 'super_admin', 'director'].includes(userRole);
}

export function canDispatchFuel(userRole: string): boolean {
  return ['mpl_manager', 'super_admin'].includes(userRole);
}

export function canViewSBU(userRole: string, sbuType: string): boolean {
  if (['super_admin', 'director'].includes(userRole)) return true;
  if (sbuType === 'wli') return ['wli_gm', 'wli_site_manager', 'wli_mechanic', 'wli_procurement', 'wli_finance'].includes(userRole);
  if (sbuType === 'mpl') return ['mpl_manager'].includes(userRole);
  if (sbuType === 'ems') return ['ems_manager'].includes(userRole);
  return false;
}
