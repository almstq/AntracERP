import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Briefcase, Plus } from 'lucide-react';
import { listEnquiries } from '../../../lib/services/crm';
import { formatDate } from '../../../lib/utils/format';
import type { Enquiry } from '../../../types/crm';

const STATUS_STYLE: Record<string, string> = {
  logged: 'bg-blue/10 text-blue',
  availability_checked: 'bg-cyan/10 text-cyan',
  gm_approved: 'bg-violet/10 text-violet',
  quotation_drafted: 'bg-amber/10 text-amber',
  quotation_approved: 'bg-teal/10 text-teal',
  quotation_sent: 'bg-teal/15 text-teal',
  quote_accepted: 'bg-teal/20 text-teal font-semibold',
  quote_declined: 'bg-red/10 text-red',
  follow_up: 'bg-amber/15 text-amber',
  closed: 'bg-border text-text-muted',
};

const STATUS_LABELS: Record<string, string> = {
  logged: 'Logged',
  availability_checked: 'Avail. Checked',
  gm_approved: 'GM Approved',
  quotation_drafted: 'Qtn Drafted',
  quotation_approved: 'Qtn Approved',
  quotation_sent: 'Qtn Sent',
  quote_accepted: 'Accepted → WO',
  quote_declined: 'Declined',
  follow_up: 'Follow-Up',
  closed: 'Closed',
};

export function EnquiryList() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEnquiries('wli').then(e => { setEnquiries(e); setLoading(false); });
  }, []);

  const open = enquiries.filter(e => !['quote_declined', 'closed'].includes(e.status));
  const closed = enquiries.filter(e => ['quote_declined', 'closed'].includes(e.status));

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Sales Enquiries</h1>
          <p className="text-xs text-text-muted">{loading ? 'Loading…' : `${open.length} open · ${closed.length} closed`}</p>
        </div>
        <Link to="/wli/crm/enquiries/new">
          <Button variant="primary" size="sm"><Plus size={14} /> New Enquiry</Button>
        </Link>
      </div>

      <Card>
        {loading ? (
          <div className="py-8 text-center text-xs text-text-muted">Loading…</div>
        ) : enquiries.length === 0 ? (
          <div className="py-10 text-center">
            <Briefcase size={28} className="mx-auto text-text-muted mb-2" />
            <p className="text-xs text-text-muted">No enquiries yet.</p>
            <Link to="/wli/crm/enquiries/new" className="text-xs text-blue hover:underline mt-1 block">Log first enquiry →</Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {enquiries.map(e => (
              <Link key={e.id} to={`/wli/crm/enquiries/${e.id}`}
                className="flex items-center justify-between p-3 hover:bg-bg-surface transition-colors group">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-text-primary">{e.displayId}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[e.status] ?? 'bg-border text-text-muted'}`}>
                      {STATUS_LABELS[e.status] ?? e.status}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate">{e.projectName}</p>
                  <p className="text-[10px] text-text-muted">{e.customerName} · {formatDate(e.createdAt)}</p>
                </div>
                <span className="text-[10px] text-text-muted group-hover:text-text-primary ml-4 flex-shrink-0">
                  {e.assetRequests.length} asset{e.assetRequests.length !== 1 ? 's' : ''} →
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
