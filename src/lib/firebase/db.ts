/**
 * Typed Firestore data-access layer (real SDK, used by the workflow executor
 * and live data hooks). Separate from the legacy mock stubs in firestore.ts.
 *
 * Timestamps: writes use serverTimestamp(); reads convert Firestore Timestamps
 * to JS Dates so the rest of the app sees plain Date objects.
 */
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, deleteDoc,
  query, where, orderBy, writeBatch, serverTimestamp, Timestamp, documentId,
  type WhereFilterOp, type WriteBatch, type Firestore,
} from 'firebase/firestore';
import { getDbInstance } from './client';

function db(): Firestore {
  const instance = getDbInstance();
  if (!instance) throw new Error('[db] Firebase not configured (.env.local missing?)');
  return instance;
}

/** Recursively convert Firestore Timestamps to JS Dates. */
function deepConvert<T>(value: T): T {
  if (value instanceof Timestamp) return value.toDate() as unknown as T;
  if (Array.isArray(value)) return value.map(deepConvert) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = deepConvert(v);
    return out as T;
  }
  return value;
}

export async function getById<T = Record<string, unknown>>(
  coll: string, id: string,
): Promise<(T & { id: string }) | null> {
  const snap = await getDoc(doc(db(), coll, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...deepConvert(snap.data()) } as T & { id: string };
}

export async function listAll<T = Record<string, unknown>>(
  coll: string,
): Promise<(T & { id: string })[]> {
  const snap = await getDocs(collection(db(), coll));
  return snap.docs.map((d) => ({ id: d.id, ...deepConvert(d.data()) }) as T & { id: string });
}

export async function listWhere<T = Record<string, unknown>>(
  coll: string, field: string, op: WhereFilterOp, value: unknown, sortBy?: string,
): Promise<(T & { id: string })[]> {
  const constraints = [where(field, op, value)];
  if (sortBy) constraints.push(orderBy(sortBy) as never);
  const snap = await getDocs(query(collection(db(), coll), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...deepConvert(d.data()) }) as T & { id: string });
}

/**
 * List a collection scoped to a set of site ids, matched on `field`. Pass
 * `field='id'` to match the document id itself (the `sites` collection, where
 * the doc id *is* the site id). Deliberately a single `in` constraint with NO
 * sbuId equality — a site id already belongs to exactly one SBU — so it rides
 * Firestore's automatic single-field index and needs NO composite index.
 * Returns [] for an empty id set (an `in` with [] throws).
 */
export async function listBySites<T = Record<string, unknown>>(
  coll: string, field: string, siteIds: readonly string[],
): Promise<(T & { id: string })[]> {
  if (!siteIds.length) return [];
  const target = field === 'id' ? documentId() : field;
  // Firestore caps `in` at 30 values; site-bound field roles have ≤4 sites.
  const snap = await getDocs(query(collection(db(), coll), where(target, 'in', siteIds.slice(0, 30))));
  return snap.docs.map((d) => ({ id: d.id, ...deepConvert(d.data()) }) as T & { id: string });
}

/** List a subcollection, optionally ordered by a field. */
export async function listSub<T = Record<string, unknown>>(
  coll: string, id: string, sub: string, sortBy?: string,
): Promise<(T & { id: string })[]> {
  const base = collection(db(), coll, id, sub);
  const snap = await getDocs(sortBy ? query(base, orderBy(sortBy)) : base);
  return snap.docs.map((d) => ({ id: d.id, ...deepConvert(d.data()) }) as T & { id: string });
}

/** Create a doc with an explicit id. */
export async function createWithId(coll: string, id: string, data: Record<string, unknown>): Promise<void> {
  await setDoc(doc(db(), coll, id), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

/** Create a doc with an auto id; returns the new id. */
export async function createAuto(coll: string, data: Record<string, unknown>): Promise<string> {
  const ref = await addDoc(collection(db(), coll), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateFields(coll: string, id: string, data: Record<string, unknown>): Promise<void> {
  await updateDoc(doc(db(), coll, id), { ...data, updatedAt: serverTimestamp() });
}

// ─── Batch helpers (for atomic multi-write transitions) ────────────────────

export function newBatch(): WriteBatch {
  return writeBatch(db());
}

export function batchUpdate(batch: WriteBatch, coll: string, id: string, data: Record<string, unknown>): void {
  batch.update(doc(db(), coll, id), { ...data, updatedAt: serverTimestamp() });
}

/** Add a doc to a subcollection within a batch; returns the generated ref id. */
export function batchAddSub(batch: WriteBatch, coll: string, id: string, sub: string, data: Record<string, unknown>): string {
  const ref = doc(collection(db(), coll, id, sub));
  batch.set(ref, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

/** Add a doc to a top-level collection within a batch; returns the generated ref id. */
export function batchAddTop(batch: WriteBatch, coll: string, data: Record<string, unknown>): string {
  const ref = doc(collection(db(), coll));
  batch.set(ref, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export { serverTimestamp };

// ─── Delete ─────────────────────────────────────────────────────────────────

export async function deleteDocument(coll: string, id: string): Promise<void> {
  await deleteDoc(doc(db(), coll, id));
}
