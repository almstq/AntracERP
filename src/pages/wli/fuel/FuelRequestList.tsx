import { useState, useEffect } from 'react';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Fuel, Plus, Droplets, Search, ChevronRight } from 'lucide-react';
import { listFuelRequests } from '../../../lib/services/fuel';
import { listInventoryBalances } from '../../../lib/services/fuel';
import { formatDate } from '../../../lib/utils/format';
import type { FuelRequest, InventoryBalance } from '../../../types/workflow-entities';

const COLS = '1.9fr 1.1fr 0.8fr 0.9fr 24px';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', inventory_checked: 'Inventory Checked', gm_approved: 'GM Approved',
  mpl_accepted: 'MPL Accepted', director_approved: 'Director Approved', ready_for_collection: 'Ready for Collection',
  collected: 'Collected', closed: 'Closed', rejected: 'Rejected',
};

function badge(status: string): string {
  if (['draft', 'closed'].includes(status)) return 'b-muted';
  if (status === 'rejected') return 'b-danger';
  if (['gm_approved', 'collected'].includes(status)) return 'b-pos';
  if (['inventory_checked'].includes(status)) return 'b-accent';
  if (['mpl_accepted', 'director_approved', 'ready_for_collection'].includes(status)) return 'b-warn';
  return 'b-info';
}

const TYPE_ICON: Record<string, React.ReactElement> = {
  fuel:  <Fuel size={14} className="text-amber flex-shrink-0" />,
  water: <Droplets size={14} className="text-blue flex-shrink-0" />,
  both:  <Droplets size={14} className="text-teal flex-shrink-0" />,
};

const URGENCY_COLOR: Record<string, string> = {
  critical: 'var(--danger)', urgent: 'var(--warning)', routine: 'var(--text-muted)',
};

export function FuelRequestList() {
  const [requests, setRequests] = useState<(FuelRequest & { id: string })[]>([]);
  const [balances, setBalances] = useState<(InventoryBalance & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([listFuelRequests(), listInventoryBalances()])
      .then(([reqs, bals]) => { setRequests(reqs); setBalances(bals); })
      .finally(() => setLoading(false));
  }, []);

  const searched = !search
    ? requests
    : requests.filter(r =>
        r.displayId.toLowerCase().includes(search.toLowerCase()) ||
        r.siteId.toLowerCase().includes(search.toLowerCase()) ||
        (r.fuelType && r.fuelType.toLowerCase().includes(search.toLowerCase()))
      );

  const open   = searched.filter(r => !['closed'].includes(r.status));
  const closed = searched.filter(r => r.status === 'closed');

  const Row = ({ r, dim }: { r: FuelRequest & { id: string }; dim?: boolean }) => (
    <Link to={`/wli/fuel/requests/${r.id}`} className="tbl-row" style={{ gridTemplateColumns: COLS, opacity: dim ? 0.6 : 1 }}>
      <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        {TYPE_ICON[r.requestType]}
        <div style={{ minWidth: 0 }}>
          <div className="tc-id">{r.displayId}</div>
          <div className="tc-desc">{r.quantity} {r.uom}{r.fuelType ? ` · ${r.fuelType}` : ''} · {r.siteId}</div>
        </div>
      </div>
      <div><span className={`badge ${badge(r.status)}`}><span className="bdot" />{STATUS_LABELS[r.status] ?? r.status}</span></div>
      <div className="tc-txt" style={{ color: URGENCY_COLOR[r.urgency], fontWeight: 600 }}>{r.urgency}</div>
      <div className="tc-txt">{formatDate(r.createdAt)}</div>
      <ChevronRight className="tc-chev" />
    </Link>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Fuel &amp; Water Requests</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : `${open.length} open · ${closed.length} closed`}</span>
          </p>
        </div>
        <div className="head-actions">
          <Link to="/wli/fuel/requests/new"><Button variant="primary" size="sm"><Plus size={14} /> New Request</Button></Link>
        </div>
      </div>

      {!loading && balances.length > 0 && (
        <div className="sumbar">
          {balances.map(b => (
            <div key={b.id} className="sumchip">
              <div className="sc-l" style={{ textTransform: 'capitalize' }}>{b.item} ({b.uom})</div>
              <div className="sc-v num" style={{ color: 'var(--accent)' }}>{b.currentQty.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      <div className="toolbar">
        <div className="search-wrap">
          <Search />
          <input placeholder="Search requests, sites…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="section-head"><h2 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open Requests</h2></div>
      <div className="tbl" style={{ marginBottom: 22 }}>
        <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
          <span>Request</span><span>Status</span><span>Urgency</span><span>Created</span><span />
        </div>
        {loading ? (
          <div className="tbl-empty">Loading…</div>
        ) : open.length === 0 ? (
          <div className="tbl-empty">{search ? 'No results match your search.' : 'No open fuel or water requests.'}</div>
        ) : open.map(r => <Row key={r.id} r={r} />)}
      </div>

      {closed.length > 0 && (
        <>
          <div className="section-head"><h2 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Closed</h2></div>
          <div className="tbl">
            <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
              <span>Request</span><span>Status</span><span>Urgency</span><span>Created</span><span />
            </div>
            {closed.map(r => <Row key={r.id} r={r} dim />)}
          </div>
        </>
      )}
    </div>
  );
}
