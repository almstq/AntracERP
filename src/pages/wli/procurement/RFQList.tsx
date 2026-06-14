import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { Plus, Filter, FileSearch, Eye } from 'lucide-react';
import { MOCK_RFQS } from '../../../lib/mock-data/procurement';

const STATUS_MAP: Record<string, string> = {
  open: 'Open', evaluating: 'Evaluating', awarded: 'Awarded', closed: 'Closed',
};
const COLS = '2fr 0.9fr 0.9fr 48px';

export function RFQList() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Requests for Quotation</h1>
          <p className="page-sub"><span className="live"><i /> Live</span><span>{MOCK_RFQS.length} RFQs</span></p>
        </div>
        <div className="head-actions" style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm"><Filter size={14} /> Filter</Button>
          <Button variant="primary" size="sm"><Plus size={14} /> New RFQ</Button>
        </div>
      </div>

      <div className="tbl">
        <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
          <span>RFQ</span><span>Quotes</span><span>Status</span><span />
        </div>
        {MOCK_RFQS.map(rfq => (
          <div key={rfq.id} className="tbl-row" style={{ gridTemplateColumns: COLS }}>
            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileSearch size={15} className="text-text-muted" />
              <div style={{ minWidth: 0 }}>
                <div className="tc-id">{rfq.title}</div>
                <div className="tc-desc">{rfq.id} · {rfq.vendorCount} vendors · Due {rfq.dueDate}</div>
              </div>
            </div>
            <div className="tc-txt">{rfq.quotesReceived}/{rfq.vendorCount}</div>
            <div><StatusBadge status={STATUS_MAP[rfq.status] || rfq.status} /></div>
            <div style={{ justifySelf: 'end' }}><Button variant="ghost" size="sm"><Eye size={14} /></Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
