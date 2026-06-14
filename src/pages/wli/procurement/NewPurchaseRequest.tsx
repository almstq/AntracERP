import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { InputTextarea } from '../../../components/shared/InputTextarea';
import { PageContainer } from '../../../components/shared/PageContainer';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useSiteList } from '../../../lib/hooks/useWorkflowData';
import { createPurchaseRequest, procurementBase, type DirectPRLineInput } from '../../../lib/services/procurement';
import { useToast } from '../../../lib/context/ToastContext';
import type { Urgency } from '../../../types/workflow-entities';

const URGENCIES: Urgency[] = ['critical', 'urgent', 'routine'];
// Only WLI is an active operating SBU today; MPL is an approver, EMS is planned.
const SBUS = [{ id: 'sbu-wli', name: 'Well Land Investment' }];

const emptyLine = (): DirectPRLineInput => ({ description: '', kind: 'material', uom: 'pcs', quantity: 1, estimatedUnitPrice: 0 });

export function NewPurchaseRequest() {
  const { user, actor: authActor } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const base = procurementBase(pathname);
  const { data: sites } = useSiteList();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [sbuId, setSbuId] = useState('sbu-wli');
  const [siteId, setSiteId] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('routine');
  const [lines, setLines] = useState<DirectPRLineInput[]>([emptyLine()]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [costCenter, setCostCenter] = useState('WLI-PLANT');
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState('');

  const setLine = (i: number, patch: Partial<DirectPRLineInput>) =>
    setLines((arr) => arr.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const addLine = () => setLines((arr) => [...arr, emptyLine()]);
  const removeLine = (i: number) => setLines((arr) => (arr.length > 1 ? arr.filter((_, j) => j !== i) : arr));

  async function submit() {
    if (!user) return;
    if (!title.trim()) { setErr('Give the request a title.'); return; }
    if (!reason.trim()) { setErr('A justification (why it’s needed) is required.'); return; }
    if (!siteId) { setErr('Select where it’s needed.'); return; }
    const cleanLines = lines
      .filter((l) => l.description.trim())
      .map((l) => ({ 
        ...l, 
        description: l.description.trim(), 
        uom: l.uom.trim() || 'pcs', 
        quantity: Number(l.quantity) > 0 ? Number(l.quantity) : 1,
        estimatedUnitPrice: Number(l.estimatedUnitPrice) > 0 ? Number(l.estimatedUnitPrice) : undefined,
      }));
    if (cleanLines.length === 0) { setErr('Add at least one line item.'); return; }

    setBusy(true); setErr(null);
    try {
      const id = await createPurchaseRequest(
        { 
          title: title.trim(), 
          reason: reason.trim(), 
          sbuId, 
          siteId, 
          urgency, 
          lineItems: cleanLines,
          costCenter: costCenter.trim() || undefined,
          requestedDeliveryDate: requestedDeliveryDate ? new Date(requestedDeliveryDate) : undefined,
        },
        authActor!,
      );
      toast('success', 'Purchase request submitted for approval');
      navigate(`${base}/requests/${id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create request';
      setErr(msg);
      toast('error', msg);
      setBusy(false);
    }
  }

  return (
    <PageContainer className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link to={`${base}/requests`} aria-label="Back to purchase requests" className="text-text-muted hover:text-text-primary">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold text-text-primary">New Purchase Request</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-muted">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Office printer toner" className="mt-1" />
          </div>

          <div>
            <label className="text-xs text-text-muted">Justification — why is this needed? *</label>
            <InputTextarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="Explain the need so the approver has context…" className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted">For SBU *</label>
              <InputSelect className="mt-1" value={sbuId} onChange={(e) => setSbuId(e.target.value)}>
                {SBUS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </InputSelect>
            </div>
            <div>
              <label className="text-xs text-text-muted">Where is it needed? *</label>
              <InputSelect className="mt-1" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                <option value="">Select site…</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </InputSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted">Cost Center / Budget Code</label>
              <InputSelect className="mt-1" value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
                <option value="WLI-PLANT">WLI Plant Hire SBU</option>
                <option value="WLI-SHIPPING">WLI Marine Shipping SBU</option>
                <option value="WLI-HQ">WLI Male HQ Office</option>
                <option value="PROJECT-THILAFUSHI">Thilafushi Project Site</option>
                <option value="PROJECT-BODUFINOLHU">Bodufinolhu Resort Project</option>
                <option value="PROJECT-MUTHAAFUSHI">Muthaafushi Project Site</option>
                <option value="PROJECT-GOIDHOO">Goidhoo Infrastructure Project</option>
              </InputSelect>
            </div>
            <div>
              <label className="text-xs text-text-muted">Requested Delivery Date</label>
              <Input type="date" className="mt-1" value={requestedDeliveryDate} onChange={(e) => setRequestedDeliveryDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted">Urgency</label>
            <div className="flex gap-2 mt-1">
              {URGENCIES.map((u) => (
                <button key={u} onClick={() => setUrgency(u)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors capitalize ${
                    urgency === u
                      ? u === 'critical' ? 'bg-red/10 border-red text-red'
                        : u === 'urgent' ? 'bg-amber/10 border-amber text-amber'
                        : 'bg-teal/10 border-teal text-teal'
                      : 'border-border text-text-muted hover:text-text-primary'
                  }`}>
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-text-muted">Items / Services *</label>
              <button onClick={addLine} className="text-[11px] text-blue flex items-center gap-1"><Plus size={12} /> Add line</button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                  <Input value={l.description} onChange={(e) => setLine(i, { description: e.target.value })}
                    placeholder="Description" className="flex-1" />
                  <InputSelect value={l.kind} onChange={(e) => setLine(i, { kind: e.target.value as DirectPRLineInput['kind'] })} className="w-28">
                    <option value="material">Material</option>
                    <option value="service">Service</option>
                  </InputSelect>
                  <Input value={l.uom} onChange={(e) => setLine(i, { uom: e.target.value })} placeholder="uom" className="w-16" />
                  <Input type="number" min="1" value={String(l.quantity)} onChange={(e) => setLine(i, { quantity: Number(e.target.value) })} className="w-16" />
                  <Input type="number" placeholder="est. price" value={l.estimatedUnitPrice ? String(l.estimatedUnitPrice) : ''} 
                    onChange={(e) => setLine(i, { estimatedUnitPrice: Number(e.target.value) })} className="w-24" />
                  <button onClick={() => removeLine(i)} className="text-text-muted hover:text-red p-1" aria-label="Remove line" disabled={lines.length === 1}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {err && <p className="text-xs text-red">{err}</p>}

          <div className="flex gap-2 pt-1">
            <Button variant="primary" size="sm" className="flex-1" onClick={submit} disabled={busy}>
              {busy ? 'Submitting…' : 'Submit for Approval'}
            </Button>
            <Link to={`${base}/requests`}><Button variant="secondary" size="sm">Cancel</Button></Link>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
