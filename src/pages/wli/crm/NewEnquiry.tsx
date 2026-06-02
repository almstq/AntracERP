import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { InputTextarea } from '../../../components/shared/InputTextarea';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { listCustomers, createEnquiry } from '../../../lib/services/crm';
import { useAuth } from '../../../lib/hooks/useAuth';
import type { Customer, EnquiryAssetRequest } from '../../../types/crm';
import { PageContainer } from '../../../components/shared/PageContainer';
import { useToast } from '../../../lib/context/ToastContext';

const BLANK_REQUEST: EnquiryAssetRequest = {
  assetType: '', quantity: 1, notes: '',
};

export function NewEnquiry() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [mobilisation, setMobilisation] = useState('');
  const [demobilisation, setDemobilisation] = useState('');
  const [notes, setNotes] = useState('');
  const [requests, setRequests] = useState<EnquiryAssetRequest[]>([{ ...BLANK_REQUEST }]);

  useEffect(() => {
    listCustomers('wli').then(setCustomers);
  }, []);

  function addRequest() {
    setRequests(r => [...r, { ...BLANK_REQUEST }]);
  }

  function removeRequest(i: number) {
    if (!window.confirm('Remove this asset request?')) return;
    setRequests(r => r.filter((_, idx) => idx !== i));
  }

  function updateRequest<K extends keyof EnquiryAssetRequest>(i: number, key: K, val: EnquiryAssetRequest[K]) {
    setRequests(r => r.map((req, idx) => idx === i ? { ...req, [key]: val } : req));
  }

  async function submit() {
    if (!customerId) { setErr('Select a customer'); return; }
    if (!projectName.trim()) { setErr('Project name required'); return; }
    if (requests.some(r => !r.assetType.trim())) { setErr('All asset requests need a type'); return; }

    setBusy(true); setErr(null);
    try {
      const customer = customers.find(c => c.id === customerId)!;
      const id = await createEnquiry({
        orgId: user?.orgId ?? 'antrac',
        sbuId: 'wli',
        customerId,
        customerName: customer.name,
        status: 'logged',
        projectName: projectName.trim(),
        projectLocation: projectLocation.trim() || undefined,
        mobilisationDate: mobilisation ? new Date(mobilisation) : undefined,
        demobilisationDate: demobilisation ? new Date(demobilisation) : undefined,
        notes: notes.trim() || undefined,
        assetRequests: requests.map(r => ({
          assetType: r.assetType.trim(),
          quantity: r.quantity,
          notes: r.notes?.trim() || undefined,
        })),
        raisedById: user?.uid ?? 'unknown',
      });
      toast('success', 'Enquiry logged');
      nav(`/wli/crm/enquiries/${id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setErr(msg);
      toast('error', msg);
    }
    finally { setBusy(false); }
  }

  return (
    <PageContainer className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wli/crm/enquiries" aria-label="Back to enquiries" className="text-text-muted hover:text-text-primary"><ArrowLeft size={18} /></Link>
        <h1 className="text-lg font-bold text-text-primary">New Enquiry</h1>
      </div>

      <Card header={<span className="text-sm font-medium">Customer & Project</span>}>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wide mb-1 block">Customer *</label>
            <InputSelect value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">— Select customer —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </InputSelect>
            {customers.length === 0 && (
              <p className="text-[10px] text-text-muted mt-1">
                No customers yet. <Link to="/wli/crm/customers" className="text-blue hover:underline">Add a customer first →</Link>
              </p>
            )}
          </div>
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wide mb-1 block">Project Name *</label>
            <Input placeholder="e.g. Bodufinolhu Reclamation Phase 2" value={projectName} onChange={e => setProjectName(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wide mb-1 block">Project Location</label>
            <Input placeholder="e.g. Bodufinolhu, B. Atoll" value={projectLocation} onChange={e => setProjectLocation(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wide mb-1 block">Mobilisation Date</label>
              <Input type="date" value={mobilisation} onChange={e => setMobilisation(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wide mb-1 block">Demobilisation Date</label>
              <Input type="date" value={demobilisation} onChange={e => setDemobilisation(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wide mb-1 block">Notes</label>
            <InputTextarea className="h-16 resize-none" placeholder="Scope details, special requirements…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card header={
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-medium">Asset Requirements</span>
          <button onClick={addRequest} className="flex items-center gap-1 text-[11px] text-blue hover:underline">
            <Plus size={12} /> Add Asset
          </button>
        </div>
      }>
        <div className="space-y-2">
          {requests.map((req, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-bg-surface border border-border">
              <div className="flex-1 space-y-1.5">
                <Input className="bg-bg-panel"
                  placeholder="Asset type (e.g. Excavator, Dump Truck)" value={req.assetType}
                  onChange={e => updateRequest(i, 'assetType', e.target.value)} />
                <div className="flex gap-2">
                  <Input type="number" min={1} className="bg-bg-panel w-20"
                    placeholder="Qty" value={req.quantity} onChange={e => updateRequest(i, 'quantity', parseInt(e.target.value) || 1)} />
                  <Input className="bg-bg-panel flex-1"
                    placeholder="Notes (optional)" value={req.notes ?? ''}
                    onChange={e => updateRequest(i, 'notes', e.target.value)} />
                </div>
              </div>
              {requests.length > 1 && (
                <button onClick={() => removeRequest(i)} aria-label="Remove asset request" className="text-text-muted hover:text-red mt-1">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {err && <p className="text-xs text-red">{err}</p>}
      <div className="flex gap-2">
        <Button variant="primary" onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Log Enquiry'}</Button>
        <Link to="/wli/crm/enquiries"><Button variant="secondary">Cancel</Button></Link>
      </div>
    </PageContainer>
  );
}
