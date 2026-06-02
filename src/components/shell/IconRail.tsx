import { Link, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { MODULES, moduleForPath } from './navConfig';

/** Helix icon rail — module switcher. Lives left of the sidebar. */
export function IconRail() {
  const { pathname } = useLocation();
  const activeKey = moduleForPath(pathname).key;

  return (
    <aside className="rail panel">
      <div className="rail-brand">A</div>
      <div className="rail-modules">
        {MODULES.map((m) => {
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
      <button className="rail-btn" aria-label="Settings">
        <Settings />
        <span className="rail-tip">Settings</span>
      </button>
    </aside>
  );
}
