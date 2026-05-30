/**
 * Generic workflow engine — shared by all Antrac role-gated workflows.
 *
 * Every workflow is a linear-ish, role-gated state machine over a single
 * Firestore entity. Entities are linked to each other via SIDE EFFECTS
 * (e.g. a ticket reaching `gm_approved` fires ACTIVATE_PR on its linked PR).
 *
 * Phase 2 = pure definitions + pure transition logic (no Firebase).
 * Phase 3 = the executor wires transitions to Firestore writes, the timeline
 *           subcollection, notification creation, and side-effect handlers.
 */

export type WorkflowId =
  | 'ticket'
  | 'purchase_request'
  | 'purchase_order'
  | 'fuel_request';

/**
 * Side-effect tags. The engine declares them; Phase 3 maps each tag to a
 * handler that mutates linked entities / balances.
 */
export type SideEffectTag =
  | 'CREATE_PR_ON_HOLD'        // ticket diagnosis → spawn PR (on_hold) if material/service needed
  | 'ACTIVATE_PR'             // ticket gm_approved → PR on_hold → approved
  | 'GENERATE_RFQ'            // PR rfq_sent → produce one RFQ per supplier (PDF stub)
  | 'GENERATE_PRICE_COMPARE'  // PR quotes → Gemini comparison (stub)
  | 'CREATE_PO_PER_SUPPLIER'  // PR po_raised → one PO per selected supplier
  | 'TRIGGER_DELIVERY'        // PO closed → create delivery task to requestee
  | 'MARK_TICKET_DELIVERED'   // delivery confirmed → ticket → items_delivered
  | 'CLOSE_LINKED_PR_PO'      // ticket resolved → close linked PR/PO
  | 'SPAWN_CHILD_TICKET'      // ticket persists → new child ticket
  | 'DEDUCT_INVENTORY_BALANCE'; // fuel_request closed → deduct WLI balance

export interface WorkflowTransition<S extends string = string> {
  /** Current state this transition departs from. */
  from: S;
  /** Resulting state. */
  to: S;
  /** Stable machine key (used by UI + executor), e.g. 'submit_diagnosis'. */
  action: string;
  /** Button label shown to the actor. */
  label: string;
  /** Roles permitted to perform this transition. 'system' = engine/side-effect only. */
  allowedRoles: string[];
  /** Require a notes string before the transition is accepted. */
  requiresNotes?: boolean;
  /** Entity fields that must be populated for this transition (validated in app). */
  requiresFields?: string[];
  /** Side effects fired after a successful transition. */
  sideEffects?: SideEffectTag[];
  /** Roles to notify when this transition completes. */
  notify?: string[];
  /** Marks a rejection/return path (for UI styling). */
  isReject?: boolean;
}

export interface WorkflowDefinition<S extends string = string> {
  id: WorkflowId;
  /** Firestore collection backing this workflow's entities. */
  collection: string;
  /** Human label, e.g. "Issue Ticket". */
  label: string;
  /** State an entity is created in. */
  initialState: S;
  /** All valid states. */
  states: readonly S[];
  /** States from which no forward progress is expected. */
  terminalStates: readonly S[];
  /** Display labels per state. */
  statusLabels: Record<S, string>;
  /** All transitions. */
  transitions: WorkflowTransition<S>[];
}

/** A single immutable entry in an entity's timeline subcollection. */
export interface TimelineEvent {
  id?: string;
  workflowId: WorkflowId;
  entityId: string;
  from: string;
  to: string;
  action: string;
  actorId: string;
  actorRole: string;
  actorName?: string;
  notes?: string;
  timestamp: Date;
}

/** In-app notification (Phase 3 writes these to users/{uid}/notifications). */
export interface WorkflowNotification {
  id?: string;
  recipientRole: string;
  recipientId?: string;
  workflowId: WorkflowId;
  entityId: string;
  entityDisplayId?: string;
  event: string;
  message: string;
  read: boolean;
  createdAt: Date;
}
