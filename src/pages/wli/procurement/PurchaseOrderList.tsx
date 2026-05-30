import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Plus, Filter, ShoppingCart, Eye, Printer } from 'lucide-react';
import { MOCK_PURCHASE_ORDERS } from '../../../lib/mock-data/procurement';

const STATUS_MAP: Record<string, string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  in_progress: 'In Transit',
  delivered: 'Delivered',
  rejected: 'Rejected',
};

export function PurchaseOrderList() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Purchase Orders</h1>
          <p className="text-xs text-text-muted">
            {MOCK_PURCHASE_ORDERS.length} orders · Total: ${MOCK_PURCHASE_ORDERS.reduce((s, p) => s + p.total, 0).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Filter size={14} /> Filter</Button>
          <Button variant="primary" size="sm"><Plus size={14} /> New PO</Button>
        </div>
      </div>

      <Card>
        <div className="space-y-2">
          {MOCK_PURCHASE_ORDERS.map(po => (
            <div
              key={po.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <ShoppingCart size={16} className="text-text-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{po.vendor}</p>
                  <p className="text-[10px] text-text-muted">
                    {po.id} · {po.itemCount} items · {po.date}{po.rfqId ? ` · ${po.rfqId}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className="text-xs font-semibold text-text-primary">${po.total.toLocaleString()}</span>
                <StatusBadge status={STATUS_MAP[po.status] || po.status} />
                <Button variant="ghost" size="sm"><Printer size={14} /></Button>
                <Button variant="ghost" size="sm"><Eye size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
