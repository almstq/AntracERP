# CRM & Sales — Proposed Build Plan

**Status:** PROPOSAL — pending Mustarq review
**Spec:** `~/Downloads/WLI_CRM_SALES_WORKFLOW.md`
**Date:** 2026-05-31

CRM is WLI's **revenue engine** (equipment rental). It maps cleanly onto the same
shared workflow engine (`src/lib/workflow/`) we used for Issue→Closure and Fuel:
declarative state machines + role-gated transitions + timeline + notifications +
side-effects + downloadable docs. This plan reuses all of that.

---

## Lifecycle (what we're building)

```
Customer Register
   └─ Enquiry (Sales) ── logged → availability_checked → gm_approved →
        quotation_drafted → quotation_approved → quotation_sent →
        quote_accepted ──► Work Order
                              active → in_progress → completed → invoiced →
                              partially_paid / fully_paid → closed
        quote_declined / follow_up (archived)
```

**Actors:** sales_staff, ops_staff (NEW), gm, finance_wli, antrac_finance (read-only invoices), customer (external — not a system user).

---

## New entities / collections

| Collection | Purpose |
|------------|---------|
| `customers` | Customer register (credit terms, credit limit, lifetime revenue, outstanding) |
| `enquiries` | Sales enquiry + its state machine |
| `quotations` | Quotation docs (rates, GST, totals, GM sign-off) |
| `workOrders` | Confirmed jobs (contract value, advance, retention, dates) |
| `invoices` | Invoices + payment status |
| `payments` | Payment records per invoice |
| `rateSheets` | WLI rate sheet (asset type → MVR/hr or MVR/day) |

Reuses existing `assets` (adds **commercialStatus**: available / soft_reserved / deployed) and `sites`.

---

## Phased plan

### Phase A — Cross-cutting money foundation (do FIRST; also benefits Procurement)
- `Money { amount, currency }` type + **currency selector** component (default MVR).
- Global **GST 8%** constant + `computeTotals(lineItems)` → { subtotal, gst, total }.
- Retrofit PO doc + payment chain to use it; all CRM docs use it.
- **Deliverable:** currency + GST visible/correct on every priced document.

### Phase B — Roles + asset commercial status
- Add `sales_staff`, `ops_staff` roles (roles.ts, rules, dev users, Act-As).
- Add `commercialStatus` to Asset; helpers to soft-reserve / deploy / release.
- **Deliverable:** sourcing/availability can flag assets without double-booking.

### Phase C — Customer Register (Module A)
- `Customer` type + collection + rules; CRUD register page + searchable directory.
- Customer profile page (history shell: enquiries/quotes/WOs/invoices/payments).
- Live rollups: lifetime revenue, active WOs, outstanding balance.
- **Deliverable:** customers exist before any sales activity.

### Phase D — Sales workflow (Module B)
- `enquiryWorkflow` state machine (8 states) on the shared engine.
- Stage forms: enquiry log (Sales) → availability check w/ asset selection (Ops) →
  GM approval (soft-reserve assets) → quotation draft (Finance, rate sheet + GST +
  advance/retention) → GM sign-off → send → customer response (accept → WO / decline).
- **Quotation document** generator (like RFQ/PO): letterhead, scope, asset rate table,
  mob/demob, GST 8%, total, payment terms, validity, GM signature.
- **Deliverable:** enquiry → signed quotation → accept, live & testable via Act-As.

### Phase E — Work Order + Invoice + Payment (Module C)
- `workOrderWorkflow` (6 states); auto-created on quote_accepted (side-effect),
  assets → hard `deployed`.
- Ops execution/completion (actual hours/days); links to Issue tickets on deployed assets.
- **Invoice** generator (actuals × rate, less advance/retention, GST, due date from credit terms).
- Payment tracking (full/partial/overdue), retention release, **Antrac HQ Finance read-only mirror**.
- Closure → assets released to operational/standby, customer rollups updated.
- **Deliverable:** full revenue cycle to closed + asset utilisation metric feed.

### Phase F — Dashboards
- **Sales tab:** active WOs, open enquiries, quotations sent, follow-ups, customer directory.
- **WLI Finance tab:** outstanding invoices, payments this month, overdue, advances held.
- Asset **utilisation %** surfaced (deployed days / available days) — the Director metric.

---

## Decisions to confirm before build
1. `ops_staff` a new role, or reuse `supervisor`? (spec says "Ops Staff (Supervisor level)")
2. Rate sheet: seed a starter WLI rate sheet now, or enter rates per-quote initially?
3. Multi-currency real (USD jobs) or MVR-only for v1 (selector still present)?
4. Retention + advance: build in Phase E, or defer to a follow-up?

---

## Build order summary
**A (money) → B (roles/asset status) → C (customers) → D (sales→quote) → E (WO→invoice→payment) → F (dashboards).**
Each phase: typecheck + build clean, commit, live-test via Act-As, then proceed.
