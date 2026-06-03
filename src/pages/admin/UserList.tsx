import { useState } from 'react';
import { UserCog, ShieldCheck } from 'lucide-react';
import { useUsers } from '../../lib/hooks/useUsers';
import { useSiteList } from '../../lib/hooks/useWorkflowData';
import { assignAccess, type AppUser } from '../../lib/services/users';
import { ROLES, ROLE_LABELS } from '../../lib/permissions/roles';
import { useToast } from '../../lib/context/ToastContext';

const ROLE_OPTIONS = Object.values(ROLES);
// Roles where a site assignment is meaningful (field / site-scoped).
const SITE_BOUND = new Set<string>([ROLES.OPERATOR, ROLES.MECHANIC, ROLES.SUPERVISOR, ROLES.INVENTORY_STAFF, ROLES.PROC_STAFF]);

function UserRow({ user, sites, onSaved }: {
  user: AppUser;
  sites: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [role, setRole] = useState(user.role);
  const [siteIds, setSiteIds] = useState<string[]>(user.siteIds ?? []);
  const [busy, setBusy] = useState(false);
  const dirty = role !== user.role || JSON.stringify(siteIds) !== JSON.stringify(user.siteIds ?? []);

  const toggleSite = (id: string) =>
    setSiteIds((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]));

  async function save() {
    setBusy(true);
    try {
      await assignAccess(user.id, role, SITE_BOUND.has(role) ? siteIds : []);
      toast('success', `${user.displayName || user.email} → ${ROLE_LABELS[role] ?? role}`);
      onSaved();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed to assign');
    } finally { setBusy(false); }
  }

  return (
    <div className="dcard" style={{ padding: 14, marginBottom: 10, ...(user.role === 'pending' ? { borderColor: 'var(--warning)' } : {}) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div className="avatar" style={{ width: 34, height: 34 }}>{(user.displayName || user.email || 'U').charAt(0).toUpperCase()}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row-id">{user.displayName || '—'} {user.role === 'pending' && <span className="badge b-warn">NEW · pending</span>}</div>
          <div className="row-sub">{user.email}</div>
        </div>
        <select className="side-foot-sel" style={{ width: 'auto', minWidth: 170 }} value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
        </select>
        <button className="btn btn-primary" onClick={save} disabled={busy || !dirty} style={{ opacity: dirty ? 1 : 0.5 }}>
          {busy ? 'Saving…' : 'Assign'}
        </button>
      </div>
      {SITE_BOUND.has(role) && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="k">Sites:</span>
          {sites.map((s) => (
            <label key={s.id} className="chip" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <input type="checkbox" checked={siteIds.includes(s.id)} onChange={() => toggleSite(s.id)} />
              {s.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function UserList() {
  const { data: users, loading, refresh } = useUsers();
  const { data: sites } = useSiteList();
  const siteOpts = sites.map((s) => ({ id: s.id, name: s.name }));

  const pending = users.filter((u) => u.role === 'pending');
  const assigned = users.filter((u) => u.role !== 'pending');

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">User Access</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : `${users.length} users`}</span>
            {pending.length > 0 && <><span>·</span><span style={{ color: 'var(--warning)' }}>{pending.length} awaiting a role</span></>}
          </p>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="section">
          <div className="section-head"><h2><UserCog size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--warning)' }} />Access Requests <span className="hint" style={{ color: 'var(--warning)' }}>{pending.length}</span></h2></div>
          {pending.map((u) => <UserRow key={u.id} user={u} sites={siteOpts} onSaved={refresh} />)}
        </div>
      )}

      <div className="section">
        <div className="section-head"><h2><ShieldCheck size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--accent)' }} />Assigned Users</h2></div>
        {loading ? (
          <div className="empty-note">Loading…</div>
        ) : assigned.length === 0 ? (
          <div className="empty-note">No assigned users yet.</div>
        ) : assigned.map((u) => <UserRow key={u.id} user={u} sites={siteOpts} onSaved={refresh} />)}
      </div>
    </div>
  );
}
