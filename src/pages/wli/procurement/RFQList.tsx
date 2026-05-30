import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Plus, Filter, FileSearch, Eye } from 'lucide-react';
import { MOCK_RFQS } from '../../../lib/mock-data/procurement';

const STATUS_MAP: Record<string, string> = {
  open: 'Open',
  evaluating: 'Evaluating',
  awarded: 'Awarded',
  closed: 'Closed',
};

export function RFQList() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Requests for Quotation</h1>
          <p className="text-xs text-text-muted">{MOCK_RFQS.length} RFQs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Filter size={14} /> Filter</Button>
          <Button variant="primary" size="sm"><Plus size={14} /> New RFQ</Button>
        </div>
      </div>

      <Card>
        <div className="space-y-2">
          {MOCK_RFQS.map(rfq => (
            <div
              key={rfq.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileSearch size={16} className="text-text-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{rfq.title}</p>
                  <p className="text-[10px] text-text-muted">{rfq.id} · {rfq.vendorCount} vendors · Due {rfq.dueDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className="text-[10px] text-text-muted">{rfq.quotesReceived}/{rfq.vendorCount} quotes</span>
                <StatusBadge status={STATUS_MAP[rfq.status] || rfq.status} />
                <Button variant="ghost" size="sm"><Eye size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
