import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Plus, Search, ChevronRight } from 'lucide-react';
import { listEnquiries } from '../../../lib/services/crm';
import { formatDate } from '../../../lib/utils/format';
import type { Enquiry } from '../../../types/crm';

const COLS = '1.7fr 1.1fr 1fr 0.7fr 24px';

const STATUS_LABELS: Record<string, string> = {
  logged: 'Logged', availability_checked: 'Avail. Checked', gm_approved: 'GM Approved',
  quotation_drafted: 'Qtn Drafted', quotation_approved: 'Qtn Approved', quotation_sent: 'Qtn Sent',
  quote_accepted: 'Accepted → WO', quote_declined: 'Declined', follow_up: 'Follow-Up', closed: 'Closed',
};

function badge(status: string): string {
  if (status === 'closed') return 'b-muted';
  if (status === 'quote_declined') return 'b-danger';
  if (status === 'quote_accepted') return 'b-pos';
  if (['gm_approved', 'quotation_approved', 'quotation_sent'].includes(status)) return 'b-accent';
  if (['quotation_drafted', 'follow_up'].includes(status)) return 'b-warn';
  return 'b-info';
}

export function EnquiryList() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    listEnquiries('wli').then(e => { setEnquiries(e); setLoading(false); });
  }, []);

  const open = enquiries.filter(e => !['quote_declined', 'closed'].includes(e.status));
  const closed = enquiries.filter(e => ['quote_declined', 'closed'].includes(e.status));

  const filtered = !search
    ? enquiries
    : enquiries.filter(e =>
        e.displayId.toLowerCase().includes(search.toLowerCase()) ||
        e.projectName.toLowerCase().includes(search.toLowerCase()) ||
        e.customerName.toLowerCase().includes(search.toLowerCase())
      );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Sales Enquiries</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : `${open.length} open · ${closed.length} closed`}</span>
          </p>
        </div>
        <div className="head-actions">
          <Link to="/wli/crm/enquiries/new"><Button variant="primary" size="sm"><Plus size={14} /> New Enquiry</Button></Link>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <Search />
          <input placeholder="Search enquiries, projects, customers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="tbl">
        <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
          <span>Enquiry</span><span>Customer</span><span>Status</span><span>Assets</span><span />
        </div>
        {loading ? (
          <div className="tbl-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="tbl-empty">{search ? 'No results match your search.' : 'No enquiries yet. Log the first one.'}</div>
        ) : filtered.map(e => (
          <Link key={e.id} to={`/wli/crm/enquiries/${e.id}`} className="tbl-row" style={{ gridTemplateColumns: COLS }}>
            <div style={{ minWidth: 0 }}>
              <div className="tc-id">{e.displayId}</div>
              <div className="tc-desc">{e.projectName}</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="tc-txt">{e.customerName}</div>
              <div className="tc-sub">{formatDate(e.createdAt)}</div>
            </div>
            <div><span className={`badge ${badge(e.status)}`}><span className="bdot" />{STATUS_LABELS[e.status] ?? e.status}</span></div>
            <div className="tc-txt">{e.assetRequests.length} asset{e.assetRequests.length !== 1 ? 's' : ''}</div>
            <ChevronRight className="tc-chev" />
          </Link>
        ))}
      </div>
    </div>
  );
}
