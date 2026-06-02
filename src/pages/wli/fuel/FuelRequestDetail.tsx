import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { FileUpload } from '../../../components/shared/FileUpload';
import { ArrowLeft, Fuel, Droplets, Database } from 'lucide-react';
import { getFuelRequest, getInventoryBalance } from '../../../lib/services/fuel';
import { Timeline } from '../../../components/workflow/Timeline';
import { TransitionPanel } from '../../../components/workflow/TransitionPanel';
import { fuelRequestWorkflow } from '../../../lib/workflow/definitions';
import { formatDate } from '../../../lib/utils/format';
import type { FuelRequest, InventoryBalance, FuelRequestStatus } from '../../../types/workflow-entities';
import { PageContainer } from '../../../components/shared/PageContainer';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';

const STATUS_STYLE: Record<string, string> = {
  draft:                'bg-border text-text-muted',
  submitted:            'bg-blue/10 text-blue',
  inventory_checked:    'bg-violet/10 text-violet',
  gm_approved:          'bg-teal/10 text-teal',
  mpl_accepted:         'bg-amber/10 text-amber',
  director_approved:    'bg-amber/15 text-amber',
  ready_for_collection: 'bg-orange/10 text-orange',
  collected:            'bg-teal/15 text-teal',
  closed:               'bg-border text-text-muted',
  rejected:             'bg-red/10 text-red',
};

