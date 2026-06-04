import { describe, it, expect } from 'vitest';
import {
  getAvailableTransitions,
  getTransition,
  getTransitionByAction,
  canTransition,
  isTerminal,
  getStatusLabel,
  validateTransition,
} from './engine';
import {
  ticketWorkflow,
  purchaseRequestWorkflow,
  purchaseOrderWorkflow,
  WORKFLOWS,
  getWorkflow,
} from './definitions';
import type { WorkflowDefinition } from './types';

// A walk step: [from, to, actingRole, payload?]
type Step = [string, string, string, { notes?: string; fields?: Record<string, unknown> }?];

/** Minimal synthetic machine with a SYSTEM-ONLY edge (no real def has one) to
 *  exercise the system-only exclusion in getAvailableTransitions. */
function synthetic(): WorkflowDefinition {
  return {
    id: 'ticket',
    collection: 'synthetic',
    label: 'Synthetic',
    initialState: 'a',
    states: ['a', 'b', 'c'],
    terminalStates: ['c'],
    statusLabels: { a: 'A', b: 'B', c: 'C' },
    transitions: [
      { from: 'a', to: 'b', action: 'go', label: 'Go', allowedRoles: ['operator', 'super_admin'] },
      { from: 'a', to: 'c', action: 'auto', label: 'Auto', allowedRoles: ['system'] }, // system-only
      { from: 'b', to: 'c', action: 'finish', label: 'Finish', allowedRoles: ['gm', 'system', 'super_admin'] },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Structural integrity — invariants every definition must hold (all 6 machines)
// ─────────────────────────────────────────────────────────────────────────────
describe('workflow definitions — structural integrity', () => {
  for (const def of Object.values(WORKFLOWS)) {
    describe(def.label, () => {
      it('initialState is a declared state', () => {
        expect(def.states).toContain(def.initialState);
      });

      it('every terminal state is a declared state', () => {
        for (const t of def.terminalStates) expect(def.states).toContain(t);
      });

      it('every transition from/to is a declared state', () => {
        for (const t of def.transitions) {
          expect(def.states, `from "${t.from}" (${t.action})`).toContain(t.from);
          expect(def.states, `to "${t.to}" (${t.action})`).toContain(t.to);
        }
      });

      it('statusLabels cover exactly the declared states', () => {
        expect(Object.keys(def.statusLabels).sort()).toEqual([...def.states].sort());
      });

      it('action keys are unique', () => {
        const actions = def.transitions.map((t) => t.action);
        expect(new Set(actions).size, 'duplicate action key').toBe(actions.length);
      });

      it('every transition has a label and at least one allowed role', () => {
        for (const t of def.transitions) {
          expect(t.label.length, `${t.action} label`).toBeGreaterThan(0);
          expect(t.allowedRoles.length, `${t.action} allowedRoles`).toBeGreaterThan(0);
        }
      });

      it('super_admin can perform every transition (solo-testable)', () => {
        for (const t of def.transitions) {
          expect(t.allowedRoles, `${t.action} is missing super_admin`).toContain('super_admin');
        }
      });

      it('every state with no outgoing transition is marked terminal', () => {
        const hasOutgoing = new Set(def.transitions.map((t) => t.from));
        for (const s of def.states) {
          if (!hasOutgoing.has(s)) {
            expect(def.terminalStates, `dead-end "${s}" not terminal`).toContain(s);
          }
        }
      });

      it('all states are reachable from initialState', () => {
        const adj = buildAdjacency(def);
        const seen = bfs(def.initialState, adj);
        for (const s of def.states) {
          expect(seen.has(s), `state "${s}" unreachable from "${def.initialState}"`).toBe(true);
        }
      });

      it('every non-terminal state can reach a terminal state (no dead ends)', () => {
        const adj = buildAdjacency(def);
        for (const s of def.states) {
          if (def.terminalStates.includes(s)) continue;
          const reachable = bfs(s, adj);
          const hitsTerminal = def.terminalStates.some((t) => reachable.has(t));
          expect(hitsTerminal, `state "${s}" cannot reach any terminal state`).toBe(true);
        }
      });
    });
  }
});

function buildAdjacency(def: WorkflowDefinition): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const t of def.transitions) {
    const list = adj.get(t.from) ?? [];
    list.push(t.to);
    adj.set(t.from, list);
  }
  return adj;
}

function bfs(start: string, adj: Map<string, string[]>): Set<string> {
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift() as string;
    for (const next of adj.get(cur) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

// ─────────────────────────────────────────────────────────────────────────────
// getAvailableTransitions
// ─────────────────────────────────────────────────────────────────────────────
describe('getAvailableTransitions', () => {
  it('returns only the operator action from a fresh ticket', () => {
    expect(getAvailableTransitions(ticketWorkflow, 'draft', 'operator').map((t) => t.action)).toEqual(['submit']);
  });

  it('returns nothing for a role with no rights from that state', () => {
    expect(getAvailableTransitions(ticketWorkflow, 'draft', 'mechanic')).toEqual([]);
  });

  it('returns every GM option at the approval gate', () => {
    const acts = getAvailableTransitions(ticketWorkflow, 'supervisor_checked', 'gm').map((t) => t.action);
    expect(acts).toContain('gm_approve');
    expect(acts).toContain('gm_reject');
    expect(acts).toContain('gm_request_info');
  });

  it('excludes system-only transitions (even for the system role)', () => {
    const def = synthetic();
    expect(getAvailableTransitions(def, 'a', 'system')).toEqual([]); // "auto" hidden, "go" not for system
    expect(getAvailableTransitions(def, 'a', 'operator').map((t) => t.action)).toEqual(['go']);
    // A mixed system+role transition still shows for the named role.
    expect(getAvailableTransitions(def, 'b', 'gm').map((t) => t.action)).toEqual(['finish']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// canTransition / lookups / terminal / labels
// ─────────────────────────────────────────────────────────────────────────────
describe('canTransition', () => {
  it('allows the authorised role', () => {
    expect(canTransition(ticketWorkflow, 'draft', 'submitted', 'operator')).toBe(true);
  });
  it('denies an unauthorised role', () => {
    expect(canTransition(ticketWorkflow, 'draft', 'submitted', 'gm')).toBe(false);
  });
  it('returns false for a non-existent edge', () => {
    expect(canTransition(ticketWorkflow, 'draft', 'closed', 'super_admin')).toBe(false);
  });
  it('treats a "system"-permitted edge as traversable by anyone (system bridges side effects)', () => {
    // PR on_hold→approved allows ['system','gm','super_admin']; the engine OR-s in system.
    expect(canTransition(purchaseRequestWorkflow, 'on_hold', 'approved', 'operator')).toBe(true);
  });
});

describe('getTransition / getTransitionByAction', () => {
  it('finds a transition by from/to', () => {
    expect(getTransition(ticketWorkflow, 'draft', 'submitted')?.action).toBe('submit');
  });
  it('returns undefined for a missing from/to', () => {
    expect(getTransition(ticketWorkflow, 'draft', 'resolved')).toBeUndefined();
  });
  it('finds a transition by action key', () => {
    expect(getTransitionByAction(ticketWorkflow, 'gm_approve')?.to).toBe('gm_approved');
  });
  it('returns undefined for an unknown action', () => {
    expect(getTransitionByAction(ticketWorkflow, 'does_not_exist')).toBeUndefined();
  });
});

describe('isTerminal & getStatusLabel', () => {
  it('isTerminal is true for a closed ticket', () => {
    expect(isTerminal(ticketWorkflow, 'closed')).toBe(true);
  });
  it('isTerminal is false for an in-flight state', () => {
    expect(isTerminal(ticketWorkflow, 'gm_approved')).toBe(false);
  });
  it('getStatusLabel returns the configured label', () => {
    expect(getStatusLabel(ticketWorkflow, 'gm_approved')).toBe('GM Approved');
  });
  it('getStatusLabel falls back to the raw status when unmapped', () => {
    expect(getStatusLabel(ticketWorkflow, 'mystery_state')).toBe('mystery_state');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateTransition — the rule the executor relies on
// ─────────────────────────────────────────────────────────────────────────────
describe('validateTransition', () => {
  it('passes a legal transition with no extra requirements', () => {
    expect(validateTransition(ticketWorkflow, 'draft', 'submitted', 'operator')).toBeNull();
  });
  it('rejects a non-existent transition', () => {
    expect(validateTransition(ticketWorkflow, 'draft', 'closed', 'super_admin')).toMatch(/No transition/);
  });
  it('rejects a disallowed role', () => {
    expect(validateTransition(ticketWorkflow, 'draft', 'submitted', 'gm')).toMatch(/cannot perform/);
  });
  it('requires notes where requiresNotes is set', () => {
    expect(validateTransition(ticketWorkflow, 'submitted', 'diagnosed', 'mechanic')).toMatch(/requires a note/);
    expect(validateTransition(ticketWorkflow, 'submitted', 'diagnosed', 'mechanic', { notes: 'seal failure' })).toBeNull();
  });
  it('treats whitespace-only notes as missing', () => {
    expect(validateTransition(ticketWorkflow, 'submitted', 'diagnosed', 'mechanic', { notes: '   ' })).toMatch(/requires a note/);
  });
  it('requires fields where requiresFields is set', () => {
    expect(validateTransition(purchaseRequestWorkflow, 'quotes_under_review', 'gm_quote_approved', 'gm')).toMatch(/selectedSuppliers/);
    expect(
      validateTransition(purchaseRequestWorkflow, 'quotes_under_review', 'gm_quote_approved', 'gm', { fields: { selectedSuppliers: ['sup-1'] } }),
    ).toBeNull();
  });
  it('treats empty-string fields as missing', () => {
    expect(
      validateTransition(purchaseOrderWorkflow, 'director_approved', 'payment_completed', 'antrac_finance', { fields: { paymentReceipt: '' } }),
    ).toMatch(/paymentReceipt/);
  });
  it('lets the system role bypass the role gate (side-effect-driven moves)', () => {
    // on_hold→approved permits 'system'; any caller passes the role check when system is allowed.
    expect(validateTransition(purchaseRequestWorkflow, 'on_hold', 'approved', 'whoever')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getWorkflow registry
// ─────────────────────────────────────────────────────────────────────────────
describe('WORKFLOWS registry', () => {
  it('getWorkflow returns the matching definition', () => {
    expect(getWorkflow('ticket')).toBe(ticketWorkflow);
    expect(getWorkflow('purchase_order').collection).toBe('purchaseOrders');
  });
  it('every registry key matches its definition id', () => {
    for (const [id, def] of Object.entries(WORKFLOWS)) expect(def.id).toBe(id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// End-to-end happy path: ticket → PR → PO (the issue-to-closure spine)
// ─────────────────────────────────────────────────────────────────────────────
describe('Issue-to-Closure happy path', () => {
  function assertWalk(def: WorkflowDefinition, path: Step[]) {
    for (const [from, to, role, payload] of path) {
      expect(validateTransition(def, from, to, role, payload), `${from} → ${to} as ${role}`).toBeNull();
    }
    // connected: each `to` is the next step's `from`
    for (let i = 0; i < path.length - 1; i++) expect(path[i][1], 'path is broken').toBe(path[i + 1][0]);
  }

  it('ticket walks draft → closed, each stage legal for its actor', () => {
    const path: Step[] = [
      ['draft', 'submitted', 'operator'],
      ['submitted', 'diagnosed', 'mechanic', { notes: 'hydraulic seal failure' }],
      ['diagnosed', 'supervisor_checked', 'supervisor'],
      ['supervisor_checked', 'gm_approved', 'gm'],
      ['gm_approved', 'awaiting_delivery', 'super_admin'],   // TRIGGER_DELIVERY fires this via system; SA can also do it manually
      ['awaiting_delivery', 'items_delivered', 'operator'],
      ['items_delivered', 'resolved', 'operator', { notes: 'back in service' }],
      ['resolved', 'closed', 'gm'],
    ];
    assertWalk(ticketWorkflow, path);
    expect(path[0][0]).toBe(ticketWorkflow.initialState);
    expect(isTerminal(ticketWorkflow, path[path.length - 1][1])).toBe(true);
  });

  it('blocks an actor from skipping the chain (operator cannot GM-approve)', () => {
    expect(validateTransition(ticketWorkflow, 'supervisor_checked', 'gm_approved', 'operator')).toMatch(/cannot perform/);
  });

  it('GM approval bridges into procurement (ACTIVATE_PR side effect)', () => {
    expect(getTransition(ticketWorkflow, 'supervisor_checked', 'gm_approved')?.sideEffects).toContain('ACTIVATE_PR');
  });

  it('PR walks on_hold → closed through sourcing & supplier award', () => {
    const path: Step[] = [
      ['on_hold', 'approved', 'system'], // bridged by the ticket GM approval
      ['approved', 'pr_accepted', 'proc_staff'],
      ['pr_accepted', 'rfq_sent', 'proc_staff'],
      ['rfq_sent', 'quotes_under_review', 'proc_staff'],
      ['quotes_under_review', 'gm_quote_approved', 'gm', { fields: { selectedSuppliers: ['sup-1'] } }],
      ['gm_quote_approved', 'po_raised', 'proc_staff'],
      ['po_raised', 'closed', 'proc_staff'],
    ];
    assertWalk(purchaseRequestWorkflow, path);
  });

  it('raising the PO spawns one PO per supplier (CREATE_PO_PER_SUPPLIER)', () => {
    expect(getTransition(purchaseRequestWorkflow, 'gm_quote_approved', 'po_raised')?.sideEffects).toContain('CREATE_PO_PER_SUPPLIER');
  });

  it('PO walks the full 4-tier HQ payment chain raised → po_closed', () => {
    const path: Step[] = [
      ['raised', 'supplier_confirmed', 'proc_staff'],
      ['supplier_confirmed', 'payment_request_sent', 'finance_wli'],
      ['payment_request_sent', 'antrac_finance_accepted', 'antrac_finance'],
      ['antrac_finance_accepted', 'cfo_verified', 'cfo'],
      ['cfo_verified', 'director_approved', 'director'],
      ['director_approved', 'payment_completed', 'antrac_finance', { fields: { paymentReceipt: 'rcpt-1' } }],
      ['payment_completed', 'wli_finance_confirmed', 'finance_wli'],
      ['wli_finance_confirmed', 'items_collected', 'inventory_staff', { fields: { taxInvoice: 'inv-1' } }],
      ['items_collected', 'po_closed', 'proc_staff'],
    ];
    assertWalk(purchaseOrderWorkflow, path);
    expect(isTerminal(purchaseOrderWorkflow, 'po_closed')).toBe(true);
  });

  it('enforces payment-tier order (CFO cannot verify before Antrac Finance accepts)', () => {
    expect(validateTransition(purchaseOrderWorkflow, 'payment_request_sent', 'cfo_verified', 'cfo')).toMatch(/No transition/);
  });

  it('payment needs a receipt and collection needs a tax invoice', () => {
    expect(validateTransition(purchaseOrderWorkflow, 'director_approved', 'payment_completed', 'antrac_finance')).toMatch(/paymentReceipt/);
    expect(validateTransition(purchaseOrderWorkflow, 'wli_finance_confirmed', 'items_collected', 'inventory_staff')).toMatch(/taxInvoice/);
  });

  it('closing the PO triggers delivery to the requestee (TRIGGER_DELIVERY)', () => {
    expect(getTransition(purchaseOrderWorkflow, 'items_collected', 'po_closed')?.sideEffects).toContain('TRIGGER_DELIVERY');
  });
});
