import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { UserCog, Plus } from 'lucide-react';
import { useStaffList, useSiteList } from '../../../lib/hooks/useWorkflowData';
import { createStaff, assignStaffSite } from '../../../lib/services/registry';
import { ROLES, ROLE_LABELS } from '../../../lib/permissions/roles';
import { PageContainer } from '../../../components/shared/PageContainer';
import { useToast } from '../../../lib/context/ToastContext';

const ASSIGNABLE_ROLES = [
  ROLES.OPERATOR, ROLES.MECHANIC, ROLES.SUPERVISOR, ROLES.PROC_STAFF,
  ROLES.FINANCE_WLI, ROLES.INVENTORY_STAFF, ROLES.GM,
];

function nextStaffId(count: number): string {
  return `ST-${String(count + 1).padStart(3, '0')}`;
}

export function StaffRegister() {
  const { data: staff, loading, refresh } = useStaffList();
  const { data: sites } = useSiteList();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', role: ROLES.OPERATOR as string, designation: '', siteId: '' });
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function add() {
    if (!form.name.trim()) { setErr('Name required'); return; }
    setBusy(true); setErr(null);
    try {
      await createStaff(
        { name: form.name, role: form.role, designation: form.designation, siteId: form.siteId || undefined },
        nextStaffId(staff.length),
      );
      toast('success', 'Staff added');
      setForm({ name: '', role: ROLES.OPERATOR, designation: '', siteId: '' });
      setAdding(false); refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setErr(msg);
      toast('error', msg);
    }
    finally { setBusy(false); }
  }

  async function reassign(staffId: string, siteId: string) {
    const siteName = sites.find(s => s.id === siteId)?.name ?? siteId;
    if (!window.confirm(`Reassign this staff member to "${siteName}"?`)) return;
    await assignStaffSite(staffId, siteId); refresh();
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Staff Register</h1>
          <p className="text-xs text-text-muted">{loading ? 'Loading…' : `${staff.length} staff`}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add Staff</Button>
      </div>

      {adding && (
        <Card className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <InputSelect value={form.role} onChange={(e) => set('role', e.target.value)}>
              {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </InputSelect>
            <Input placeholder="Designation" value={form.designation} onChange={(e) => set('designation', e.target.value)} />
            <InputSelect value={form.siteId} onChange={(e) => set('siteId', e.target.value)}>
              <option value="">Site…</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </InputSelect>
            <Button variant="primary" size="sm" onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
          </div>
          {err && <p className="text-xs text-red mt-2">{err}</p>}
        </Card>
      )}

      <Card>
        <div className="space-y-1">
          {staff.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface gap-3">
              <Link to={`/wli/staff/${p.id}`} className="flex items-center gap-3 min-w-0 flex-1 group">
                <UserCog size={16} className="text-text-muted" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate group-hover:text-blue">{p.name}</p>
                  <p className="text-[10px] text-text-muted">{p.displayId} · {ROLE_LABELS[p.role] ?? p.role} · {p.designation}</p>
                </div>
              </Link>
              <select
                className="text-[10px] p-1.5 rounded bg-bg-surface border border-border text-text-secondary flex-shrink-0"
                value={p.siteId ?? ''}
                onChange={(e) => reassign(p.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                title="Assign site"
              >
                <option value="">Unassigned</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}
