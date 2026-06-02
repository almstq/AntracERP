import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, Ticket, TrendingUp, Truck, Plus, ShoppingCart,
  Droplets, Fuel, FolderOpen, type LucideIcon,
} from 'lucide-react';

interface Cmd { t: string; s?: string; icon: LucideIcon; to: string }
interface Group { group: string; items: Cmd[] }

const GROUPS: Group[] = [
  { group: 'Jump to', items: [
    { t: 'Command Center', s: 'WLI', icon: LayoutDashboard, to: '/wli' },
    { t: 'Issue Tickets', s: 'Operations', icon: Ticket, to: '/wli/tickets' },
    { t: 'Sales Dashboard', s: 'CRM', icon: TrendingUp, to: '/wli/crm/sales' },
    { t: 'Asset Register', s: 'Registers', icon: Truck, to: '/wli/assets' },
    { t: 'Document Vault', s: 'Documents', icon: FolderOpen, to: '/wli/documents' },
  ]},
  { group: 'Actions', items: [
    { t: 'New Issue Ticket', s: '', icon: Plus, to: '/wli/tickets/new' },
    { t: 'Raise Purchase Request', s: '', icon: ShoppingCart, to: '/wli/procurement/requests' },
    { t: 'New Fuel Request', s: '', icon: Droplets, to: '/wli/fuel/requests/new' },
    { t: 'Switch module → MPL', s: '', icon: Fuel, to: '/mpl' },
  ]},
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQ(''); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return GROUPS;
    return GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.t.toLowerCase().includes(query)) }))
      .filter((g) => g.items.length > 0);
  }, [q]);

  if (!open) return null;

  const go = (to: string) => { onClose(); navigate(to); };

  return (
    <div className="cmdk-back" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmdk">
        <div className="cmdk-input">
          <Search />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tickets, customers, assets, actions…"
          />
          <span className="esc">ESC</span>
        </div>
        <div className="cmdk-list">
          {filtered.length === 0 && <div className="empty-note">No matches.</div>}
          {filtered.map((g, gi) => (
            <div key={gi}>
              <div className="cmdk-group">{g.group}</div>
              {g.items.map((it, i) => {
                const Icon = it.icon;
                return (
                  <button
                    key={it.t}
                    className={`cmdk-item${gi === 0 && i === 0 ? ' sel' : ''}`}
                    onClick={() => go(it.to)}
                  >
                    <Icon />
                    <span className="ci-t">{it.t}</span>
                    {it.s && <span className="ci-s">{it.s}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
