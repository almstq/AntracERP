/**
 * Unified role registry — the single source of truth for ALL roles.
 *
 * Every role (the 17 built-ins AND admin-created custom roles) is a RoleDef with:
 *   - `modules`:     which SBU/HQ modules it may open
 *   - `permissions`: per-function (nav path) permission LEVEL
 *   - `scope`:       'own_territory' (sees only its sites' assets/staff) or 'all'
 *   - `workflowActors`: stable workflow authorities granted to this role
 *
 * PERMISSION LEVELS (ascending power):
 *   none  → cannot see the function
 *   view  → read-only
 *   note  → read + can attach a note / suggest a change (admin applies it)
 *   edit  → can change data directly
 *   manage→ full control (edit + approve others' notes, etc.)
 *
 * PERSISTENCE:
 *   - Built-in *defaults* are seeded from code at startup.
 *   - Super Admin edits and SA-created roles are stored in one Firestore `roles` registry.
 *   - Legacy `customRoles` / override docs are still read as a migration fallback.
 */
import { useSyncExternalStore } from 'react';
import type { ModuleKey } from './scope';
import { listAll, getById, createWithId, deleteDocument } from '../firebase/db';
import { setDoc, doc } from 'firebase/firestore';
import { getDbInstance } from '../firebase/client';

const FS_ROLES = 'roles';               // unified registry (doc id = role id)
const FS_CUSTOM = 'customRoles';        // legacy fallback
const FS_CONFIG = 'appConfig';
const FS_OVERRIDES = 'roleOverrides';   // single doc holding { data: { roleId: partial } }

export type Level = 'none' | 'view' | 'note' | 'edit' | 'manage';
export type Scope = 'own_territory' | 'all';

export const LEVELS: Level[] = ['none', 'view', 'note', 'edit', 'manage'];
export const LEVEL_RANK: Record<Level, number> = { none: 0, view: 1, note: 2, edit: 3, manage: 4 };
export const LEVEL_LABEL: Record<Level, string> = {
  none: 'No access', view: 'View only', note: 'View + Note', edit: 'Edit', manage: 'Full',
};

export interface RoleDef {
  id: string;
  label: string;
  builtin: boolean;
  modules: ModuleKey[];
  permissions: Record<string, Level>; // nav path -> level
  scope: Scope;
  workflowActors: string[];
  createdAt: number;
  createdBy?: string;
}

const LS_CUSTOM = 'antrac:roles:custom:v1';
const LS_OVERRIDES = 'antrac:roles:overrides:v1'; // built-in edits

// In-memory built-in defaults, populated once by seedBuiltins().
const builtinBase = new Map<string, RoleDef>();

let customCache: RoleDef[] | null = null;
let overrideCache: Record<string, Partial<RoleDef>> | null = null;
const listeners = new Set<() => void>();

// Recover custom roles created before the unified-registry migration
// (old shape: { id, label, modules, functions: string[] } under a legacy key).
function migrateLegacyCustomRoles(): RoleDef[] {
  try {
    const raw = localStorage.getItem('antrac:customRoles:v1');
    if (!raw) return [];
    const legacy = JSON.parse(raw) as Array<{ id: string; label: string; modules?: ModuleKey[]; functions?: string[]; createdAt?: number }>;
    if (!Array.isArray(legacy) || legacy.length === 0) return [];
    return legacy.map((r) => ({
      id: r.id, label: r.label, builtin: false,
      modules: r.modules ?? [],
      permissions: Object.fromEntries((r.functions ?? []).map((f) => [f, 'edit' as Level])),
      scope: 'all' as Scope,
      workflowActors: [],
      createdAt: r.createdAt ?? Date.now(),
    }));
  } catch { return []; }
}

// ── storage (Firestore write-through added separately; localStorage is the cache) ──
function loadCustom(): RoleDef[] {
  if (customCache) return customCache;
  try { customCache = JSON.parse(localStorage.getItem(LS_CUSTOM) || '[]'); }
  catch { customCache = []; }
  // One-time recovery of pre-migration custom roles.
  if (customCache!.length === 0) {
    const legacy = migrateLegacyCustomRoles();
    if (legacy.length) {
      customCache = legacy;
      try { localStorage.setItem(LS_CUSTOM, JSON.stringify(legacy)); } catch { /* ignore */ }
    }
  }
  return customCache!;
}
function loadOverrides(): Record<string, Partial<RoleDef>> {
  if (overrideCache) return overrideCache;
  try { overrideCache = JSON.parse(localStorage.getItem(LS_OVERRIDES) || '{}'); }
  catch { overrideCache = {}; }
  return overrideCache!;
}
function saveCustom(roles: RoleDef[]) {
  customCache = roles;
  try { localStorage.setItem(LS_CUSTOM, JSON.stringify(roles)); } catch { /* ignore */ }
  emit();
}
function saveOverrides(ov: Record<string, Partial<RoleDef>>) {
  overrideCache = ov;
  try { localStorage.setItem(LS_OVERRIDES, JSON.stringify(ov)); } catch { /* ignore */ }
  emit();
}

