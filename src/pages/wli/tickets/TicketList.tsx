import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronRight } from 'lucide-react';
import { useTicketList } from '../../../lib/hooks/useWorkflowData';
import { ticketWorkflow } from '../../../lib/workflow/definitions';
import type { TicketStatus } from '../../../types/workflow-entities';

const URGENCY_COLOR: Record<string, string> = {
  critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--info)', low: 'var(--text-muted)',
};

function statusBadge(status: string): string {
  if (status === 'closed') return 'b-muted';
  if (status === 'rejected') return 'b-danger';
  if (status === 'gm_approved' || status === 'resolved' || status === 'items_delivered') return 'b-pos';
  if (status === 'supervisor_checked') return 'b-accent';
  if (status === 'submitted' || status === 'diagnosed') return 'b-warn';
  return 'b-info';
}

const CHIPS: [string, string][] = [
  ['all', 'All'], ['open', 'Open'], ['supervisor_checked', 'Awaiting GM'],
  ['gm_approved', 'Approved'], ['closed', 'Closed'],
];

export function TicketList() {
  const { data: tickets, loading, error } = useTicketList();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState('all');

  const active = tickets.filter((t) => !['closed', 'rejected'].includes(t.status));
  const critical = active.filter((t) => t.urgency === 'critical').length;
  const awaitingGm = tickets.filter((t) => t.status === 'supervisor_checked').length;
  const resolved = tickets.filter((t) => ['gm_approved', 'resolved', 'closed'].includes(t.status)).length;

  const filtered = tickets.filter((t) => {
    const okChip = chip === 'all'
      ? true
      : chip === 'open' ? !['closed', 'rejected'].includes(t.status)
      : t.status === chip;
    const q = search.trim().toLowerCase();
    const okQ = !q || `${t.displayId} ${t.description} ${t.assetCode ?? ''} ${t.siteId ?? ''}`.toLowerCase().includes(q);
    return okChip && okQ;
  });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Issue Tickets</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : `${active.length} open · ${tickets.length} total`}</span>
          </p>
        </div>
        <div className="head-actions">
          <Link className="btn btn-primary" to="/wli/tickets/new"><Plus /> New Ticket</Link>
        </div>
      </div>

      {error && <p className="empty-note" style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="sumbar">
        <div className="sumchip"><div className="sc-l">Open</div><div className="sc-v num">{active.length}<span className="sc-sub">of {tickets.length}</span></div></div>
        <div className="sumchip"><div className="sc-l">Critical</div><div className="sc-v num" style={{ color: 'var(--danger)' }}>{critical}<span className="sc-sub">needs mobilise</span></div></div>
        <div className="sumchip"><div className="sc-l">Awaiting GM</div><div className="sc-v num" style={{ color: 'var(--accent)' }}>{awaitingGm}<span className="sc-sub">your desk</span></div></div>
        <div className="sumchip"><div className="sc-l">Resolved</div><div className="sc-v num" style={{ color: 'var(--positive)' }}>{resolved}<span className="sc-sub">approved+closed</span></div></div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <Search />
          <input placeholder="Search tickets, assets, sites…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="chips">
          {CHIPS.map(([k, label]) => (
            <button key={k} className={`chip${chip === k ? ' on' : ''}`} onClick={() => setChip(k)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="tbl">
        <div className="tbl-head">
          <span>Ticket</span><span className="col-md">Asset</span><span>Site</span>
          <span>Urgency</span><span>Status</span><span className="col-md">Updated</span><span />
        </div>
        {loading ? (
          <div className="tbl-empty">Loading tickets…</div>
        ) : filtered.length === 0 ? (
          <div className="tbl-empty">{search || chip !== 'all' ? 'No tickets match your filters.' : 'No tickets yet. Raise the first one.'}</div>
        ) : (
          filtered.map((t) => (
            <button key={t.id} className="tbl-row" onClick={() => navigate(`/wli/tickets/${t.id}`)}>
              <div style={{ minWidth: 0 }}>
                <div className="tc-id">{t.displayId}</div>
                <div className="tc-desc">{t.description || '—'}</div>
              </div>
              <div className="col-md" style={{ minWidth: 0 }}>
                <div className="tc-txt mono">{t.assetCode || '—'}</div>
              </div>
              <div className="tc-txt">{t.siteId || '—'}</div>
              <div className="urg" style={{ color: URGENCY_COLOR[t.urgency] ?? 'var(--text-muted)' }}>
                <i style={{ background: 'currentColor' }} />{t.urgency}
              </div>
              <div>
                <span className={`badge ${statusBadge(t.status)}`}>
                  <span className="bdot" />{ticketWorkflow.statusLabels[t.status as TicketStatus] ?? t.status}
                </span>
              </div>
              <div className="tc-sub col-md">{t.updatedAt ? new Date(t.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}</div>
              <ChevronRight className="tc-chev" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
