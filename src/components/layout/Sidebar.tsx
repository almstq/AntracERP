import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/hooks/useAuth';
import { usePermissions } from '../../lib/hooks/usePermissions';
import { LayoutDashboard, Package, Users, Settings, LogOut, Menu, X, Building2 } from 'lucide-react';
import { ROLES } from '../../lib/permissions/roles';

interface AuthUser {
  displayName?: string;
  role?: string;
}

const navItems = [
  { to: '/holding', label: 'Holding', icon: Building2, roles: [ROLES.SUPER_ADMIN, ROLES.DIRECTOR, ROLES.HOLDING_FINANCE, ROLES.HOLDING_HR] },
  { to: '/wli', label: 'WLI', icon: LayoutDashboard, roles: [ROLES.WLI_GM, ROLES.WLI_SITE_MANAGER, ROLES.WLI_MECHANIC, ROLES.WLI_PROCUREMENT, ROLES.WLI_FINANCE, ROLES.SUPER_ADMIN] },
  { to: '/mpl', label: 'MPL', icon: Package, roles: [ROLES.MPL_MANAGER, ROLES.SUPER_ADMIN] },
  { to: '/ems', label: 'EMS', icon: Settings, roles: [ROLES.EMS_MANAGER, ROLES.SUPER_ADMIN] },
  { to: '/admin/users', label: 'Admin', icon: Users, roles: [ROLES.SUPER_ADMIN] },
];

export function Navbar() {
  const { user, logout } = useAuth() as { user: AuthUser | null; logout: () => Promise<void> };
  const { role } = usePermissions();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredItems = navItems.filter(item => (item.roles as readonly string[]).includes(role as string));

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-bg-panel">
        <span className="text-sm font-bold text-text-primary">Antrac ERP</span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-text-secondary">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <aside className={`${mobileOpen ? 'block' : 'hidden'} md:block w-56 bg-bg-panel border-r border-border flex-shrink-0 overflow-y-auto`}>
        <div className="p-4 border-b border-border">
          <h1 className="text-base font-bold text-text-primary">Antrac ERP</h1>
          <p className="text-[10px] text-text-muted mt-0.5">Antrac Holding</p>
        </div>

        <nav className="p-2 space-y-0.5">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue/10 text-blue'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border bg-bg-panel">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-blue/20 flex items-center justify-center text-[10px] font-bold text-blue">
              {user?.displayName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{user?.displayName}</p>
              <p className="text-[10px] text-text-muted truncate">{role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-text-muted hover:text-red transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
