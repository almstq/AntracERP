# WLI Machine Status Action Register — Report Spec

**Priority:** Highest — daily operational report, most important in the reports section  
**Source:** Mustarq directive + xlsx WLI_Machine_Status_04Jun2026_UPDATED.xlsx  
**Updated:** 2026-06-04  
**Status:** Spec only — to be built when reports section is developed

---

## What It Is

A daily action register covering every open item across WLI sites — machine issues,
consumables, workshop tools, electrical, and general maintenance. One row per action item.
Management uses this to track procurement status, dispatch, and next actions without
opening individual tickets or chasing staff.

The xlsx version is manually maintained. The in-app version will be **fully live from
Firestore** — no manual entry, no stale data. Every status label is derived directly
from where the ticket/PR/PO actually sits in the workflow engine.

---

## Report Structure (4 views / tabs)

### 1. Main Register (primary view)
All open action items grouped by location → machine/section.

**Columns:**
| Column | Source in ERP |
|---|---|
| Location | `ticket.siteId` |
| Machine / Section | `ticket.assetLabel` + `ticket.assetCode`; or category tag for consumables/tools |
| # | Sequential row number across entire report |
| Item / Issue | `ticket.description` |
| Parts / Action Needed | `ticket.materials[]` descriptions OR `pr.lineItems[]` descriptions |
| Source / Procurement | Supplier name from awarded quote + payment status from linked PO |
| Priority | `ticket.urgency` → Critical / High / Medium / Low |
| Status | Derived from workflow state (see Status Labels below) |
| Dispatch / Next Action | Derived from ticket + PO state + notes |

**Groupings (from actual data):**
- Muthaafushi → per machine (Komatsu PC350 Low Bed, Kobelco SK380, Volvo A40G, etc.)
- Bodufinolhu → per machine (CAT 745C, CAT Loader, Komatsu PC350 Low Bed / High Bed, etc.)
- Thilafushi / Goidhoo / Male-HQ → same pattern
- General Maintenance → site-wide PM campaigns
- Consumables & Equipment → maintenance supplies not linked to a specific ticket
- Workshop Tools → tools procurement
- Battery Jump System → dedicated section
- RO Plant / Electrical → infrastructure items

### 2. Outstanding Quotes (filtered view)
Items in AWAITING QUOTE or AWAITING TECHNICAL CONFIRMATION states.
Columns: Category, Item, Supplier/Owner, Current Status, Next Action, Linked Row #

Maps to: tickets/PRs with no supplier assigned yet.

### 3. Original Request Coverage (audit trail)
Cross-reference: original site request → main register row → final status.
Useful for proving every reported issue has been actioned.

Maps to: ticket timeline + parentTicketId links.

### 4. Quote / Payment Summary (financial view)
Supplier-level payment tracker.

| Column | Source in ERP |
|---|---|
| Supplier | `supplier.name` |
| Reference | `po.displayId` or quote reference |
| Date | `po.createdAt` |
| Amount (MVR) | `po.total` |
| Items Covered | `po.lineItems[]` descriptions |
| Payment / Procurement Status | Derived from PO payment chain state |
| Notes | `po` notes / procurement notes |

Maps to: PurchaseOrder collection, payment chain status.

---

## Full Status Label Set

| Status Label | When It Shows | Workflow State |
|---|---|---|
| RECEIVED AT HQ — AWAITING DISPATCH | Items physically at HQ store, not yet sent to site | `po.status === 'items_collected'` and ticket `gm_approved` |
| DISPATCHED | In transit to site | ticket `awaiting_delivery` (TRIGGER_DELIVERY fired) |
| AWAITING QUOTE | No supplier/quote yet | PR `on_hold`/`approved` with no quotes, or ticket pre-PR |
| AWAITING TECHNICAL CONFIRMATION | Mechanic/specialist input needed before sourcing | ticket `submitted`/`diagnosed` with mechanic flag |
| INVOICED — PAYMENT DUE | Quote received, invoice issued, payment not processed | PO `supplier_confirmed` or `payment_request_sent` (early stages) |
| QUOTES RECEIVED — ORDER PENDING | Competitive quotes in, PO not yet raised | PR `quotes_under_review` / `gm_quote_approved` |
| WAITING PAYMENT | PO raised, payment chain in progress | PO `payment_request_sent` → `director_approved` |
| AWAITING ACTION | External dependency (specialist, third party) | ticket `gm_approved` + no PR (no parts needed) |
| FABRICATING @ [SUPPLIER] | Item being made at a workshop | Custom tag on PR/PO notes or ticket notes containing supplier name |
| IN HQ STOCK | Item already available at Male-HQ warehouse | `inventoryBalance` / `stockByStore` record exists |
| IN MPL STOCK | Available at MPL depot | Same, different store |
| READY / NO ISSUE | Machine operational, no outstanding items | ticket `closed` / `resolved` or no open tickets for machine |

