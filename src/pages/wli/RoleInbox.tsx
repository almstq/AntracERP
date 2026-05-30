import { useParams, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Ticket as TicketIcon } from 'lucide-react';
import { useTicketList } from '../../lib/hooks/useWorkflowData';
import { ticketWorkflow } from '../../lib/workflow/definitions';
import { getAvailableTransitions } from '../../lib/workflow/engine';
import { ROLE_LABELS } from '../../lib/permissions/roles';
import type { TicketStatus } from '../../types/workflow-entities';

/**
 * Generic actor desk: lists the issue tickets currently awaiting action by the
 * role in the URL (e.g. /wli/desk/mechanic). Each actor's "what's on my plate".
 */
export function RoleInbox() {
  const { role = '' } = useParams();
  const { data: tickets, loading } = useTicketList();

  const actionable = tickets.filter(
    (t) => getAvailableTransitions(ticketWorkflow, t.status as TicketStatus, role).length > 0,
  );
  const label = ROLE_LABELS[role] ?? role;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-text-primary">{label} Desk</h1>
        <p className="text-xs text-text-muted">
          {loading ? 'Loading…' : `${actionable.length} item(s) awaiting your action`}
        </p>
      </div>

      <Card>
        {!loading && actionable.length === 0 ? (
          <p className="text-xs text-text-muted p-2">Nothing awaiting the {label.toLowerCase()} right now.</p>
        ) : (
          <div className="space-y-1">
            {actionable.map((t) => {
              const next = getAvailableTransitions(ticketWorkflow, t.status as TicketStatus, role);
              return (
                <Link key={t.id} to={`/wli/tickets/${t.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <TicketIcon size={16} className="text-text-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{t.description || t.displayId}</p>
                      <p className="text-[10px] text-text-muted">{t.displayId} · {t.assetCode || '—'} · {t.siteId} · {t.urgency}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {next.map((tr) => (
                      <span key={tr.action} className="text-[9px] px-2 py-1 rounded-full bg-blue/10 text-blue">{tr.label}</span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
