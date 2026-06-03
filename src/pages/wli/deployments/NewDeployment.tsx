import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { InputTextarea } from '../../../components/shared/InputTextarea';
import { PageContainer } from '../../../components/shared/PageContainer';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useAssetList, useSiteList } from '../../../lib/hooks/useWorkflowData';
import { useCustomerList } from '../../../lib/hooks/useCrmData';
import { createDeployment } from '../../../lib/services/deployments';
import { assetLabel } from '../../../types/asset';
import type { RateBasis } from '../../../types/reports';
import { useToast } from '../../../lib/context/ToastContext';

const BASIS_HINT: Record<RateBasis, string> = { monthly: 'per month', daily: 'per day', lump: 'total (lump sum)' };

export function NewDeployment() {
  const { user, effectiveRole } = useAuth();
  const navigate = useNavigate();
  const { data: assets } = useAssetList();
  const { data: sites } = useSiteList();
  const { data: customers } = useCustomerList();
  const { toast } = useToast();
  const [params] = useSearchParams();

  const [assetId, setAssetId] = useState(params.get('asset') ?? '');
  const [siteId, setSiteId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [agreementRef, setAgreementRef] = useState('');
  const [rateBasis, setRateBasis] = useState<RateBasis>('monthly');
  const [rate, setRate] = useState('');
  const [currency, setCurrency] = useState<'MVR' | 'USD'>('MVR');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fieldSites = sites.filter((s) => s.type !== 'hq');
  const selectedAsset = assets.find((a) => a.id === assetId);

  async function submit() {
    if (!user) return;
    if (!selectedAsset) { setErr('Select the machine being deployed.'); return; }
    if (!siteId) { setErr('Select the project / site.'); return; }
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) { setErr('Select the client from the customer register.'); return; }
    if (!rate || Number(rate) <= 0) { setErr('Enter the agreed rate — revenue is mandatory for a deployment.'); return; }
    setBusy(true); setErr(null);
    try {
      await createDeployment(
        {
          assetId: selectedAsset.id, assetCode: selectedAsset.code, assetLabel: assetLabel(selectedAsset),
          siteId, customerId: customer.id, customerName: customer.name, agreementRef: agreementRef || undefined,
          rateBasis, rate: Number(rate), currency, startDate: new Date(startDate), note: note || undefined,
        },
        { id: user.uid, role: effectiveRole, name: user.displayName },
      );
      toast('success', 'Machine deployed — revenue terms recorded');
      navigate('/wli/deployments');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to deploy';
      setErr(msg); toast('error', msg); setBusy(false);
    }
  }

  return (
    <PageContainer className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wli/deployments" aria-label="Back to deployments" className="text-text-muted hover:text-text-primary"><ArrowLeft size={18} /></Link>
        <h1 className="text-lg font-bold text-text-primary">Deploy Machine</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-muted">Machine *</label>
            <InputSelect className="mt-1" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
              <option value="">Select the machine…</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{assetLabel(a)} · {a.commercialStatus}</option>)}
            </InputSelect>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted">Project / Site *</label>
              <InputSelect className="mt-1" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                <option value="">Select site…</option>
                {fieldSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </InputSelect>
            </div>
            <div>
              <label className="text-xs text-text-muted">Client *</label>
              <InputSelect className="mt-1" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">{customers.length ? 'Select client…' : 'No customers — add one first'}</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </InputSelect>
              {customers.length === 0 && (
                <Link to="/wli/crm/customers" className="text-[10px] text-blue mt-1 inline-block">+ Add a customer in the register</Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-text-muted">Billing basis *</label>
              <InputSelect className="mt-1" value={rateBasis} onChange={(e) => setRateBasis(e.target.value as RateBasis)}>
                <option value="monthly">Monthly</option>
                <option value="daily">Daily</option>
                <option value="lump">Lump sum</option>
              </InputSelect>
            </div>
            <div>
              <label className="text-xs text-text-muted">Rate * <span className="text-text-faint">({BASIS_HINT[rateBasis]})</span></label>
              <Input type="number" min="0" className="mt-1" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. 250000" />
            </div>
            <div>
              <label className="text-xs text-text-muted">Currency</label>
              <InputSelect className="mt-1" value={currency} onChange={(e) => setCurrency(e.target.value as 'MVR' | 'USD')}>
                <option value="MVR">MVR</option>
                <option value="USD">USD</option>
              </InputSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted">Start date * <span className="text-text-faint">(backdate ok)</span></label>
              <Input type="date" className="mt-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-text-muted">Agreement ref (optional)</label>
              <Input className="mt-1" value={agreementRef} onChange={(e) => setAgreementRef(e.target.value)} placeholder="contract no." />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted">Note (optional)</label>
            <InputTextarea rows={2} className="mt-1" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {err && <p className="text-xs text-red">{err}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="primary" size="sm" className="flex-1" onClick={submit} disabled={busy}>{busy ? 'Deploying…' : 'Deploy & Record Revenue'}</Button>
            <Link to="/wli/deployments"><Button variant="secondary" size="sm">Cancel</Button></Link>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
