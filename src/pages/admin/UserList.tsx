import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCog, ShieldCheck } from 'lucide-react';
import { useUsers } from '../../lib/hooks/useUsers';
import { useSiteList } from '../../lib/hooks/useWorkflowData';
import { assignAccess, type AppUser } from '../../lib/services/users';
import { useRoleRegistry, getRole, roleScope, type RoleDef } from '../../lib/permissions/roleRegistry';
import { useAuth } from '../../lib/hooks/useAuth';
import { logActivity } from '../../lib/services/activityLog';
import { useToast } from '../../lib/context/ToastContext';

const labelForRole = (r: string) => getRole(r)?.label ?? r;

function UserRow({ user, sites, roles, onSaved }: {
  user: AppUser;
  sites: { id: string; name: string }[];
  roles: RoleDef[];
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const { user: actor } = useAuth();
  const [role, setRole] = useState(user.role);
  const [siteIds, setSiteIds] = useState<string[]>(user.siteIds ?? []);
  const [busy, setBusy] = useState(false);
  const dirty = role !== user.role || JSON.stringify(siteIds) !== JSON.stringify(user.siteIds ?? []);

  const toggleSite = (id: string) =>
    setSiteIds((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]));

  async function save() {
    setBusy(true);
    try {
      const prev = user.role;
      await assignAccess(user.id, role, roleScope(role) === 'own_territory' ? siteIds : []);
      toast('success', `${user.displayName || user.email} → ${labelForRole(role)}`);
      void logActivity({
        category: 'access', action: 'role_assigned',
        summary: `${user.displayName || user.email}: ${labelForRole(prev)} → ${labelForRole(role)}`,
        actorId: actor?.uid ?? 'unknown', actorName: actor?.displayName, actorRole: actor?.role,
        entityType: 'user', entityId: user.id,
      });
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
        <select className="side-foot-sel" style={{ width: 'auto', minWidth: 190 }} value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <button className="btn btn-primary" onClick={save} disabled={busy || !dirty} style={{ opacity: dirty ? 1 : 0.5 }}>
          {busy ? 'Saving…' : 'Assign'}
        </button>
      </div>
      {roleScope(role) === 'own_territory' && (
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
  const { roles: allRoles } = useRoleRegistry();
  const assignableRoles = allRoles.filter((r) => r.id !== 'pending').sort((a, b) => a.label.localeCompare(b.label));
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
            <><span>·</span><span style={{ color: 'var(--accent)' }}>{assignableRoles.length} registry roles</span></>
          </p>
        </div>
        <Link className="btn btn-ghost" to="/admin/roles"><ShieldCheck size={15} /> Manage Roles</Link>
      </div>

      {pending.length > 0 && (
        <div className="section">
          <div className="section-head"><h2><UserCog size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--warning)' }} />Access Requests <span className="hint" style={{ color: 'var(--warning)' }}>{pending.length}</span></h2></div>
          {pending.map((u) => <UserRow key={u.id} user={u} sites={siteOpts} roles={assignableRoles} onSaved={refresh} />)}
        </div>
      )}

      <div className="section">
        <div className="section-head"><h2><ShieldCheck size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--accent)' }} />Assigned Users</h2></div>
        {loading ? (
          <div className="empty-note">Loading…</div>
        ) : assigned.length === 0 ? (
          <div className="empty-note">No assigned users yet.</div>
        ) : assigned.map((u) => <UserRow key={u.id} user={u} sites={siteOpts} roles={assignableRoles} onSaved={refresh} />)}
      </div>
    </div>
  );
}
