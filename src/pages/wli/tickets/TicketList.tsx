import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Ticket, Plus } from 'lucide-react';
import { useTicketList } from '../../../lib/hooks/useWorkflowData';
import { ticketWorkflow } from '../../../lib/workflow/definitions';
import type { TicketStatus } from '../../../types/workflow-entities';

export function TicketList() {
  const { data: tickets, loading, error } = useTicketList();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Issue Tickets</h1>
          <p className="text-xs text-text-muted">{loading ? 'Loading…' : `${tickets.length} tickets`}</p>
        </div>
        <Link to="/wli/tickets/new">
          <Button variant="primary" size="sm"><Plus size={14} /> New Ticket</Button>
        </Link>
      </div>

      {error && <p className="text-xs text-red mb-3">{error}</p>}

      <Card>
        {!loading && tickets.length === 0 ? (
          <p className="text-xs text-text-muted p-2">No tickets yet. Raise the first one.</p>
        ) : (
          <div className="space-y-1">
            {tickets.map((t) => (
              <Link
                key={t.id}
                to={`/wli/tickets/${t.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Ticket size={16} className="text-text-muted flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{t.description || t.displayId}</p>
                    <p className="text-[10px] text-text-muted">{t.displayId} · {t.assetCode || '—'} · {t.siteId} · {t.urgency}</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-bg-surface text-text-secondary flex-shrink-0 ml-3">
                  {ticketWorkflow.statusLabels[t.status as TicketStatus] ?? t.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
