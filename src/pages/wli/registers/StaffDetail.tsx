import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserCog, Pencil, MapPin, User, Briefcase, AlertTriangle, Trash2 } from 'lucide-react';
import { useStaffList, useSiteList, useAssetList } from '../../../lib/hooks/useWorkflowData';
import { useAuth } from '../../../lib/hooks/useAuth';
import { updateStaff, assignStaffSite, assignStaffAsset, deleteStaff } from '../../../lib/services/registry';
import { ROLES, ROLE_LABELS } from '../../../lib/permissions/roles';
import { STAFF_TYPES, STAFF_TYPE_LABEL, type StaffType } from '../../../types/org';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';
import { useToast } from '../../../lib/context/ToastContext';

const ASSIGNABLE_ROLES = [
  ROLES.OPERATOR, ROLES.MECHANIC, ROLES.SUPERVISOR, ROLES.PROC_STAFF,
  ROLES.FINANCE_WLI, ROLES.INVENTORY_STAFF, ROLES.GM,
];

export function StaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: staff, loading, refresh } = useStaffList();
  const { data: sites } = useSiteList();
  const { data: assets } = useAssetList();
  const { toast } = useToast();
  const { effectiveRole } = useAuth();
  const canManageStaff = effectiveRole === 'super_admin' || effectiveRole === 'gm';

  const person = staff.find((p) => p.id === id);
  const siteName = (sid: string | undefined) => (sid ? sites.find((s) => s.id === sid)?.name ?? sid : 'Unassigned');
  const assetLabelOf = (aid: string | undefined) => {
    const a = aid ? assets.find((x) => x.id === aid) : undefined;
    return a ? `${a.code} — ${a.make} ${a.model}` : '—';
  };

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', staffType: 'operator' as StaffType, designation: '', siteId: '', assignedAssetId: '' });
  const setF = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleDelete() {
    if (!person) return;
    const confirmed = window.confirm(`Delete "${person.name}" (${person.displayId})?\n\nThis cannot be undone.`);
    if (!confirmed) return;
    try {
      await deleteStaff(person.id);
      toast('success', `${person.name} removed from staff register.`);
      navigate('/wli/staff');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Delete failed');
    }
  }

  function startEdit() {
    if (!person) return;
    setForm({ name: person.name, role: person.role, staffType: person.staffType ?? 'operator', designation: person.designation ?? '', siteId: person.siteId ?? '', assignedAssetId: person.assignedAssetId ?? '' });
    setEditing(true);
  }
  async function save() {
    if (!person) return;
    setBusy(true);
    try {
      await updateStaff(person.id, { name: form.name, role: form.role, staffType: form.staffType, designation: form.designation });
      if (form.siteId !== (person.siteId ?? '')) await assignStaffSite(person.id, form.siteId);
      if (form.assignedAssetId !== (person.assignedAssetId ?? '')) await assignStaffAsset(person.id, form.assignedAssetId || null);
      toast('success', 'Staff updated');
      setEditing(false);
      refresh();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Update failed');
    } finally { setBusy(false); }
  }

  if (loading) return <div className="page"><LoadingSpinner text="Loading…" /></div>;
  if (!person) return <div className="page"><p className="empty-note">Staff member not found.</p></div>;

  return (
    <div className="page">
      <Link to="/wli/staff" className="dback"><ArrowLeft /> Staff Register</Link>

      <div className="dhead">
        <div>
          <span className="eyebrow">{person.displayId}</span>
          <h1 className="dtitle">{person.name}</h1>
          <div className="dhead-badges">
            {person.staffType && <span className="badge b-accent"><UserCog size={11} /> {STAFF_TYPE_LABEL[person.staffType]}</span>}
            <span className="badge b-info">{ROLE_LABELS[person.role] ?? person.role}</span>
            <span className={`badge ${person.status === 'active' ? 'b-pos' : 'b-muted'}`}><span className="bdot" />{person.status}</span>
            <span className="tc-sub"><MapPin size={11} /> {siteName(person.siteId)}</span>
          </div>
        </div>
        <div className="dhead-actions">
          {!editing && <button className="btn btn-ghost" onClick={startEdit}><Pencil /> Edit</button>}
          {!editing && canManageStaff && (
            <button className="btn btn-ghost" onClick={handleDelete} style={{ color: 'var(--danger)' }}>
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="detail">
        <div className="dcol">
          <div className="dcard">
            <div className="dcard-h"><h3><User /> Profile</h3></div>
            <div className="dcard-b">
              {editing ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div className="kv">
                    <div><div className="k">Name</div><Input value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="Full name" /></div>
                    <div><div className="k">Staff Type</div>
                      <InputSelect value={form.staffType} onChange={(e) => setF('staffType', e.target.value)}>
                        {STAFF_TYPES.map((t) => <option key={t} value={t}>{STAFF_TYPE_LABEL[t]}</option>)}
                      </InputSelect>
                    </div>
                    <div><div className="k">Designation</div><Input value={form.designation} onChange={(e) => setF('designation', e.target.value)} placeholder="Designation" /></div>
                    <div><div className="k">System Role</div>
                      <InputSelect value={form.role} onChange={(e) => setF('role', e.target.value)}>
                        {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </InputSelect>
                    </div>
                    <div><div className="k">Site</div>
                      <InputSelect value={form.siteId} onChange={(e) => setF('siteId', e.target.value)}>
                        <option value="">Unassigned</option>
                        {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </InputSelect>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}><div className="k">Assigned Asset (location follows the asset’s site)</div>
                      <InputSelect value={form.assignedAssetId} onChange={(e) => setF('assignedAssetId', e.target.value)}>
                        <option value="">— None —</option>
                        {assets.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.make} {a.model}</option>)}
                      </InputSelect>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="primary" size="sm" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="kv">
                  <div><div className="k">Staff ID</div><div className="v"><span className="mono">{person.displayId}</span></div></div>
                  <div><div className="k">Staff Type</div><div className="v">{person.staffType ? STAFF_TYPE_LABEL[person.staffType] : '—'}</div></div>
                  <div><div className="k">System Role</div><div className="v">{ROLE_LABELS[person.role] ?? person.role}</div></div>
                  <div><div className="k">Designation</div><div className="v">{person.designation || '—'}</div></div>
                  {person.category && <div><div className="k">Category</div><div className="v">{person.category}</div></div>}
                  <div><div className="k">Assigned Site</div><div className="v">{siteName(person.assignedAssetId ? assets.find((a) => a.id === person.assignedAssetId)?.currentSiteId : person.siteId)}</div></div>
                  <div><div className="k">Assigned Asset</div><div className="v">{assetLabelOf(person.assignedAssetId)}</div></div>
                  <div><div className="k">Status</div><div className="v" style={{ textTransform: 'capitalize' }}>{person.status}</div></div>
                  {person.employmentStatus && <div><div className="k">Employment Type</div><div className="v">{person.employmentStatus}</div></div>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dcol">
          {/* HR details */}
          {(person.nationality || person.grade || person.joinedDateText || person.contactNo || person.licenceNoClass) && (
            <div className="dcard">
              <div className="dcard-h"><h3><Briefcase /> HR Details</h3></div>
              <div className="dcard-b">
                <div className="kv" style={{ gridTemplateColumns: '1fr' }}>
                  {person.nationality && <div><div className="k">Nationality</div><div className="v">{person.nationality}</div></div>}
                  {person.grade && <div><div className="k">Grade</div><div className="v"><span className="mono">{person.grade}</span></div></div>}
                  {person.joinedDateText && <div><div className="k">Joined</div><div className="v">{person.joinedDateText}</div></div>}
                  {person.contactNo && <div><div className="k">Contact No</div><div className="v"><span className="mono">{person.contactNo}</span></div></div>}
                  {person.licenceNoClass && <div><div className="k">Licence / Class</div><div className="v">{person.licenceNoClass}</div></div>}
                </div>
              </div>
            </div>
          )}

          {/* Compliance & work permit */}
          {(person.workPermitStatus || person.permitNo || person.permitExpiry || person.notes) && (
            <div className="dcard">
              <div className="dcard-h"><h3><AlertTriangle size={15} /> Compliance</h3></div>
              <div className="dcard-b">
                <div className="kv" style={{ gridTemplateColumns: '1fr' }}>
                  {person.workPermitStatus && (
                    <div>
                      <div className="k">Work Permit Status</div>
                      <div className="v">
                        <span className="badge b-warn"><span className="bdot" />{person.workPermitStatus}</span>
                      </div>
                    </div>
                  )}
                  {person.permitNo && <div><div className="k">Permit No</div><div className="v"><span className="mono">{person.permitNo}</span></div></div>}
                  {person.permitExpiry && <div><div className="k">Permit Expiry</div><div className="v">{person.permitExpiry}</div></div>}
                  {person.notes && <div><div className="k">Notes</div><div className="v" style={{ lineHeight: 1.5 }}>{person.notes}</div></div>}
                </div>
              </div>
            </div>
          )}

          <div className="dcard">
            <div className="dcard-h"><h3>Documents</h3></div>
            <div className="dcard-b">
              {(person.documents?.length ?? 0) === 0
                ? <p className="empty-note" style={{ padding: 0 }}>No documents on file.</p>
                : person.documents.map((d, i) => (
                  <div className="lineitem" key={i}><span className="li-t">{d.name}</span>
                    {d.url && <a className="li-v" href={d.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>open</a>}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
