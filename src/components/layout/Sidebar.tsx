import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/hooks/useAuth';
import {
  LayoutDashboard, Ticket, ShoppingCart, MapPin, Truck, UserCog, Map as MapIcon,
  Users, LogOut, Menu, X, Building2, Fuel, Wrench, HardHat, ClipboardCheck,
  Boxes, Banknote, Package, Store, UserSquare2, Briefcase, ClipboardList,
  TrendingUp, Droplets, FolderOpen, ChevronDown, ChevronRight, Warehouse,
  ArrowLeftRight, type LucideIcon,
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
      title: 'Warehouse',
      items: [
        { to: '/wli/warehouse/stores', label: 'Stores', icon: Warehouse },
        { to: '/wli/warehouse/items', label: 'Item Catalog', icon: Package },
        { to: '/wli/warehouse/stock', label: 'Stock by Store', icon: Boxes },
        { to: '/wli/warehouse/movements', label: 'Movements', icon: ArrowLeftRight },
        { to: '/wli/warehouse/transfers', label: 'Transfers', icon: Truck },
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

export function Navbar({ className = '' }: { className?: string }) {
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
      {/* Mobile top bar — floating card bar offset from browser walls */}
      <div className="md:hidden fixed top-4 inset-x-4 z-40 flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-bg-panel/90 backdrop-blur shadow-md">
        <span className="text-sm font-bold text-text-primary">{isSA ? 'Antrac Group' : visibleModules[0].brand}</span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-text-secondary" aria-label="Toggle menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {/* Mobile sidebar drawer — floating sheet, separate from desktop */}
      {mobileOpen && (
        <aside className="md:hidden fixed top-20 bottom-4 left-4 w-[280px] z-50 rounded-xl border border-border bg-bg-panel shadow-2xl flex flex-col overflow-hidden">
          <SidebarContent
            isSA={isSA} user={user} visibleModules={visibleModules} isActive={isActive}
            collapsed={collapsed} toggleSection={toggleSection} logout={logout}
            onNavClick={() => setMobileOpen(false)}
          />
        </aside>
      )}

      {/* Desktop sidebar — always rendered as its own floating card.
          AppShell passes the card-level classes (rounded-2xl, border, bg, shadow, etc.)
          via className. We never fight 'hidden' here. */}
      <aside className={className}>
        <SidebarContent
          isSA={isSA} user={user} visibleModules={visibleModules} isActive={isActive}
          collapsed={collapsed} toggleSection={toggleSection} logout={logout}
          onNavClick={() => {}}
        />
      </aside>
    </>
  );
}

/* ─── Inner content extracted so both mobile + desktop share the same JSX ─── */
interface ContentProps {
  isSA: boolean;
  user: ReturnType<typeof import('../../lib/hooks/useAuth').useAuth>['user'];
  visibleModules: ModuleNav[];
  isActive: (item: NavItem) => boolean;
  collapsed: Set<string>;
  toggleSection: (title: string) => void;
  logout: () => void;
  onNavClick: () => void;
}

function SidebarContent({ isSA, user, visibleModules, isActive, collapsed, toggleSection, logout, onNavClick }: ContentProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Brand header */}
      <div className="px-6 py-5 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue/15 flex items-center justify-center text-sm font-bold text-blue shrink-0">A</div>
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

      {/* Nav links */}
      <nav className="px-4 py-4 space-y-5 flex-1 overflow-y-auto">
        {visibleModules.map((mod) => (
          <div key={mod.key} className="space-y-0.5">
            {isSA && (
              <div className="px-3 pt-1 pb-2">
                <span className="text-[10px] font-black text-blue/60 uppercase tracking-[0.2em]">{mod.brand}</span>
              </div>
            )}
            {mod.sections.map((section, si) => {
              const sectionActive = section.items.some(isActive);
              const isCollapsedNow = !!section.title && collapsed.has(section.title) && !sectionActive;
              return (
                <div key={si} className={section.title ? 'pt-2' : ''}>
                  {section.title && (
                    <button
                      onClick={() => toggleSection(section.title!)}
                      className="w-full flex items-center justify-between px-3 pb-1.5 group"
                      aria-expanded={!isCollapsedNow}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted group-hover:text-text-secondary">{section.title}</span>
                      {isCollapsedNow
                        ? <ChevronRight size={12} className="text-text-muted group-hover:text-text-secondary" />
                        : <ChevronDown size={12} className="text-text-muted group-hover:text-text-secondary" />}
                    </button>
                  )}
                  {!isCollapsedNow && (
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item);
                        return (
                          <Link
                            key={item.to} to={item.to} onClick={onNavClick}
                            className={`flex items-center gap-3 mx-1 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                              active ? 'bg-blue/10 text-blue font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface'
                            }`}
                          >
                            <Icon size={16} className="shrink-0" /> {item.label}
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

      {/* Footer */}
      <div className="border-t border-border shrink-0">
        <ActorSwitcher />
        <div className="flex items-center gap-3 px-6 pt-4 pb-2">
          <div className="w-8 h-8 rounded-full bg-blue/20 flex items-center justify-center text-[11px] font-bold text-blue shrink-0">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">{user?.displayName}</p>
            <p className="text-[10px] text-text-muted truncate">{user ? (ROLE_LABELS[user.role] ?? user.role) : ''}</p>
          </div>
        </div>
        <ThemeToggle />
        <button onClick={() => logout()} className="flex items-center gap-2 px-6 py-3 pb-4 w-full text-xs text-text-muted hover:text-red transition-colors">
          <LogOut size={14} /> Logout
        </button>
      </div>
    </div>
  );
}
