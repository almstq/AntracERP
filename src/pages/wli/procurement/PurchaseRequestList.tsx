import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { Button } from '../../../components/ui/Button';
import { Plus, Filter, FileText, Eye } from 'lucide-react';
import { MOCK_TICKETS } from '../../../lib/mock-data/tickets';

// Derive purchase requests from tickets that are gm_approved
const mockPRs = MOCK_TICKETS
  .filter(t => t.status === 'gm_approved')
  .map((t, i) => ({
    id: `PR-2026-${String(i + 1).padStart(4, '0')}`,
    title: t.title,
    description: t.description,
    siteId: t.siteId,
    requestedBy: t.raisedById,
    status: 'pending' as const,
    priority: t.severity,
    itemCount: t.items.length,
    estimatedTotal: t.items.reduce((sum, item) => sum + item.quantity * 150, 0),
    createdAt: t.createdAt,
  }));

const STATUS_MAP: Record<string, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  converted_to_po: 'Converted to PO',
};

export function PurchaseRequestList() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Purchase Requests</h1>
          <p className="text-xs text-text-muted">{mockPRs.length} requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Filter size={14} /> Filter</Button>
          <Button variant="primary" size="sm"><Plus size={14} /> New PR</Button>
        </div>
      </div>

      <Card>
        <div className="space-y-1">
          {mockPRs.map(pr => (
            <div
              key={pr.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileText size={16} className="text-text-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{pr.title}</p>
                  <p className="text-[10px] text-text-muted">{pr.id} · {pr.siteId} · {pr.itemCount} items · ~${pr.estimatedTotal}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <PriorityBadge priority={pr.priority} />
                <StatusBadge status={STATUS_MAP[pr.status] || pr.status} />
                <Button variant="ghost" size="sm"><Eye size={14} /></Button>
              </div>
            </div>
          ))}
          {mockPRs.length === 0 && (
            <div className="text-center py-8 text-xs text-text-muted">No purchase requests yet</div>
          )}
        </div>
      </Card>
    </div>
  );
}
