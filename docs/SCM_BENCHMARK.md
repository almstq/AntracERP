# SCM Benchmark — Antrac ERP vs tier-1 ERP systems

**Date:** 2026-06-01 · **Author:** Claude Code (research + analysis)
**Purpose:** Benchmark the Antrac inventory/SCM engine against the disciplines used
by category-leading enterprise ERP/SCM platforms, and decide what to adopt — **without
changing how Antrac actually works.**

---

## Governing principle — REFLECT, DON'T ENFORCE

> Mustarq is GM, not owner. The system **digitizes Antrac's existing practice**;
> it does not re-engineer it. Every enterprise-grade concept below is added as
> **optional data-capture and/or advisory flags — never as a hard gate that forces a
> behavior change.** Anything that would alter practice is surfaced as a
> *recommendation* to leadership, decided by them, not imposed by the software.

This is **Decision 26** (master timeline).

---

## How tier-1 ERP systems frame it (reference)

Enterprise ERP/SCM splits this into **materials management**, **warehouse
management**, and **procure-to-pay (P2P)**. The pillars:
- **Item/material master** — rich definition (base + alternate UoMs, valuation class
  linked to a finance account, replenishment type, batch/serial flags)
- **Plant → storage location → bin** hierarchy; stock held at a location, valued by
  **moving-average or standard cost**
- **Typed goods movements** (goods receipt, goods issue, transfer) — each posting an
  inventory document *and* a financial document
- **Three-way match** (PO ↔ goods receipt ↔ invoice) before payment — the central control
- **Requirements planning** — reorder points, safety stock → auto-generated requisitions

## Side-by-side

| Domain | Tier-1 ERP | Antrac | Verdict |
|--------|-----------|--------|---------|
| Item master | Rich (alt UoM, valuation class) | Lean InventoryItem | Add alt-UoM field (UI later) |
| Location | Plant → location → **bin** | Site → **Store** | ✓ right-sized — skip bins |
| Movements | Inventory + finance doc, typed | Append-only typed ledger | ✓ sound; finance posting deferred |
| Valuation | Moving-avg / standard | Weighted-avg | ✓ + add **landed cost** |
| Receipt vs invoice | Receipt + invoice **3-way matched** | Tax invoice at collection | Add **advisory** reconciliation |
| Partial delivery | Native | Assumes full | Allow partial (optional) |
| Batch/serial | Native | None | Optional per-item flag |
| Reservation | Native | Assets only | Optional |
| Replenishment | Requirements planning | None | **Advisory** reorder alerts |
| Stock-take | Physical inventory | `adjustment` only | Count process later |
| Vendor master | Terms/tax/bank/rating | Basic register | Enrich later |
| Costing→finance | Auto ledger + cost centers | vs ticket/site | Defer (no chart of accounts) |

## The six that matter for WLI — as REFLECT-not-enforce

1. **Three-way match → advisory mismatch flag.** Capture received qty + invoice
   qty/price vs PO; show a badge if they differ. **Does not block payment** or change
   the approval chain. Pure visibility (more important now that we're pay-first).
2. **Landed cost → optional capture.** Record freight + customs duty (20–40% of true
   cost for a Maldives importer) → truer stock value + job costing. Blank = behaves
   as today.
3. **Transfer = marine logistics → capture what you already do.** Link a store→store
   `StockTransfer` to a vessel/trip + shipping cost. The category-leading platforms
   treat transfers generically — this is where Antrac can do *better* for an island
   business. 🌟
4. **Batch / serial → optional per-item flag** (`none|batch|serial`). Serial for
   parts (warranty / which machine), batch for fuel/consumables (expiry).
5. **Reorder points → advisory low-stock alert** per item-store. No auto-PO unless
   leadership later asks. Valuable for remote sites with long resupply lead times.
6. **Stock reservation → optional.** Reserve stock against a ticket/work order so it
   isn't double-committed.

## Deliberately SKIP (enterprise bloat for a 30-staff SBU)
Bin-level warehouse management · full requirements-planning engine · configurable
release strategies · full finance-ledger + automatic account determination ·
valuation areas / special stock categories.

## What Antrac already does right
Append-only ledger (= the inventory-document principle) · workflow-first role-gating
(cleaner than enterprise release strategies) · pick-or-create master governance ·
items permanent / qty moves · right-sized (adopts concepts, not bloat) · pay-first
was a deliberate, valid GM decision.

## Build guidance
Fold the six into the Inventory plan as **optional fields + advisory flags** (cheap
now, costly to retrofit). Design marine-logistics transfer in Phase D. Defer
finance-ledger/cost-center, cycle-count UI, alt-UoM UI (add fields now, UI later).

> Research basis: standard procure-to-pay, materials-management and warehouse-
> management disciplines as implemented across category-leading enterprise ERP/SCM
> platforms. Concepts cited (three-way match, moving-average valuation, requirements
> planning) are generic SCM practice, not vendor-specific.
