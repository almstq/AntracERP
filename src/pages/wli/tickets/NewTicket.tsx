import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { InputTextarea } from '../../../components/shared/InputTextarea';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useAssetList } from '../../../lib/hooks/useWorkflowData';
import { createTicket } from '../../../lib/services/tickets';
import { assetLabel } from '../../../types/asset';
import type { Urgency, RequiredMaterial } from '../../../types/workflow-entities';
import { PageContainer } from '../../../components/shared/PageContainer';
import { useToast } from '../../../lib/context/ToastContext';

const SITES = ['thilafushi', 'bodufinolhu', 'muthaafushi', 'goidhoo', 'male-hq'];
const URGENCIES: Urgency[] = ['critical', 'urgent', 'routine'];
const UOMS = ['pcs', 'set', 'kg', 'L', 'm', 'roll', 'box', 'hr', 'other'];

interface MaterialRow {
  description: string;
  quantity: string;
  uom: string;
}

function emptyRow(): MaterialRow {
  return { description: '', quantity: '1', uom: 'pcs' };
}

export function NewTicket() {
  const { user, effectiveRole } = useAuth();
  const navigate = useNavigate();
  const { data: assets, loading: assetsLoading } = useAssetList();
  const { toast } = useToast();

  const isSupervisor = effectiveRole === 'supervisor' || effectiveRole === 'super_admin';

  const [assetId, setAssetId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [siteTouched, setSiteTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('routine');
  const [recommendation, setRecommendation] = useState('');
  const [reportedDate, setReportedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [materials, setMaterials] = useState<MaterialRow[]>([emptyRow()]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selectedAsset = assets.find((a) => a.id === assetId);
  const effectiveSite = siteTouched ? siteId : (selectedAsset?.currentSiteId ?? '');

  function onAssetChange(id: string) {
    setAssetId(id);
    setSiteTouched(false);
  }

  function addMaterialRow() {
    setMaterials((prev) => [...prev, emptyRow()]);
  }

  function removeMaterialRow(index: number) {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMaterialRow(index: number, field: keyof MaterialRow, value: string) {
    setMaterials((prev) => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  }

  async function submit() {
    if (!user) return;
    if (!selectedAsset) { setErr('Select the machine this issue is about.'); return; }
    if (!effectiveSite) { setErr('Select a location.'); return; }
    if (!description.trim()) { setErr('Describe the issue.'); return; }

    // Supervisor must have at least one valid material row
    if (isSupervisor) {
      const filled = materials.filter((m) => m.description.trim());
      if (filled.length === 0) { setErr('Add at least one material or part required.'); return; }
    }

    setBusy(true); setErr(null);
    try {
      const reportedAt = new Date(reportedDate);

      // Build typed materials for supervisor path
      const parsedMaterials: RequiredMaterial[] = isSupervisor
        ? materials
            .filter((m) => m.description.trim())
            .map((m) => ({
              description: m.description.trim(),
              quantity: Math.max(1, parseFloat(m.quantity) || 1),
              uom: m.uom,
              category: 'parts' as const,
            }))
        : [];

      const id = await createTicket(
        {
          description, siteId: effectiveSite, assetId: selectedAsset.id,
          assetCode: selectedAsset.code, assetLabel: assetLabel(selectedAsset),
          urgency,
          operatorRecommendation: !isSupervisor && recommendation ? recommendation : undefined,
          reportedAt,
          raisedByRole: effectiveRole,
          materials: isSupervisor ? parsedMaterials : undefined,
        },
        { id: user.uid, role: effectiveRole, name: user.displayName ?? undefined },
      );
      toast('success', isSupervisor ? 'Ticket submitted — GM notified' : 'Issue ticket created');
      navigate(`/wli/tickets/${id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create ticket';
      setErr(msg);
      toast('error', msg);
      setBusy(false);
    }
  }

  return (
    <PageContainer className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wli/tickets" aria-label="Back to tickets" className="text-text-muted hover:text-text-primary"><ArrowLeft size={18} /></Link>
        <h1 className="text-lg font-bold text-text-primary">Raise Issue</h1>
      </div>

      <Card>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-muted">Machine / Asset *</label>
            <InputSelect value={assetId} onChange={(e) => onAssetChange(e.target.value)}>
              <option value="">{assetsLoading ? 'Loading fleet…' : 'Select the machine…'}</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{assetLabel(a)} · {a.currentSiteId}</option>
              ))}
            </InputSelect>
            {selectedAsset && (
              <p className="text-[10px] text-text-muted mt-1">
                Status: {selectedAsset.operationalStatus} · Deployed at {selectedAsset.currentSiteId}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-text-muted">Location {selectedAsset && !siteTouched ? '(auto)' : ''}</label>
              <InputSelect
                value={effectiveSite}
                onChange={(e) => { setSiteTouched(true); setSiteId(e.target.value); }}
              >
                <option value="">Select…</option>
                {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
              </InputSelect>
            </div>
            <div>
              <label className="text-xs text-text-muted">Urgency</label>
              <InputSelect value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
                {URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
              </InputSelect>
            </div>
            <div>
              <label className="text-xs text-text-muted">Date Reported</label>
              <Input type="date" value={reportedDate} onChange={(e) => setReportedDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted">Issue description *</label>
            <InputTextarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's wrong with the machine?" />
          </div>

          {/* Operator only — recommendation field */}
          {!isSupervisor && (
            <div>
              <label className="text-xs text-text-muted">Your recommendation (optional)</label>
              <Input value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />
            </div>
          )}

          {/* Supervisor only — materials required */}
          {isSupervisor && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-text-primary">Materials / Parts Required *</label>
                <button
                  type="button"
                  onClick={addMaterialRow}
                  className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  <Plus size={12} /> Add row
                </button>
              </div>
              <div className="space-y-2">
                {materials.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_72px_28px] gap-2 items-center">
                    <Input
                      placeholder="Description (e.g. brake pad, hydraulic hose)"
                      value={row.description}
                      onChange={(e) => updateMaterialRow(i, 'description', e.target.value)}
                    />
                    <Input
                      type="number"
                      min="0.01"
                      step="any"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => updateMaterialRow(i, 'quantity', e.target.value)}
                    />
                    <InputSelect value={row.uom} onChange={(e) => updateMaterialRow(i, 'uom', e.target.value)}>
                      {UOMS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </InputSelect>
                    <button
                      type="button"
                      onClick={() => removeMaterialRow(i)}
                      disabled={materials.length === 1}
                      className="flex items-center justify-center text-text-muted hover:text-danger disabled:opacity-30 transition-colors"
                      title="Remove row"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-text-muted">
                This ticket will go directly to the GM for approval. A Purchase Request will be raised automatically.
              </p>
            </div>
          )}

          {err && <p className="text-xs text-red">{err}</p>}
          <Button variant="primary" size="sm" onClick={submit} disabled={busy}>
            {busy ? 'Submitting…' : isSupervisor ? 'Submit with Materials' : 'Submit Issue'}
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}
