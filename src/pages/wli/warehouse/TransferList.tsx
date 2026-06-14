import { Link } from 'react-router-dom';
import { ArrowRight, Plus, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useStockTransfers } from '../../../lib/hooks/useInventory';
import type { TransferStatus } from '../../../types/inventory';

const COLS = '1.9fr 0.9fr 0.7fr 0.9fr 24px';

const STATUS_LABEL: Record<TransferStatus, string> = {
  requested: 'Requested', in_transit: 'In Transit', received: 'Received', cancelled: 'Cancelled',
};

function badge(status: TransferStatus): string {
  if (status === 'received') return 'b-pos';
  if (status === 'in_transit') return 'b-info';
  if (status === 'cancelled') return 'b-muted';
  return 'b-warn';
}

function fmtDate(d: Date | undefined): string {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('en-MV', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function TransferList() {
  const { data: transfers, loading } = useStockTransfers();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Stock Transfers</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : `${transfers.length} transfers`}</span>
          </p>
        </div>
        <div className="head-actions">
          <Link to="/wli/warehouse/transfers/new"><Button variant="primary" size="sm"><Plus size={14} /> New Transfer</Button></Link>
        </div>
      </div>

      <div className="tbl">
        <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
          <span>Transfer</span><span>Status</span><span>Lines</span><span>Created</span><span />
        </div>
        {loading ? (
          <div className="tbl-empty">Loading…</div>
        ) : transfers.length === 0 ? (
          <div className="tbl-empty">No transfers yet.</div>
        ) : transfers.map((tr) => (
          <Link key={tr.id} to={`/wli/warehouse/transfers/${tr.id}`} className="tbl-row" style={{ gridTemplateColumns: COLS }}>
            <div style={{ minWidth: 0 }}>
              <div className="tc-id">{tr.displayId}</div>
              <div className="tc-desc" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {tr.fromStoreName} <ArrowRight size={10} /> {tr.toStoreName}
              </div>
            </div>
            <div><span className={`badge ${badge(tr.status)}`}><span className="bdot" />{STATUS_LABEL[tr.status]}</span></div>
            <div className="tc-txt">{tr.lineItems?.length ?? 0} line{tr.lineItems?.length !== 1 ? 's' : ''}</div>
            <div className="tc-txt">{fmtDate(tr.createdAt)}</div>
            <ChevronRight className="tc-chev" />
          </Link>
        ))}
      </div>
    </div>
  );
}
