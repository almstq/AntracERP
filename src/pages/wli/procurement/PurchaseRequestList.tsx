import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Search, ChevronRight, Plus } from 'lucide-react';
import { usePRList } from '../../../lib/hooks/useWorkflowData';
import { useAuth } from '../../../lib/hooks/useAuth';
import { purchaseRequestWorkflow } from '../../../lib/workflow/definitions';
import { procurementBase } from '../../../lib/services/procurement';
import type { PRStatus } from '../../../types/workflow-entities';

// Non-field roles who may raise a direct PR (field crew go through tickets).
const RAISER_ROLES = new Set([
  'supervisor', 'gm', 'proc_staff', 'finance_wli', 'inventory_staff',
  'director', 'cfo', 'antrac_finance', 'holding_hr', 'super_admin',
]);

const COLS = '1.6fr 1fr 1fr 1.3fr 24px';
const URGENCY_COLOR: Record<string, string> = {
  critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--info)', low: 'var(--text-muted)',
};

function prBadge(status: string): string {
  if (status === 'closed') return 'b-pos';
  if (status === 'rejected') return 'b-danger';
  if (status === 'gm_quote_approved' || status === 'po_raised') return 'b-accent';
  if (status === 'rfq_sent' || status === 'quotes_under_review') return 'b-warn';
  if (status === 'on_hold') return 'b-warn';
  return 'b-info';
}

export function PurchaseRequestList() {
  const { data: prs, loading } = usePRList();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const base = procurementBase(pathname);
  const { effectiveRole } = useAuth();
  const canRaise = RAISER_ROLES.has(effectiveRole);
  const [search, setSearch] = useState('');

  // Hide ticket-spawned on_hold PRs (managed via the ticket); show direct ones
  // (they're awaiting approval and need to be visible to the approver + requester).
  const visible = prs.filter((p) => p.status !== 'on_hold' || p.origin === 'direct');
  const pendingApproval = visible.filter((p) => p.status === 'on_hold').length;
  const sourcing = visible.filter((p) => ['rfq_sent', 'quotes_under_review'].includes(p.status)).length;
  const closed = visible.filter((p) => p.status === 'closed').length;

  const filtered = visible.filter((p) => {
    const q = search.trim().toLowerCase();
    return !q || p.displayId.toLowerCase().includes(q) || (p.title?.toLowerCase().includes(q) ?? false);
  });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Purchase Requests</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : `${visible.length} active`}</span>
          </p>
        </div>
        {canRaise && (
          <div className="head-actions">
            <Link className="btn btn-primary" to={`${base}/requests/new`}><Plus /> Raise PR</Link>
          </div>
        )}
      </div>

      <div className="sumbar">
        <div className="sumchip"><div className="sc-l">Active</div><div className="sc-v num">{visible.length}<span className="sc-sub">on desk</span></div></div>
        <div className="sumchip"><div className="sc-l">Pending Approval</div><div className="sc-v num" style={{ color: 'var(--warning)' }}>{pendingApproval}<span className="sc-sub">awaiting GM</span></div></div>
        <div className="sumchip"><div className="sc-l">Sourcing</div><div className="sc-v num" style={{ color: 'var(--info)' }}>{sourcing}<span className="sc-sub">RFQ / quotes</span></div></div>
        <div className="sumchip"><div className="sc-l">Closed</div><div className="sc-v num" style={{ color: 'var(--positive)' }}>{closed}<span className="sc-sub">PO raised</span></div></div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <Search />
          <input placeholder="Search purchase requests…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="tbl">
        <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
          <span>Request</span><span>Items</span><span>Urgency</span><span>Status</span><span />
        </div>
        {loading ? (
          <div className="tbl-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="tbl-empty">{search ? 'No results.' : 'No purchase requests yet. Raise one directly, or they appear here when a GM approves an issue ticket.'}</div>
        ) : (
          filtered.map((p) => (
            <button key={p.id} className="tbl-row" style={{ gridTemplateColumns: COLS }} onClick={() => navigate(`${base}/requests/${p.id}`)}>
              <div>
                <div className="tc-id">{p.displayId}</div>
                <div className="tc-desc">{p.origin === 'direct' ? (p.title || 'Direct request') : 'From issue ticket'}</div>
              </div>
              <div className="tc-txt">{p.lineItems?.length ?? 0} item(s)</div>
              <div className="urg" style={{ color: URGENCY_COLOR[p.urgency] ?? 'var(--text-muted)' }}>
                <i style={{ background: 'currentColor' }} />{p.urgency}
              </div>
              <div>
                <span className={`badge ${prBadge(p.status)}`}>
                  <span className="bdot" />{purchaseRequestWorkflow.statusLabels[p.status as PRStatus] ?? p.status}
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