export function FuelRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<(FuelRequest & { id: string }) | null>(null);
  const [balance, setBalance] = useState<(InventoryBalance & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getFuelRequest(id)
      .then(async (req) => {
        setRequest(req);
        if (req) {
          const balId = req.requestType === 'water' ? 'water' : (req.fuelType ?? 'diesel');
          const bal = await getInventoryBalance(balId);
          setBalance(bal);
        }
        setError(null);
      })
      .catch(e => setError(e?.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  if (loading) return <LoadingSpinner text="Loading…" />;
  if (error)   return <div className="p-6 text-xs text-red">{error}</div>;
  if (!request) return <div className="p-6 text-xs text-text-muted">Request not found.</div>;

  const isWater = request.requestType === 'water';
  const TypeIcon = isWater ? Droplets : Fuel;
  const typeColor = isWater ? 'text-blue' : 'text-amber';

  return (
    <PageContainer className="max-w-4xl space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/wli/fuel/requests" aria-label="Back to fuel requests" className="text-text-muted hover:text-text-primary">
          <ArrowLeft size={18} />
        </Link>
        <nav className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <Link to="/wli/fuel/requests" className="hover:text-text-primary">Fuel Requests</Link>
          <span>/</span>
          <span className="text-text-secondary">{request.displayId}</span>
        </nav>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <TypeIcon size={16} className={typeColor} />
            <h1 className="text-lg font-bold text-text-primary capitalize">
              {request.requestType} Request
            </h1>
            <span className={`text-[10px] px-2 py-1 rounded-full ${STATUS_STYLE[request.status] ?? ''}`}>
              {fuelRequestWorkflow.statusLabels[request.status as FuelRequestStatus] ?? request.status}
            </span>
            <span className={`text-[10px] px-2 py-1 rounded-full bg-bg-surface ${
              request.urgency === 'critical' ? 'text-red' : request.urgency === 'urgent' ? 'text-amber' : 'text-text-muted'
            }`}>
              {request.urgency}
            </span>
          </div>
          <p className="text-xs text-text-muted">{request.displayId} · {request.siteId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">

          {/* Core details */}
          <Card header={<span className="text-sm font-medium">Request Details</span>}>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-text-muted">Type:</span>{' '}
                <span className="text-text-primary capitalize">{request.requestType}</span>
              </div>
              {request.fuelType && (
                <div>
                  <span className="text-text-muted">Fuel type:</span>{' '}
                  <span className="text-text-primary capitalize">{request.fuelType}</span>
                </div>
              )}
              <div>
                <span className="text-text-muted">Quantity:</span>{' '}
                <span className="text-text-primary">{request.quantity} {request.uom}</span>
              </div>
              <div>
                <span className="text-text-muted">Site:</span>{' '}
                <span className="text-text-primary">{request.siteId}</span>
              </div>
              <div>
                <span className="text-text-muted">Raised:</span>{' '}
                <span className="text-text-primary">{formatDate(request.createdAt)}</span>
              </div>
              <div>
                <span className="text-text-muted">Raised by:</span>{' '}
                <span className="text-text-primary">{request.raisedById}</span>
              </div>
              {request.assetId && (
                <div>
                  <span className="text-text-muted">Asset:</span>{' '}
                  <span className="text-text-primary">{request.assetId}</span>
                </div>
              )}
            </div>
            {request.notes && (
              <div className="mt-3 pt-3 border-t border-border text-xs">
                <p className="text-text-muted mb-1">Notes:</p>
                <p className="text-text-secondary">{request.notes}</p>
              </div>
            )}
          </Card>

          {/* Inventory check result */}
          {request.wliBalanceAtCheck != null && (
            <Card header={<span className="text-sm font-medium">Inventory Check</span>}>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-text-muted">Balance at check:</span>{' '}
                  <span className="text-text-primary">{request.wliBalanceAtCheck} {request.uom}</span>
                </div>
                <div>
                  <span className="text-text-muted">Available for release:</span>{' '}
                  <span className="text-text-primary">{request.availableQty ?? '—'} {request.uom}</span>
                </div>
              </div>
              {request.inventoryNotes && (
                <p className="text-xs text-text-secondary mt-2">{request.inventoryNotes}</p>
              )}
            </Card>
          )}

          {/* Collection details */}
          {request.collectionPoint && (
            <Card header={<span className="text-sm font-medium">Collection</span>}>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-text-muted">Collection point:</span>{' '}
                  <span className="text-text-primary">{request.collectionPoint}</span>
                </div>
                {request.validUntil && (
                  <div>
                    <span className="text-text-muted">Valid until:</span>{' '}
                    <span className="text-text-primary">{formatDate(request.validUntil)}</span>
                  </div>
                )}
                {request.quantityCollected != null && (
                  <div>
                    <span className="text-text-muted">Collected:</span>{' '}
                    <span className="text-text-primary font-semibold">
                      {request.quantityCollected} {request.uom}
                    </span>
                  </div>
                )}
                {request.collectedAt && (
                  <div>
                    <span className="text-text-muted">Collected at:</span>{' '}
                    <span className="text-text-primary">{formatDate(request.collectedAt)}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          <FileUpload
            collection="fuelRequests"
            entityId={request.id}
            entityDisplayId={request.displayId}
            attachments={(request as any).attachments ?? []}
            onUpdate={load}
            label="Collection Receipt & Photos"
            accept="image/*,.pdf"
          />

          <Timeline collection="fuelRequests" entityId={request.id} />
        </div>

        <div className="space-y-4">
          <TransitionPanel
            workflowId="fuel_request"
            entityId={request.id}
            status={request.status}
            onDone={load}
          />

          {/* Inventory balance card */}
          {balance && (
            <Card header={
              <span className="text-sm font-medium flex items-center gap-2">
                <Database size={14} /> WLI Stock
              </span>
            }>
              <p className={`text-2xl font-bold ${
                balance.currentQty < 500 ? 'text-red' :
                balance.currentQty < 1000 ? 'text-amber' : 'text-teal'
              }`}>
                {balance.currentQty.toLocaleString()}
              </p>
              <p className="text-[10px] text-text-muted capitalize mt-0.5">
                {balance.item} ({balance.uom})
              </p>
              <p className="text-[10px] text-text-muted mt-1">
                Updated {formatDate(balance.lastUpdated)}
              </p>
              {request.quantity > balance.currentQty && (
                <p className="text-[10px] text-red mt-2 font-medium">
                  Requested ({request.quantity}) exceeds current stock
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
