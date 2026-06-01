import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Briefcase } from 'lucide-react';
import { listWorkOrders } from '../../../lib/services/crm';
import { formatMoney } from '../../../lib/utils/money';
import { formatDate } from '../../../lib/utils/format';
import type { WorkOrder } from '../../../types/crm';
import { PageContainer } from '../../../components/shared/PageContainer';

const STATUS_STYLE: Record<string, string> = {
  active:          'bg-blue/10 text-blue',
  in_progress:     'bg-violet/10 text-violet',
  completed:       'bg-amber/10 text-amber',
  invoiced:        'bg-amber/15 text-amber',
  partially_paid:  'bg-teal/10 text-teal',
  fully_paid:      'bg-teal/20 text-teal',
  closed:          'bg-border text-text-muted',
};

const STATUS_LABELS: Record<string, string> = {
  active:         'Active',
  in_progress:    'In Progress',
  completed:      'Completed',
  invoiced:       'Invoiced',
  partially_paid: 'Partially Paid',
  fully_paid:     'Fully Paid',
  closed:         'Closed',
};

export function WorkOrderList() {
  const [wos, setWos] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listWorkOrders('wli').then(data => { setWos(data); setLoading(false); });
  }, []);

  const open   = wos.filter(w => w.status !== 'closed');
  const closed = wos.filter(w => w.status === 'closed');

  return (
    <PageContainer>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-text-primary">Work Orders</h1>
        <p className="text-xs text-text-muted">
          {loading ? 'Loading…' : `${open.length} active · ${closed.length} closed`}
        </p>
      </div>

      <Card>
        {loading ? (
          <div className="py-8 text-center text-xs text-text-muted">Loading…</div>
        ) : wos.length === 0 ? (
          <div className="py-10 text-center">
            <Briefcase size={28} className="mx-auto text-text-muted mb-2" />
            <p className="text-xs text-text-muted">No work orders yet.</p>
            <p className="text-[10px] text-text-muted mt-1">Work orders are auto-created when a quotation is accepted.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {wos.map(wo => (
              <Link key={wo.id} to={`/wli/crm/work-orders/${wo.id}`}
                className="flex items-center justify-between p-3 hover:bg-bg-surface transition-colors group">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-text-primary">{wo.displayId}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[wo.status] ?? 'bg-border text-text-muted'}`}>
                      {STATUS_LABELS[wo.status] ?? wo.status}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate">{wo.customerName}</p>
                  <p className="text-[10px] text-text-muted">
                    From {formatDate(wo.startDate)}
                    {wo.endDate ? ` → ${formatDate(wo.endDate)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className="text-right hidden md:block">
                    <p className="text-[9px] text-text-muted uppercase tracking-wide">Contract</p>
                    <p className="text-xs font-medium text-text-primary">
                      {formatMoney(wo.contractValue, wo.currency as 'MVR' | 'USD')}
                    </p>
                  </div>
                  <span className="text-[10px] text-text-muted group-hover:text-text-primary">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
