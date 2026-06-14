import { ArrowRightLeft, Plus, Filter, Eye } from 'lucide-react';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_INTERSBU_TRANSFERS } from '../../lib/mock-data/mpl-data';

const STATUS_MAP: Record<string, string> = {
  requested: 'Requested', approved: 'Approved', in_transit: 'In Transit', completed: 'Completed', rejected: 'Rejected',
};
const COLS = '2.2fr 0.9fr 48px';

export function InterSBUTransferList() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Inter-SBU Transfers</h1>
          <p className="page-sub"><span className="live"><i /> Live</span><span>{MOCK_INTERSBU_TRANSFERS.length} transfers</span></p>
        </div>
        <div className="head-actions" style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm"><Filter size={14} /> Filter</Button>
          <Button variant="primary" size="sm"><Plus size={14} /> New Transfer</Button>
        </div>
      </div>

      <div className="tbl">
        <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
          <span>Transfer</span><span>Status</span><span />
        </div>
        {MOCK_INTERSBU_TRANSFERS.map(transfer => (
          <div key={transfer.id} className="tbl-row" style={{ gridTemplateColumns: COLS }}>
            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <ArrowRightLeft size={15} className="text-text-muted" />
              <div style={{ minWidth: 0 }}>
                <div className="tc-id">{transfer.assetName}</div>
                <div className="tc-desc">{transfer.id} · {transfer.fromSBU} → {transfer.toSBU} · {transfer.fromSite} → {transfer.toSite}</div>
              </div>
            </div>
            <div><StatusBadge status={STATUS_MAP[transfer.status] ?? transfer.status} /></div>
            <div style={{ justifySelf: 'end' }}><Button variant="ghost" size="sm"><Eye size={14} /></Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
