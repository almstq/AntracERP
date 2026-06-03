import {
  LayoutDashboard, Ticket, ShoppingCart, Package, TrendingUp, Banknote, Contact,
  Briefcase, ClipboardList, Droplets, Warehouse, Boxes, ArrowLeftRight, Truck,
  FolderOpen, MapPin, UserCog, Store, Map as MapIcon, Building2, Fuel, Wrench,
  Users, HardHat, ClipboardCheck, BarChart3, type LucideIcon,
} from 'lucide-react';
import { ROLES } from '../../lib/permissions/roles';
import { canAccessModule, visibleFor, type ModuleKey } from '../../lib/permissions/scope';

/** `allow` undefined = visible to every role in the module (super_admin + gm always see it). */
export interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: string; allow?: string[] }
export interface NavGroup { title?: string; collapsed?: boolean; items: NavItem[]; allow?: string[] }
export interface ModuleNav { key: ModuleKey; brand: string; sub: string; root: string; icon: LucideIcon; groups: NavGroup[] }

// WLI line/CRM roles — used to keep the allow-lists readable below.
const { OPERATOR, MECHANIC, SUPERVISOR, PROC_STAFF, FINANCE_WLI, INVENTORY_STAFF, SALES_STAFF, OPS_STAFF } = ROLES;

export const WLI_NAV: ModuleNav = {
  key: 'wli', brand: 'Well Land Investment', sub: 'Antrac Holding Group', root: '/wli', icon: LayoutDashboard,
  groups: [
    { items: [{ to: '/wli', label: 'Home', icon: LayoutDashboard, end: true }] },
    {
      // Inspector for super_admin only — every role's personal desk is now their Home page.
      title: 'Role Desks', collapsed: true, allow: [ROLES.SUPER_ADMIN], items: [
        { to: '/wli/desk/operator', label: 'Operator', icon: HardHat },
        { to: '/wli/desk/mechanic', label: 'Mechanic', icon: Wrench },
        { to: '/wli/desk/supervisor', label: 'Supervisor', icon: ClipboardCheck },
        { to: '/wli/desk/gm', label: 'General Manager', icon: LayoutDashboard },
        { to: '/wli/desk/proc_staff', label: 'Procurement', icon: ShoppingCart },
        { to: '/wli/desk/finance_wli', label: 'WLI Finance', icon: Banknote },
        { to: '/wli/desk/inventory_staff', label: 'Inventory', icon: Boxes },
      ],
    },
    {
      title: 'Operations', items: [
        { to: '/wli/tickets', label: 'Issue Tickets', icon: Ticket, allow: [OPERATOR, MECHANIC, SUPERVISOR, OPS_STAFF] },
        { to: '/wli/procurement/requests', label: 'Purchase Requests', icon: ShoppingCart, allow: [PROC_STAFF, SUPERVISOR, FINANCE_WLI, INVENTORY_STAFF] },
        { to: '/wli/procurement/orders', label: 'Purchase Orders', icon: Package, allow: [PROC_STAFF, FINANCE_WLI] },
      ],
    },
    {
      title: 'CRM & Sales', items: [
        { to: '/wli/crm/sales', label: 'Sales Dashboard', icon: TrendingUp, allow: [SALES_STAFF, OPS_STAFF] },
        { to: '/wli/crm/finance', label: 'Finance Dashboard', icon: Banknote, allow: [FINANCE_WLI] },
        { to: '/wli/crm/customers', label: 'Customers', icon: Contact, allow: [SALES_STAFF, OPS_STAFF] },
        { to: '/wli/crm/enquiries', label: 'Enquiries', icon: Briefcase, allow: [SALES_STAFF, OPS_STAFF] },
        { to: '/wli/crm/work-orders', label: 'Work Orders', icon: ClipboardList, allow: [SALES_STAFF, OPS_STAFF, FINANCE_WLI] },
        { to: '/wli/deployments', label: 'Deployments', icon: Truck, allow: [SALES_STAFF, OPS_STAFF] },
      ],
    },
    { title: 'Reports', items: [{ to: '/wli/reports', label: 'Revenue vs Repair', icon: BarChart3, allow: [FINANCE_WLI] }] },
    { title: 'Fuel & Water', items: [{ to: '/wli/fuel/requests', label: 'Fuel Requests', icon: Droplets, allow: [OPERATOR, SUPERVISOR, INVENTORY_STAFF] }] },
    {
      title: 'Warehouse', allow: [INVENTORY_STAFF, PROC_STAFF], items: [
        { to: '/wli/warehouse/stores', label: 'Stores', icon: Warehouse, allow: [INVENTORY_STAFF] },
        { to: '/wli/warehouse/items', label: 'Item Catalog', icon: Package, allow: [INVENTORY_STAFF, PROC_STAFF] },
        { to: '/wli/warehouse/stock', label: 'Stock by Store', icon: Boxes, allow: [INVENTORY_STAFF, PROC_STAFF] },
        { to: '/wli/warehouse/movements', label: 'Movements', icon: ArrowLeftRight, allow: [INVENTORY_STAFF] },
        { to: '/wli/warehouse/transfers', label: 'Transfers', icon: Truck, allow: [INVENTORY_STAFF] },
      ],
    },
    { title: 'Documents', items: [{ to: '/wli/documents', label: 'Document Vault', icon: FolderOpen, allow: [SUPERVISOR, PROC_STAFF, FINANCE_WLI, OPS_STAFF] }] },
    {
      title: 'Registers', collapsed: true, items: [
        { to: '/wli/locations', label: 'Locations', icon: MapPin, allow: [SUPERVISOR, OPS_STAFF] },
        { to: '/wli/assets', label: 'Asset Register', icon: Truck, allow: [OPERATOR, MECHANIC, SUPERVISOR, OPS_STAFF] },
        { to: '/wli/staff', label: 'Staff Register', icon: UserCog, allow: [SUPERVISOR] },
        { to: '/wli/suppliers', label: 'Supplier Register', icon: Store, allow: [PROC_STAFF] },
        { to: '/wli/map', label: 'Map', icon: MapIcon, allow: [OPERATOR, MECHANIC, SUPERVISOR, OPS_STAFF] },
      ],
    },
  ],
};

