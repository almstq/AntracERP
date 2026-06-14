import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../lib/hooks/useAuth';
import { getWorkflow } from '../../lib/workflow/definitions';
import { getAvailableTransitions } from '../../lib/workflow/engine';
import { executeTransition } from '../../lib/workflow/executor';
import type { WorkflowId, WorkflowTransition } from '../../lib/workflow/types';
import type { RequiredMaterial, RequiredService } from '../../types/workflow-entities';

interface Props {
  workflowId: WorkflowId;
  entityId: string;
  status: string;
  onDone: () => void;
  signatures?: Record<string, any>;
}

export function TransitionPanel({ workflowId, entityId, status, onDone, signatures }: Props) {
  const { user, effectiveRole, actor: authActor } = useAuth();
  const def = getWorkflow(workflowId);
  const role = effectiveRole;
  const available = getAvailableTransitions(def, status, role);

  const [active, setActive] = useState<WorkflowTransition | null>(null);
  const [notes, setNotes] = useState('');
  const [fieldVals, setFieldVals] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Diagnosis-specific capture
  const [materialRequired, setMaterialRequired] = useState(false);
  const [serviceRequired, setServiceRequired] = useState(false);
  const [materials, setMaterials] = useState<RequiredMaterial[]>([]);
  const [services, setServices] = useState<RequiredService[]>([]);

  if (def.terminalStates.includes(status)) {
    return (
      <Card header={<span className="text-sm font-medium">Actions</span>}>
        <p className="text-xs text-text-muted">This {def.label.toLowerCase()} is closed.</p>
      </Card>
    );
  }

  function reset() {
    setActive(null); setNotes(''); setFieldVals({}); setErr(null);
    setMaterialRequired(false); setServiceRequired(false); setMaterials([]); setServices([]);
  }

  async function run() {
    if (!active || !user) return;
    setBusy(true); setErr(null);

    const fields: Record<string, unknown> = { ...fieldVals };
    if (active.action === 'submit_diagnosis') {
      fields.diagnosis = notes;
      fields.materialRequired = materialRequired;
      fields.serviceRequired = serviceRequired;
      fields.materials = materialRequired ? materials : [];
      fields.services = serviceRequired ? services : [];
    }

    // Capture compliance signatures on transitions
    if (workflowId === 'ticket') {
      const updatedSigs = { ...(signatures || {}) };
      if (active.action === 'submit_diagnosis') {
        updatedSigs.mechanic = { name: authActor!.name ?? 'Lead Mechanic', date: new Date().toISOString() };
      } else if (active.action === 'supervisor_signoff' || active.action === 'supervisor_submit') {
        updatedSigs.supervisor = { name: authActor!.name ?? 'Field Supervisor', date: new Date().toISOString() };
      } else if (active.action === 'gm_approve') {
        updatedSigs.gm = { name: authActor!.name ?? 'General Manager', date: new Date().toISOString() };
      } else if (active.action === 'mark_resolved' || active.action === 'close_no_parts') {
        updatedSigs.operator = { name: authActor!.name ?? 'Field Operator', date: new Date().toISOString() };
        fields.resolutionChecklist = { clean: true, photos: true, tools: true, safety: true };
      }
      fields.signatures = updatedSigs;
    } else if (workflowId === 'purchase_order') {
      const updatedSigs = { ...(signatures || {}) };
      if (active.action === 'antrac_accept' || active.action === 'cfo_verify') {
        updatedSigs.verified = { name: authActor!.name ?? 'Finance Officer', date: new Date().toISOString() };
      } else if (active.action === 'director_approve') {
        updatedSigs.approved = { name: authActor!.name ?? 'Director', date: new Date().toISOString() };
      }
      fields.signatures = updatedSigs;
    }

    const res = await executeTransition({
      workflowId, entityId, to: active.to as string,
      actor: authActor!,
      notes: notes || undefined,
      fields: Object.keys(fields).length ? fields : undefined,
    });

    setBusy(false);
    if (!res.success) { setErr(res.message); return; }
    reset();
    onDone();
  }

  return (
    <Card header={<span className="text-sm font-medium">Actions</span>}>
      {available.length === 0 ? (
        <p className="text-xs text-text-muted">No actions available for your role at this stage.</p>
      ) : !active ? (
        <div className="space-y-2">
          {available.map((t) => (
            <Button
              key={t.action}
              variant={t.isReject ? 'danger' : 'primary'}
              size="sm" className="w-full"
              onClick={() => { reset(); setActive(t); }}
            >
              {t.label}
            </Button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-medium text-text-primary">{active.label}</p>

          {(active.requiresNotes || active.action === 'submit_diagnosis') && (
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder={active.action === 'submit_diagnosis' ? 'Diagnosis…' : 'Notes…'}
              className="w-full text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary"
              rows={3}
            />
          )}

          {active.requiresFields?.map((f) => (
            <input
              key={f} value={fieldVals[f] ?? ''}
              onChange={(e) => setFieldVals((v) => ({ ...v, [f]: e.target.value }))}
              placeholder={f}
              className="w-full text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary"
            />
          ))}

          {active.action === 'submit_diagnosis' && (
            <div className="space-y-2 border-t border-border pt-2">
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <input type="checkbox" checked={materialRequired}
                  onChange={(e) => { setMaterialRequired(e.target.checked); if (e.target.checked && materials.length === 0) setMaterials([{ description: '', uom: 'pcs', quantity: 1, category: 'parts' }]); }} />
                Materials required
              </label>
              {materialRequired && materials.map((m, i) => (
                <div key={i} className="flex gap-1">
                  <input placeholder="item" value={m.description}
                    onChange={(e) => setMaterials((arr) => arr.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                    className="flex-1 text-xs p-1.5 rounded bg-bg-surface border border-border text-text-primary" />
                  <input placeholder="uom" value={m.uom}
                    onChange={(e) => setMaterials((arr) => arr.map((x, j) => j === i ? { ...x, uom: e.target.value } : x))}
                    className="w-14 text-xs p-1.5 rounded bg-bg-surface border border-border text-text-primary" />
                  <input type="number" min={1} step={1} inputMode="numeric" placeholder="qty" value={m.quantity}
                    onKeyDown={(e) => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault(); }}
                    onChange={(e) => { const n = parseInt(e.target.value, 10); setMaterials((arr) => arr.map((x, j) => j === i ? { ...x, quantity: Number.isNaN(n) || n < 1 ? 1 : n } : x)); }}
                    className="w-14 text-xs p-1.5 rounded bg-bg-surface border border-border text-text-primary" />
                </div>
              ))}
              {materialRequired && (
                <button onClick={() => setMaterials((a) => [...a, { description: '', uom: 'pcs', quantity: 1, category: 'parts' }])}
                  className="text-[10px] text-blue">+ add material</button>
              )}
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <input type="checkbox" checked={serviceRequired}
                  onChange={(e) => { setServiceRequired(e.target.checked); if (e.target.checked && services.length === 0) setServices([{ description: '', specialistType: 'mechanical' }]); }} />
                Service required
              </label>
              {serviceRequired && services.map((s, i) => (
                <input key={i} placeholder="service description" value={s.description}
                  onChange={(e) => setServices((arr) => arr.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                  className="w-full text-xs p-1.5 rounded bg-bg-surface border border-border text-text-primary" />
              ))}
            </div>
          )}

          {err && <p className="text-xs text-red">{err}</p>}

          <div className="flex gap-2">
            <Button variant="primary" size="sm" className="flex-1" onClick={run} disabled={busy}>
              {busy ? 'Working…' : 'Confirm'}
            </Button>
            <Button variant="secondary" size="sm" onClick={reset} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
