# SCM Benchmark — Antrac ERP vs SAP (what to adopt, what to skip)

**Date:** 2026-06-01 · **Author:** Claude Code (research + analysis)
**Purpose:** Benchmark the Antrac inventory/SCM engine against SAP's model, and
decide what to adopt — **without changing how Antrac actually works.**

---

## Governing principle — REFLECT, DON'T ENFORCE

> Mustarq is GM, not owner. The system **digitizes Antrac's existing practice**;
> it does not re-engineer it. Every SAP-grade concept below is added as **optional
> data-capture and/or advisory flags — never as a hard gate that forces a behavior
> change.** Anything that would alter practice is surfaced as a *recommendation* to
> leadership, decided by them, not imposed by the software.

This is **Decision 26** (master timeline).

---

## How SAP frames it (reference)

- **MM / WM / P2P** split. Material master (UoM, valuation class→GL, MRP, batch/serial);
  Plant → Storage Location → Bin; typed **movement types** (101 GR, 201 issue, 311
  transfer) each posting a material + financial document; **moving-average / standard**
  valuation; **three-way match** (PO ↔ GR ↔ Invoice) gating payment; **MRP** (reorder
  points, safety stock → auto requisitions).

## Side-by-side

| Domain | SAP | Antrac | Verdict |
|--------|-----|--------|---------|
| Item master | Rich (alt UoM, valuation class) | Lean InventoryItem | Add alt-UoM field (UI later) |
| Location | Plant → StorLoc → **Bin** | Site → **Store** | ✓ right-sized — skip bins |
| Movements | Material + FI doc, typed | Append-only typed ledger | ✓ sound; GL posting deferred |
| Valuation | Moving-avg / standard | Weighted-avg | ✓ + add **landed cost** |
| Receipt vs invoice | GR + Invoice **3-way match** | Tax invoice at collection | Add **advisory** reconciliation |
| Partial delivery | Native | Assumes full | Allow partial (optional) |
| Batch/serial | Native | None | Optional per-item flag |
| Reservation | Native | Assets only | Optional |
| Replenishment | MRP | None | **Advisory** reorder alerts |
| Stock-take | Physical inventory | `adjustment` only | Count process later |
| Vendor master | Terms/tax/bank/rating | Basic register | Enrich later |
| Costing→finance | Auto GL + cost centers | vs ticket/site | Defer (no chart of accounts) |

## The six that matter for WLI — as REFLECT-not-enforce

1. **Three-way match → advisory mismatch flag.** Capture received qty + invoice
   qty/price vs PO; show a badge if they differ. **Does not block payment** or change
   the approval chain. Pure visibility (more important now that we're pay-first).
2. **Landed cost → optional capture.** Record freight + customs duty (20–40% of true
   cost for a Maldives importer) → truer stock value + job costing. Blank = behaves
   as today.
3. **Transfer = marine logistics → capture what you already do.** Link a store→store
   `StockTransfer` to a vessel/trip + shipping cost. SAP won't give this out of the
   box — it's where Antrac can beat SAP for an island business. 🌟
4. **Batch / serial → optional per-item flag** (`none|batch|serial`). Serial for
   parts (warranty / which machine), batch for fuel/consumables (expiry).
5. **Reorder points → advisory low-stock alert** per item-store. No auto-PO unless
   leadership later asks. Valuable for remote sites with long resupply lead times.
6. **Stock reservation → optional.** Reserve stock against a ticket/work order so it
   isn't double-committed.

## Deliberately SKIP (SAP bloat for a 30-staff SBU)
Bin-level WM/EWM · full MRP engine · release-strategy config · full GL + account
determination · valuation areas / special stock categories.

## What Antrac already does right
Append-only ledger (= SAP material-document principle) · workflow-first role-gating
(cleaner than SAP release strategies) · pick-or-create master governance · items
permanent / qty moves · right-sized (adopts concepts, not bloat) · pay-first was a
deliberate, valid GM decision.

## Build guidance
Fold the six into the Inventory plan as **optional fields + advisory flags** (cheap
now, costly to retrofit). Design marine-logistics transfer in Phase D. Defer GL/
cost-center, cycle-count UI, alt-UoM UI (add fields now, UI later).

**Sources:** SAP S/4HANA Logistics & Inventory (community.sap.com), SAP Learning —
Inventory & Material Valuation, Movement Types in SAP MM (gtracademy.org), 3-Way
Match in SAP (ramp.com), SAP P2P cycle (stampli.com).
