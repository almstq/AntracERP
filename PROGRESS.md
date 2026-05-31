# Antrac ERP — Live Progress Tracker

**Repo:** `D:\!starq\projects\antrac-erp\` (local git only — bare remote at `D:\!starq\_git-remotes\antrac-erp.git`)
**Stack:** React 19 + TypeScript + Vite 8 + Tailwind 4 + Firebase
**Firebase project:** `antrac-erp` (live) · **Version:** 0.9.0
**Updated:** 2026-05-31 (session 5 — CRM Phase F: Sales + Finance dashboards)

> Maintained by Claude Code. The strategic/master timeline lives at
> `D:\!starq\starqos\content\nexus\antrac-erp-master-timeline.md` (Nexus).

---

## ⏯ RESUME HERE (next session)

Session 5 complete — CRM Phase F built, build clean. **Next, in order:**

1. **Fuel/Water UI** — Workflow 2 UI (machine + side-effects exist, no pages yet):
   - FuelRequestList + FuelRequestDetail pages
   - Inventory balance display (WLI stock, MPL deduction)
   - Role-gated transitions wired
2. **File Uploads** — Firebase Storage for tax invoice, payment receipt, site photos
3. Google Maps API key (from user) — lights up Fleet Map / Command Center.
4. **Doc consolidation** — migrate remaining Antrac content out of the starqOS
   processor into `docs/` (see `docs/README.md` "Deferred consolidation"); update
   indexer / VOID DECK / cron references; retire old copies to `_recyclebin/`.

**Organising principle (Mustarq):** every project is self-contained under
`projects/<name>/`; starqOS indexes/visualises it but does not hold project
content. All project docs live under `projects/antrac-erp/docs/` (canonical).

**To run:** `npm run dev` → http://localhost:3000 · log in with **Google** as
super_admin (NOT Developer Login — mock has no token, writes denied). Use the
sidebar-footer **Act As** dropdown to test as any actor.

---

## Current State (one-liner)

Firebase live; full **Issue→Closure** workflow (ticket → PR → RFQ sourcing →
quotes → GM comparison/award → PO → 4-tier payment chain) built with live UI,
downloadable RFQ/PO docs, and **live-tested end-to-end**. Master-data registers
(Locations/Assets/Staff/Suppliers + Fleet Map) and a map-centric Command Center
done. **Fuel workflow modelled (no UI). CRM spec received → plan in `docs/CRM_PLAN.md`.**

---

## The Two Workflows (the real product)

Mustarq's correction (2026-05-31): the product is the **role-gated business
workflows**, not CRUD data screens. Specs in `~/Downloads/`:
`WLI_WORKFLOW_TICKETS.md` and `WLI_MPL_FUEL_WORKFLOW.md`.

### Workflow 1 — Issue → Closure (spine = ticket, 14 stages)
Operator raises → Mechanic diagnoses (**PR auto-spawns ON_HOLD**) → Supervisor
checks → **GM approves (activates PR)** → Proc: accept → RFQ (1 PDF/supplier) →
quotes → GM selects supplier(s), can split → **PO (1/supplier)** → collection →
**4-tier payment chain** (WLI Finance → Antrac Finance → CFO → Director →
execute → receipt) → PO closed → delivery → requestee confirms → **ticket
closed** (or child ticket if issue persists). Ticket stays OPEN throughout.

### Workflow 2 — WLI ↔ MPL Fuel/Water (9 stages)
Supervisor raises → WLI Inventory checks balance → GM approves → MPL Manager
accepts → Director approves → MPL collection notice → Supervisor collects →
auto-close + **deduct inventory balance**. MPL dashboard = approval node only.

**Build decisions:** full role alignment · Firebase-only timeline ·
PDF + Gemini stubbed for now · one shared declarative engine for both workflows.

---

## Build Log

| Phase | Scope | Status | Commit |
|-------|-------|--------|--------|
| 2A | Scaffold, auth, routing, mock data, UI kit | ✅ Done | `b18fc03` |
| 2B-prep | Firestore rules + indexes + seed files | ✅ Done | `5de63bc` |
| Firebase init | `.firebaserc`, `firebase.json`, rules/indexes deployed | ✅ Done | `c1c16a3` |
| Seed | admin-seed.ts (4 orgs, 5 WLI sites, super_admin) | ✅ Done | `22465be` |
| **WF Phase 1** | Roles → 11-actor model; rules + dev users realigned | ✅ Done | `335330e` |
| **WF Phase 2** | Workflow engine + 4 declarative state machines | ✅ Done | `1502a49` |
| **WF Phase 3** | Wire `executeTransition` → Firestore + timeline + notifications + side-effects | ✅ Done | `9bb20b4` |
| **WF Phase 4** | Live UI: tickets, TransitionPanel, Timeline, login splash, module sidebar, actor desks, Command Center, registers (Locations/Assets/Staff/Suppliers/Map) | ✅ Done | `→ 11e6830` |
| **Procurement deep-dive** | Iterative RFQ sourcing matrix, competitive quotes, GM price comparison, RFQ+PO docs, Act-As testing | ✅ Done & live-tested | `dc50f26`, `5513e06` |
| **v0.6.0 milestone** | Phase 4 + procurement/payment complete | ✅ Tagged | `v0.6.0` |
| **Money foundation** | `money.ts`, `computeTotals`, `formatMoney`, `CurrencySelector`, PO doc GST rows, PO detail breakdown | ✅ Done | `875db3b` |
| **CRM Phase A-D** | Roles (sales/ops_staff), Asset commercialStatus, Customer Register + Detail, Enquiry workflow (10 states), Quotation doc generator, Work Order workflow | ✅ Done | `875db3b` |
| **CRM Phase E** | Work Order pages, invoice generator, payment tracking, asset status handlers, customer rollups | ✅ Done | `b427ff3` |
| **CRM Phase F** | Sales + Finance dashboards, asset utilisation %, useCrmData hooks | ✅ Done | `1558462` |
| **Fuel/water UI** | Workflow 2 UI (modelled, no UI yet) | ⬜ Next | — |

### Cross-cutting backlog
- **Currency selector** + **Maldives GST 8%** — missing on all finance forms (PO, future quotes/invoices). Money model + shared totals calc. **Do before CRM.**
- **File uploads** (Firebase Storage) for tax invoice / payment receipt / photos — currently text-reference stubs.
- **Google Maps API key** — `VITE_GOOGLE_MAPS_API_KEY` (+ billing) from user → lights up Fleet Map / Command Center.
- **Cloud Functions** — move side-effects server-side (currently client-side + coarse rules).
- **PDF/Gemini** — docs are HTML/print-PDF; Gemini comparison/diagnosis stubbed.

### Phase 4 / procurement detail (key files)
- UI: `src/components/workflow/{TransitionPanel,Timeline,FleetMapView}.tsx`, `src/components/layout/{Sidebar,NotificationBell,ActorSwitcher}.tsx`
- Pages: `src/pages/wli/{WLIDashboard,RoleInbox}.tsx`, `tickets/*`, `procurement/*`, `registers/*`
- Services: `src/lib/services/{tickets,registry,rfq}.ts` (rfq.ts also has `buildPoHtml`)
- Auth: `effectiveRole`/`actingRole` in AuthContext (Act-As); `isMock` banner
- Seed now: 4 orgs, 5 sites(+geo), 10 assets, 5 suppliers, 6 staff, super_admin

### Phase 3 detail (`src/lib/workflow/` + `src/lib/firebase/db.ts`)
- `db.ts` — real Firestore SDK access layer (getById, listAll/Where, createAuto/WithId, updateFields, batch helpers; Timestamp→Date conversion)
- `executor.ts` — `executeTransition`: read → validate → atomic batch (status + fields + timeline subdoc + notifications) → run side-effects post-commit
- `notifications.ts` — top-level `notifications` collection, tagged by recipientRole
- `side-effects.ts` — handlers: CREATE_PR_ON_HOLD, ACTIVATE_PR, CREATE_PO_PER_SUPPLIER, CLOSE_LINKED_PR_PO, SPAWN_CHILD_TICKET, DEDUCT_INVENTORY_BALANCE (GENERATE_RFQ/PRICE_COMPARE/TRIGGER_DELIVERY = stubs)
- Rules: added timeline subcollections (PR/PO/fuel), `notifications` + `inventoryBalances` collections, `isWorkflowParticipant()` coarse gate. Deployed.

**Known limitations (Phase 3):**
- Side-effects run **client-side** under the actor's auth (not Cloud Functions). Rules are coarse (`isWorkflowParticipant`); fine-grained authority lives in the app transition tables. Hardening path: move side-effects to Cloud Functions later.
- Side-effects are post-commit + best-effort (idempotent guards on PR/PO creation). Not in the main atomic batch.
- Live behavioral verification deferred to Phase 4 (executor is client-SDK only; UI is the natural driver).

---

## Roles — 11-Actor Model (`src/lib/permissions/roles.ts`)

`super_admin` · `director` · `cfo` · `antrac_finance` · `holding_hr` ·
`gm` · `supervisor` · `proc_staff` · `finance_wli` · `inventory_staff` ·
`mechanic` · `operator` · `mpl_manager` · `ems_manager` · `pending`

Renamed from Phase 2A: `wli_gm→gm`, `wli_mechanic→mechanic`,
`wli_procurement→proc_staff`, `wli_finance→finance_wli`,
`wli_site_manager→supervisor`, `holding_finance→antrac_finance`.
New: `operator`, `inventory_staff`, `cfo`.

All 11 workflow actors are testable now via **dev-login** mock users
(`src/lib/mock-data/tickets.ts`) — no real Auth accounts needed per role yet.

---

## Workflow Engine Map (`src/lib/workflow/`)

| File | Purpose |
|------|---------|
| `types.ts` | `WorkflowDefinition`, `WorkflowTransition`, side-effect tags, `TimelineEvent`, `WorkflowNotification` |
| `engine.ts` | Pure logic: `getAvailableTransitions`, `canTransition`, `validateTransition`, `getTransition(ByAction)`, `isTerminal`, `getStatusLabel` |
| `definitions/ticket.ts` | Issue ticket machine (10 states) |
| `definitions/purchase-request.ts` | PR machine (8 states) |
| `definitions/purchase-order.ts` | PO machine (10 states, incl. 4-tier payment chain) |
| `definitions/fuel-request.ts` | Fuel/water machine (10 states) |
| `definitions/index.ts` | Registry: `WORKFLOWS`, `getWorkflow(id)` |

Entities: `src/types/workflow-entities.ts` (Ticket, PurchaseRequest,
PurchaseOrder, Supplier, FuelRequest, InventoryBalance + supporting types).

Side-effect tags (handlers come in Phase 3): `CREATE_PR_ON_HOLD`,
`ACTIVATE_PR`, `GENERATE_RFQ`, `GENERATE_PRICE_COMPARE`,
`CREATE_PO_PER_SUPPLIER`, `TRIGGER_DELIVERY`, `MARK_TICKET_DELIVERED`,
`CLOSE_LINKED_PR_PO`, `SPAWN_CHILD_TICKET`, `DEDUCT_INVENTORY_BALANCE`.

---

## Environment / Ops

- **Dev server:** `npm run dev` → http://localhost:3000
- **Build:** `npm run build` (tsc + vite) — currently clean, 0 errors
- **Deploy rules:** `firebase deploy --only firestore:rules`
- **Seed:** `npx ts-node seed/admin-seed.ts <uid> "<service-account.json path>"`
- **Service account:** kept OUTSIDE the repo (never commit). `.env.local` ignored via `*.local`.
- **Super admin:** a.musthaq@gmail.com — uid `jD7xvbVpSTONcYRZM4EiXyQjjPx2`

---

## Known Issues (parked)

- Google popup login sometimes needs 2 attempts (popup race / persistence) — fix in AuthContext later.
- Dashboard ticket counts still show **mock** data (no live reads wired yet).
- Minor UI breakage on initial render (cosmetic).
- `bundle > 500 KB` build warning — code-split later.
