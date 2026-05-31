import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useSiteList } from '../../../lib/hooks/useWorkflowData';
import { createFuelRequest } from '../../../lib/services/fuel';
import type { FuelRequest, Urgency } from '../../../types/workflow-entities';

const SITES = ['thilafushi', 'bodufinolhu', 'muthaafushi', 'goidhoo', 'male-hq'];
const URGENCIES: Urgency[] = ['critical', 'urgent', 'routine'];

export function NewFuelRequest() {
  const { user, effectiveRole } = useAuth();
  const navigate = useNavigate();
  const { data: sites } = useSiteList();

  const [requestType, setRequestType] = useState<FuelRequest['requestType']>('fuel');
  const [fuelType, setFuelType] = useState<FuelRequest['fuelType']>('diesel');
  const [quantity, setQuantity] = useState('');
  const [uom, setUom] = useState<FuelRequest['uom']>('litres');
  const [siteId, setSiteId] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('routine');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const siteOptions = sites.length > 0
    ? sites.map(s => ({ id: s.id, name: s.name }))
    : SITES.map(s => ({ id: s, name: s }));

  async function submit() {
    if (!user) return;
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      setErr('Enter a valid quantity.'); return;
    }
    if (!siteId) { setErr('Select a site.'); return; }
    setBusy(true); setErr(null);
    try {
      const id = await createFuelRequest(
        {
          requestType,
          fuelType: requestType === 'water' ? undefined : fuelType,
          quantity: Number(quantity),
          uom,
          siteId,
          urgency,
          notes: notes || undefined,
        },
        { id: user.uid, role: effectiveRole, name: user.displayName },
      );
      navigate(`/wli/fuel/requests/${id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create request');
      setBusy(false);
    }
  }

  const field = 'w-full text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary';

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wli/fuel/requests" className="text-text-muted hover:text-text-primary">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold text-text-primary">New Fuel / Water Request</h1>
      </div>

      <Card>
        <div className="space-y-4">

          {/* Type */}
          <div>
            <label className="text-xs text-text-muted">Request Type *</label>
            <div className="flex gap-2 mt-1">
              {(['fuel', 'water', 'both'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setRequestType(t)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors capitalize ${
                    requestType === t
                      ? 'bg-blue/10 border-blue text-blue'
                      : 'border-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Fuel type (only for fuel/both) */}
          {requestType !== 'water' && (
            <div>
              <label className="text-xs text-text-muted">Fuel Type *</label>
              <select className={`${field} mt-1`} value={fuelType} onChange={e => setFuelType(e.target.value as FuelRequest['fuelType'])}>
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {/* Quantity + UOM */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted">Quantity *</label>
              <input
                type="number" min="1" value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="e.g. 500"
                className={`${field} mt-1`}
              />
            </div>
            <div>
              <label className="text-xs text-text-muted">Unit</label>
              <select className={`${field} mt-1`} value={uom} onChange={e => setUom(e.target.value as FuelRequest['uom'])}>
                <option value="litres">Litres</option>
                <option value="drums">Drums</option>
                <option value="tonnes">Tonnes</option>
              </select>
            </div>
          </div>

          {/* Site */}
          <div>
            <label className="text-xs text-text-muted">Delivery Site *</label>
            <select className={`${field} mt-1`} value={siteId} onChange={e => setSiteId(e.target.value)}>
              <option value="">Select site…</option>
              {siteOptions.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Urgency */}
          <div>
            <label className="text-xs text-text-muted">Urgency</label>
            <div className="flex gap-2 mt-1">
              {URGENCIES.map(u => (
                <button
                  key={u}
                  onClick={() => setUrgency(u)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors capitalize ${
                    urgency === u
                      ? u === 'critical' ? 'bg-red/10 border-red text-red'
                        : u === 'urgent' ? 'bg-amber/10 border-amber text-amber'
                        : 'bg-teal/10 border-teal text-teal'
                      : 'border-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-text-muted">Notes (optional)</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any context for the request…"
              rows={3}
              className={`${field} mt-1`}
            />
          </div>

          {err && <p className="text-xs text-red">{err}</p>}

          <div className="flex gap-2 pt-1">
            <Button variant="primary" size="sm" className="flex-1" onClick={submit} disabled={busy}>
              {busy ? 'Submitting…' : 'Create Request'}
            </Button>
            <Link to="/wli/fuel/requests">
              <Button variant="secondary" size="sm">Cancel</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
