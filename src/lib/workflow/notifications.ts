/**
 * Notification creation. Each workflow transition's `notify` roles produce one
 * notification doc in the top-level `notifications` collection, tagged with the
 * recipient role. The UI queries `where('recipientRole','==',myRole)`.
 */
import type { WriteBatch } from 'firebase/firestore';
import { batchAddTop } from '../firebase/db';
import type { WorkflowDefinition, WorkflowTransition } from './types';

export const NOTIFICATIONS_COLLECTION = 'notifications';

/** Queue notification writes for a transition onto an existing batch. */
export function queueNotifications<S extends string>(
  batch: WriteBatch,
  def: WorkflowDefinition<S>,
  transition: WorkflowTransition<S>,
  entity: { id: string; displayId?: string },
  actorName?: string,
): void {
  if (!transition.notify?.length) return;
  for (const recipientRole of transition.notify) {
    const message = `${def.label} ${entity.displayId ?? entity.id}: ${transition.label}`
      + (actorName ? ` by ${actorName}` : '');
    batchAddTop(batch, NOTIFICATIONS_COLLECTION, {
      recipientRole,
      workflowId: def.id,
      entityId: entity.id,
      entityDisplayId: entity.displayId ?? null,
      event: transition.action,
      message,
      read: false,
    });
  }
}
