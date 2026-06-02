import { useState, type ReactNode } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../shared/Input';
import { InputSelect } from '../shared/InputSelect';
import { UserCog, Plus, Trash2 } from 'lucide-react';
import { useStaffList } from '../../lib/hooks/useWorkflowData';
import { createStaff, deleteStaff } from '../../lib/services/registry';
import { useAuth } from '../../lib/hooks/useAuth';
import { ROLE_LABELS } from '../../lib/permissions/roles';
import { STAFF_TYPES, STAFF_TYPE_LABEL, type StaffType, type Staff } from '../../types/org';
import { PageContainer } from '../shared/PageContainer';
import { PageHeader } from '../shared/PageHeader';
import { useToast } from '../../lib/context/ToastContext';

interface Props {
  /** SBU bucket these staff live under (e.g. 'antrac-hq', 'sbu-mpl'). */
  sbuId: string;
  /** displayId prefix, e.g. 'ANT-EMP' or 'MPL-EMP'. */
  idPrefix: string;
  title: string;
  subtitle?: string;
  /** System-role options offered in the add form. */
  roleOptions: string[];
  defaultRole: string;
  defaultDesignation?: string;
  /** Roles allowed to add/delete here. */
  manageRoles: string[];
  /** Optional per-row trailing content (e.g. site-in-charge chips, approval note). */
  renderExtra?: (s: Staff & { id: string }) => ReactNode;
  /** Hint shown under the add form. */
  hint?: ReactNode;
  /** Empty-state message. */
  emptyNote?: string;
}

export function ModuleStaffRegister({
  sbuId, idPrefix, title, subtitle, roleOptions, defaultRole,
  defaultDesignation = '', manageRoles, renderExtra, hint, emptyNote,
}: Props) {
  const { data: staff, loading, refresh } = useStaffList(sbuId);
  const { effectiveRole } = useAuth();
  const canManage = manageRoles.includes(effectiveRole ?? '');

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', designation: defaultDesignation, staffType: 'supervisor' as StaffType, role: defaultRole });
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const nextId = () => `${idPrefix}-${String(staff.length + 1).padStart(4, '0')}`;

  async function add() {
    if (!form.name.trim()) { setErr('Name required'); return; }
    setBusy(true); setErr(null);
    try {
      await createStaff(
        { name: form.name, role: form.role, staffType: form.staffType, designation: form.designation },
        nextId(),
        { orgId: 'antrac-holding', sbuId },
      );
      toast('success', 'Staff added');
      setForm({ name: '', designation: defaultDesignation, staffType: 'supervisor', role: defaultRole });
      setAdding(false); refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setErr(msg); toast('error', msg);
    } finally { setBusy(false); }
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"?`)) return;
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
        <PageHeader title={title} subtitle={loading ? 'Loading…' : (subtitle ?? `${staff.length} staff`)} />
        {canManage && (
          <Button variant="primary" size="sm" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add Staff</Button>
        )}
      </div>

      {adding && (
        <Card className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <Input placeholder="Designation" value={form.designation} onChange={(e) => set('designation', e.target.value)} />
            <InputSelect value={form.staffType} onChange={(e) => set('staffType', e.target.value)} title="Staff type">
              {STAFF_TYPES.map((t) => <option key={t} value={t}>{STAFF_TYPE_LABEL[t]}</option>)}
            </InputSelect>
            <InputSelect value={form.role} onChange={(e) => set('role', e.target.value)} title="System role">
              {roleOptions.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
            </InputSelect>
            <Button variant="primary" size="sm" onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
          </div>
          {err && <p className="text-xs text-red mt-2">{err}</p>}
          {hint && <p className="text-[11px] text-text-muted mt-2">{hint}</p>}
        </Card>
      )}

      <Card>
        {staff.length === 0 ? (
          <p className="text-xs text-text-muted p-3">{emptyNote ?? 'No staff yet.'}</p>
        ) : (
          <div className="space-y-1">
            {staff.map((p) => (
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
                  {renderExtra?.(p)}
                  {canManage && (
                    <button className="p-1 rounded text-text-muted hover:text-red" title="Delete" onClick={() => remove(p.id, p.name)}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
