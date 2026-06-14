import { Fuel, Plus, Filter, Eye } from 'lucide-react';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_FUEL_DISPATCHES } from '../../lib/mock-data/mpl-data';

const STATUS_MAP: Record<string, string> = {
  requested: 'Requested', approved: 'Approved', dispensed: 'Dispensed', rejected: 'Rejected',
};
const COLS = '2.2fr 0.9fr 48px';

export function FuelDispatchList() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Fuel Dispatches</h1>
          <p className="page-sub"><span className="live"><i /> Live</span><span>{MOCK_FUEL_DISPATCHES.length} dispatches</span></p>
        </div>
        <div className="head-actions" style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm"><Filter size={14} /> Filter</Button>
          <Button variant="primary" size="sm"><Plus size={14} /> New Dispatch</Button>
        </div>
      </div>

      <div className="tbl">
        <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
          <span>Dispatch</span><span>Status</span><span />
        </div>
        {MOCK_FUEL_DISPATCHES.map(dispatch => (
          <div key={dispatch.id} className="tbl-row" style={{ gridTemplateColumns: COLS }}>
            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Fuel size={15} className="text-text-muted" />
              <div style={{ minWidth: 0 }}>
                <div className="tc-id">{dispatch.assetTag} — {dispatch.assetType}</div>
                <div className="tc-desc">{dispatch.id} · {dispatch.requestedLiters}L {dispatch.fuelType} · {dispatch.siteName} · {dispatch.createdAt.slice(0, 10)}</div>
              </div>
            </div>
            <div><StatusBadge status={STATUS_MAP[dispatch.status] ?? dispatch.status} /></div>
            <div style={{ justifySelf: 'end' }}><Button variant="ghost" size="sm"><Eye size={14} /></Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
