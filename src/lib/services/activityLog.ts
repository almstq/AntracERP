/**
 * System Activity Log — one append-only record of everything that happens.
 *
 * Two ways entries arrive:
 *  1. LIVE capture — workflow transitions, role assignments, role edits, etc. are
 *     logged automatically from the moment the app goes live.
 *  2. MANUAL backdated entries — a Super Admin can record history that happened
 *     before go-live. These are flagged `manual: true` with the real `occurredAt`
 *     date. The act of adding one is ITSELF logged live (admin activity).
 *
 * Entries are immutable (no update/delete). Readable by GM and above.
 */
import {
  collection, addDoc, getDocs, query, orderBy, limit as fsLimit, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { getDbInstance } from '../firebase/client';

export type ActivityCategory = 'workflow' | 'access' | 'registry' | 'admin' | 'manual';

export interface ActivityEntry {
  id: string;
  category: ActivityCategory;
  action: string;
  summary: string;
  actorId: string;
  actorName?: string;
  actorRole?: string;
  adminOverride?: boolean;
  performedByRole?: string;
  entityType?: string;
  entityId?: string;
  entityDisplayId?: string;
  manual?: boolean;
  occurredAt: Date;   // when the activity happened (backdated for manual entries)
  createdAt?: Date;    // when the row was written
}

export interface LogInput {
  category: ActivityCategory;
  action: string;
  summary: string;
  actorId: string;
  actorName?: string | null;
  actorRole?: string | null;
  adminOverride?: boolean;
  performedByRole?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  entityDisplayId?: string | null;
  manual?: boolean;
  occurredAt?: Date;
}

const COLL = 'activityLog';

/** Append one activity entry. Best-effort — never throws into the caller. */
export async function logActivity(input: LogInput): Promise<void> {
  const db = getDbInstance();
  if (!db) return;
  try {
    await addDoc(collection(db, COLL), {
      category: input.category,
      action: input.action,
      summary: input.summary,
      actorId: input.actorId,
      actorName: input.actorName ?? null,
      actorRole: input.actorRole ?? null,
      adminOverride: input.adminOverride ?? false,
      performedByRole: input.performedByRole ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      entityDisplayId: input.entityDisplayId ?? null,
      manual: input.manual ?? false,
      occurredAt: input.occurredAt ? Timestamp.fromDate(input.occurredAt) : serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  } catch { /* logging must never break the action it records */ }
}

/**
 * Add a backdated history entry (Super Admin). Records the historical event AND
 * logs the admin action of adding it (so the backdating itself is auditable).
 */
export async function addManualEntry(input: {
  occurredAt: Date;
  category: ActivityCategory;
  summary: string;
  actorId: string;
  actorName?: string;
  actorRole?: string;
}): Promise<void> {
  await logActivity({
    category: input.category,
    action: 'manual_history',
    summary: input.summary,
    actorId: input.actorId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    manual: true,
    occurredAt: input.occurredAt,
  });
  // The act of backdating is itself a live admin activity.
  await logActivity({
    category: 'admin',
    action: 'manual_entry_added',
    summary: `Backdated history entry added for ${input.occurredAt.toLocaleDateString()}: "${input.summary}"`,
    actorId: input.actorId,
    actorName: input.actorName,
    actorRole: input.actorRole,
  });
}

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date(0);
}

/** Newest-first list of activity (capped). */
export async function listActivity(max = 300): Promise<ActivityEntry[]> {
  const db = getDbInstance();
  if (!db) return [];
  try {
    const snap = await getDocs(query(collection(db, COLL), orderBy('occurredAt', 'desc'), fsLimit(max)));
    return snap.docs.map((d) => {
      const data = d.data() ?? {};
      return {
        id: d.id,
        category: data.category,
        action: data.action,
        summary: data.summary,
        actorId: data.actorId,
        actorName: data.actorName ?? undefined,
        actorRole: data.actorRole ?? undefined,
        adminOverride: data.adminOverride ?? false,
        performedByRole: data.performedByRole ?? undefined,
        entityType: data.entityType ?? undefined,
        entityId: data.entityId ?? undefined,
        entityDisplayId: data.entityDisplayId ?? undefined,
        manual: data.manual ?? false,
        occurredAt: toDate(data.occurredAt),
        createdAt: toDate(data.createdAt),
      } as ActivityEntry;
    });
  } catch {
    return [];
  }
}
