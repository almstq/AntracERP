import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useAssetList } from '../../../lib/hooks/useWorkflowData';
import { createTicket } from '../../../lib/services/tickets';
import { assetLabel } from '../../../types/asset';
import type { Urgency } from '../../../types/workflow-entities';
import { PageContainer } from '../../../components/shared/PageContainer';

const SITES = ['thilafushi', 'bodufinolhu', 'muthaafushi', 'goidhoo', 'male-hq'];
const URGENCIES: Urgency[] = ['critical', 'urgent', 'routine'];

export function NewTicket() {
  const { user, effectiveRole } = useAuth();
  const navigate = useNavigate();
  const { data: assets, loading: assetsLoading } = useAssetList();

  const [assetId, setAssetId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [siteTouched, setSiteTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('routine');
  const [recommendation, setRecommendation] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selectedAsset = assets.find((a) => a.id === assetId);
  // Site auto-follows the asset's current deployment unless the user overrides it.
  const effectiveSite = siteTouched ? siteId : (selectedAsset?.currentSiteId ?? '');

  function onAssetChange(id: string) {
    setAssetId(id);
    setSiteTouched(false); // re-sync site to the new asset's location
  }

  async function submit() {
    if (!user) return;
    if (!selectedAsset) { setErr('Select the machine this issue is about.'); return; }
    if (!effectiveSite) { setErr('Select a location.'); return; }
    if (!description.trim()) { setErr('Describe the issue.'); return; }
    setBusy(true); setErr(null);
    try {
      const id = await createTicket(
        {
          description, siteId: effectiveSite, assetId: selectedAsset.id,
          assetCode: selectedAsset.code, assetLabel: assetLabel(selectedAsset),
          urgency, operatorRecommendation: recommendation || undefined,
        },
        { id: user.uid, role: effectiveRole, name: user.displayName },
      );
      navigate(`/wli/tickets/${id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create ticket');
      setBusy(false);
    }
  }

  const field = 'w-full text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary';

  return (
    <PageContainer className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wli/tickets" className="text-text-muted hover:text-text-primary"><ArrowLeft size={18} /></Link>
        <h1 className="text-lg font-bold text-text-primary">Raise Issue</h1>
      </div>

      <Card>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-muted">Machine / Asset *</label>
            <select className={field} value={assetId} onChange={(e) => onAssetChange(e.target.value)}>
              <option value="">{assetsLoading ? 'Loading fleet…' : 'Select the machine…'}</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{assetLabel(a)} · {a.currentSiteId}</option>
              ))}
            </select>
            {selectedAsset && (
              <p className="text-[10px] text-text-muted mt-1">
                Status: {selectedAsset.operationalStatus} · Deployed at {selectedAsset.currentSiteId}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted">Location {selectedAsset && !siteTouched ? '(auto)' : ''}</label>
              <select
                className={field}
                value={effectiveSite}
                onChange={(e) => { setSiteTouched(true); setSiteId(e.target.value); }}
              >
                <option value="">Select…</option>
                {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted">Urgency</label>
              <select className={field} value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
                {URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted">Issue description *</label>
            <textarea className={field} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's wrong with the machine?" />
          </div>
          <div>
            <label className="text-xs text-text-muted">Your recommendation (optional)</label>
            <input className={field} value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />
          </div>
          {err && <p className="text-xs text-red">{err}</p>}
          <Button variant="primary" size="sm" onClick={submit} disabled={busy}>
            {busy ? 'Submitting…' : 'Submit Issue'}
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}
