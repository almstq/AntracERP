import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PriorityBadge } from '../../components/shared/PriorityBadge';
import { Ticket } from 'lucide-react';

const mockTickets = [
  { id: 'IR-2026-0001', title: 'Excavator hydraulic leak', asset: 'EX-001', severity: 'high', status: 'mechanic_review', age: '2h' },
  { id: 'IR-2026-0002', title: 'Vessel engine overheating', asset: 'VS-003', severity: 'critical', status: 'open', age: '30m' },
  { id: 'IR-2026-0003', title: 'Generator fuel filter replacement', asset: 'GN-002', severity: 'medium', status: 'supervisor_review', age: '1d' },
  { id: 'IR-2026-0004', title: 'Crane wire rope inspection', asset: 'CR-001', severity: 'low', status: 'gm_approved', age: '3d' },
];

const stats = [
  { label: 'Open Tickets', value: '12', colorClass: 'text-blue' },
  { label: 'Pending Approvals', value: '5', colorClass: 'text-amber' },
  { label: 'Critical', value: '2', colorClass: 'text-red' },
  { label: 'Closed Today', value: '8', colorClass: 'text-teal' },
];

export function WLIDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary">WLI Dashboard</h1>
          <p className="text-xs text-text-muted">Welcome, {user?.displayName || 'User'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(stat => (
          <Card key={stat.label} className="text-center py-3">
            <p className={`text-xl font-bold ${stat.colorClass}`}>{stat.value}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Card header={<span className="text-sm font-medium">Recent Tickets</span>}>
        <div className="space-y-2">
          {mockTickets.map(ticket => (
            <Link
              key={ticket.id}
              to={`/wli/tickets/${ticket.id}`}
              className="flex items-center justify-between p-3 rounded-lg border border-border-soft hover:bg-bg-surface transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Ticket size={16} className="text-text-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{ticket.title}</p>
                  <p className="text-[10px] text-text-muted">{ticket.id} · {ticket.asset} · {ticket.age}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <PriorityBadge priority={ticket.severity} />
                <StatusBadge status={ticket.status} />
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
