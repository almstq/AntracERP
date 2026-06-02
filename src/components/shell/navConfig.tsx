import {
  LayoutDashboard, Ticket, ShoppingCart, Package, TrendingUp, Banknote, Contact,
  Briefcase, ClipboardList, Droplets, Warehouse, Boxes, ArrowLeftRight, Truck,
  FolderOpen, MapPin, UserCog, Store, Map as MapIcon, Building2, Fuel, Wrench,
  Users, HardHat, ClipboardCheck, type LucideIcon,
} from 'lucide-react';

export interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: string }
export interface NavGroup { title?: string; collapsed?: boolean; items: NavItem[] }
export interface ModuleNav { key: string; brand: string; sub: string; root: string; icon: LucideIcon; groups: NavGroup[] }

export const WLI_NAV: ModuleNav = {
  key: 'wli', brand: 'Well Land Investment', sub: 'Antrac Holding Group', root: '/wli', icon: LayoutDashboard,
  groups: [
    { items: [{ to: '/wli', label: 'Command Center', icon: LayoutDashboard, end: true }] },
    {
      title: 'Role Desks', collapsed: true, items: [
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
        { to: '/wli/tickets', label: 'Issue Tickets', icon: Ticket },
        { to: '/wli/procurement/requests', label: 'Purchase Requests', icon: ShoppingCart },
        { to: '/wli/procurement/orders', label: 'Purchase Orders', icon: Package },
      ],
    },
    {
      title: 'CRM & Sales', items: [
        { to: '/wli/crm/sales', label: 'Sales Dashboard', icon: TrendingUp },
        { to: '/wli/crm/finance', label: 'Finance Dashboard', icon: Banknote },
        { to: '/wli/crm/customers', label: 'Customers', icon: Contact },
        { to: '/wli/crm/enquiries', label: 'Enquiries', icon: Briefcase },
        { to: '/wli/crm/work-orders', label: 'Work Orders', icon: ClipboardList },
      ],
    },
    { title: 'Fuel & Water', items: [{ to: '/wli/fuel/requests', label: 'Fuel Requests', icon: Droplets }] },
    {
      title: 'Warehouse', items: [
        { to: '/wli/warehouse/stores', label: 'Stores', icon: Warehouse },
        { to: '/wli/warehouse/items', label: 'Item Catalog', icon: Package },
        { to: '/wli/warehouse/stock', label: 'Stock by Store', icon: Boxes },
        { to: '/wli/warehouse/movements', label: 'Movements', icon: ArrowLeftRight },
        { to: '/wli/warehouse/transfers', label: 'Transfers', icon: Truck },
      ],
    },
    { title: 'Documents', items: [{ to: '/wli/documents', label: 'Document Vault', icon: FolderOpen }] },
    {
      title: 'Registers', collapsed: true, items: [
        { to: '/wli/locations', label: 'Locations', icon: MapPin },
        { to: '/wli/assets', label: 'Asset Register', icon: Truck },
        { to: '/wli/staff', label: 'Staff Register', icon: UserCog },
        { to: '/wli/suppliers', label: 'Supplier Register', icon: Store },
        { to: '/wli/map', label: 'Fleet Map', icon: MapIcon },
      ],
    },
  ],
};

export const HQ_NAV: ModuleNav = {
  key: 'holding', brand: 'Antrac Holding Group', sub: 'Operations · Finance · Directors', root: '/holding', icon: Building2,
  groups: [
    { items: [{ to: '/holding', label: 'Group Overview', icon: Building2, end: true }] },
    { title: 'Admin', items: [{ to: '/admin/users', label: 'Users', icon: Users }] },
  ],
};

export const MPL_NAV: ModuleNav = {
  key: 'mpl', brand: 'Maldives Petroleum Link', sub: 'Fuel & Water Supply', root: '/mpl', icon: Fuel,
  groups: [{ items: [
    { to: '/mpl', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/mpl/dispatches', label: 'Fuel Requests', icon: Fuel },
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
