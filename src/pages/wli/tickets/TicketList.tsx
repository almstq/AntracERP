import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { Button } from '../../../components/ui/Button';
import { Ticket, Plus, Filter } from 'lucide-react';

const mockTickets = [
  { id: 'IR-2026-0001', title: 'Excavator hydraulic leak', asset: 'EX-001', severity: 'high', status: 'mechanic_review', site: 'Site A', age: '2h', raisedBy: 'Ahmed' },
  { id: 'IR-2026-0002', title: 'Vessel engine overheating', asset: 'VS-003', severity: 'critical', status: 'open', site: 'Harbor', age: '30m', raisedBy: 'Ibrahim' },
  { id: 'IR-2026-0003', title: 'Generator fuel filter replacement', asset: 'GN-002', severity: 'medium', status: 'supervisor_review', site: 'Site B', age: '1d', raisedBy: 'Hassan' },
  { id: 'IR-2026-0004', title: 'Crane wire rope inspection', asset: 'CR-001', severity: 'low', status: 'gm_approved', site: 'Site A', age: '3d', raisedBy: 'Ali' },
  { id: 'IR-2026-0005', title: 'Bulldozer track damage', asset: 'BD-001', severity: 'high', status: 'open', site: 'Site C', age: '4h', raisedBy: 'Mustarq' },
];

export function TicketList() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Issue Tickets</h1>
          <p className="text-xs text-text-muted">{mockTickets.length} tickets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Filter size={14} /> Filter</Button>
          <Button variant="primary" size="sm"><Plus size={14} /> New Ticket</Button>
        </div>
      </div>

      <Card>
        <div className="space-y-1">
          {mockTickets.map(ticket => (
            <Link
              key={ticket.id}
              to={`/wli/tickets/${ticket.id}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Ticket size={16} className="text-text-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{ticket.title}</p>
                  <p className="text-[10px] text-text-muted">{ticket.id} · {ticket.asset} · {ticket.site} · {ticket.raisedBy} · {ticket.age}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
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
