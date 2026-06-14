import {
  LayoutDashboard, Ticket, ShoppingCart, Package, TrendingUp, Banknote, Contact,
  Briefcase, ClipboardList, Droplets, Warehouse, Boxes, ArrowLeftRight, Truck,
  FolderOpen, MapPin, UserCog, Store, Map as MapIcon, Building2, Fuel, Wrench,
  Users, HardHat, ClipboardCheck, BarChart3, Activity, ShieldCheck, type LucideIcon,
} from 'lucide-react';
import { ROLES, ROLE_LABELS } from '../../lib/permissions/roles';
import { type ModuleKey } from '../../lib/permissions/scope';
import { roleCanAccessModule, permissionLevel } from '../../lib/permissions/roleRegistry';

/** `allow` undefined = visible to every role in the module (super_admin + gm always see it). */
export interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: string; allow?: string[] }
export interface NavGroup { title?: string; collapsed?: boolean; items: NavItem[]; allow?: string[] }
export interface ModuleNav { key: ModuleKey; brand: string; sub: string; root: string; icon: LucideIcon; groups: NavGroup[] }

// WLI line/CRM roles — used to keep the allow-lists readable below.
const { OPERATOR, MECHANIC, SUPERVISOR, PROC_STAFF, FINANCE_WLI, INVENTORY_STAFF, SALES_STAFF, OPS_STAFF } = ROLES;

// Per-role desk icons (fallback to a generic desk icon).
const DESK_ICON: Record<string, LucideIcon> = {
  [ROLES.OPERATOR]: HardHat, [ROLES.MECHANIC]: Wrench, [ROLES.SUPERVISOR]: ClipboardCheck,
  [ROLES.GM]: LayoutDashboard, [ROLES.PROC_STAFF]: ShoppingCart, [ROLES.FINANCE_WLI]: Banknote,
  [ROLES.INVENTORY_STAFF]: Boxes, [ROLES.SALES_STAFF]: TrendingUp, [ROLES.OPS_STAFF]: Briefcase,
  [ROLES.DIRECTOR]: Building2, [ROLES.CFO]: Banknote, [ROLES.ANTRAC_FINANCE]: Banknote,
  [ROLES.HOLDING_HR]: Users, [ROLES.MPL_MANAGER]: Fuel, [ROLES.EMS_MANAGER]: Wrench,
};
// "Add all roles to role desk" — every real role gets a desk (super_admin/pending excluded).
const DESK_ROLES = Object.keys(ROLE_LABELS).filter((r) => r !== ROLES.SUPER_ADMIN && r !== ROLES.PENDING);
const ROLE_DESK_ITEMS: NavItem[] = DESK_ROLES.map((r) => ({
  to: `/wli/desk/${r}`, label: ROLE_LABELS[r], icon: DESK_ICON[r] ?? ClipboardCheck,
}));

export const WLI_NAV: ModuleNav = {
  key: 'wli', brand: 'Well Land Investment', sub: 'Antrac Holding Group', root: '/wli', icon: LayoutDashboard,
  groups: [
    { items: [{ to: '/wli', label: 'Home', icon: LayoutDashboard, end: true }] },
    {
      // Super-admin inspector: jump into ANY role's desk. Acting-as is driven from the sidebar footer.
      title: 'Role Desks', collapsed: true, allow: [ROLES.SUPER_ADMIN], items: ROLE_DESK_ITEMS,
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
    { title: 'Reports', items: [
      { to: '/wli/reports', label: 'Management KPIs', icon: BarChart3, allow: [ROLES.GM, FINANCE_WLI, ROLES.CFO, ROLES.DIRECTOR, ROLES.ANTRAC_FINANCE] },
      { to: '/wli/reports/profitability', label: 'Revenue vs Repair', icon: TrendingUp, allow: [ROLES.GM, FINANCE_WLI, ROLES.CFO, ROLES.DIRECTOR] },
      { to: '/wli/reports/uptime', label: 'Fleet Uptime', icon: Activity, allow: [SUPERVISOR, FINANCE_WLI, ROLES.GM] },
    ] },
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
    {
      title: 'Vault', items: [
        { to: '/registry', label: 'Document Registry', icon: ShieldCheck },
        { to: '/wli/documents', label: 'Document Vault', icon: FolderOpen, allow: [SUPERVISOR, PROC_STAFF, FINANCE_WLI, OPS_STAFF] },
      ]
    },
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
    { title: 'Reports', items: [
      { to: '/holding/reports', label: 'WLI Management KPIs', icon: BarChart3, allow: [ROLES.DIRECTOR, ROLES.CFO, ROLES.ANTRAC_FINANCE] },
      { to: '/holding/reports/profitability', label: 'WLI Revenue vs Repair', icon: TrendingUp, allow: [ROLES.DIRECTOR, ROLES.CFO] },
      { to: '/holding/reports/uptime', label: 'WLI Fleet Uptime', icon: Activity, allow: [ROLES.DIRECTOR, ROLES.CFO] },
    ] },
    { title: 'Procurement', items: [{ to: '/holding/procurement/requests', label: 'Purchase Requests', icon: ShoppingCart, allow: [ROLES.DIRECTOR, ROLES.CFO, ROLES.ANTRAC_FINANCE, ROLES.HOLDING_HR] }] },
    { title: 'Vault & Registry', items: [
      { to: '/registry', label: 'Document Registry', icon: ShieldCheck },
      { to: '/wli/documents', label: 'WLI Document Vault', icon: FolderOpen, allow: [ROLES.DIRECTOR, ROLES.CFO, ROLES.ANTRAC_FINANCE] }
    ] },
    { title: 'Registers', items: [{ to: '/holding/staff', label: 'Holding Staff', icon: UserCog, allow: [ROLES.HOLDING_HR, ROLES.DIRECTOR, ROLES.CFO] }] },
    { title: 'Admin', allow: [ROLES.SUPER_ADMIN], items: [
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck },
    ] },
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
  return MODULES.filter((m) => roleCanAccessModule(role, m.key));
}

/**
 * A copy of the module nav with functions this role can't see removed.
 * Every role (built-in + custom) is resolved uniformly through the registry:
 * a function is shown when its permission level is above 'none'.
 */
export function navForRole(mod: ModuleNav, role: string): ModuleNav {
  const groups = mod.groups
    .map((g) => ({ ...g, items: g.items.filter((it) => permissionLevel(role, it.to) !== 'none') }))
    .filter((g) => g.items.length > 0);
  return { ...mod, groups };
}

/** Flat list of every nav function across all modules — drives the Role Builder. */
export interface ModuleFunctionGroup {
  key: ModuleKey;
  brand: string;
  functions: { to: string; label: string; group: string }[];
}

export function allModuleFunctions(): ModuleFunctionGroup[] {
  return MODULES.map((m) => ({
    key: m.key,
    brand: m.brand,
    functions: m.groups.flatMap((g) =>
      g.items.map((it) => ({ to: it.to, label: it.label, group: g.title ?? 'General' })),
    ),
  }));
}
