import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Fuel } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { MOCK_FUEL_DISPATCHES } from '../../lib/mock-data/mpl-data';

const STATUS_MAP: Record<string, string> = {
  requested: 'Requested',
  approved: 'Approved',
  dispensed: 'Dispensed',
  rejected: 'Rejected',
};

export function FuelDispatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = MOCK_FUEL_DISPATCHES.find(d => d.id === id);

  if (!dispatch) {
    return (
      <div className="p-6 text-center">
        <p className="text-text-muted text-sm">Dispatch not found.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate(-1)}>Back</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted text-xs mb-4 hover:text-text-primary">
        <ArrowLeft size={14} /> Back to Dispatches
      </button>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">{dispatch.id}</h1>
          <p className="text-xs text-text-muted">{dispatch.assetTag} — {dispatch.assetType}</p>
        </div>
        <StatusBadge status={STATUS_MAP[dispatch.status] ?? dispatch.status} />
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div><p className="text-text-muted mb-1">Fuel Type</p><p className="text-text-primary font-medium capitalize">{dispatch.fuelType}</p></div>
          <div><p className="text-text-muted mb-1">Requested</p><p className="text-text-primary font-medium">{dispatch.requestedLiters}L</p></div>
          <div><p className="text-text-muted mb-1">Dispensed</p><p className="text-text-primary font-medium">{dispatch.dispensedLiters}L</p></div>
          <div><p className="text-text-muted mb-1">Cost (MVR)</p><p className="text-text-primary font-medium">{dispatch.cost.toLocaleString()}</p></div>
          <div><p className="text-text-muted mb-1">Site</p><p className="text-text-primary font-medium">{dispatch.siteName}</p></div>
          <div><p className="text-text-muted mb-1">Date</p><p className="text-text-primary font-medium">{dispatch.createdAt.slice(0, 10)}</p></div>
          {dispatch.notes && (
            <div className="col-span-2"><p className="text-text-muted mb-1">Notes</p><p className="text-text-primary">{dispatch.notes}</p></div>
          )}
          <div className="col-span-2 pt-2 border-t border-border">
            <p className="text-[10px] text-text-muted flex items-center gap-1">
              <Fuel size={12} /> Full Firestore integration coming in Phase 2B.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
