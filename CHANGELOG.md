# Changelog

All notable changes to Antrac ERP are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) ·
Versioning: [SemVer](https://semver.org/) (pre-1.0: each phase = a minor bump).

Git tags mark each release on its milestone commit (`git tag -l`).

## [Unreleased]

### In progress
- **WF Phase 4** — UI per stage (role inboxes, stage forms, GM summary card,
  timeline view). Building one workflow slice at a time, starting with the
  issue-ticket raise → diagnose → approve path to verify the engine live.

---

## [0.5.0] — 2026-05-31 — Workflow engine wired to Firestore
**Commit:** `9bb20b4`

### Added
- `executeTransition` live persistence: atomic batch (status + fields +
  immutable timeline subdoc + notifications), post-commit side-effects.
- `src/lib/firebase/db.ts` — typed Firestore access layer (real SDK).
- `src/lib/workflow/{executor,notifications,side-effects}.ts`.
- Side-effect handlers: CREATE_PR_ON_HOLD, ACTIVATE_PR, CREATE_PO_PER_SUPPLIER,
  CLOSE_LINKED_PR_PO, SPAWN_CHILD_TICKET, DEDUCT_INVENTORY_BALANCE.
- Firestore: timeline subcollections (PR/PO/fuel), top-level `notifications`
  and `inventoryBalances` collections, `isWorkflowParticipant()` gate.

### Known limitations
- Side-effects run client-side under actor auth (coarse rules + app-level
  gating); Cloud Functions hardening deferred.
- RFQ PDF / Gemini price-comparison / delivery handlers are stubs.

## [0.4.0] — 2026-05-31 — Workflow engine + state machines
**Commit:** `1502a49`

### Added
- Shared declarative workflow engine (`src/lib/workflow/{types,engine}.ts`).
- Four state machines: ticket (10 states), purchase-request (8),
  purchase-order (10, incl. 4-tier HQ payment chain), fuel-request (10).
- Entity interfaces (`src/types/workflow-entities.ts`).

## [0.3.0] — 2026-05-31 — Roles realigned to workflow model
**Commit:** `335330e`

### Changed
- Roles rebuilt to the 11-actor workflow model. Renames: `wli_gm→gm`,
  `wli_mechanic→mechanic`, `wli_procurement→proc_staff`,
  `wli_finance→finance_wli`, `wli_site_manager→supervisor`,
  `holding_finance→antrac_finance`.

### Added
- New roles: `operator`, `inventory_staff`, `cfo`. `ROLE_LABELS` for UI.
- Dev-login mock users covering all 11 workflow actors.

## [0.2.0] — 2026-05-30 — Firebase live
**Commits:** `5de63bc`, `c1c16a3`, `22465be`

### Added
- Firebase project `antrac-erp`: Auth (Google) + Firestore deployed.
- Firestore security rules + composite indexes.
- Admin seed (`seed/admin-seed.ts`): 4 orgs, 5 WLI sites, super_admin user.

### Fixed
- `firestore.rules` read role from `users` collection (was `userRoles`).

### Verified
- Live auth end-to-end: Google login → Firestore `users` doc → super_admin →
  Holding dashboard.

## [0.1.0] — 2026-05-30 — Phase 2A foundation
**Commit:** `b18fc03`

### Added
- React 19 + TS + Vite 8 + Tailwind 4 scaffold, auth context, routing,
  permissions, mock data, UI kit, SBU dashboards, ticket workflow draft.
- Clean build (tsc + vite, 0 errors).
