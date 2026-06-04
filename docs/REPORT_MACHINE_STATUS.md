# WLI Machine Status Report — Spec

**Priority:** High — daily operational report, most important in the reports section  
**Source:** Mustarq directive, 2026-06-04  
**Status:** Spec only — to be built when reports section is developed

---

## What It Is

A daily snapshot of every open machine issue across all WLI sites. One row per issue.
Management uses this to track procurement progress, dispatch status, and next actions
without having to open individual tickets.

## Sample Layout (from 04 June 2026 report)

| Location | Machine | # | Issue | Parts / Action Needed | Source / Procurement | Status | Dispatch / Next Action |
|---|---|---|---|---|---|---|---|
| Muthaafushi | Komatsu PC350 (Low Bed) | 1 | Boom steel bush worn/damaged | Boom steel bush | ELM Marine — payment sent 14 May; completed 1 Jun | FABRICATING @ WEW | Dispatch when fabrication complete |
| Muthaafushi | Komatsu PC350 (Low Bed) | 2 | Battery dead — wiring, lugs and terminals needed | New battery | Received — Anam Trade | DISPATCHED | En route to Muthaafushi — 04 Jun 2026 |
| Bodufinolhu | CAT Loader | 11 | Fuel filter & oil filter need replacement | Fuel filter + oil filter set | Quote received — LEO Stores | WAITING PAYMENT | Process payment to LEO Stores to collect parts |

## Grouping & Structure

- **Primary group:** Location (Muthaafushi, Bodufinolhu, Thilafushi, Goidhoo, Male-HQ)
- **Secondary group:** Machine (asset code + name)
- **Row:** One row per open issue/ticket that has an active procurement or action item
- Sequential `#` numbering across the entire report (not per-machine)

## Status Badges & Colours

| Status Label | Meaning | Colour |
|---|---|---|
| FABRICATING @ WEW | Item being fabricated at a supplier workshop | Yellow / amber |
| DISPATCHED | Parts purchased, in transit to site | Blue |
| NOT SOURCED | No supplier found yet, quote needed | Red |
| AWAITING ACTION | Waiting on external party (e.g. specialist, vendor) | Purple |
| WAITING PAYMENT | Quote received, payment not yet processed | Orange |
| QUOTES RECEIVED — ORDER PENDING | Competitive quotes in hand, PO not yet raised | Green |

## Data Sources (from live Firestore)

Each row maps to:

| Report Column | Source |
|---|---|
| Location | `ticket.siteId` |
| Machine | `ticket.assetLabel` + `ticket.assetCode` |
| Issue | `ticket.description` |
| Parts / Action Needed | `ticket.materials[]` descriptions OR `pr.lineItems[]` descriptions |
| Source / Procurement | Latest quote supplier + payment status from linked PR/PO |
| Status | Derived from PR/PO status (see mapping below) |
| Dispatch / Next Action | Derived from ticket + PO status + notes |

## Status Derivation Logic

```
ticket.status === 'draft' / 'submitted' / 'diagnosed'     → NOT SOURCED (no PR yet)
pr.status === 'on_hold' / 'approved' / 'rfq_sent'         → NOT SOURCED
pr.status === 'quotes_under_review' / 'gm_quote_approved' → QUOTES RECEIVED — ORDER PENDING
pr.status === 'po_raised' && po.status === 'raised'/'supplier_confirmed' → WAITING PAYMENT
po.status in payment chain (payment_request_sent → director_approved)    → WAITING PAYMENT
po.status === 'payment_completed' / 'wli_finance_confirmed' → WAITING PAYMENT (collection pending)
po.status === 'items_collected'                            → DISPATCHED (or custom if fabricating)
ticket.status === 'awaiting_delivery'                      → DISPATCHED
ticket.status === 'items_delivered'                        → (exclude — resolved)
ticket.status === 'gm_approved' && no PR                   → AWAITING ACTION
custom tag on PR/PO notes containing "fabricat"            → FABRICATING @ [supplier]
```

## Generation

- **Frequency:** Daily (or on-demand)
- **Format:** Rendered HTML table (printable / PDF-exportable) + in-app view
- **Scope:** All tickets in states: submitted, diagnosed, supervisor_checked, gm_approved,
  awaiting_delivery — i.e. open issues that haven't been resolved yet
- **Excludes:** draft, closed, resolved tickets

## Export

- PDF download button (same pattern as existing RFQ/PO download)
- Print-friendly CSS (already established in the app)
- Title: "WLI — Machine Status Report | As of [today's date]"
- Footer: site logos, generated timestamp

## Notes

- This was the primary daily management tool before the ERP — Mustarq reviewed it every morning
- The report replaces manual WhatsApp/spreadsheet updates from site supervisors
- "Dispatch / Next Action" column is the most valuable — it tells every role what to do next
- When built, this should be the landing card on the WLI Home dashboard for GM role
