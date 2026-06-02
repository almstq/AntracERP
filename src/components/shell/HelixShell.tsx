import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { IconRail } from './IconRail';
import { ShellSidebar } from './ShellSidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { moduleForPath } from './navConfig';

/** Helix floating-card shell: icon rail · sidebar · main(topbar + outlet). */
export function HelixShell({ banner }: { banner?: React.ReactNode }) {
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);

  // ⌘K / Ctrl-K toggles the palette; Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdkOpen((v) => !v);
      }
      if (e.key === 'Escape') setCmdkOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close mobile nav on route change.
  useEffect(() => { setNavOpen(false); }, [pathname]);

  const mod = moduleForPath(pathname);

  return (
    <div className={`app${navOpen ? ' nav-open' : ''}`}>
      {navOpen && <div className="shell-scrim" onClick={() => setNavOpen(false)} />}
      <IconRail />
      <ShellSidebar onNavigate={() => setNavOpen(false)} />

      <main className="main panel">
        {/* Mobile bar — only shows under 860px via CSS */}
        <div className="shell-mobilebar">
          <button className="icon-btn" onClick={() => setNavOpen(true)} aria-label="Open navigation"><Menu /></button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{mod.brand}</span>
        </div>

        <Topbar onOpenSearch={() => setCmdkOpen(true)} onOpenNav={() => setNavOpen(true)} />
        {banner}
        <div className="content">
          <Outlet />
        </div>
      </main>

      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} />
    </div>
  );
}
