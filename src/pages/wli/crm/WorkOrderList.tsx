import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { listWorkOrders } from '../../../lib/services/crm';
import { formatMoney } from '../../../lib/utils/money';
import { formatDate } from '../../../lib/utils/format';
import type { WorkOrder } from '../../../types/crm';

const COLS = '1.6fr 1fr 1.1fr 1fr 24px';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active', in_progress: 'In Progress', completed: 'Completed', invoiced: 'Invoiced',
  partially_paid: 'Partially Paid', fully_paid: 'Fully Paid', closed: 'Closed',
};

function badge(status: string): string {
  if (status === 'closed') return 'b-muted';
  if (status === 'fully_paid') return 'b-pos';
  if (status === 'partially_paid') return 'b-accent';
  if (['completed', 'invoiced'].includes(status)) return 'b-warn';
  return 'b-info';
}

export function WorkOrderList() {
  const [wos, setWos] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    listWorkOrders('wli').then(data => { setWos(data); setLoading(false); });
  }, []);

  const open   = wos.filter(w => w.status !== 'closed');
  const closed = wos.filter(w => w.status === 'closed');

  const filtered = !search
    ? wos
    : wos.filter(wo => wo.displayId.toLowerCase().includes(search.toLowerCase()) || wo.customerName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Work Orders</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : `${open.length} active · ${closed.length} closed`}</span>
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <Search />
          <input placeholder="Search work orders, customers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="tbl">
        <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
          <span>Work Order</span><span>Status</span><span>Period</span><span>Contract</span><span />
        </div>
        {loading ? (
          <div className="tbl-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="tbl-empty">{search ? 'No results match your search.' : 'No work orders yet. They are auto-created when a quotation is accepted.'}</div>
        ) : filtered.map(wo => (
          <Link key={wo.id} to={`/wli/crm/work-orders/${wo.id}`} className="tbl-row" style={{ gridTemplateColumns: COLS }}>
            <div style={{ minWidth: 0 }}>
              <div className="tc-id">{wo.displayId}</div>
              <div className="tc-desc">{wo.customerName}</div>
            </div>
            <div><span className={`badge ${badge(wo.status)}`}><span className="bdot" />{STATUS_LABELS[wo.status] ?? wo.status}</span></div>
            <div className="tc-txt">{formatDate(wo.startDate)}{wo.endDate ? ` → ${formatDate(wo.endDate)}` : ''}</div>
            <div className="tc-txt mono">{formatMoney(wo.contractValue, wo.currency as 'MVR' | 'USD')}</div>
            <ChevronRight className="tc-chev" />
          </Link>
        ))}
      </div>
    </div>
  );
}
