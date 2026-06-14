/**
 * executeTransition — the live half of the workflow engine.
 *
 * 1. Read the entity, determine its current status.
 * 2. Validate the requested transition (role, notes, required fields).
 * 3. In one atomic batch: write status + supplied fields, append an immutable
 *    timeline event, and queue notifications for the transition's `notify` roles.
 * 4. After commit, run side-effect handlers (which may create/advance linked entities).
 */
import {
  getById, newBatch, batchUpdate, batchAddSub, batchAddTop, serverTimestamp,
} from '../firebase/db';
import { getWorkflow } from './definitions';
import { getTransition, validateTransition } from './engine';
import { queueNotifications } from './notifications';
import { runSideEffects } from './side-effects';
import type { ExecuteOptions, ExecuteResult } from './types';

export async function executeTransition(opts: ExecuteOptions): Promise<ExecuteResult> {
  const { workflowId, entityId, to, actor, notes, fields } = opts;
  const def = getWorkflow(workflowId);

  const entity = await getById<{ status: string; displayId?: string }>(def.collection, entityId);
  if (!entity) {
    return { success: false, message: `${def.label} ${entityId} not found.` };
  }
  const from = entity.status as string;

  const error = validateTransition(def, from, to, actor.role, { notes, fields });
  if (error) {
    return { success: false, message: error, from, to };
  }

  const transition = getTransition(def, from, to)!;

  // ── Atomic write: status + fields + timeline + notifications ──
  const batch = newBatch();

  batchUpdate(batch, def.collection, entityId, {
    status: to,
    ...(fields ?? {}),
  });

  batchAddSub(batch, def.collection, entityId, 'timeline', {
    workflowId, entityId, from, to,
    action: transition.action,
    actorId: actor.id,
    actorRole: actor.role,
    actorName: actor.name ?? null,
    // Proxy governance: capture that a super_admin acted on behalf of this role.
    adminOverride: actor.adminOverride ?? false,
    performedByRole: actor.realRole ?? null,
    notes: notes ?? null,
    timestamp: serverTimestamp(),
  });

  queueNotifications(batch, def, transition, { id: entityId, displayId: entity.displayId }, actor.name);

  // Live system-log capture — one global, append-only record of this activity.
  batchAddTop(batch, 'activityLog', {
    category: 'workflow',
    action: transition.action,
    summary: `${def.label} ${entity.displayId ?? entityId}: ${from} → ${to}`,
    actorId: actor.id,
    actorName: actor.name ?? null,
    actorRole: actor.role,
    adminOverride: actor.adminOverride ?? false,
    performedByRole: actor.realRole ?? null,
    entityType: workflowId,
    entityId,
    entityDisplayId: entity.displayId ?? null,
    manual: false,
    occurredAt: serverTimestamp(),
  });

  await batch.commit();

  // ── Side effects (post-commit; may create/advance linked entities) ──
  await runSideEffects(transition.sideEffects, { entityId, actor, execute: executeTransition });

  return { success: true, message: `${def.label}: ${from} → ${to}`, from, to };
}
