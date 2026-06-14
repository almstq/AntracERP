# HAND-001: Phase 1 Foundation — Authentication and Role Architecture

**Status:** Approved
**Date:** 2026-06-03
**Author:** Quill (via Nexus)
**Phase:** 9A — Institutional Knowledge Production
**Scope:** Phase 1 Foundation — 7 major task groups, 43 subsequent phases built on this foundation

---

## Purpose

This handover document captures the architecture, design rationale, and interfaces established during Phase 1 (Foundation). It enables any new worker to understand and work on the authentication system, role model, asset data model, and design system without reverse-engineering from code.

---

## What Was Built

### Authentication Architecture

**Flow:**
1. User clicks "Sign in with Google" (or email/password)
2. Firebase Auth popup → `onAuthStateChanged` fires
3. `AuthContext.tsx` fetches user document from Firestore
4. User state set with: uid, email, displayName, role, orgId, orgName, siteIds
5. `ProtectedRoute` checks `user + loading` → redirects to role-specific home page
6. UI filters data based on role + siteIds

**Files:**
| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/context/AuthContext.context.ts` | AuthUser model, AuthContextType | 37 |
| `src/lib/context/AuthContext.tsx` | Auth provider, onAuthStateChanged, Act-As | 124 |
| `src/lib/firebase/auth.ts` | loginWithGoogle, loginWithEmail, registerWithEmail | 60 |
| `src/lib/firebase/client.ts` | Firebase initialization | — |
| `src/pages/Login.tsx` | Login UI, isProcessing state, dev login | 132 |

**Key design decisions:**
- `loading: true` initial state (user not yet determined)
- `isProcessing` state in Login.tsx prevents double-clicks during auth
- `useEffect` in Login.tsx navigates only after `user` state is set (fixes race condition)
- Dev login mode (`isMock`) for testing without Firebase token

### Role Model

**8 roles defined:**

| Role | Scope | Home Page |
|------|-------|-----------|
| super_admin | Global (all sites, all orgs) | Full dashboard + Act-As |
| gm | Multi-site (assigned sites) | GM dashboard |
| supervisor | Single site | Site dashboard |
| mechanic | Single site | Repair board |
| operator | Single site | My site |
| procurement | Single site | Procurement desk |
| warehouse | Single site | Warehouse desk |
| finance | Global (all sites) | Finance dashboard |

**Role derivation:** From Firestore `users` collection document. Each user document contains `role`, `orgId`, `siteIds`.

**Act-As feature:** Super Admins can impersonate any role via `actingRole` state. Workflow UI behaves as the impersonated role while preserving the original role.

### Asset Data Model

**Dual status model:**
- **Operational status:** available, deployed, maintenance, etc.
- **Commercial status:** active, inactive, disposed

**Asset lifecycle:**
```
available → soft_reserved → deployed → maintenance → available
```

**Asset-site relationship:** Assets belong to sites. Users see assets based on their `siteIds`.

### Site Scoping Model

**Design:** `siteIds` array on `AuthUser` document
- `siteIds: ['site-a', 'site-b']` — user sees data for these sites
- `siteIds: []` — user sees all sites (finance, HQ)

**Current status:** Model is defined but not fully enforced in data hooks. All data hooks currently filter by `sbuId` only, not `siteId`. This is a known engineering gap.

### Design System

**Theme:** Helix (cool technical console)
**Component library:** `src/components/ui/` (Input, Button, etc.)
**Spacing system:** 8pt grid
**Color tokens:** CSS variables in `globals.css`

### Firestore Security

**Dual-layer approach:**
1. **Role-based:** Each collection has role-gated read/write rules
2. **Site-based:** Rules validate `siteId` matches user's `siteIds`

**Known gaps:**
- `_sequences` collection has broad write permissions
- `auditEvents` collection allows modification (should be append-only)

---

## Interfaces and Contracts

### AuthUser (from `AuthContext.context.ts`)
```typescript
interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;        // 8 roles
  orgId: string;       // e.g., 'sbu-wli'
  orgName: string;     // e.g., 'WLI'
  siteIds: string[];   // Empty = global access
}
```

### AuthContextType (from `AuthContext.context.ts`)
```typescript
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (uid?: string) => Promise<void>;
  logout: () => Promise<void>;
  effectiveRole: string;      // Real role or impersonated role
  actingRole: string | null;  // Impersonation role (super_admin only)
  setActingRole: (role: string | null) => void;
  isMock: boolean;            // Dev login mode
}
```

### WorkflowDefinition (from `types.ts`)
```typescript
interface WorkflowDefinition<S extends string> {
  id: WorkflowId;                    // 'ticket' | 'purchase_request' | ...
  collection: string;                // Firestore collection
  label: string;                     // Human label
  initialState: S;                   // Starting state
  states: readonly S[];              // All valid states
  terminalStates: readonly S[];      // End states
  statusLabels: Record<S, string>;   // Display labels
  transitions: WorkflowTransition<S>[]; // All transitions
}
```

### WorkflowTransition (from `types.ts`)
```typescript
interface WorkflowTransition<S extends string> {
  from: S;
  to: S;
  action: string;                // Stable machine key
  label: string;                 // Button label
  allowedRoles: string[];        // Role-gated
  requiresNotes?: boolean;
  requiresFields?: string[];
  sideEffects?: SideEffectTag[]; // 17 types
  notify?: string[];
  isReject?: boolean;
}
```

---

## Known Limitations and Deferred Decisions

### Known Bugs
| Bug | Impact | Workaround | Priority |
|-----|--------|------------|----------|
| Loading state race condition | Users must click "Sign in" twice | Login.tsx `useEffect` navigates after user state set (partial fix) | P0 |
| No signup UI | New users cannot self-register | Google Sign-In creates user silently | P1 |

### Known Gaps
| Gap | Impact | Status |
|-----|--------|--------|
| Site filtering not enforced in data hooks | Field roles can see cross-site data | Engineering task |
| No offline persistence | App fails without connectivity | Engineering task |
| No test coverage | No safety net for financial logic | Engineering task |
| Firestore rules too broad | Audit trails can be modified | Engineering task |
| AI key in client code | API key exposed | Post-MVP (move to Cloud Function) |

### Deferred Decisions
| Decision | Reason | When |
|----------|--------|------|
| Move AI to Cloud Function | Low priority, current approach works | Post-MVP |
| Implement rate limiting | Not needed until scale | Post-MVP |
| Add 2FA | Not in current requirements | Future |

---

## Data Shapes

### Firestore Users Collection
```
/users/{uid}
  - uid: string
  - email: string
  - displayName: string
  - role: string (one of 8 roles)
  - orgId: string (e.g., 'antrac-holding', 'sbu-wli')
  - siteIds: string[] (empty = global)
  - createdAt: timestamp
