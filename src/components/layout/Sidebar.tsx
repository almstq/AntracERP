import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/hooks/useAuth';
import {
  LayoutDashboard, Ticket, ShoppingCart, MapPin, Truck, UserCog, Map as MapIcon,
  Users, LogOut, Menu, X, Building2, Fuel, Wrench, HardHat, ClipboardCheck,
  Boxes, Banknote, Package, Store, UserSquare2, Briefcase, ClipboardList,
  TrendingUp, Droplets, FolderOpen, ChevronDown, ChevronRight, type LucideIcon,
} from 'lucide-react';
import { ROLE_LABELS } from '../../lib/permissions/roles';
import { ActorSwitcher } from './ActorSwitcher';
import { ThemeToggle } from '../shared/ThemeToggle';

interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean }
interface NavSection { title?: string; items: NavItem[]; defaultCollapsed?: boolean }
interface ModuleNav { key: string; brand: string; subtitle: string; sections: NavSection[] }

const WLI_NAV: ModuleNav = {
  key: 'wli', brand: 'Well Land Investment', subtitle: 'Antrac Holding Group',
  sections: [
    { items: [{ to: '/wli', label: 'Command Center', icon: LayoutDashboard, end: true }] },
    {
      title: 'Role Desks',
      defaultCollapsed: true,
      items: [
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
      title: 'Operations',
      items: [
        { to: '/wli/tickets', label: 'Issue Tickets', icon: Ticket },
        { to: '/wli/procurement/requests', label: 'Purchase Requests', icon: ShoppingCart },
        { to: '/wli/procurement/orders', label: 'Purchase Orders', icon: Package },
      ],
    },
    {
      title: 'CRM & Sales',
      items: [
        { to: '/wli/crm/sales', label: 'Sales Dashboard', icon: TrendingUp },
        { to: '/wli/crm/finance', label: 'Finance Dashboard', icon: Banknote },
        { to: '/wli/crm/customers', label: 'Customers', icon: UserSquare2 },
        { to: '/wli/crm/enquiries', label: 'Enquiries', icon: Briefcase },
        { to: '/wli/crm/work-orders', label: 'Work Orders', icon: ClipboardList },
      ],
    },
    {
      title: 'Fuel & Water',
      items: [
        { to: '/wli/fuel/requests', label: 'Fuel Requests', icon: Droplets },
      ],
    },
    {
      title: 'Documents',
      items: [
        { to: '/wli/documents', label: 'Document Vault', icon: FolderOpen },
      ],
    },
    {
      title: 'Registers',
      defaultCollapsed: true,
      items: [
        { to: '/wli/locations', label: 'Locations', icon: MapPin },
        { to: '/wli/assets', label: 'Asset Register', icon: Truck },
        { to: '/wli/staff', label: 'Staff Register', icon: UserCog },
        { to: '/wli/suppliers', label: 'Supplier Register', icon: Store },
        { to: '/wli/map', label: 'Fleet Map', icon: MapIcon },
      ],
    },
  ],
};

const HQ_NAV: ModuleNav = {
  key: 'holding', brand: 'Antrac Holding Group', subtitle: 'Operations · Finance · Directors',
  sections: [
    { items: [{ to: '/holding', label: 'Group Overview', icon: Building2, end: true }] },
    { title: 'Admin', items: [{ to: '/admin/users', label: 'Users', icon: Users }] },
  ],
};

const MPL_NAV: ModuleNav = {
  key: 'mpl', brand: 'Maldives Petroleum Link', subtitle: 'Fuel & Water Supply',
  sections: [
    { items: [
      { to: '/mpl', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/mpl/dispatches', label: 'Fuel Requests', icon: Fuel },
    ] },
  ],
};

const EMS_NAV: ModuleNav = {
  key: 'ems', brand: 'Expert Motor Services', subtitle: 'Antrac Holding Group',
  sections: [{ items: [{ to: '/ems', label: 'Dashboard', icon: LayoutDashboard, end: true }] }],
};

function moduleForPath(path: string): ModuleNav {
  if (path.startsWith('/holding') || path.startsWith('/admin')) return HQ_NAV;
  if (path.startsWith('/mpl')) return MPL_NAV;
  if (path.startsWith('/ems')) return EMS_NAV;
  return WLI_NAV;
}

/** 
 * Refined logic: super_admin sees EVERYTHING. 
 * Standard users see the module relevant to their current path.
 */
function getVisibleModules(userRole: string | undefined, currentPath: string): ModuleNav[] {
  if (userRole === 'super_admin') {
    return [HQ_NAV, WLI_NAV, MPL_NAV, EMS_NAV];
  }
  return [moduleForPath(currentPath)];
}

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const isSA = user?.role === 'super_admin';
  const visibleModules = getVisibleModules(user?.role, location.pathname);

  const isActive = (item: NavItem) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);

  // Collapsible sections — start with the noisy ones (Role Desks, Registers) collapsed.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const s = new Set<string>();
    // Collapse for SA by default to keep the long list tidy
    if (isSA) {
      s.add('Role Desks');
      s.add('Registers');
    } else {
      const activeMod = visibleModules[0];
      for (const sec of activeMod.sections) if (sec.title && sec.defaultCollapsed) s.add(sec.title);
    }
    return s;
  });

  const toggleSection = (title: string) =>
    setCollapsed((c) => { const n = new Set(c); n.has(title) ? n.delete(title) : n.add(title); return n; });

  return (
    <>
      {/* Mobile top bar — fixed, full width, sits above content */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-3 border-b border-border bg-bg-panel">
        <span className="text-sm font-bold text-text-primary">{isSA ? 'Antrac Group' : visibleModules[0].brand}</span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-text-secondary" aria-label="Toggle menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden'} md:relative md:z-auto md:block w-60 bg-bg-panel border-r border-border flex-shrink-0 overflow-y-auto`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue/15 flex items-center justify-center text-sm font-bold text-blue">A</div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-text-primary leading-tight truncate">
                {isSA ? 'Antrac Holding Group' : visibleModules[0].brand}
              </h1>
              <p className="text-[10px] text-text-muted truncate">
                {isSA ? 'Global Administrator' : visibleModules[0].subtitle}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-2 pb-24 space-y-6">
          {visibleModules.map((mod) => (
            <div key={mod.key} className="space-y-2">
              {isSA && (
                <div className="px-3 py-1 mb-1">
                  <span className="text-[10px] font-black text-blue/60 uppercase tracking-[0.2em]">{mod.brand}</span>
                </div>
              )}
              
              {mod.sections.map((section, si) => {
                const sectionActive = section.items.some(isActive);
                const isCollapsed = !!section.title && collapsed.has(section.title) && !sectionActive;
                
                return (
                  <div key={si}>
                    {section.title && (
                      <button
                        onClick={() => toggleSection(section.title!)}
                        className="w-full flex items-center justify-between px-3 pt-2 pb-1 group"
                        aria-expanded={!isCollapsed}
                      >
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-text-muted group-hover:text-text-secondary">{section.title}</span>
                        {isCollapsed
                          ? <ChevronRight size={11} className="text-text-muted group-hover:text-text-secondary" />
                          : <ChevronDown size={11} className="text-text-muted group-hover:text-text-secondary" />}
                      </button>
                    )}
                    {!isCollapsed && (
                      <div className="space-y-0.5">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          const active = isActive(item);
                          return (
                            <Link
                              key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                active ? 'bg-blue/10 text-blue' : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface'
                              }`}
                            >
                              <Icon size={15} /> {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-bg-panel">
          <ActorSwitcher />
          <div className="flex items-center gap-2 mb-2 p-3 pb-0">
            <div className="w-7 h-7 rounded-full bg-blue/20 flex items-center justify-center text-[10px] font-bold text-blue">
              {user?.displayName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{user?.displayName}</p>
              <p className="text-[10px] text-text-muted truncate">{user ? (ROLE_LABELS[user.role] ?? user.role) : ''}</p>
            </div>
          </div>
          <ThemeToggle />
          <button onClick={() => logout()} className="flex items-center gap-2 px-3 py-2 pb-3 w-full text-xs text-text-muted hover:text-red transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