export const HQ_NAV: ModuleNav = {
  key: 'holding', brand: 'Antrac Holding Group', sub: 'Operations · Finance · Directors', root: '/holding', icon: Building2,
  groups: [
    { items: [{ to: '/holding', label: 'Group Overview', icon: Building2, end: true }] },
    { title: 'Finance', items: [{ to: '/holding/approvals', label: 'Payment Approvals', icon: Banknote, allow: [ROLES.ANTRAC_FINANCE, ROLES.CFO, ROLES.DIRECTOR] }] },
    { title: 'Reports', items: [{ to: '/holding/reports', label: 'WLI Revenue vs Repair', icon: BarChart3, allow: [ROLES.DIRECTOR, ROLES.CFO] }] },
    { title: 'Procurement', items: [{ to: '/holding/procurement/requests', label: 'Purchase Requests', icon: ShoppingCart, allow: [ROLES.DIRECTOR, ROLES.CFO, ROLES.ANTRAC_FINANCE, ROLES.HOLDING_HR] }] },
    { title: 'Registers', items: [{ to: '/holding/staff', label: 'Holding Staff', icon: UserCog, allow: [ROLES.HOLDING_HR, ROLES.DIRECTOR, ROLES.CFO] }] },
    { title: 'Admin', allow: [ROLES.SUPER_ADMIN], items: [{ to: '/admin/users', label: 'Users', icon: Users }] },
  ],
};

export const MPL_NAV: ModuleNav = {
  key: 'mpl', brand: 'Maldives Petroleum Link', sub: 'Fuel & Water Supply', root: '/mpl', icon: Fuel,
  groups: [{ items: [
    { to: '/mpl', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/mpl/dispatches', label: 'Fuel Requests', icon: Fuel },
    { to: '/mpl/staff', label: 'MPL Staff', icon: UserCog },
  ] }],
};

export const EMS_NAV: ModuleNav = {
  key: 'ems', brand: 'Expert Motor Services', sub: 'Antrac Holding Group', root: '/ems', icon: Wrench,
  groups: [{ items: [{ to: '/ems', label: 'Dashboard', icon: LayoutDashboard, end: true }] }],
};

export const MODULES: ModuleNav[] = [HQ_NAV, WLI_NAV, MPL_NAV, EMS_NAV];

export function moduleForPath(path: string): ModuleNav {
  if (path.startsWith('/holding') || path.startsWith('/admin')) return HQ_NAV;
  if (path.startsWith('/mpl')) return MPL_NAV;
  if (path.startsWith('/ems')) return EMS_NAV;
  return WLI_NAV;
}

/** Modules this role is allowed to open — drives the icon rail + mobile switcher. */
export function accessibleModules(role: string): ModuleNav[] {
  return MODULES.filter((m) => canAccessModule(role, m.key));
}

/** A copy of the module nav with groups/items this role can't see removed (empty groups dropped). */
export function navForRole(mod: ModuleNav, role: string): ModuleNav {
  const groups = mod.groups
    .filter((g) => visibleFor(role, g.allow))
    .map((g) => ({ ...g, items: g.items.filter((it) => visibleFor(role, it.allow)) }))
    .filter((g) => g.items.length > 0);
  return { ...mod, groups };
}