function emit() { version++; listeners.forEach((l) => l()); }
let version = 0;

// ── Firestore sync (central persistence; localStorage is the offline fallback) ──
// Best-effort: every helper swallows errors so the app keeps working offline / in
// mock mode. Roles are hydrated once at login and write-through on every mutation.

function fsAvailable(): boolean {
  try { return !!getDbInstance(); } catch { return false; }
}

function sanitizeRoleId(label: string): string {
  const base = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'role';
  const existing = new Set([...builtinBase.keys(), ...loadCustom().map((r) => r.id)]);
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

async function fsWriteRole(role: RoleDef): Promise<void> {
  if (!fsAvailable()) return;
  try { await createWithId(FS_ROLES, role.id, role as unknown as Record<string, unknown>); } catch { /* offline */ }
}
async function fsDeleteRole(id: string): Promise<void> {
  if (!fsAvailable()) return;
  try { await deleteDocument(FS_ROLES, id); } catch { /* offline */ }
}
async function fsWriteOverrides(): Promise<void> {
  if (!fsAvailable()) return;
  try {
    const instance = getDbInstance();
    if (!instance) return;
    await setDoc(doc(instance, FS_CONFIG, FS_OVERRIDES), { data: loadOverrides() }, { merge: false });
  } catch { /* offline */ }
}

/** Load custom roles + built-in overrides from Firestore into the caches. Call once after login. */
export async function hydrateFromFirestore(): Promise<void> {
  if (!fsAvailable()) return;
  try {
    const registry = await listAll<RoleDef>(FS_ROLES);
    if (Array.isArray(registry) && registry.length > 0) {
      const overrides: Record<string, Partial<RoleDef>> = {};
      const customs: RoleDef[] = [];
      for (const role of registry) {
        const normalized = { ...role, workflowActors: role.workflowActors ?? [] };
        if (builtinBase.has(normalized.id) || normalized.builtin) {
          overrides[normalized.id] = {
            label: normalized.label,
            modules: normalized.modules,
            permissions: normalized.permissions,
            scope: normalized.scope,
            workflowActors: normalized.workflowActors,
          };
        } else {
          customs.push({ ...normalized, builtin: false });
        }
      }
      customCache = customs;
      overrideCache = { ...loadOverrides(), ...overrides };
      try { localStorage.setItem(LS_CUSTOM, JSON.stringify(customCache)); } catch { /* ignore */ }
      try { localStorage.setItem(LS_OVERRIDES, JSON.stringify(overrideCache)); } catch { /* ignore */ }
    } else {
      const customs = await listAll<RoleDef>(FS_CUSTOM);
      if (Array.isArray(customs)) {
        customCache = customs.map((c) => ({ ...c, builtin: false, workflowActors: c.workflowActors ?? [] }));
        try { localStorage.setItem(LS_CUSTOM, JSON.stringify(customCache)); } catch { /* ignore */ }
      }
    }
    const ovDoc = await getById<{ data: Record<string, Partial<RoleDef>> }>(FS_CONFIG, FS_OVERRIDES);
    if (ovDoc?.data) {
      // Legacy appConfig overrides are a fallback; unified /roles docs win.
      overrideCache = { ...ovDoc.data, ...loadOverrides() };
      try { localStorage.setItem(LS_OVERRIDES, JSON.stringify(overrideCache)); } catch { /* ignore */ }
    }
    emit();
  } catch { /* keep localStorage caches */ }
}

// ── seeding (called once at startup with data derived from navConfig) ────────
export function seedBuiltins(defs: RoleDef[]): void {
  builtinBase.clear();
  for (const d of defs) builtinBase.set(d.id, { ...d, builtin: true, workflowActors: d.workflowActors ?? [d.id] });
  emit();
}

// ── identity ────────────────────────────────────────────────────────────────
export function isCustomRole(role: string | undefined | null): boolean {
  return typeof role === 'string' && role !== 'pending' && !builtinBase.has(role);
}

// ── resolution ───────────────────────────────────────────────────────────────
export function getRole(id: string): RoleDef | undefined {
  const base = builtinBase.get(id);
  if (!base) return loadCustom().find((r) => r.id === id);
  const ov = loadOverrides()[id];
  if (!ov) return base;
  return {
    ...base,
    label: ov.label ?? base.label,
    modules: ov.modules ?? base.modules,
    permissions: ov.permissions ?? base.permissions,
    scope: ov.scope ?? base.scope,
    workflowActors: ov.workflowActors ?? base.workflowActors,
  };
}

export function getAllRoles(): RoleDef[] {
  const builtins = [...builtinBase.keys()].map((id) => getRole(id)!).filter(Boolean);
  return [...builtins, ...loadCustom()];
}

export function getCustomRoles(): RoleDef[] {
  return [...loadCustom()];
}

export function roleLabel(role: string): string | undefined {
  return getRole(role)?.label;
}

export function roleModules(role: string): ModuleKey[] {
  return getRole(role)?.modules ?? [];
}

/** Registry-aware module access — used at runtime by nav + route guards. */
export function roleCanAccessModule(role: string, moduleKey: ModuleKey): boolean {
  if (role === 'super_admin') return true;
  return roleModules(role).includes(moduleKey);
}

export function roleScope(role: string): Scope {
  // super_admin + gm always operate org-wide.
  if (role === 'super_admin' || role === 'gm') return 'all';
  return getRole(role)?.scope ?? 'all';
}

export function roleWorkflowActors(role: string): string[] {
  if (role === 'super_admin') return ['super_admin'];
  const def = getRole(role);
  return def ? Array.from(new Set([role, ...(def.workflowActors ?? [])])) : [role];
}

export function roleHasWorkflowActor(role: string, actor: string): boolean {
  return roleWorkflowActors(role).includes(actor);
}

/** Permission level this role has for a given function path. */
export function permissionLevel(role: string, path: string): Level {
  if (role === 'super_admin') return 'manage';
  if (path === '/registry') {
    return role && role !== 'pending' ? 'view' : 'none';
  }
  return getRole(role)?.permissions[path] ?? 'none';
}

/** Convenience predicates used by components. */
export function canView(role: string, path: string): boolean {
  return LEVEL_RANK[permissionLevel(role, path)] >= LEVEL_RANK.view;
}
export function canNote(role: string, path: string): boolean {
  return LEVEL_RANK[permissionLevel(role, path)] >= LEVEL_RANK.note;
}
export function canEdit(role: string, path: string): boolean {
  return LEVEL_RANK[permissionLevel(role, path)] >= LEVEL_RANK.edit;
}
export function canManage(role: string, path: string): boolean {
  return LEVEL_RANK[permissionLevel(role, path)] >= LEVEL_RANK.manage;
}

/** True when this role is confined to its own sites (territory-scoped). */
export function isTerritoryScoped(role: string): boolean {
  return roleScope(role) === 'own_territory';
}

// ── mutation ─────────────────────────────────────────────────────────────────
export function upsertRole(
  input: { id?: string; label: string; modules: ModuleKey[]; permissions: Record<string, Level>; scope: Scope; workflowActors?: string[]; createdBy?: string },
): RoleDef {
  // Editing a built-in → store as override.
  if (input.id && builtinBase.has(input.id)) {
    const ov = { ...loadOverrides() };
    ov[input.id] = {
      label: input.label,
      modules: input.modules,
      permissions: input.permissions,
      scope: input.scope,
      workflowActors: input.workflowActors ?? [input.id],
    };
    saveOverrides(ov);
    void fsWriteRole(getRole(input.id)!);
    void fsWriteOverrides();
    return getRole(input.id)!;
  }
  const roles = loadCustom();
  if (input.id) {
    const idx = roles.findIndex((r) => r.id === input.id);
    if (idx >= 0) {
      const updated: RoleDef = {
        ...roles[idx],
        label: input.label,
        modules: input.modules,
        permissions: input.permissions,
        scope: input.scope,
        workflowActors: input.workflowActors ?? [],
      };
      const next = [...roles]; next[idx] = updated; saveCustom(next);
      void fsWriteRole(updated);
      return updated;
    }
  }
  const created: RoleDef = {
    id: sanitizeRoleId(input.label),
    label: input.label, builtin: false,
    modules: input.modules, permissions: input.permissions, scope: input.scope,
    workflowActors: input.workflowActors ?? [],
    createdAt: Date.now(), createdBy: input.createdBy,
  };
  saveCustom([...roles, created]);
  void fsWriteRole(created);
  return created;
}

export function deleteCustomRole(id: string): void {
  if (builtinBase.has(id)) return; // seeded roles can't be deleted
  saveCustom(loadCustom().filter((r) => r.id !== id));
  void fsDeleteRole(id);
}

/** Reset a built-in role back to its code default (drop overrides). */
export function resetBuiltin(id: string): void {
  const ov = { ...loadOverrides() };
  delete ov[id];
  saveOverrides(ov);
  void fsDeleteRole(id);
  void fsWriteOverrides();
}

export function isOverridden(id: string): boolean {
  return !!loadOverrides()[id];
}

// ── React hook ───────────────────────────────────────────────────────────────
function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
function snapshotVersion() { return version; }

export function useRoleRegistry(): { roles: RoleDef[]; version: number } {
  const v = useSyncExternalStore(subscribe, snapshotVersion, snapshotVersion);
  return { roles: getAllRoles(), version: v };
}
