# ADR-001: Workflow Engine Pure Function Architecture

**Status:** Approved
**Date:** 2026-06-03
**Author:** Quill (via Nexus)
**Phase:** 9A — Institutional Knowledge Production

---

## Context

Antrac ERP manages complex business workflows: issue tickets, purchase requests, purchase orders, fuel requests, enquiries, and work orders. Each workflow has multiple states (e.g., ticket: reported → diagnosed → approved → resolved) with role-gated transitions (e.g., only Mechanics can diagnose, only GMs can approve).

The system needed to answer two questions:
1. **What transitions are available** for a given role from a given state?
2. **Is a specific transition legal** for a given role?

## Decision

Separate the workflow engine into **pure functions** (`engine.ts`) and a **Phase 3 executor** (Firebase integration).

The pure functions answer "what can this role do from this state?" and "is this transition legal?" without any Firebase dependency. The executor handles Firestore writes, timeline entries, notifications, and side effects.

### Architecture

```
src/lib/workflow/
  types.ts          -- WorkflowId, SideEffectTag, WorkflowTransition, WorkflowDefinition
  engine.ts         -- Pure functions (no Firebase)
  executor.ts       -- Phase 3: Firebase integration
  side-effects.ts   -- 17 side-effect handlers
  notifications.ts  -- Notification creation
```

### Pure Functions (engine.ts)

```typescript
// What transitions are available for this role from this state?
getAvailableTransitions(def, currentStatus, role): WorkflowTransition[]

// Find a specific transition by from/to
getTransition(def, from, to): WorkflowTransition | undefined

// Find a transition by its stable action key
getTransitionByAction(def, action): WorkflowTransition | undefined

// Can this role move the entity from → to?
canTransition(def, from, to, role): boolean

// Is this state terminal?
isTerminal(def, status): boolean

// Human-readable status label
getStatusLabel(def, status): string
```

### Transition Model (types.ts)

```typescript
interface WorkflowTransition {
  from: S;                    // Current state
  to: S;                      // Resulting state
  action: string;             // Stable machine key (e.g., 'submit_diagnosis')
  label: string;              // Button label for UI
  allowedRoles: string[];     // Roles permitted to perform this transition
  requiresNotes?: boolean;    // Require notes before transition
  requiresFields?: string[];  // Fields that must be populated
  sideEffects?: SideEffectTag[];  // Side effects fired after transition
  notify?: string[];          // Roles to notify
  isReject?: boolean;         // Marks a rejection/return path
}
```

### Side Effects (17 types)

```
CREATE_PR_ON_HOLD, ACTIVATE_PR, GENERATE_RFQ, GENERATE_PRICE_COMPARE,
CREATE_PO_PER_SUPPLIER, TRIGGER_DELIVERY, CLOSE_LINKED_PR_PO,
SPAWN_CHILD_TICKET, DEDUCT_INVENTORY_BALANCE, SOFT_RESERVE_ASSETS,
CREATE_WORK_ORDER, DEPLOY_ASSETS, RELEASE_ASSETS,
UPDATE_CUSTOMER_ROLLUPS, RECEIVE_INTO_INVENTORY, CONSUME_TICKET_MATERIALS
```

## Alternatives Considered

| Alternative | Pros | Cons | Rejected Because |
|-------------|------|------|------------------|
| Monolithic workflow service with Firebase coupling | Single file, simple | Untestable without Firebase, tightly coupled | Business logic can't be tested independently |
| Firebase Security Rules only | Server-side enforcement | Limited logic, no side effects, no notifications | Can't handle complex multi-entity workflows |
| Third-party workflow engine (Temporal, Camunda) | Production-grade, battle-tested | External dependency, operational complexity, cost | Overkill for current scale, adds infrastructure burden |
| Pure functions + executor (chosen) | Testable, portable, previewable | Two layers to maintain | Best tradeoff for current needs |

## Consequences

### Positive
- **Testable without Firebase:** Pure functions can be unit tested with mock data
- **Portable across backends:** Engine works with any database (Firestore, PostgreSQL, etc.)
- **UI can preview transitions:** Frontend can show available actions without writing to database
- **Side-effects are explicit:** 17 side-effect types are declared and tracked
- **Role-gated by design:** Every transition declares which roles can perform it

### Negative
- **Two layers to maintain:** Engine + executor must stay in sync
- **Side-effects must match:** Side-effect handlers must handle all 17 declared tags
- **System role is special:** `system` role is used for automated transitions (side effects), must be excluded from user-facing transition lists

## Impact Scope

- **6 workflow types:** ticket, purchase_request, purchase_order, fuel_request, enquiry, work_order
- **17 side-effect types**
- **100+ state transitions**
- **Every financial approval process**
- **Every ticket lifecycle**
- **Every procurement flow**

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/workflow/engine.ts` | Pure transition logic (102 lines) |
| `src/lib/workflow/types.ts` | Transition model, side-effect tags (138 lines) |
| `src/lib/workflow/side-effects.ts` | Side-effect handlers (328 lines) |
| `src/lib/workflow/executor.ts` | Phase 3 Firebase integration (62 lines) |
| `src/lib/workflow/notifications.ts` | Notification creation (34 lines) |

## Known Gaps

- **Zero test coverage:** No unit tests for `engine.ts` (102 lines of untested financial approval logic)
- **Executor not complete:** Phase 3 Firebase integration is partial
- **Side-effect handlers not tested:** 328 lines of side-effect logic untested

## Historical Context

This architecture was established in Phase 2 (workflow engine foundation) and extended in Phase 3 (executor + side effects). The pure function approach was chosen early to enable testing without Firebase dependencies. The 17 side-effect types were added to handle cross-entity workflows (e.g., ticket approval spawns PR, PR approval spawns PO).

---

*End of ADR-001*
