import { useState, type ReactNode } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../shared/Input';
import { InputSelect } from '../shared/InputSelect';
import { UserCog, Plus, Trash2, Pencil } from 'lucide-react';
import { useStaffList } from '../../lib/hooks/useWorkflowData';
import { createStaff, deleteStaff, updateStaff } from '../../lib/services/registry';
import { useAuth } from '../../lib/hooks/useAuth';
import { ROLE_LABELS } from '../../lib/permissions/roles';
import { STAFF_TYPES, STAFF_TYPE_LABEL, type StaffType, type Staff } from '../../types/org';
import { useToast } from '../../lib/context/ToastContext';

const COLS = '2fr 1.2fr 72px';

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

  // Inline edit (one row at a time)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', designation: '', staffType: '', role: '' });
  const setE = (k: keyof typeof editForm, v: string) => setEditForm((f) => ({ ...f, [k]: v }));

  function startEdit(p: Staff & { id: string }) {
    setEditingId(p.id);
    setEditForm({ name: p.name, designation: p.designation ?? '', staffType: p.staffType ?? '', role: p.role });
  }

  async function saveEdit() {
    if (!editingId) return;
    if (!editForm.name.trim()) { toast('error', 'Name required'); return; }
    setBusy(true);
    try {
      const patch: { name: string; designation: string; role: string; staffType?: StaffType } = {
        name: editForm.name, designation: editForm.designation, role: editForm.role,
      };
      if (editForm.staffType) patch.staffType = editForm.staffType as StaffType;
      await updateStaff(editingId, patch);
      toast('success', 'Staff updated');
      setEditingId(null); refresh();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Update failed');
    } finally { setBusy(false); }
  }

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
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : (subtitle ?? `${staff.length} staff`)}</span>
          </p>
        </div>
        {canManage && (
          <div className="head-actions">
            <Button variant="primary" size="sm" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add Staff</Button>
          </div>
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

      <div className="tbl">
        <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
          <span>Staff</span><span>Role</span><span />
        </div>
        {staff.length === 0 ? (
          <div className="tbl-empty">{emptyNote ?? 'No staff yet.'}</div>
        ) : (
          staff.map((p) => editingId === p.id ? (
            <div key={p.id} className="tbl-row" style={{ gridTemplateColumns: '1fr', cursor: 'default', padding: 12 }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Input placeholder="Name" value={editForm.name} onChange={(e) => setE('name', e.target.value)} />
                <Input placeholder="Designation" value={editForm.designation} onChange={(e) => setE('designation', e.target.value)} />
                <InputSelect value={editForm.staffType} onChange={(e) => setE('staffType', e.target.value)} title="Staff type">
                  <option value="">— none —</option>
                  {STAFF_TYPES.map((t) => <option key={t} value={t}>{STAFF_TYPE_LABEL[t]}</option>)}
                </InputSelect>
                <InputSelect value={editForm.role} onChange={(e) => setE('role', e.target.value)} title="System role">
                  {roleOptions.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
                </InputSelect>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="primary" size="sm" onClick={saveEdit} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
                <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                <span className="text-[10px] text-text-muted self-center ml-1">{p.displayId}</span>
              </div>
            </div>
          ) : (
            <div key={p.id} className="tbl-row" style={{ gridTemplateColumns: COLS, cursor: 'default' }}>
              <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserCog size={15} className="text-text-muted" />
                <div style={{ minWidth: 0 }}>
                  <div className="tc-id">{p.name}</div>
                  <div className="tc-desc">{p.displayId} · {p.designation || (p.staffType ? STAFF_TYPE_LABEL[p.staffType] : ROLE_LABELS[p.role] ?? p.role)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>{renderExtra?.(p)}</div>
              <div style={{ justifySelf: 'end', display: 'flex', gap: 2 }}>
                {canManage && (
                  <button className="btn btn-ghost" style={{ padding: 4 }} title="Edit" onClick={() => startEdit(p)}><Pencil size={13} /></button>
                )}
                {canManage && (
                  <button className="btn btn-ghost" style={{ padding: 4 }} title="Delete" onClick={() => remove(p.id, p.name)}><Trash2 size={13} /></button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
