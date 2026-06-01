import { Fuel, Plus, Filter, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_FUEL_DISPATCHES } from '../../lib/mock-data/mpl-data';
import { PageContainer } from '../../components/shared/PageContainer';

const STATUS_MAP: Record<string, string> = {
  requested: 'Requested',
  approved: 'Approved',
  dispensed: 'Dispensed',
  rejected: 'Rejected',
};

export function FuelDispatchList() {
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Fuel Dispatches</h1>
          <p className="text-xs text-text-muted">{MOCK_FUEL_DISPATCHES.length} dispatches</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Filter size={14} /> Filter</Button>
          <Button variant="primary" size="sm"><Plus size={14} /> New Dispatch</Button>
        </div>
      </div>

      <Card>
        <div className="space-y-2">
          {MOCK_FUEL_DISPATCHES.map(dispatch => (
            <div
              key={dispatch.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Fuel size={16} className="text-text-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">
                    {dispatch.assetTag} — {dispatch.assetType}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {dispatch.id} · {dispatch.requestedLiters}L {dispatch.fuelType} · {dispatch.siteName} · {dispatch.createdAt.slice(0, 10)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <StatusBadge status={STATUS_MAP[dispatch.status] ?? dispatch.status} />
                <Button variant="ghost" size="sm"><Eye size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}
