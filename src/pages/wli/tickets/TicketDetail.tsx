import { useParams, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/shared/EmptyState';
import { ArrowLeft } from 'lucide-react';

const mockTicket = {
  id: 'IR-2026-0001',
  title: 'Excavator hydraulic leak',
  description: 'Hydraulic fluid leaking from the main cylinder. Machine is currently down.',
  asset: 'EX-001 — Caterpillar 320D',
  site: 'Site A — Hulhumalé',
  severity: 'high',
  status: 'mechanic_review',
  raisedBy: 'Ahmed',
  raisedAt: '2 hours ago',
  items: [
    { description: 'Hydraulic cylinder seal kit', quantity: 1, type: 'material' },
    { description: 'Hydraulic fluid 20L', quantity: 2, type: 'material' },
  ],
  timeline: [
    { event: 'Ticket raised', actor: 'Ahmed', role: 'Site Manager', time: '2h ago', notes: '' },
    { event: 'Assigned to mechanic', actor: 'System', role: 'System', time: '2h ago', notes: '' },
  ],
};

export function TicketDetail() {
  const { id: _id } = useParams();
  const ticket = mockTicket;
  void _id;
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wli/tickets" className="text-text-muted hover:text-text-primary">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-text-primary truncate">{ticket.title}</h1>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.severity} />
          </div>
          <p className="text-xs text-text-muted">{ticket.id} · {ticket.asset}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card header={<span className="text-sm font-medium">Details</span>}>
            <p className="text-xs text-text-secondary mb-3">{ticket.description}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-text-muted">Asset:</span> <span className="text-text-primary">{ticket.asset}</span></div>
              <div><span className="text-text-muted">Site:</span> <span className="text-text-primary">{ticket.site}</span></div>
              <div><span className="text-text-muted">Raised by:</span> <span className="text-text-primary">{ticket.raisedBy}</span></div>
              <div><span className="text-text-muted">Age:</span> <span className="text-text-primary">{ticket.raisedAt}</span></div>
            </div>
          </Card>

          <Card header={<span className="text-sm font-medium">Items Required</span>}>
            <div className="space-y-2">
              {ticket.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-bg-surface text-xs">
                  <span className="text-text-primary">{item.description}</span>
                  <span className="text-text-muted">×{item.quantity} · {item.type}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card header={<span className="text-sm font-medium">Timeline</span>}>
            <div className="space-y-3">
              {ticket.timeline.map((event, i) => (
                <div key={i} className="flex gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-text-primary font-medium">{event.event}</p>
                    <p className="text-text-muted">{event.actor} · {event.role} · {event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card header={<span className="text-sm font-medium">Actions</span>}>
            <div className="space-y-2">
              <Button variant="primary" size="sm" className="w-full">Start Review</Button>
              <Button variant="secondary" size="sm" className="w-full">Request Clarification</Button>
              <Button variant="danger" size="sm" className="w-full">Reject</Button>
            </div>
          </Card>

          <Card header={<span className="text-sm font-medium">Documents</span>}>
            <EmptyState title="No documents" description="Upload photos, invoices, or receipts" />
          </Card>
        </div>
      </div>
    </div>
  );
}
