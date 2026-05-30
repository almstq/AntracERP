import { ArrowRightLeft, Plus, Filter, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_INTERSBU_TRANSFERS } from '../../lib/mock-data/mpl-data';

const STATUS_MAP: Record<string, string> = {
  requested: 'Requested',
  approved: 'Approved',
  in_transit: 'In Transit',
  completed: 'Completed',
  rejected: 'Rejected',
};

export function InterSBUTransferList() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Inter-SBU Transfers</h1>
          <p className="text-xs text-text-muted">{MOCK_INTERSBU_TRANSFERS.length} transfers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Filter size={14} /> Filter</Button>
          <Button variant="primary" size="sm"><Plus size={14} /> New Transfer</Button>
        </div>
      </div>

      <Card>
        <div className="space-y-2">
          {MOCK_INTERSBU_TRANSFERS.map(transfer => (
            <div
              key={transfer.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <ArrowRightLeft size={16} className="text-text-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">
                    {transfer.assetName}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {transfer.id} · {transfer.fromSBU} → {transfer.toSBU} · {transfer.fromSite} → {transfer.toSite}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <StatusBadge status={STATUS_MAP[transfer.status] ?? transfer.status} />
                <Button variant="ghost" size="sm"><Eye size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
