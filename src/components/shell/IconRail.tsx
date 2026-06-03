import { Link, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { accessibleModules, moduleForPath } from './navConfig';
import { useAuth } from '../../lib/hooks/useAuth';

/** Helix icon rail — module switcher. Lives left of the sidebar. */
export function IconRail() {
  const { pathname } = useLocation();
  const { effectiveRole } = useAuth();
  const activeKey = moduleForPath(pathname).key;
  const modules = accessibleModules(effectiveRole);

  return (
    <aside className="rail panel">
      <div className="rail-brand" style={{ background: 'transparent', padding: 0, overflow: 'hidden' }}>
        <img src="/brand/antrac-mark.svg" alt="Antrac" width={36} height={36} style={{ display: 'block' }} />
      </div>
      <div className="rail-modules">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.key}
              to={m.root}
              className={`rail-btn${m.key === activeKey ? ' active' : ''}`}
              aria-label={m.brand}
            >
              <Icon />
              <span className="rail-tip">{m.brand.split(' ')[0] === 'Antrac' ? 'Holding' : m.brand}</span>
            </Link>
          );
        })}
      </div>
      <Link to="/settings" className={`rail-btn${pathname === '/settings' ? ' active' : ''}`} aria-label="Settings">
        <Settings />
        <span className="rail-tip">Settings</span>
      </Link>
    </aside>
  );
}
