import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCog, ShieldCheck, ChevronDown, Search, Check, MapPin, Building2 } from 'lucide-react';
import { useUsers } from '../../lib/hooks/useUsers';
import { useSiteList } from '../../lib/hooks/useWorkflowData';
import { assignAccess, type AppUser } from '../../lib/services/users';
import { useRoleRegistry, getRole, roleScope, type RoleDef } from '../../lib/permissions/roleRegistry';
import { useAuth } from '../../lib/hooks/useAuth';
import { logActivity } from '../../lib/services/activityLog';
import { useToast } from '../../lib/context/ToastContext';
import { ROLE_LABELS } from '../../lib/permissions/roles';

const labelForRole = (r: string) => getRole(r)?.label ?? r;

function RoleOption({ role, selected, onPick }: { role: RoleDef; selected: boolean; onPick: () => void }) {
  const fnCount = Object.values(role.permissions).filter((l) => l !== 'none').length;
  const workflow = role.workflowActors.map((a) => ROLE_LABELS[a] ?? a).join(', ');
  return (
    <button
      type="button"
      onClick={onPick}
      className="dcard"
      style={{
        width: '100%', padding: 10, textAlign: 'left', borderColor: selected ? 'var(--accent)' : 'var(--border)',
        background: selected ? 'var(--accent-soft)' : 'var(--bg-card)', cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div
          className="avatar"
          style={{
            width: 28, height: 28, fontSize: 11,
            background: role.builtin ? 'var(--info-soft)' : 'var(--accent-soft)',
            color: role.builtin ? 'var(--info)' : 'var(--accent)',
          }}
        >
          {role.label.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row-id" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {role.label}
            <span className={`badge ${role.builtin ? 'b-info' : 'b-accent'}`}>{role.builtin ? 'SEEDED' : 'SA CREATED'}</span>
            <span className="badge b-muted">{role.scope === 'own_territory' ? 'territory' : 'all sites'}</span>
          </div>
          <div className="row-sub">
            {role.modules.map((m) => m.toUpperCase()).join(' · ') || 'no module'} · {fnCount} functions
            {workflow ? ` · workflow: ${workflow}` : ''}
          </div>
        </div>
        {selected && <Check size={15} style={{ color: 'var(--accent)' }} />}
      </div>
    </button>
  );
}

function RegistryRolePicker({ roles, value, onChange }: { roles: RoleDef[]; value: string; onChange: (roleId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = roles.find((r) => r.id === value) ?? getRole(value);
  const q = query.trim().toLowerCase();
  const filtered = roles.filter((r) => {
    if (!q) return true;
    const haystack = `${r.label} ${r.id} ${r.modules.join(' ')} ${r.workflowActors.map((a) => ROLE_LABELS[a] ?? a).join(' ')}`.toLowerCase();
    return haystack.includes(q);
  });
  const seeded = filtered.filter((r) => r.builtin);
  const created = filtered.filter((r) => !r.builtin);
  const roleGroups = ([
    ['SA-created roles', created],
    ['Seeded roles', seeded],
  ] as [string, RoleDef[]][]).filter(([, rows]) => rows.length > 0);

  return (
    <div style={{ flex: '0 1 420px', minWidth: 280 }}>
      <button
        type="button"
        className="side-foot-sel"
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', minHeight: 46, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px' }}
      >
        <span
          className="avatar"
          style={{
            width: 26, height: 26, fontSize: 11,
            background: selected?.builtin ? 'var(--info-soft)' : 'var(--accent-soft)',
            color: selected?.builtin ? 'var(--info)' : 'var(--accent)',
          }}
        >
          {(selected?.label ?? value).charAt(0).toUpperCase()}
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span className="tc-id" style={{ display: 'block' }}>{selected?.label ?? value}</span>
          <span className="tc-desc" style={{ display: 'block' }}>
            {selected ? `${selected.modules.map((m) => m.toUpperCase()).join(' · ') || 'no module'} · ${selected.scope === 'own_territory' ? 'territory' : 'all sites'}` : 'Unknown role'}
          </span>
        </span>
        <ChevronDown size={15} style={{ opacity: 0.65 }} />
      </button>

      {open && (
        <div
          className="dcard"
          style={{
            marginTop: 8, padding: 10, position: 'relative', zIndex: 20,
            borderColor: 'var(--accent)', boxShadow: 'var(--shadow-lg, 0 20px 45px rgba(0,0,0,0.32))',
          }}
        >
          <label
            className="side-foot-sel"
            style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', marginBottom: 10, padding: '7px 9px' }}
          >
            <Search size={14} style={{ opacity: 0.65 }} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search role, module, workflow authority..."
              style={{ background: 'transparent', border: 0, outline: 0, color: 'var(--text-primary)', width: '100%', fontSize: 12 }}
            />
          </label>
          <div style={{ maxHeight: 360, overflow: 'auto', display: 'grid', gap: 10 }}>
            {roleGroups.map(([title, rows]) => (
              <div key={title}>
                <div className="k" style={{ fontSize: 10, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {title === 'SA-created roles' ? <ShieldCheck size={11} /> : <Building2 size={11} />}
                  {title} · {rows.length}
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {rows.map((r) => (
                    <RoleOption
                      key={r.id}
                      role={r}
                      selected={r.id === value}
                      onPick={() => { onChange(r.id); setOpen(false); setQuery(''); }}
                    />
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="tbl-empty">No registry role matches this search.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function UserRow({ user, sites, roles, onSaved }: {
  user: AppUser;
  sites: { id: string; name: string }[];
  roles: RoleDef[];
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const { user: actor, actor: authActor } = useAuth();
  const [role, setRole] = useState(user.role);
  const [siteIds, setSiteIds] = useState<string[]>(user.siteIds ?? []);
  const [busy, setBusy] = useState(false);
  const dirty = role !== user.role || JSON.stringify(siteIds) !== JSON.stringify(user.siteIds ?? []);

  const toggleSite = (id: string) =>
    setSiteIds((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]));
  const selectedRole = roles.find((r) => r.id === role);
  const selectedFnCount = selectedRole ? Object.values(selectedRole.permissions).filter((l) => l !== 'none').length : 0;

  async function save() {
    setBusy(true);
    try {
      const prev = user.role;
      await assignAccess(user.id, role, roleScope(role) === 'own_territory' ? siteIds : []);
      toast('success', `${user.displayName || user.email} → ${labelForRole(role)}`);
      void logActivity({
        category: 'access', action: 'role_assigned',
        summary: `${user.displayName || user.email}: ${labelForRole(prev)} → ${labelForRole(role)}`,
        actorId: authActor?.id ?? actor?.uid ?? 'unknown',
        actorName: authActor?.name ?? actor?.displayName,
        actorRole: authActor?.role ?? actor?.role,
        adminOverride: authActor?.adminOverride,
        performedByRole: authActor?.realRole,
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
        <RegistryRolePicker roles={roles} value={role} onChange={setRole} />
        <button className="btn btn-primary" onClick={save} disabled={busy || !dirty} style={{ opacity: dirty ? 1 : 0.5 }}>
          {busy ? 'Saving…' : 'Assign'}
        </button>
      </div>
      {selectedRole && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="badge b-muted"><ShieldCheck size={11} /> {selectedRole.builtin ? 'seeded role' : 'SA-created role'}</span>
          <span className="badge b-muted">{selectedFnCount} functions</span>
          <span className="badge b-muted">
            {selectedRole.scope === 'own_territory' ? <MapPin size={11} /> : <Building2 size={11} />}
            {selectedRole.scope === 'own_territory' ? 'requires site assignment' : 'all-site role'}
          </span>
          {selectedRole.workflowActors.length > 0 && (
            <span className="badge b-muted">
              <ShieldCheck size={11} />
              {selectedRole.workflowActors.map((a) => ROLE_LABELS[a] ?? a).join(', ')}
            </span>
          )}
        </div>
      )}
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
