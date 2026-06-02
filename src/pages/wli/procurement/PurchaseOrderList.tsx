import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { usePOList } from '../../../lib/hooks/useWorkflowData';
import { purchaseOrderWorkflow } from '../../../lib/workflow/definitions';
import type { POStatus } from '../../../types/workflow-entities';

const COLS = '1.5fr 1fr 0.9fr 1.4fr 24px';

function poBadge(status: string): string {
  if (status === 'po_closed') return 'b-pos';
  if (status === 'items_collected' || status === 'wli_finance_confirmed') return 'b-pos';
  if (status === 'payment_completed' || status === 'director_approved') return 'b-accent';
  if (status.includes('payment') || status === 'antrac_finance_accepted' || status === 'cfo_verified') return 'b-warn';
  if (status === 'raised' || status === 'supplier_confirmed') return 'b-info';
  return 'b-info';
}

export function PurchaseOrderList() {
  const { data: pos, loading } = usePOList();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const open = pos.filter((po) => po.status !== 'po_closed');
  const inPayment = pos.filter((po) => po.status.includes('payment') || ['antrac_finance_accepted', 'cfo_verified', 'director_approved'].includes(po.status)).length;
  const totalValue = pos.reduce((s, po) => s + (po.total ?? 0), 0);
  const closed = pos.filter((po) => po.status === 'po_closed').length;

  const filtered = pos.filter((po) => {
    const q = search.trim().toLowerCase();
    return !q || po.displayId.toLowerCase().includes(q) || po.supplierName.toLowerCase().includes(q);
  });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : `${open.length} open · ${pos.length} total`}</span>
          </p>
        </div>
      </div>

      <div className="sumbar">
        <div className="sumchip"><div className="sc-l">Open</div><div className="sc-v num">{open.length}<span className="sc-sub">of {pos.length}</span></div></div>
        <div className="sumchip"><div className="sc-l">In Payment</div><div className="sc-v num" style={{ color: 'var(--warning)' }}>{inPayment}<span className="sc-sub">chain running</span></div></div>
        <div className="sumchip"><div className="sc-l">Total Value</div><div className="sc-v num" style={{ color: 'var(--accent)' }}>{totalValue.toLocaleString()}<span className="sc-sub">MVR</span></div></div>
        <div className="sumchip"><div className="sc-l">Closed</div><div className="sc-v num" style={{ color: 'var(--positive)' }}>{closed}<span className="sc-sub">settled</span></div></div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <Search />
          <input placeholder="Search orders, suppliers…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="tbl">
        <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
          <span>Order</span><span>Value</span><span>Items</span><span>Status</span><span />
        </div>
        {loading ? (
          <div className="tbl-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="tbl-empty">{search ? 'No results.' : 'No purchase orders yet. POs are raised from an approved PR.'}</div>
        ) : (
          filtered.map((po) => (
            <button key={po.id} className="tbl-row" style={{ gridTemplateColumns: COLS }} onClick={() => navigate(`/wli/procurement/orders/${po.id}`)}>
              <div style={{ minWidth: 0 }}>
                <div className="tc-id">{po.displayId}</div>
                <div className="tc-desc">{po.supplierName}</div>
              </div>
              <div className="tc-txt mono">{po.currency} {po.total?.toLocaleString() ?? '0'}</div>
              <div className="tc-txt">{po.lineItems?.length ?? 0}</div>
              <div>
                <span className={`badge ${poBadge(po.status)}`}>
                  <span className="bdot" />{purchaseOrderWorkflow.statusLabels[po.status as POStatus] ?? po.status}
                </span>
              </div>
              <ChevronRight className="tc-chev" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