---

## Priority Mapping

| xlsx Priority | `ticket.urgency` | Meaning |
|---|---|---|
| Critical | `critical` | Machine down / major failure / revenue impact |
| High | `urgent` | Degraded operation / imminent failure |
| Medium | `routine` | Scheduled maintenance / non-urgent repair |
| Low | — | Informational / monitor only |

---

## Status Derivation Logic (for in-app render)

```
ticket has no PR:
  gm_approved + notes mention "awaiting" specialist  → AWAITING ACTION
  gm_approved + no action pending                    → AWAITING ACTION

ticket has linked PR:
  pr.status === 'on_hold' / 'approved' / 'rfq_sent'              → AWAITING QUOTE
  pr.status === 'quotes_under_review' / 'gm_quote_approved'      → QUOTES RECEIVED — ORDER PENDING
  po.status === 'raised' / 'supplier_confirmed'                  → INVOICED — PAYMENT DUE
  po.status in payment chain (payment_request_sent → director)   → WAITING PAYMENT
  po.status === 'payment_completed' / 'wli_finance_confirmed'    → WAITING PAYMENT
  po.status === 'items_collected'                                → RECEIVED AT HQ — AWAITING DISPATCH
  ticket.status === 'awaiting_delivery'                         → DISPATCHED
  ticket.status === 'items_delivered'                           → (exclude from report — pending resolution)

notes/tags override:
  PR/PO/ticket notes contain "fabricat"                          → FABRICATING @ [supplier name]

no open ticket for machine:
  inventoryBalance exists / ticket closed                        → IN HQ STOCK / READY / NO ISSUE
```

---

## Scope (what's included vs excluded)

**Included:**
- Tickets in: `submitted`, `diagnosed`, `supervisor_checked`, `gm_approved`, `awaiting_delivery`
- PRs not yet closed
- Consumables / tools / equipment tracked as standalone PRs without a ticket parent
- Items where `ticket.status === 'items_delivered'` but work not yet resolved

**Excluded:**
- Tickets in `draft` (not submitted yet)
- Tickets in `closed` / `resolved` (unless flagged as ongoing monitoring)
- POs fully closed with no pending actions

---

## What the In-App Version Can Do That xlsx Can't

1. **Status is always live** — refreshes from Firestore, nobody updates it manually
2. **Parts column is exact** — pulled from `pr.lineItems` with quantities and UOM as submitted
3. **Supplier and reference are real** — actual supplier name from the awarded quote, actual PO number
4. **Drill-down** — click any row → opens the ticket/PR/PO directly
5. **Outstanding Quotes tab auto-populates** — no manual filtering, it's a live query
6. **Quote/Payment Summary tab is live** — actual PO totals, actual payment states
7. **Alerts** — flag rows where status hasn't changed in X days (stale items)
8. **Priority auto-set** from ticket urgency — no manual tagging
9. **Multi-site** — Thilafushi and Goidhoo included automatically as tickets exist there
10. **GM dashboard card** — live summary count per status on WLI Home for GM role

---

## Export

- PDF download (same pattern as existing RFQ/PO download — `buildReportHtml()`)
- Print-friendly layout
- Title: `WLI — Machine Status Action Register | As of [date]`
- All 4 tabs exportable separately or as combined multi-section PDF

---

## Key Suppliers (from actual data — seed into Supplier Register)

| Supplier | What They Cover |
|---|---|
| ELM Marine / ELM Engineering | Steel fabrication, structural parts |
| WEW Maldives (Welding Engineering Works) | Hydraulic hoses, bushes, shims, bracket fabrication |
| ANAM Trading | Batteries, electrical components |
| Parts Master | Gaskets, mechanical parts |
| Infra Engineers | Solenoids, hydraulic parts |
| Leo Trade | Consumables (grease, hoses, tools, cable) |
| Magic Hardware | Small hardware, grinding, copper fittings |
| Al Dahr Dubai | Heavy parts (hydraulic pumps), overseas orders |

---

## Notes

- This was the primary daily management tool before the ERP — reviewed every morning
- The report replaces manual WhatsApp/spreadsheet updates from site supervisors
- "Dispatch / Next Action" column is the most operationally valuable — tells each role what to do
- The Outstanding Quotes tab drives the procurement team's daily task list
- The Quote/Payment Summary tab is the finance team's daily payment action list
- When built, the GM dashboard card should show: X items awaiting dispatch, Y awaiting quote, Z waiting payment
