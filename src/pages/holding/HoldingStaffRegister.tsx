import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/shared/Input';
import { InputSelect } from '../../components/shared/InputSelect';
import { UserCog, Plus, MapPin, Trash2 } from 'lucide-react';
import { useStaffList, useSiteList } from '../../lib/hooks/useWorkflowData';
import { createStaff, deleteStaff } from '../../lib/services/registry';
import { useAuth } from '../../lib/hooks/useAuth';
import { ROLES, ROLE_LABELS } from '../../lib/permissions/roles';
import { STAFF_TYPES, STAFF_TYPE_LABEL, type StaffType } from '../../types/org';
import { PageContainer } from '../../components/shared/PageContainer';
import { PageHeader } from '../../components/shared/PageHeader';
import { useToast } from '../../lib/context/ToastContext';

// Holding staff live under the Antrac org, kept in their own SBU bucket so they
// never mix with an operating company's roster (e.g. the WLI 34-person list).
const HOLDING_SBU = 'antrac-hq';

// Roles a Holding manager can hold (project oversight, HR, finance, directors).
const HQ_ROLES = [
  ROLES.DIRECTOR, ROLES.CFO, ROLES.ANTRAC_FINANCE, ROLES.HOLDING_HR, ROLES.SUPERVISOR,
];

function nextHqId(count: number): string {
  return `ANT-EMP-${String(count + 1).padStart(4, '0')}`;
}

export function HoldingStaffRegister() {
  const { data: staff, loading, refresh } = useStaffList(HOLDING_SBU);
  const { data: sites } = useSiteList();
  const { effectiveRole } = useAuth();
  const canManage = effectiveRole === 'super_admin' || effectiveRole === 'director' || effectiveRole === 'holding_hr';

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', designation: 'Project Manager', staffType: 'supervisor' as StaffType, role: ROLES.SUPERVISOR as string });
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Which WLI (or any) sites is each HQ person in charge of?
  const sitesInChargeOf = (staffId: string) => sites.filter((s) => s.inChargeStaffId === staffId);

  async function add() {
    if (!form.name.trim()) { setErr('Name required'); return; }
    setBusy(true); setErr(null);
    try {
      await createStaff(
        { name: form.name, role: form.role, staffType: form.staffType, designation: form.designation },
        nextHqId(staff.length),
        { orgId: 'antrac-holding', sbuId: HOLDING_SBU },
      );
      toast('success', 'Holding staff added');
      setForm({ name: '', designation: 'Project Manager', staffType: 'supervisor', role: ROLES.SUPERVISOR });
      setAdding(false); refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setErr(msg);
      toast('error', msg);
    } finally { setBusy(false); }
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete "${name}" from Holding staff?\n\nAny sites they are in charge of will need a new in-charge assigned.`)) return;
    try {
      await deleteStaff(id);
      toast('success', `${name} removed`);
      refresh();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Delete failed');
    }
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <PageHeader
          title="Holding Staff"
          subtitle={loading ? 'Loading…' : `${staff.length} staff · assigned to oversee operating-company sites`}
        />
        {canManage && (
          <Button variant="primary" size="sm" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add Staff</Button>
        )}
      </div>

      {adding && (
        <Card className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <Input placeholder="Designation (e.g. Project Manager)" value={form.designation} onChange={(e) => set('designation', e.target.value)} />
            <InputSelect value={form.staffType} onChange={(e) => set('staffType', e.target.value)} title="Staff type">
              {STAFF_TYPES.map((t) => <option key={t} value={t}>{STAFF_TYPE_LABEL[t]}</option>)}
            </InputSelect>
            <InputSelect value={form.role} onChange={(e) => set('role', e.target.value)} title="System role">
              {HQ_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </InputSelect>
            <Button variant="primary" size="sm" onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
          </div>
          {err && <p className="text-xs text-red mt-2">{err}</p>}
          <p className="text-[11px] text-text-muted mt-2">
            Holding staff (e.g. project managers) are assigned to oversee specific sites from each
            site's page — open <b>WLI → Locations → a site → Site In-Charge</b>.
          </p>
        </Card>
      )}

      <Card>
        {staff.length === 0 ? (
          <p className="text-xs text-text-muted p-3">No Holding staff yet. Add a project manager or director above.</p>
        ) : (
          <div className="space-y-1">
            {staff.map((p) => {
              const inCharge = sitesInChargeOf(p.id);
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <UserCog size={16} className="text-text-muted shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{p.name}</p>
                      <p className="text-[10px] text-text-muted">
                        {p.displayId} · {p.designation || (p.staffType ? STAFF_TYPE_LABEL[p.staffType] : ROLE_LABELS[p.role] ?? p.role)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {inCharge.length === 0 ? (
                      <span className="text-[10px] text-text-muted italic">Not overseeing any site</span>
                    ) : (
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {inCharge.map((s) => (
                          <span key={s.id} className="badge b-accent" style={{ fontSize: 10 }}>
                            <MapPin size={9} /> {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {canManage && (
                      <button
                        className="p-1 rounded text-text-muted hover:text-red"
                        title="Delete"
                        onClick={() => remove(p.id, p.name)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