```

### Firestore Assets Collection
```
/assets/{assetId}
  - id: string
  - name: string
  - operationalStatus: string (available, deployed, maintenance, etc.)
  - commercialStatus: string (active, inactive, disposed)
  - siteId: string
  - orgId: string
  - createdAt: timestamp
```

---

## Testing Gaps

| Area | Coverage | Risk |
|------|----------|------|
| Workflow engine | 0% | Financial approval logic untested |
| Auth flow | 0% | Login race condition not caught by tests |
| Site filtering | 0% | Data leakage not detected |
| Role permissions | 0% | Permission escalation not detected |

---

## Future Work

### Immediate (Pre-Production)
1. Fix loading state race condition in AuthContext
2. Create Signup.tsx view
3. Add siteId filtering to all data hooks
4. Install Vitest + test workflow engine
5. Enable Firestore offline persistence
6. Tighten Firestore rules

### Post-Production
1. Move AI key to Cloud Function
2. Add rate limiting
3. Implement storage lifecycle rules
4. Add 2FA

---

## Historical Context

Phase 1 established the foundation that 43 subsequent phases were built on. The authentication system, role model, asset data model, and design system have remained stable throughout all phases. The workflow engine (Phase 2-3) extended this foundation with business logic. The site-scoping model was designed but not fully enforced — this is the most significant architectural gap.

---

*End of HAND-001*
