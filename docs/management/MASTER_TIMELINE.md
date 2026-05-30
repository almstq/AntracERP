# Antrac ERP — Master Development Timeline

**Owner:** Nexus (starqOS Coordinator)
**Created:** 2026-05-29
**Updated:** 2026-05-31 (Claude Code build session 3)
**Status:** ACTIVE — Firebase LIVE · 2 workflows built & live-tested end-to-end (Issue→Closure + Fuel) · CRM & Sales workflow spec received, plan pending · cross-cutting currency + GST 8% pending

---

## Project Overview

| Field | Value |
|-------|-------|
| System | Group Resource Management System |
| Client | Antrac Holding Group (HQ + WLI + MPL + EMS) |
| Stack | React 19 + TypeScript + Vite / Firebase |
| Codebase | `D:\!starq\projects\antrac-erp\` |
| Primary User | Mustarq (WLI GM) |
| WLI Business | **Equipment rental company** — generate leads, convert to contracts, execute rentals |
| MVP Scope | 8 modules focused on WLI rental operations |
| Post-MVP | 3 supporting modules |
| Total Modules | 11 |

---

## Module Status Matrix

| # | Module | Phase | Status | Lead |
|---|--------|-------|--------|------|
| 1 | Asset Management (dual status) | Phase 1 | **Built** — Asset Register (CRUD, location assign) live; commercial status (soft-reserve/deploy) pending CRM | Claude Code |
| 2 | HR & Staff Management | Phase 1 | **Built** — Staff Register (CRUD, site assign) live | Claude Code |
| 3 | CRM & Equipment Rentals | Phase 2 | **Spec received, plan pending** (`docs/CRM_PLAN.md`) — revenue engine, next major build | Claude Code |
| 4 | Maintenance/CMMS | Phase 2 | ✅ **Built & live-tested** (Issue→Closure workflow, full UI) | Claude Code |
| 5 | Procurement | Phase 2 | ✅ **Built & live-tested** (PR/PO UI, iterative RFQ sourcing, comparison, docs) | Claude Code |
| 6 | Inventory & Warehouse | Phase 2 | Partial — balances + collection in workflows; full warehouse pending | Claude Code |
| 7 | Finance & Approvals | Phase 3 | ✅ **Built & live-tested** (4-tier payment chain UI). Cross-cutting currency + GST pending | Claude Code |
| 8 | Fuel Management | Phase 3 | Modelled (state machine + engine); **UI pending** | Claude Code |
| 9 | Logistics & Transport | Phase 4 | Not Started | Cipher |
| 10 | Reporting & BI | Phase 5 | Not Started | Cipher |
| 11 | AI Operations Advisor | Phase 6 | Not Started (Gemini hooks stubbed in procurement) | Cipher |

**Key metric:** Asset Utilisation = (days deployed to clients / total available days) × 100%

> **Note (2026-05-31):** Build approach pivoted from module-by-module to
> **workflow-first**. The two operational workflows (Issue→Closure and
> WLI↔MPL Fuel) cut across modules 4–8 and are being built as a shared,
> role-gated state-machine engine. "Workflow backbone built" = entities +
> state machines + transition logic done (Phase 2); live Firestore wiring +
> UI still pending (Phases 3–4). See repo `PROGRESS.md` for code-level detail.

---

## Workflow Registry

All workflows run on one shared declarative engine (`src/lib/workflow/`):
state machines + role-gated transitions + immutable timeline + notifications +
side-effects. Spec docs originate from Mustarq (in `~/Downloads/WLI_*.md`).

### Workflow 1 — Issue → Closure (Maintenance) ✅ BUILT & LIVE-TESTED
Spec: `WLI_WORKFLOW_TICKETS.md`. Spine = Issue Ticket; spawns PR → PO(s) → payment.
- **Ticket (10 states):** draft → submitted → diagnosed → supervisor_checked → gm_approved → items_delivered → resolved/persists → closed/rejected
- **Purchase Request (8):** on_hold → approved → pr_accepted → rfq_sent → quotes_under_review → gm_quote_approved → po_raised → closed
- **Purchase Order (10, incl. 4-tier HQ payment chain):** raised → supplier_confirmed → items_collected → payment_request_sent → antrac_finance_accepted → cfo_verified → director_approved → payment_completed → wli_finance_confirmed → po_closed
- Actors: operator, mechanic, supervisor, gm, proc_staff, finance_wli, inventory_staff, antrac_finance, cfo, director
- Built: full UI, iterative RFQ sourcing (suppliers × items matrix), competitive quotes + GM price-comparison grid (split orders), RFQ + PO downloadable docs (HTML/print-PDF), auto PR-spawn & one-PO-per-supplier side-effects.

### Workflow 2 — WLI ↔ MPL Fuel/Water ✅ MODELLED (UI pending)
Spec: `WLI_MPL_FUEL_WORKFLOW.md`. Inter-SBU: WLI requests, MPL supplies, Director approves.
- **Fuel Request (10):** draft → submitted → inventory_checked → gm_approved → mpl_accepted → director_approved → ready_for_collection → collected → closed/rejected
- Actors: supervisor, inventory_staff, gm, mpl_manager, director. Side-effect: deduct inventory balance on close. MPL dashboard = approval node only.
- State machine + engine wiring DONE; dedicated UI NOT yet built.

### Workflow 3 — CRM & Sales (Revenue) 🔲 SPEC RECEIVED, PLAN PENDING
Spec: `WLI_CRM_SALES_WORKFLOW.md`. The revenue engine — enquiry → quote → work order → invoice → payment.
- **Module A — Customer Register:** customers (credit terms, credit limit, lifetime revenue, outstanding balance).
- **Module B — Sales (Enquiry, ~8 states):** enquiry → logged → availability_checked → gm_approved → quotation_drafted → quotation_approved → quotation_sent → quote_accepted/declined/follow_up
- **Module C — Work Order (6 states):** active → in_progress → completed → invoiced → partially_paid/fully_paid → closed; plus Invoice (raised→sent→paid/overdue→closed) + Payment records.
- New actors: **sales_staff, ops_staff** (not yet in roles model). New entities: Customer, Enquiry, Quotation, WorkOrder, Invoice, Payment, RateSheet.
- Key concepts: soft-reservation vs hard deployment of assets (ties to Asset Register + utilisation metric), GST 8%, currency, credit terms, advance payment, retention, Antrac HQ Finance read-only invoice mirror.
- Maps cleanly onto the shared engine; quotation + invoice = new downloadable docs (like RFQ/PO) with GST + currency. **Proposed phased plan: see repo `docs/CRM_PLAN.md`.**

---

## Cross-Cutting Backlog (apply globally)

| Item | Status | Notes |
|------|--------|-------|
| **Currency selector** | 🔲 Pending | Missing on all finance forms (PO, quotes, invoices). Money model {amount, currency}; default MVR. |
| **Maldives GST 8%** | 🔲 Pending | Global tax line on all priced docs (quotation, invoice, PO). Shared GST constant + subtotal/GST/total calc. |
| **File uploads** | 🔲 Pending | Tax invoice, payment receipt, photos → Firebase Storage (currently text-reference stubs). |
| **Google Maps key** | 🔲 Pending user | `VITE_GOOGLE_MAPS_API_KEY` (+ billing) to light up the Fleet/Command-Center map. |
| **PDF + Gemini** | 🔲 Deferred | Docs are HTML/print-PDF; Gemini price-comparison/diagnosis stubbed. |
| **Cloud Functions** | 🔲 Deferred | Move side-effects server-side (currently client-side under actor auth + coarse rules). |

---

## Session Log

### Session 1 — 2026-05-29 (Nexus Orchestration)

**Accomplishments:**
- Full team mobilisation, agent renames, dashboard v7.0
- Lens research brief, Quill doc framework + design system
- Cipher codebase audit (BUILD ON EXISTING scaffold)
- Vector stakeholder analysis (solo GM model)
- Module architecture brief + corrections from Mustarq
- Master architecture consolidated and corrected
- Board: 37 real tasks (16 HIGH, 11 MEDIUM, 10 LOW)
- Telegram gateway personality updated

**Mustarq corrections (critical):**
- WLI is a revenue-generating equipment rental company
- CRM & Equipment Rentals moves from post-MVP → Phase 2
- Dual asset status (operational + commercial) from day one
- Asset utilisation is the key Director metric
- 8 role-based staff portals required
- Each function has dedicated dashboard

**Decisions:** 11 decisions registered (see Decisions Register)

**Next priorities:**
1. Retry Cipher Phase 1 schema (dual status + CRM data model + role portals)
2. Mustarq reviews schema
3. Grid begins Phase 1 build

---

### Session 2 — 2026-05-31 (Claude Code build session)

**Accomplishments:**
- Firebase project `antrac-erp` created and wired; Firestore rules + indexes deployed
- Seeded 4 orgs, 5 real WLI sites, super_admin user (`admin-seed.ts` via firebase-admin)
- **Verified live auth end-to-end:** Google login → Firestore `users` doc → super_admin → Holding dashboard
- Fixed `firestore.rules` collection mismatch (`userRoles` → `users`)
- **WF Phase 1:** roles realigned to the 11-actor workflow model (renames + new operator/inventory_staff/cfo); rules + dev-login users updated
- **WF Phase 2:** shared workflow engine + 4 declarative state machines
  (ticket, PR, PO w/ 4-tier payment chain, fuel/water), linked via side effects
- Commits: `5de63bc`, `c1c16a3`, `22465be`, `335330e`, `1502a49`

**Mustarq corrections (critical):**
- The product is the **role-gated business workflows**, NOT CRUD data screens
- Build workflow-first, not module-by-module
- Two workflow specs provided: Issue→Closure (maintenance spine) + WLI↔MPL Fuel

**Decisions:** full role alignment · Firebase-only timeline · stub PDF/Gemini ·
one shared declarative engine for both workflows (Decisions 12–15)

**Next priorities:**
1. WF Phase 3 — wire `executeTransition` to Firestore (status + timeline + notifications + side-effect handlers)
2. WF Phase 4 — UI per stage (role inboxes, stage forms, GM summary card, timeline view)
3. Mustarq reviews state-machine definitions before persistence is built on them

---

### Session 3 — 2026-05-31 (Claude Code — Phase 3 + 4 + procurement deep-dive)

**Accomplishments:**
- **WF Phase 3:** `executeTransition` wired live (atomic batch: status + timeline subdoc + notifications; post-commit side-effects). `db.ts` access layer. (`9bb20b4`)
- **WF Phase 4 (UI):** live ticket list/detail/new, generic `TransitionPanel`, `Timeline`; branded login splash; module-aware sidebar (HQ/WLI/MPL/EMS); WLI sidebar lists all actor desks; `RoleInbox` actor desks; map-centric **Command Center** (stats, action inbox, fleet readiness, notification bell, Google-Maps fleet map key-gated).
- **Master data registers (GM):** Locations (geo + CRUD), Asset Register (assign location), Staff Register (assign site), Supplier Register, Fleet Map. Seeded 10 assets, 6 staff, 5 suppliers, site geo-coords.
- **Act-As switcher:** super_admin impersonates any actor in the UI while keeping real auth (so writes pass rules) — enables solo multi-actor testing. Mock-mode warning banner.
- **Procurement deep-dive (iterated with Mustarq, SCM-correct):** per-item supplier assignment → iterative RFQ sourcing (add suppliers / issue more RFQs anytime) → record quotes (proc keeps PR on its desk; save vs forward) → GM price-comparison grid (lowest flagged, split orders) → raise one PO per supplier → 4-tier payment chain. RFQ + PO downloadable docs. Sourcing presented as wide suppliers × items matrix.
- **LIVE-TESTED end-to-end** by Mustarq: raise → diagnose (PR auto-spawn) → approve (PR activate) → source → quote → award → PO → payment. Working.
- Commits through `5513e06` (≈20 commits). Versioning live: SemVer + CHANGELOG + git tags v0.1.0–v0.5.0 (tag v0.6.0 for Phase 4 milestone).

**Mustarq inputs/corrections:**
- Tickets must link to a specific **asset** + location (requestee picks the machine; site auto-fills). Fleet/Vessel + Staff + Location registers needed; GM assigns assets/staff to locations; map view.
- Each SBU gets its own module + module-specific sidebar; login splash with Antrac branding.
- Procurement is **iterative SCM sourcing** (multi-supplier per item, RFQ rounds, competitive quotes, price comparison). Quote population is proc's job; PO needs a downloadable doc.
- **Cross-cutting:** currency selector missing on all finance forms; **Maldives GST 8%** must be global.
- Provided the **CRM & Sales workflow spec** (Workflow 3) — to be planned next.

**Decisions:** 17–19 registered.

**Next priorities (resume here):**
1. **Cross-cutting money foundation:** Money {amount, currency} + currency selector + global GST 8% (benefits PO + all CRM docs).
2. **CRM & Sales build** per `docs/CRM_PLAN.md` (Customer Register → Sales/Enquiry → Quotation → Work Order → Invoice → Payment); add `sales_staff` + `ops_staff` roles; asset commercial status (soft-reserve/deploy).
3. Fuel/water workflow UI; file uploads (Storage); Maps API key from Mustarq.

---

## Architecture Decisions Register

| # | Decision | Chosen | Reason | Date | By |
|---|----------|--------|--------|------|----|
| 1 | Build on existing scaffold | Build on existing | 59 files, auth/routing/permissions sound | 2026-05-29 | Mustarq |
| 2 | Firebase backend | Firebase | Already wired in | 2026-05-29 | Mustarq |
| 3 | Flutter to _recyclebin | Move | Not portable to React | 2026-05-29 | Mustarq |
| 4 | Threshold amounts | Placeholder | MVR TBD by Mustarq | 2026-05-29 | Mustarq |
| 5 | Multi-SBU structure | Adapt existing | WLI/MPL/EMS/Holding routes exist | 2026-05-29 | Mustarq |
| 6 | Offline capability | Architect now | Remote island connectivity | 2026-05-29 | Mustarq |
| 7 | Multi-language | Externalize | Dhivehi workforce | 2026-05-29 | Mustarq |
| 8 | CRM phase | Phase 2 (not post-MVP) | WLI's core revenue engine | 2026-05-29 | Mustarq |
| 9 | Asset status | Dual (operational + commercial) | Rental business requirement | 2026-05-29 | Mustarq |
| 10 | Key Director metric | Asset utilisation % | Justifies WLI's existence to Antrac | 2026-05-29 | Mustarq |
| 11 | Staff portals | 8 role-based | Each function needs scoped dashboard | 2026-05-29 | Mustarq |
| 12 | Build approach | Workflow-first (not module-by-module) | The product is the role-gated workflows, not CRUD | 2026-05-31 | Mustarq |
| 13 | Roles model | Full alignment to workflow spec (11 actors) | Every stage maps 1:1 to a role | 2026-05-31 | Mustarq |
| 14 | Timeline storage | Firebase-only (not Google Sheets) | Single source of truth, fully integrated | 2026-05-31 | Mustarq |
| 15 | Workflow architecture | One shared declarative engine | Both workflows share shape; cheap to extend | 2026-05-31 | Mustarq |
| 16 | PDF + Gemini | Stub now, layer later | Build the backbone first, integrations after | 2026-05-31 | Mustarq |
| 17 | Money model | Currency selector + global GST 8% | Maldives GST; multi-currency finance docs | 2026-05-31 | Mustarq |
| 18 | CRM build | Build on shared engine, next major phase | Revenue engine; same state-machine pattern | 2026-05-31 | Mustarq |
| 19 | Testing | super_admin "Act As" impersonation | Walk full multi-actor flow without 10 real logins | 2026-05-31 | Mustarq |

---

## File Map

| Path | Purpose |
|------|---------|
| `D:\!starq\projects\antrac-erp\src\` | Application source |
| `D:\!starq\workspaces\cipher\architecture\` | Architecture docs |
| `D:\!starq\workspaces\lens\research\` | Research briefs |
| `D:\!starq\workspaces\quill\technical\` | Doc templates + design system |
| `D:\!starq\workspaces\vector\strategies\` | Stakeholder docs |
| `D:\!starq\workspaces\grid\notes\` | Dev environment notes |
| `D:\!starq\starqos\content\nexus\` | Build log + master docs + timeline |

---

## Quick Resume

```
Read the latest handover file at D:\!starq\starqos\content\nexus\handover-[latest].md
and the master timeline at D:\!starq\starqos\content\nexus\antrac-erp-master-timeline.md
Then confirm what was last done and what is next.
```
