import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronsUpDown, LogOut, Sun, Moon, Settings, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import { useRoleRegistry } from '../../lib/permissions/roleRegistry';
import { accessibleModules, moduleForPath, navForRole } from './navConfig';
import { applyTheme } from '../../lib/prefs';
import { useUsers } from '../../lib/hooks/useUsers';

export function ShellSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, actingRole, setActingRole, effectiveRole } = useAuth();
  const { roles: allRoles } = useRoleRegistry();
  const { data: users } = useUsers();
  const actableRoles = allRoles.filter((r) => r.id !== 'super_admin' && r.id !== 'pending').sort((a, b) => a.label.localeCompare(b.label));
  const roleLabel = (role: string) => allRoles.find((r) => r.id === role)?.label ?? role;
  const roleAssignees = (role: string) => users.filter((u) => u.role === role).map((u) => u.displayName || u.email || u.id);
  const actOptionLabel = (role: string) => {
    const assignees = roleAssignees(role);
    return assignees.length ? `Act as: ${roleLabel(role)} - ${assignees.join(', ')}` : `Act as: ${roleLabel(role)} - unassigned`;
  };

  // Switching the impersonated role re-homes to that role's module via DeskRedirect,
  // so you never land on a page the new role can't open (/unauthorized).
  const onActAs = (role: string | null) => { setActingRole(role); navigate('/'); };
  const mod = moduleForPath(pathname);
  const nav = navForRole(mod, effectiveRole);
  const modules = accessibleModules(effectiveRole);
  const isSA = user?.role === 'super_admin';

  const isActive = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(to + '/');

  // Collapsed groups — seed from config defaults, but auto-open the active group.
  const initialCollapsed = useMemo(() => {
    const s = new Set<string>();
    for (const g of nav.groups) {
      if (g.title && g.collapsed && !g.items.some((i) => isActive(i.to, i.end))) s.add(g.title);
    }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod.key, effectiveRole]);
  const [collapsed, setCollapsed] = useState<Set<string>>(initialCollapsed);
  const toggle = (t: string) =>
    setCollapsed((c) => { const n = new Set(c); if (n.has(t)) n.delete(t); else n.add(t); return n; });

  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'),
  );
  const flipTheme = () => { const next = theme === 'dark' ? 'light' : 'dark'; applyTheme(next); setTheme(next); };

  return (
    <aside className="sidebar panel">
      {/* Module switcher strip — only rendered on mobile (hidden via CSS on desktop).
          Hidden entirely when the role can reach just one module. */}
      {modules.length > 1 && (
        <div className="side-modswitcher">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.key}
                to={m.root}
                onClick={onNavigate}
                className={`side-modbtn${m.key === mod.key ? ' active' : ''}`}
                aria-label={m.brand}
                title={m.brand}
              >
                <Icon />
              </Link>
            );
          })}
        </div>
      )}

      <div className="side-head">
        <div className="brand-lockup">
          <div className="brand-text">
            <h1>{mod.brand}</h1>
            <p>{mod.sub}</p>
          </div>
        </div>
      </div>

      <nav className="side-nav">
        {nav.groups.map((g, gi) => {
          const isCol = !!g.title && collapsed.has(g.title);
          return (
            <div key={gi} className={`nav-group${isCol ? ' collapsed' : ''}`}>
              {g.title && (
                <button className="group-head" onClick={() => toggle(g.title!)} aria-expanded={!isCol}>
                  <span>{g.title}</span>
                  <ChevronDown />
                </button>
              )}
              <div className="nav-items">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      onClick={onNavigate}
                      className={`nav-item${isActive(it.to, it.end) ? ' active' : ''}`}
                    >
                      <Icon />
                      <span>{it.label}</span>
                      {it.badge && <span className="badge-n">{it.badge}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="side-foot">
        <div className="actor">
          <div className="avatar">{user?.displayName?.charAt(0) ?? 'U'}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="a-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName ?? 'User'}
            </div>
            <div className="a-role">{user ? roleLabel(user.role) : ''}</div>
          </div>
          <ChevronsUpDown className="a-chev" />
        </div>

        {isSA && actingRole && (
          <div
            title="You are acting on behalf of another role. Actions you take are flagged as an admin override."
            style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
              background: 'var(--warning-soft)', color: 'var(--warning)',
              border: 'var(--hair) solid var(--warning)', borderRadius: 6,
              padding: '5px 8px', fontSize: 10.5, fontWeight: 600,
            }}
          >
            <ShieldAlert size={13} /> Admin override · acting as {roleLabel(actingRole)}
          </div>
        )}

        {isSA && (
          <select
            className="side-foot-sel"
            value={actingRole ?? ''}
            onChange={(e) => onActAs(e.target.value || null)}
            title="Act as / open a role's desk"
          >
            <option value="">Act as: Super Admin (self)</option>
            {actableRoles.map((r) => <option key={r.id} value={r.id}>{actOptionLabel(r.id)}</option>)}
          </select>
        )}

        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={flipTheme}>
            {theme === 'dark' ? <Sun /> : <Moon />} {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <Link className="btn btn-ghost" to="/settings" onClick={onNavigate} style={{ justifyContent: 'center' }} title="Settings">
            <Settings />
          </Link>
          <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => logout()} title="Log out">
            <LogOut />
          </button>
        </div>
      </div>
    </aside>
  );
}
