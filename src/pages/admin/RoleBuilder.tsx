import { useMemo, useState } from 'react';
import { ShieldCheck, Trash2, Pencil, Check, X, Boxes, RotateCcw, MapPin, Building2 } from 'lucide-react';
import {
  useRoleRegistry, upsertRole, deleteCustomRole, resetBuiltin, isOverridden,
  LEVELS, LEVEL_LABEL, type Level, type Scope, type RoleDef,
} from '../../lib/permissions/roleRegistry';
import { allModuleFunctions } from '../../components/shell/navConfig';
import type { ModuleKey } from '../../lib/permissions/scope';
import { useAuth } from '../../lib/hooks/useAuth';
import { logActivity } from '../../lib/services/activityLog';
import { useToast } from '../../lib/context/ToastContext';
import { ROLES, ROLE_LABELS } from '../../lib/permissions/roles';

type Draft = { id?: string; builtin: boolean; label: string; scope: Scope; perms: Record<string, Level>; workflowActors: string[] };

const LEVEL_COLOR: Record<Level, string> = {
  none: 'var(--text-faint)', view: 'var(--info)', note: 'var(--warning)', edit: 'var(--accent)', manage: 'var(--positive)',
};

function RoleEditor({ draft, setDraft, onSave, onCancel }: {
  draft: Draft; setDraft: (d: Draft) => void; onSave: () => void; onCancel: () => void;
}) {
  const moduleFns = useMemo(() => allModuleFunctions(), []);
  const lvl = (to: string): Level => draft.perms[to] ?? 'none';
  const setLvl = (to: string, l: Level) => setDraft({ ...draft, perms: { ...draft.perms, [to]: l } });
  const setModule = (fns: { to: string }[], l: Level) => {
    const perms = { ...draft.perms };
    for (const f of fns) perms[f.to] = l;
    setDraft({ ...draft, perms });
  };
  const toggleActor = (actor: string) => {
    const next = draft.workflowActors.includes(actor)
      ? draft.workflowActors.filter((a) => a !== actor)
      : [...draft.workflowActors, actor];
    setDraft({ ...draft, workflowActors: next });
  };
  const enabledCount = Object.values(draft.perms).filter((l) => l !== 'none').length;
  const workflowActorOptions = Object.values(ROLES).filter((r) => !['pending', 'super_admin'].includes(r));

  return (
    <div className="dcard" style={{ padding: 18, marginBottom: 16, borderColor: 'var(--accent)' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <ShieldCheck size={18} style={{ color: 'var(--accent)' }} />
        <input
          autoFocus className="side-foot-sel" style={{ width: 260, fontWeight: 600 }}
          placeholder="Role name" value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
        />
        {draft.builtin && <span className="badge b-info" style={{ fontSize: 10 }}>SEEDED</span>}
        <span className="hint">{enabledCount} function{enabledCount === 1 ? '' : 's'} enabled</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onCancel}><X size={14} /> Cancel</button>
          <button className="btn btn-primary" onClick={onSave} disabled={!draft.label.trim() || enabledCount === 0}>
            <Check size={14} /> {draft.id ? 'Save Role' : 'Create Role'}
          </button>
        </div>
      </div>

      {/* Territory scope */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <span className="k" style={{ fontSize: 11 }}>Data scope:</span>
        <button
          className="btn btn-ghost"
          style={{ borderColor: draft.scope === 'own_territory' ? 'var(--accent)' : 'var(--border)', color: draft.scope === 'own_territory' ? 'var(--accent)' : undefined }}
          onClick={() => setDraft({ ...draft, scope: 'own_territory' })}
        ><MapPin size={13} /> Own territory only</button>
        <button
          className="btn btn-ghost"
          style={{ borderColor: draft.scope === 'all' ? 'var(--accent)' : 'var(--border)', color: draft.scope === 'all' ? 'var(--accent)' : undefined }}
          onClick={() => setDraft({ ...draft, scope: 'all' })}
        ><Building2 size={13} /> All sites</button>
        <span className="hint">Territory-scoped roles see only assets &amp; staff at their assigned sites.</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="k" style={{ fontSize: 11, marginBottom: 6 }}>Workflow authority:</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {workflowActorOptions.map((actor) => (
            <label key={actor} className={`chip${draft.workflowActors.includes(actor) ? ' on' : ''}`} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <input type="checkbox" checked={draft.workflowActors.includes(actor)} onChange={() => toggleActor(actor)} />
              {ROLE_LABELS[actor] ?? actor}
            </label>
          ))}
        </div>
        <div className="hint" style={{ marginTop: 6 }}>
          These grants let a renamed or new role perform existing workflow steps without exposing old role names to users.
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {moduleFns.map((mod) => {
          const on = mod.functions.filter((f) => lvl(f.to) !== 'none').length;
          const byGroup = mod.functions.reduce<Record<string, typeof mod.functions>>((acc, f) => {
            (acc[f.group] ??= []).push(f); return acc;
          }, {});
          return (
            <div key={mod.key} className="dcard" style={{ padding: 14, background: 'var(--bg-2, rgba(255,255,255,0.02))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Boxes size={14} style={{ color: 'var(--accent)' }} />
                <strong style={{ fontSize: 13 }}>{mod.brand}</strong>
                <span className="badge" style={{ opacity: 0.7 }}>{on}/{mod.functions.length}</span>
                <select
                  className="side-foot-sel" style={{ marginLeft: 'auto', fontSize: 11, width: 'auto' }}
                  value="" onChange={(e) => { if (e.target.value) setModule(mod.functions, e.target.value as Level); }}
                  title="Set all functions in this module"
                >
                  <option value="">Set all…</option>
                  {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
                </select>
              </div>
              {Object.entries(byGroup).map(([group, fns]) => (
                <div key={group} style={{ marginBottom: 8 }}>
                  <div className="k" style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.6, marginBottom: 4 }}>{group}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 6 }}>
                    {fns.map((f) => (
                      <div key={f.to} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                        background: 'var(--bg-input)', borderRadius: 6, padding: '5px 8px', border: 'var(--hair) solid var(--border)',
                      }}>
                        <span style={{ fontSize: 12, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</span>
                        <select
                          className="side-foot-sel"
                          style={{ width: 'auto', fontSize: 11, padding: '3px 6px', color: LEVEL_COLOR[lvl(f.to)] }}
                          value={lvl(f.to)} onChange={(e) => setLvl(f.to, e.target.value as Level)}
                        >
                          {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoleCard({ role, onEdit, onDelete, onReset }: {
  role: RoleDef; onEdit: () => void; onDelete: () => void; onReset: () => void;
}) {
  const fnCount = Object.values(role.permissions).filter((l) => l !== 'none').length;
  const overridden = role.builtin && isOverridden(role.id);
  return (
    <div className="dcard" style={{ padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div className="avatar" style={{ width: 34, height: 34, background: role.builtin ? 'var(--info-soft)' : 'var(--accent-soft)', color: role.builtin ? 'var(--info)' : 'var(--accent)' }}>
          {role.label.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row-id">
            {role.label}{' '}
            <span className={`badge ${role.builtin ? 'b-info' : 'b-accent'}`}>{role.builtin ? 'SEEDED' : 'SA CREATED'}</span>
            {overridden && <span className="badge b-warn" style={{ marginLeft: 4 }}>EDITED</span>}
            <span className="badge b-muted" style={{ marginLeft: 4 }}>{role.scope === 'own_territory' ? 'territory' : 'all sites'}</span>
          </div>
          <div className="row-sub">
            {role.modules.map((m) => m.toUpperCase()).join(' · ') || 'no module'} — {fnCount} functions
            {role.workflowActors.length > 0 ? ` — workflow: ${role.workflowActors.map((a) => ROLE_LABELS[a] ?? a).join(', ')}` : ''}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={onEdit}><Pencil size={14} /> Edit</button>
        {role.builtin
          ? (overridden && <button className="btn btn-ghost" title="Reset to default" onClick={onReset}><RotateCcw size={14} /></button>)
          : <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={onDelete}><Trash2 size={14} /></button>}
      </div>
    </div>
  );
}

export function RoleBuilder() {
  const { roles } = useRoleRegistry();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [filter, setFilter] = useState<'all' | 'builtin' | 'custom'>('all');

  const modulesFromPerms = (perms: Record<string, Level>): ModuleKey[] =>
    allModuleFunctions().filter((m) => m.functions.some((f) => (perms[f.to] ?? 'none') !== 'none')).map((m) => m.key);

  const startNew = () => setEditing({ builtin: false, label: '', scope: 'all', perms: {}, workflowActors: [] });
  const startEdit = (r: RoleDef) => setEditing({
    id: r.id, builtin: r.builtin, label: r.label, scope: r.scope,
    perms: { ...r.permissions }, workflowActors: [...(r.workflowActors ?? [])],
  });

  const actor = () => ({ actorId: user?.uid ?? 'unknown', actorName: user?.displayName, actorRole: user?.role });

  const save = () => {
    if (!editing) return;
    const wasEditing = !!editing.id;
    const modules = modulesFromPerms(editing.perms);
    const saved = upsertRole({
      id: editing.id,
      label: editing.label.trim(),
      modules,
      permissions: editing.perms,
      scope: editing.scope,
      workflowActors: editing.workflowActors,
      createdBy: user?.uid,
    });
    toast('success', `${saved.label} saved — ${Object.values(saved.permissions).filter((l) => l !== 'none').length} functions`);
    void logActivity({
      category: 'registry', action: wasEditing ? 'role_updated' : 'role_created',
      summary: `Role "${saved.label}" ${wasEditing ? 'updated' : 'created'}`,
      ...actor(), entityType: 'role', entityId: saved.id,
    });
    setEditing(null);
  };

  const remove = (r: RoleDef) => {
    deleteCustomRole(r.id); toast('success', `${r.label} deleted`);
    void logActivity({ category: 'registry', action: 'role_deleted', summary: `Role "${r.label}" deleted`, ...actor(), entityType: 'role', entityId: r.id });
  };
  const reset = (r: RoleDef) => {
    resetBuiltin(r.id); toast('success', `${r.label} reset to default`);
    void logActivity({ category: 'registry', action: 'role_reset', summary: `Built-in role "${r.label}" reset to default`, ...actor(), entityType: 'role', entityId: r.id });
  };

  const visible = roles.filter((r) => filter === 'all' ? true : filter === 'builtin' ? r.builtin : !r.builtin);

  return (
    <div className="page" style={{ maxWidth: 960 }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Roles &amp; Permissions</h1>
          <p className="page-sub">
            <span className="live"><i /> Firestore synced</span>
            <span>{roles.length} roles</span>
            <span>·</span>
            <span style={{ opacity: 0.7 }}>{roles.filter((r) => r.builtin).length} seeded · {roles.filter((r) => !r.builtin).length} SA-created</span>
          </p>
        </div>
        {!editing && <button className="btn btn-primary" onClick={startNew}><ShieldCheck size={15} /> New Role</button>}
      </div>

      <div style={{
        fontSize: 12, color: 'var(--warning)', background: 'var(--warning-soft)',
        border: 'var(--hair) solid var(--warning)', borderRadius: 8, padding: '8px 12px', marginBottom: 16,
      }}>
        Every role is editable here — set each function to <strong>View</strong>, <strong>View + Note</strong> (suggest a change for admin to apply),
        <strong> Edit</strong>, or <strong>Full</strong>. Super Admin changes sync to Firestore and cache locally for offline startup.
      </div>

      {editing && <RoleEditor draft={editing} setDraft={setEditing} onSave={save} onCancel={() => setEditing(null)} />}

      <div className="toolbar">
        <div className="chips">
          {(['all', 'builtin', 'custom'] as const).map((f) => (
            <button key={f} className={`chip${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>
              {f === 'builtin' ? 'seeded' : f === 'custom' ? 'SA-created' : 'all'}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="tbl"><div className="tbl-empty">No roles in this filter.</div></div>
      ) : (
        visible.map((r) => (
          <RoleCard key={r.id} role={r} onEdit={() => startEdit(r)} onDelete={() => remove(r)} onReset={() => reset(r)} />
        ))
      )}
    </div>
  );
}
