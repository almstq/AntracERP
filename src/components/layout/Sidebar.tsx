import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/hooks/useAuth';
import {
  LayoutDashboard, Ticket, ShoppingCart, MapPin, Truck, UserCog, Map as MapIcon,
  Users, LogOut, Menu, X, Building2, Fuel, Wrench, HardHat, ClipboardCheck,
  Boxes, Banknote, Package, Store, UserSquare2, Briefcase, ClipboardList, type LucideIcon,
} from 'lucide-react';
import { ROLE_LABELS } from '../../lib/permissions/roles';
import { ActorSwitcher } from './ActorSwitcher';

interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean }
interface NavSection { title?: string; items: NavItem[] }
interface ModuleNav { key: string; brand: string; subtitle: string; sections: NavSection[] }

const WLI_NAV: ModuleNav = {
  key: 'wli', brand: 'Well Land Investment', subtitle: 'Antrac Holding Group',
  sections: [
    { items: [{ to: '/wli', label: 'Command Center', icon: LayoutDashboard, end: true }] },
    {
      title: 'Dashboards',
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
        { to: '/wli/crm/customers', label: 'Customers', icon: UserSquare2 },
        { to: '/wli/crm/enquiries', label: 'Enquiries', icon: Briefcase },
        { to: '/wli/crm/work-orders', label: 'Work Orders', icon: ClipboardList },
      ],
    },
    {
      title: 'Registers',
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
  key: 'holding', brand: 'Antrac HQ', subtitle: 'Holding · Finance · Directors',
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

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mod = moduleForPath(location.pathname);

  const isActive = (item: NavItem) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);

  return (
    <>
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-bg-panel">
        <span className="text-sm font-bold text-text-primary">{mod.brand}</span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-text-secondary">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <aside className={`${mobileOpen ? 'block' : 'hidden'} md:block w-60 bg-bg-panel border-r border-border flex-shrink-0 overflow-y-auto relative`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue/15 flex items-center justify-center text-sm font-bold text-blue">A</div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-text-primary leading-tight truncate">{mod.brand}</h1>
              <p className="text-[10px] text-text-muted truncate">{mod.subtitle}</p>
            </div>
          </div>
        </div>

        <nav className="p-2 pb-24 space-y-3">
          {mod.sections.map((section, si) => (
            <div key={si}>
              {section.title && (
                <p className="px-3 pt-2 pb-1 text-[9px] font-semibold uppercase tracking-wider text-text-muted">{section.title}</p>
              )}
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
          <button onClick={() => logout()} className="flex items-center gap-2 px-3 pb-3 text-xs text-text-muted hover:text-red transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
