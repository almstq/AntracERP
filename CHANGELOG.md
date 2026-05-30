# Changelog

All notable changes to Antrac ERP are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) ·
Versioning: [SemVer](https://semver.org/) (pre-1.0: each phase = a minor bump).

Git tags mark each release on its milestone commit (`git tag -l`).

## [Unreleased]

### Planned
- **Money foundation:** currency selector + global Maldives GST 8% (`computeTotals`); retrofit PO + all finance docs.
- **CRM & Sales module** (`docs/CRM_PLAN.md`): Customer Register → Sales/Enquiry → Quotation → Work Order → Invoice → Payment; `sales_staff`/`ops_staff` roles; asset commercial status (soft-reserve/deploy).
- Fuel/water workflow UI; file uploads (Firebase Storage); Google Maps key.

---

## [0.6.0] — 2026-05-31 — Live workflow UI + procurement/payment

### Added
- **Issue→Closure workflow, full live UI**, tested end-to-end: ticket raise
  (asset-linked) → diagnose (PR auto-spawn) → supervisor → GM approve (PR
  activate) → iterative RFQ sourcing (suppliers × items matrix) → competitive
  quotes → GM price-comparison grid (split orders) → raise PO per supplier →
  4-tier payment chain (WLI Finance → Antrac Finance → CFO → Director → close).
- Downloadable **RFQ** and **PO** documents (WLI letterhead, HTML/print-PDF).
- Generic `TransitionPanel` + `Timeline`; aggregated actor **inbox/desks**.
- Branded **login splash**; module-aware sidebar (HQ/WLI/MPL/EMS); WLI sidebar
  lists every actor desk; map-centric **Command Center** (stats, inbox, fleet
  readiness, notification bell, Google-Maps fleet map — key-gated).
- **Master-data registers:** Locations (geo), Asset, Staff, Supplier + Fleet Map.
- **Act-As switcher** (super_admin impersonation) + mock-mode warning banner.

### Notes
- CRM & Sales workflow spec received → planned in `docs/CRM_PLAN.md`.
- Cross-cutting **currency selector + GST 8%** identified, pending (next).

### Added (WF Phase 4 — slice 1: issue-ticket raise → diagnose → approve)
- Live ticket list + detail (real Firestore reads via `useWorkflowData` hooks).
- `New Ticket` form (operator raise) → creates draft + `submit` transition.
- Reusable `TransitionPanel` — renders role-available transitions for any
  workflow entity, captures notes/required fields, special-cases the diagnosis
  stage (materials/services) and calls `executeTransition`.
- `Timeline` component — reads the entity's timeline subcollection.
- Linked PR card on ticket detail (watch the PR auto-spawn on diagnosis).
- `db.listSub` for subcollection reads; `/wli/tickets/new` route.

### Added (Asset / Staff / Location module — GM master data)
- **Location register** — GM adds/edits locations with geo-coordinates.
- **Asset register** — GM adds assets (vehicle/vessel/equipment) and assigns
  each to a location (per-row reassignment).
- **Staff register** — GM adds staff and assigns them to sites.
- **Fleet Map** — Google Maps view pinning sites with their assets + staff
  (key-gated; shows setup steps until `VITE_GOOGLE_MAPS_API_KEY` is set).
- Site type gains geo `location`; seeded sites now carry Maldives coordinates;
  seeded 6 staff + 10 assets. Registry services + `useSiteList`/`useStaffList`.
- WLI dashboard: quick-access cards to the four registers.

### Added (Shell & navigation redesign)
- Branded **login splash** (Antrac branding panel + sign-in).
- **Module-aware sidebar** — contextual to HQ / WLI / MPL / EMS, each with its
  own branding header and grouped nav. Replaces the generic top-level sidebar.
- **WLI sidebar lists every actor dashboard** (Operator, Mechanic, Supervisor,
  GM, Procurement, WLI Finance, Inventory) + Operations + Registers sections.
- **Actor desks** (`/wli/desk/:role`) — each lists the tickets awaiting that
  role's action, showing the available next-actions.
- super_admin lands in the WLI module.

### Added (Procurement + payment slice)
- **Supplier Register** (type, 5 seeded suppliers, CRUD page, rule).
- **PR detail** drives the procurement state machine: accept → assign suppliers
  / send RFQs → enter quotes → GM selects supplier per line (split orders) →
  raise PO. Writes lineItems/quotes through `executeTransition`.
- **PO detail** drives the 10-state **4-tier payment chain** (WLI Finance →
  Antrac Finance → CFO → Director → execute → confirm → close) via the generic
  TransitionPanel, with a payment-chain progress tracker.
- Live PR/PO lists; `useSupplierList`/`usePRList`/`usePOList`; sidebar links.

### In progress
- Google Maps API key (user to provide) to activate the map.
- Prototype polish: Fleet Readiness "view all" detail, vessel-fleet split,
  AI Advisor daily brief.
- Remaining: fuel/water workflow UI, richer ticket fields per stage, mark-read
  on notifications, PDF/Gemini (still stubbed).

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
