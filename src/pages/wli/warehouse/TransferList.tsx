import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useStockTransfers } from '../../../lib/hooks/useInventory';
import type { TransferStatus } from '../../../types/inventory';
import { PageContainer } from '../../../components/shared/PageContainer';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';

const STATUS_STYLE: Record<TransferStatus, string> = {
  requested:  'bg-amber/10 text-amber',
  in_transit: 'bg-blue/10 text-blue',
  received:   'bg-green/10 text-green',
  cancelled:  'bg-bg-surface text-text-muted',
};

const STATUS_LABEL: Record<TransferStatus, string> = {
  requested:  'Requested',
  in_transit: 'In Transit',
  received:   'Received',
  cancelled:  'Cancelled',
};

function fmtDate(d: Date | undefined): string {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('en-MV', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function TransferList() {
  const { data: transfers, loading } = useStockTransfers();

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Stock Transfers</h1>
          <p className="text-xs text-text-muted">{loading ? 'Loading…' : `${transfers.length} transfers`}</p>
        </div>
        <Link to="/wli/warehouse/transfers/new">
          <Button variant="primary" size="sm"><Plus size={14} /> New Transfer</Button>
        </Link>
      </div>

      <Card>
        {loading ? (
          <LoadingSpinner text="Loading…" />
        ) : transfers.length === 0 ? (
          <p className="text-xs text-text-muted py-4 text-center">No transfers yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {transfers.map((tr) => (
              <Link
                key={tr.id}
                to={`/wli/warehouse/transfers/${tr.id}`}
                className="flex items-center gap-4 px-3 py-3 hover:bg-bg-surface transition-colors group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-text-primary">{tr.displayId}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[tr.status]}`}>
                      {STATUS_LABEL[tr.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-text-muted">{tr.fromStoreName}</span>
                    <ArrowRight size={10} className="text-text-muted" />
                    <span className="text-[10px] text-text-muted">{tr.toStoreName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-text-muted">{tr.lineItems?.length ?? 0} line{tr.lineItems?.length !== 1 ? 's' : ''}</p>
                  <p className="text-[10px] text-text-muted">{fmtDate(tr.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
