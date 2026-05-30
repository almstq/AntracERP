import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Ticket, Plus, List } from 'lucide-react';
import { useTicketList } from '../../lib/hooks/useWorkflowData';
import { ticketWorkflow } from '../../lib/workflow/definitions';
import type { TicketStatus } from '../../types/workflow-entities';

export function WLIDashboard() {
  const { user } = useAuth();
  const { data: tickets, loading } = useTicketList();

  const openCount = tickets.filter((t) => !['closed', 'rejected'].includes(t.status)).length;
  const approvedCount = tickets.filter((t) => t.status === 'gm_approved').length;
  const criticalCount = tickets.filter((t) => t.urgency === 'critical' && !['closed', 'rejected'].includes(t.status)).length;
  const closedCount = tickets.filter((t) => t.status === 'closed').length;

  const stats = [
    { label: 'Open', value: openCount, colorClass: 'text-blue' },
    { label: 'GM Approved', value: approvedCount, colorClass: 'text-amber' },
    { label: 'Critical', value: criticalCount, colorClass: 'text-red' },
    { label: 'Closed', value: closedCount, colorClass: 'text-teal' },
  ];

  const recent = [...tickets].slice(0, 6);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary">WLI Dashboard</h1>
          <p className="text-xs text-text-muted">Welcome, {user?.displayName || 'User'}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/wli/tickets"><Button variant="secondary" size="sm"><List size={14} /> All Tickets</Button></Link>
          <Link to="/wli/tickets/new"><Button variant="primary" size="sm"><Plus size={14} /> New Ticket</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="text-center py-3">
            <p className={`text-xl font-bold ${stat.colorClass}`}>{loading ? '—' : stat.value}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Card header={
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-medium">Recent Tickets</span>
          <Link to="/wli/tickets" className="text-[10px] text-blue">View all →</Link>
        </div>
      }>
        {loading ? (
          <p className="text-xs text-text-muted">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="text-xs text-text-muted">No tickets yet. <Link to="/wli/tickets/new" className="text-blue">Raise the first one →</Link></p>
        ) : (
          <div className="space-y-2">
            {recent.map((t) => (
              <Link
                key={t.id}
                to={`/wli/tickets/${t.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border-soft hover:bg-bg-surface transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Ticket size={16} className="text-text-muted flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{t.description || t.displayId}</p>
                    <p className="text-[10px] text-text-muted">{t.displayId} · {t.siteId} · {t.urgency}</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-bg-surface text-text-secondary flex-shrink-0 ml-2">
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
