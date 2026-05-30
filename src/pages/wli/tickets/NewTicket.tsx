import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../lib/hooks/useAuth';
import { createTicket } from '../../../lib/services/tickets';
import type { Urgency } from '../../../types/workflow-entities';

const SITES = ['thilafushi', 'bodufinolhu', 'muthaafushi', 'goidhoo', 'male-hq'];
const URGENCIES: Urgency[] = ['critical', 'urgent', 'routine'];

export function NewTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [siteId, setSiteId] = useState(SITES[0]);
  const [assetId, setAssetId] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('routine');
  const [recommendation, setRecommendation] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!user) return;
    if (!description.trim()) { setErr('Describe the issue.'); return; }
    setBusy(true); setErr(null);
    try {
      const id = await createTicket(
        { description, siteId, assetId: assetId || undefined, urgency, operatorRecommendation: recommendation || undefined },
        { id: user.uid, role: user.role, name: user.displayName },
      );
      navigate(`/wli/tickets/${id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create ticket');
      setBusy(false);
    }
  }

  const field = 'w-full text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary';

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wli/tickets" className="text-text-muted hover:text-text-primary"><ArrowLeft size={18} /></Link>
        <h1 className="text-lg font-bold text-text-primary">Raise Issue</h1>
      </div>

      <Card>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-muted">Issue description</label>
            <textarea className={field} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's wrong with the asset?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted">Site</label>
              <select className={field} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
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
            <label className="text-xs text-text-muted">Asset ID (optional)</label>
            <input className={field} value={assetId} onChange={(e) => setAssetId(e.target.value)} placeholder="e.g. WL-HV-0007" />
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
    </div>
  );
}
