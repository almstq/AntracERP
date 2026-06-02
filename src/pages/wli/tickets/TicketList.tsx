import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Search, Ticket, Plus } from 'lucide-react';
import { useTicketList } from '../../../lib/hooks/useWorkflowData';
import { ticketWorkflow } from '../../../lib/workflow/definitions';
import type { TicketStatus } from '../../../types/workflow-entities';
import { PageContainer } from '../../../components/shared/PageContainer';

export function TicketList() {
  const { data: tickets, loading, error } = useTicketList();
  const [search, setSearch] = useState('');

  const filtered = !search
    ? tickets
    : tickets.filter(t => t.description.toLowerCase().includes(search.toLowerCase()) || t.displayId.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageContainer>
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

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-bg-surface border border-border text-text-primary"
          placeholder="Search…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Card>
        {!loading && filtered.length === 0 ? (
          <p className="text-xs text-text-muted p-2">{search ? 'No results match your search.' : 'No tickets yet. Raise the first one.'}</p>
        ) : (
          <div className="space-y-1">
            {filtered.map((t) => (
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
    </PageContainer>
  );
}
