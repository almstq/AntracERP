import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import { useNotifications } from '../../lib/hooks/useWorkflowData';

export function NotificationBell() {
  const { effectiveRole } = useAuth();
  const { data: notifs } = useNotifications(effectiveRole);
  const [open, setOpen] = useState(false);
  const unread = notifs.filter((n) => !n.read);

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative text-text-secondary hover:text-text-primary">
        <Bell size={18} />
        {unread.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red text-white text-[9px] font-bold flex items-center justify-center">
            {unread.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-lg border border-border bg-bg-panel shadow-lg z-20">
          <div className="px-3 py-2 border-b border-border text-xs font-medium text-text-primary">Notifications</div>
          {notifs.length === 0 ? (
            <p className="p-3 text-xs text-text-muted">Nothing yet.</p>
          ) : (
            notifs.slice(0, 15).map((n) => (
              <div key={n.id} className={`px-3 py-2 border-b border-border-soft text-xs ${n.read ? 'text-text-muted' : 'text-text-primary'}`}>
                <p>{n.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
