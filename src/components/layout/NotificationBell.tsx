import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import { useNotifications } from '../../lib/hooks/useWorkflowData';
import { updateFields } from '../../lib/firebase/db';
import type { WorkflowNotification } from '../../lib/workflow/types';

/** Map a workflow + entity to the page that shows it. */
function pathFor(workflowId: string, entityId: string): string | null {
  switch (workflowId) {
    case 'ticket': return `/wli/tickets/${entityId}`;
    case 'purchase_request': return `/wli/procurement/requests/${entityId}`;
    case 'purchase_order': return `/wli/procurement/orders/${entityId}`;
    case 'fuel_request': return `/wli/fuel/requests/${entityId}`;
    case 'enquiry': return `/wli/crm/enquiries/${entityId}`;
    case 'work_order': return `/wli/crm/work-orders/${entityId}`;
    default: return null;
  }
}

export function NotificationBell() {
  const { effectiveRole } = useAuth();
  const { data: notifs, refresh } = useNotifications(effectiveRole);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const unread = notifs.filter((n) => !n.read);

  async function markRead(id?: string) {
    if (!id) return;
    try { await updateFields('notifications', id, { read: true }); refresh(); } catch { /* non-fatal */ }
  }

  async function markAll() {
    await Promise.allSettled(unread.map((n) => n.id && updateFields('notifications', n.id, { read: true })));
    refresh();
  }

  async function onClick(n: WorkflowNotification & { id?: string }) {
    setOpen(false);
    await markRead(n.id);
    const to = pathFor(n.workflowId, n.entityId);
    if (to) navigate(to);
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative text-text-secondary hover:text-text-primary" aria-label="Notifications">
        <Bell size={18} />
        {unread.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red text-white text-[9px] font-bold flex items-center justify-center">
            {unread.length}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-border bg-bg-panel shadow-lg z-20">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-medium text-text-primary">Notifications</span>
              {unread.length > 0 && (
                <button onClick={markAll} className="text-[10px] text-blue flex items-center gap-1 hover:opacity-80"><CheckCheck size={12} /> Mark all read</button>
              )}
            </div>
            {notifs.length === 0 ? (
              <p className="p-3 text-xs text-text-muted">Nothing yet.</p>
            ) : (
              [...notifs]
                .sort((a, b) => Number(!!a.read) - Number(!!b.read))
                .slice(0, 20)
                .map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onClick(n)}
                    className={`w-full text-left px-3 py-2 border-b border-border-soft text-xs hover:bg-bg-surface transition-colors ${n.read ? 'text-text-muted' : 'text-text-primary'}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue flex-shrink-0" />}
                      <div className="min-w-0">
                        {n.entityDisplayId && <span className="font-medium">{n.entityDisplayId} · </span>}
                        <span>{n.message}</span>
                      </div>
                    </div>
                  </button>
                ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
