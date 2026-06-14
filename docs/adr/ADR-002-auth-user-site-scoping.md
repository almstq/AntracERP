# ADR-002: Auth User Site-Scoped Territory Model

**Status:** Approved
**Date:** 2026-06-03
**Author:** Quill (via Nexus)
**Phase:** 9A — Institutional Knowledge Production

---

## Context

Antrac ERP serves multiple organizations (Antrac Holding, WLI, MPL, EMS) across multiple physical sites. Users at one site should not see data from another site. The system needed a way to enforce data isolation across sites while allowing some roles (e.g., Finance, HQ) to see all sites.

## Decision

Store `siteIds` directly on the `AuthUser` document. This array defines which sites a user can access. Empty array = global access (not site-bound).

### Data Model

```typescript
// src/lib/context/AuthContext.context.ts

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;           // super_admin, gm, supervisor, mechanic, operator, procurement, warehouse, finance
  orgId: string;          // Organization ID (e.g., 'sbu-wli', 'sbu-mpl')
  orgName: string;        // Human-readable org name
  /** Operational territory — site IDs this user covers. Empty = not site-bound (e.g. finance). */
  siteIds: string[];       // ['site-a', 'site-b'] or [] for global access
}
```

### Access Pattern

```typescript
// Site-scoped query pattern (to be enforced in all data hooks)
where('siteId', 'in', user.siteIds)

// Global access (finance, HQ) — no site filter
// user.siteIds === [] means "all sites"
```

### Act-As Pattern

Super Admins can impersonate other roles for testing:

```typescript
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (uid?: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Real role unless a super_admin is impersonating an actor for testing. */
  effectiveRole: string;
}
```

The `effectiveRole` field returns the impersonated role during Act-As, while the original role is preserved in the user document.

## Alternatives Considered

| Alternative | Pros | Cons | Rejected Because |
|-------------|------|------|------------------|
| Separate site_permissions collection | Normalized data, flexible | Extra collection to maintain, more complex queries | Adds complexity for a simple 1:user-N:sites relationship |
| Site field on each entity only | Simple entity model | No user-level scoping, must filter in every query | Doesn't centralize access control |
| Firebase Security Rules with custom claims | Server-side enforcement | Claims are cached for 1 hour, can't change dynamically | Too slow for real-time access changes |
| siteIds on AuthUser document (chosen) | Single source of truth, simple queries | Requires updating all data hooks | Best tradeoff for current needs |

## Consequences

### Positive
- **Single source of truth:** User's site access is defined in one place
- **Simple query filtering:** `where('siteId', 'in', user.siteIds)` pattern
- **Global access convention:** Empty `siteIds` array = global access (finance, HQ)
- **Act-As support:** Super Admins can impersonate any role for testing
- **Portable:** Works with any backend, not Firebase-specific

### Negative
- **Requires updating all data hooks:** Every Firestore query must filter by `siteIds` (not yet fully enforced)
- **Client-side enforcement:** Site filtering is done in application code, not database rules
- **Convention-dependent:** Empty array = global access is a convention, not enforced by schema

## Impact Scope

- **Every Firestore query:** Must filter by `siteIds` for field roles
- **Every Security Rule:** Must validate `siteIds` for write operations
- **Every UI filter:** Must show/hide data based on user's site access
- **8 roles affected:** super_admin (global), gm (multi-site), supervisor (single-site), mechanic (single-site), operator (single-site), procurement (single-site), warehouse (single-site), finance (global)

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/context/AuthContext.context.ts` | AuthUser model definition (37 lines) |
| `src/lib/context/AuthContext.tsx` | Auth provider implementation (124 lines) |
| `src/lib/hooks/useWorkflowData.ts` | Data hooks (should filter by siteIds) |
| `firestore.rules` | Security rules (should validate siteIds) |

## Known Gaps

- **Site filtering not enforced in data hooks:** `useWorkflowData.ts` confirmed using only `sbuId` filters, not `siteIds` (engineering task, not architecture change)
- **Security rules not fully scoped:** `_sequences` and `auditEvents` have broad write permissions

## Historical Context

The site-scoping model was established in Phase 1 (Foundation) alongside the 8-role system. The `siteIds` array was added to `AuthUser` to support multi-site operations across WLI, MPL, and EMS. The Act-As feature was added to allow Super Admins to test different role views without creating separate accounts.

The "empty = not site-bound" convention was established for Finance and HQ roles that need global visibility across all sites.

---

*End of ADR-002*
