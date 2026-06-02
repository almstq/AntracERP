# Antrac ERP — Live Progress Tracker

**Repo:** `D:\!starq\projects\antrac-erp\` (local git only — bare remote at `D:\!starq\_git-remotes\antrac-erp.git`)
**Stack:** React 19 + TypeScript + Vite 8 + Tailwind 4 + Firebase
**Firebase project:** `antrac-erp` (live) · **Version:** 0.26.0
**Updated:** 2026-06-02 (session 12 — Helix everywhere, registers, Map, Site Overview, FollowMe vessel tracking)

> ⚠️ **ACTION:** FollowMe live tracking is built but **inert until an API key is provisioned** —
> request from **info@followme.mv**, set `FOLLOWME_KEY` server-side, deploy functions. See `docs/FOLLOWME_INTEGRATION.md`.

> Maintained by Claude Code. The strategic/master timeline lives at
> `D:\!starq\starqos\content\nexus\antrac-erp-master-timeline.md` (Nexus).

---

## ⏯ RESUME HERE (next session)

### 🔴 TOP PRIORITY — Machine Status Data Ingestion
Full plan: `docs/MACHINE_STATUS_INGESTION_PLAN.md`

**Source doc:** `D:\!starq\.claude_code_sync\Machine Status as of 14.05.2026 till 02-06-26.docx`

Steps (in order — all questions resolved, execute straight through):
1. Add 6 suppliers: Anam Trade, Leo Trade, Parts Master, WEW, ELM Marine, Al Dahr (Dubai)
2. Correct 5 asset statuses + update WL-HV-0002 location → muthaafushi (see plan §2)
3. Add ~30 inventory items at 0 stock (workshop tools + spare parts, see plan §4)
4. Create 6 backdated tickets (14/05/2026) with materials + services wired in
5. Advance Ticket A workflow to `gm_approved` (payment already done 1 June); others at submitted/diagnosed

**All questions resolved — see plan §6. "Lkamal" in Ticket D = Ruwan Lakmal Walapita Godellage (Crane Operator, in staff register). Ready to execute.**

---

### ⏸ AWAITING MUSTARQ (two items, nothing auto-runs)
1. **Registry mass-ingestion — DRY RUN PASSED ✅** (session 13, 2026-06-02). All 9 flags expected.
   Schema updated globally: `condition`, `rentalEligible`, `nextMaintDue`, `issueHistory` +
   10 marine-specific fields added to Asset type; `category`, `workPermitStatus`, `permitNo`,
   `permitExpiry`, `notes`, `licenceNoClass` added to Staff type. UI (AssetDetail/StaffDetail)
   updated to display all new fields. `--wipe-demo` flag added (clears tickets/PRs/POs/WOs/enquiries
   for a truly clean slate). Build: 0 errors.
   **Run when ready:**
   - Without demo wipe: `npx tsx seed/ingest-registry.ts "<service-account.json>" --commit`
   - Full clean slate: `npx tsx seed/ingest-registry.ts "<service-account.json>" --commit --wipe-demo`
2. **FollowMe API key.** Request from info@followme.mv → set `FOLLOWME_KEY` server-side →
   `firebase deploy --only functions,firestore:rules`. Then live AIS lights up.
   See `docs/FOLLOWME_INTEGRATION.md`.

---

Session 12 — **Helix everywhere + register detail/edit forms + Map overhaul**,
browser-verified on live data. Build clean at **v0.23.0**, HEAD `ff4d0f2`.

Since the shell (v0.19.0) shipped, this session, in order:
- **Operations Helix** (v0.19.1–3): Tickets/PR/PO list + detail rebuilt as Helix forms.
- **Helix everywhere** (v0.20.0): token bridge (old `--color-*` → Helix palette) **+
  removed an unlayered `*{padding:0;margin:0}` reset that was beating Tailwind's
  layered utilities and silently zeroing all spacing app-wide** — the true root cause
  of every recurring "cramped/touches-wall" complaint. ~40 pages fixed at once.
- **Asset detail** (v0.21.0): specs + repair history + deployment history.
- **Register forms** (v0.22.x): assets in 3 categories (Vessels/Vehicles/Support
  Equipment); inline Edit on Asset/Staff/Supplier/Customer; **new Staff Type** field.
- **Map overhaul** (v0.23.0): staff↔asset assignment, sites+assets+staff on a
  **theme-aware** Google Map (dark/light, live re-style), "Fleet Map" → "Map".

**Known pre-existing (not from this work):** AI Brief shows `gemini-1.5-flash 404` —
`src/lib/services/ai.ts` model id is stale; one-line fix pending.

**Next priorities:**
1. **Tickets list + Ticket detail** — redesign per the handoff (table + timeline/action
   panel views already specced in the design bundle). Next shell pass.
2. **Restyle remaining pages** to the Helix system — Procurement, CRM, Warehouse,
   Registers currently render in the new shell with their *old* Tailwind styling.
3. **Fix Gemini model** — `ai.ts` calls `gemini-1.5-flash` which now 404s; the AI
   Brief shows the error. Update to a current model id (e.g. `gemini-2.0-flash`).
4. **Deploy Cloud Function** (PROOF CHAIN weekly snapshot) — `cd functions && npm install
   && npm run build && firebase deploy --only functions` (needs billing).
5. **Mobile** — shell has a responsive collapse (rail hides, sidebar → overlay) but
   inner pages still need the tables → cards pass.
6. **Email-to-Vault** — awaiting Mustarq decision on domain. See `docs/EMAIL_VAULT_PLAN.md`.

**Design decision pending:** Helix (cool teal/console — shipped) vs Atlas (warm
copper/editorial). Atlas is fully specced in the same bundle; can be wired as a
runtime toggle if Mustarq wants to compare live.

**Two-agent state:** Gemini CLI is now also building in this repo. Coordination doc
(I maintain it): `D:\!starq\.GeminiCLI\CLAUDE_CODE_SYNC.md`. Protocol: never edit
concurrently; commit+push before handoff; read the other agent's latest doc first.

**Shipped since the plan (committed + pushed):**
- ✅ OpenWeatherMap weather panel · ✅ AI Advisor (Gemini Flash, demo-mode fallback,
  `/v1/` + `gemini-1.5-flash`) · ✅ PO **pay-first** (Decision 24) · ✅ QA audit + fixes
  (legacy-attachment crash, ErrorBoundary, AiBrief 429 debounce, qty validation)
- ✅ **Cosmetic layer (design system):** light/dark theme + `ThemeToggle`, `Card`
  elevation, `PageContainer` (8pt spacing), `SectionHeading`, Plus Jakarta Sans font
- ✅ **(Gemini CLI)** super-admin unified nav, `/holding` landing, "Antrac Holding Group"
  branding, AppShell cleanup
- ✅ **Module 6 — Warehouse/SCM (cc-023 resolved):** full data model (Store, InventoryItem,
  StockBalance, StockMovement, StockTransfer), Phases A–F, 6 warehouse pages, CollectItemsPanel
  pick-or-create, RECEIVE_INTO_INVENTORY + TRIGGER_DELIVERY side-effects, Firestore rules deployed
- ✅ Login splash copyright → "Antrac Holding Group" only (Well Land removed globally)
- ✅ **PROOF CHAIN — upload attribution:** `uploadedByName` stored + displayed in Vault and FileUpload panels
- ✅ **PROOF CHAIN — SHA-256 integrity:** SubtleCrypto client-side hash on every upload; ShieldCheck chip in Vault; legacy shows `—`
- ✅ **PROOF CHAIN — weekly snapshot:** `functions/weeklyOpsSnapshot` — PDF via pdfkit, Sunday 23:59 MV, auto-saved to `snapshots/` + vault doc tagged `weekly_snapshot`
- ✅ **Email-to-Vault architecture:** `docs/EMAIL_VAULT_PLAN.md` — full spec, deferred (Decision 29)
- ✅ **UI_SPACING_CONTRACT.md** — written, enforced, memory-indexed

**Open UX (untracked):** login-splash may still show "Well Land" — should be Antrac
globally, Well Land only inside the WLI module.

**Knowledge-gap report for Mustarq/Nexus:** `D:\!starq\.claude_code_sync\CLAUDE_KNOWLEDGE_GAP_REPORT.md`.

**Organising principle (Mustarq):** every project is self-contained under
`projects/<name>/`; the parent workspace indexes/visualises it but does not hold project
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
quotes → GM selects supplier(s), can split → **PO (1/supplier)** → supplier
confirms → **4-tier payment chain** (WLI Finance → Antrac Finance → CFO →
Director → execute → WLI Finance confirms settled) → **collection** (tax invoice)
→ PO closed → delivery → requestee confirms → **ticket closed** (or child ticket
if issue persists). Ticket stays OPEN throughout.

> **PAY-FIRST (Mustarq decision, 2026-06-01):** the full payment chain settles
> **before** goods are collected — no items received until payment is confirmed.
> Payment runs against the PO total. (Reversed from the original collect-first spec.)

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
| **Fuel/water UI** | FuelRequestList + NewFuelRequest + FuelRequestDetail + inventory balance | ✅ Done | `2b5f700` |
| **File Uploads** | Firebase Storage live — `storage.ts`, `FileUpload` component, wired into PO / WorkOrder / FuelRequest / Ticket | ✅ Done | `942b861` |
| **Document Vault** | `/wli/documents` — aggregated vault, docType auto-tag, view/download split, inline preview modal (image + PDF) | ✅ Done | `fff77e3` |
| **QA Audit** | Full review — fixed 3 critical token regressions + broken mobile shell; 10 findings documented (`docs/QA_AUDIT_2026-06-01.md`) | ✅ Done | `b862aa9` |
| **OpenWeatherMap** | `weather.ts` + `WeatherPanel.tsx` — per-site wind/visibility tiles on Command Center, colour-coded, 30-min cache, no-key fallback | ✅ Done | `ef78d96` |
| **AI Integration** | `ai.ts` (Gemini Flash REST) + AI Brief, GM price-comparison recommendation, mechanic diagnosis assist — advisory, role-gated, no-key fallback | ✅ Done | `67e34d5` |
| **Inventory/Warehouse** | Module 6: Store register, Item Catalog, Stock-by-Store, Movements ledger, Transfers (A–F), CollectItemsPanel, RECEIVE_INTO_INVENTORY, TRIGGER_DELIVERY | ✅ Done | `827b651` |
| **PROOF CHAIN** | Upload attribution (name+timestamp), SHA-256 (SubtleCrypto), weekly snapshot Cloud Function (pdfkit), Email-to-Vault plan, UI_SPACING_CONTRACT | ✅ Done | `6b98e0e` |
| **Spacing contract pass** | Retroactive UI_SPACING_CONTRACT compliance — page edges, card gaps, card inner padding, sidebar chrome | ✅ Done | `b97161b`, `aded6fd` |
| **Helix Shell + Command Center** | Floating-card shell (icon rail · sidebar · topbar · ⌘K) + Command Center rebuilt on real data. From Claude Design handoff, Helix direction. `docs/HELIX_SHELL.md` | ✅ Done & verified | `42e42f6` |
| **Operations Helix (lists + detail)** | Tickets/PR/PO list pages (summary chips + filter tables) + detail forms (dhead, dcards, timeline, payment chain). Browser-verified | ✅ Done | `1677cc9`, `v0.19.2`, `v0.19.3` |
| **Helix everywhere (token bridge + reset fix)** | Remapped old `--color-*` tokens → Helix palette; **removed unlayered `*{padding:0;margin:0}` reset that was nuking all Tailwind spacing** (root cause of recurring 'cramped' bugs). All ~40 legacy pages now Helix colours + correct spacing, dark+light | ✅ Done & verified | `v0.20.0` |
| **Asset Detail** | `/wli/assets/:id` — specs + repair history (tickets) + deployment history (sales WOs) + lifetime summary | ✅ Done & verified | `ff9ba0a` |
| **Register detail/edit forms** | Assets in 3 categories (Vessels/Vehicles/Support Equipment); inline Edit on Asset/Staff/Supplier/Customer (+`updateSupplier`); Supplier order history; **new Staff Type field** (8 workforce types, distinct from role) | ✅ Done & verified | `ff1a0ce`, `e140bea`, `3bb4613` |
| **Map overhaul** | Staff↔asset assignment (`assignedAssetId`); map plots sites+assets+staff (staff at their asset's site); **theme-aware Google Map** (dark/light, live re-style); Asset 'Assigned Crew'; 'Fleet Map' → 'Map' + legend | ✅ Done & verified | `f457edb` |
| **Site Overview** | Command Center 'Site Weather' → 'Site Overview' (weather kept); each site card adds deployed assets by class (Vsl/Veh/SE chips) + crew + open issues | ✅ Done & verified | `v0.24.0` |
| **Vessel live tracking** | followme.mv `trackingId` per sea vessel; Asset detail editable field + 'Open live tracker' card; Map 'Track live' link. LCT=18599 | ✅ Done & verified | `v0.25.0` |
| **FollowMe API v5 (compliant)** | Server-side cache (`syncFollowMe`, 1 min) → Firestore; browser reads cache only; live GPS on Map; mandatory "Powered by FollowMe" badge + logo; graceful downtime; rules. `docs/FOLLOWME_INTEGRATION.md`. **Inert until `FOLLOWME_KEY` provisioned** | ✅ Built (awaiting key) | `v0.26.0` |
| **Fleet Operations module** | Dedicated section (Live Fleet/Tracking/History/ETA/Registry) + role gating — data layer ready, pages pending key | 🔲 Next (needs key) | — |
| **Bespoke redesigns (remaining)** | Richer Helix tables/metric-strips for CRM/Warehouse/Registers list pages; restyle shared workflow component internals | 🔲 Optional next | — |
| **Fix Gemini model id** | `ai.ts` `gemini-1.5-flash` → current model (AI Brief 404) | 🔲 Quick | — |
| **Mobile Responsive** | Inner pages tables → cards (shell already responsive) | 🔲 Planned | — |

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
