import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Search, Bell, Inbox, Moon, Sun, Menu } from 'lucide-react';
import { moduleForPath } from './navConfig';
import { applyTheme } from '../../lib/prefs';

function currentLabel(pathname: string): string {
  const mod = moduleForPath(pathname);
  let best: { label: string; len: number } | null = null;
  for (const g of mod.groups) {
    for (const it of g.items) {
      const match = it.end ? pathname === it.to : pathname === it.to || pathname.startsWith(it.to + '/');
      if (match && (!best || it.to.length > best.len)) best = { label: it.label, len: it.to.length };
    }
  }
  return best?.label ?? mod.brand;
}

export function Topbar({ onOpenSearch, onOpenNav }: { onOpenSearch: () => void; onOpenNav: () => void }) {
  const { pathname } = useLocation();
  const mod = moduleForPath(pathname);
  const cur = currentLabel(pathname);
  const atRoot = cur === mod.brand;

  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'),
  );
  const flipTheme = () => { const next = theme === 'dark' ? 'light' : 'dark'; applyTheme(next); setTheme(next); };

  return (
    <div className="topbar">
      <button className="icon-btn shell-railtoggle" onClick={onOpenNav} aria-label="Open navigation" style={{ display: 'none' }}>
        <Menu />
      </button>
      <div className="crumb">
        <LayoutGrid className="home" />
        <Link to={mod.root}>{mod.brand}</Link>
        {!atRoot && <><span className="sep">/</span><span className="cur">{cur}</span></>}
        {atRoot && <><span className="sep">/</span><span className="cur">{cur === mod.brand ? 'Overview' : cur}</span></>}
      </div>

      <button className="searchbtn" onClick={onOpenSearch}>
        <Search />
        <span>Search or jump to…</span>
        <span className="kbd"><kbd>⌘</kbd><kbd>K</kbd></span>
      </button>

      <div className="top-actions">
        <button className="icon-btn" title="Notifications"><Bell /><span className="ping" /></button>
        <button className="icon-btn" title="Inbox"><Inbox /></button>
        <button className="icon-btn" title="Toggle theme" onClick={flipTheme}>
          {theme === 'dark' ? <Moon /> : <Sun />}
        </button>
      </div>
    </div>
  );
}
