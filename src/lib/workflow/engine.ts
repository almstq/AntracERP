/**
 * Workflow engine — pure transition logic.
 *
 * Phase 2: no Firebase. These functions answer "what can this role do from
 * this state?" and "is this transition legal?". Phase 3 adds executeTransition
 * which performs the Firestore write + timeline + notifications + side effects.
 */

import type { WorkflowDefinition, WorkflowTransition } from './types';
import { roleWorkflowActors } from '../permissions/roleRegistry';

/** Transitions available from `currentStatus` for `role` (excludes system-only). */
export function getAvailableTransitions<S extends string>(
  def: WorkflowDefinition<S>,
  currentStatus: S,
  role: string,
): WorkflowTransition<S>[] {
  const actors = roleWorkflowActors(role);
  return def.transitions.filter(
    (t) =>
      t.from === currentStatus &&
      actors.some((actor) => t.allowedRoles.includes(actor)) &&
      !t.allowedRoles.every((r) => r === 'system'),
  );
}

/** Find a specific transition by from/to (includes system transitions). */
export function getTransition<S extends string>(
  def: WorkflowDefinition<S>,
  from: S,
  to: S,
): WorkflowTransition<S> | undefined {
  return def.transitions.find((t) => t.from === from && t.to === to);
}

/** Find a transition by its stable action key. */
export function getTransitionByAction<S extends string>(
  def: WorkflowDefinition<S>,
  action: string,
): WorkflowTransition<S> | undefined {
  return def.transitions.find((t) => t.action === action);
}

/** Can `role` move the entity from → to? ('system' permits side-effect-driven moves.) */
export function canTransition<S extends string>(
  def: WorkflowDefinition<S>,
  from: S,
  to: S,
  role: string,
): boolean {
  const actors = roleWorkflowActors(role);
  return def.transitions.some(
    (t) =>
      t.from === from &&
      t.to === to &&
      (actors.some((actor) => t.allowedRoles.includes(actor)) || t.allowedRoles.includes('system')),
  );
}

export function isTerminal<S extends string>(
  def: WorkflowDefinition<S>,
  status: S,
): boolean {
  return def.terminalStates.includes(status);
}

export function getStatusLabel<S extends string>(
  def: WorkflowDefinition<S>,
  status: S,
): string {
  return def.statusLabels[status] ?? status;
}

/**
 * Validate a requested transition against the definition and supplied payload.
 * Returns an error message if invalid, or null if the transition is allowed.
 */
export function validateTransition<S extends string>(
  def: WorkflowDefinition<S>,
  from: S,
  to: S,
  role: string,
  payload: { notes?: string; fields?: Record<string, unknown> } = {},
): string | null {
  const transition = getTransition(def, from, to);
  if (!transition) {
    return `No transition from "${from}" to "${to}" in ${def.label}.`;
  }
  const actors = roleWorkflowActors(role);
  if (!actors.some((actor) => transition.allowedRoles.includes(actor)) && !transition.allowedRoles.includes('system')) {
    return `Role "${role}" cannot perform "${transition.label}".`;
  }
  if (transition.requiresNotes && !payload.notes?.trim()) {
    return `"${transition.label}" requires a note.`;
  }
  if (transition.requiresFields?.length) {
    const fields = payload.fields ?? {};
    const missing = transition.requiresFields.filter(
      (f) => fields[f] === undefined || fields[f] === null || fields[f] === '',
    );
    if (missing.length) {
      return `"${transition.label}" requires: ${missing.join(', ')}.`;
    }
  }
  return null;
}
