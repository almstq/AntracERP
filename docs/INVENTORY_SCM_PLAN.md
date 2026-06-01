# Inventory & SCM Module — Build Plan

**Module:** 6 — Inventory & Warehouse (full SCM)
**Status:** PLAN — pending build (next major module after planning sign-off)
**Author:** Claude Code · **Date:** 2026-06-01
**Decisions locked with Mustarq:** see "Decisions" below.

---

## 1. Principle

> **Items are permanent catalog entries. Only quantity-by-location moves.**

Stock is *born* from procurement, *flows* between locations via logistics, and
*dies* (decrements) on consumption. Every change is an append-only ledger entry —
nothing is ever deleted, quantities just adjust. The catalog **populates itself
from what WLI buys**: a new material → new catalog item on first receipt; a new
supplier → Supplier Register; thereafter quantities adjust.

---

## 2. Decisions (locked 2026-06-01)

| # | Decision | Choice |
|---|----------|--------|
| D-INV-1 | Services vs materials | **Services = direct expense** (no stock). Only materials become inventory. Service PO lines are expensed against the ticket at delivery. |
| D-INV-2 | PO line → catalog item | **Pick-or-create at collection.** Inventory staff maps each material line to an existing catalog item or creates a new one. Prevents duplicate SKUs. |
| D-INV-3 | Inter-location transfer | **Operational, no approval.** Inventory/supervisor raises → in-transit → destination confirms receipt. Logistics tracking, no GM gate. |
| D-INV-4 | Costing | **Weighted moving average** per item (recomputed on each receipt). Consumption + transfers value at avg cost. (FIFO deferred.) |

---

## 3. Data Model

### InventoryItem  (`inventoryItems` collection) — the catalog/SKU
Permanent definition. Holds **no** quantity.
```
id, code (ITM-YYYYMM-###), name, category ('parts'|'consumables'|'tools'|'other'),
uom, description?, avgCost (MVR), supplierIds[], createdFromPoId?, active,
createdAt, updatedAt
```

### StockBalance  (`stockBalances` collection) — quantity per item × location
Doc id = `${itemId}_${locationId}` for idempotent upsert.
```
id, itemId, locationId, qtyOnHand, uom, updatedAt
```

### StockMovement  (`stockMovements` collection) — append-only ledger
Every stock change. Never edited or deleted.
```
id, itemId, type ('receipt'|'transfer_out'|'transfer_in'|'consumption'|'adjustment'),
qty (absolute, always +ve), locationId,           // for receipt/consumption/adjustment
fromLocationId?, toLocationId?,                    // for transfers
unitCost?, totalCost?,                             // valuation
sourceType ('po'|'transfer'|'ticket'|'manual'), sourceId?,
actorId, notes?, createdAt
```

### StockTransfer  (`stockTransfers` collection) — logistics
Inter-location movement; may carry multiple items.
```
id, displayId (TRF-YYYYMM-###), fromLocationId, toLocationId,
lineItems: [{ itemId, qty, uom }],
status ('requested'|'in_transit'|'received'|'cancelled'),
raisedById, dispatchedById?, dispatchedAt?, receivedById?, receivedAt?,
notes?, createdAt, updatedAt
```
On **received** → posts `transfer_out` (from) + `transfer_in` (to) movements, updates both balances.

### Locations
Reuse the existing **Location/Site register**. Stock can be held at sites flagged
as stores/yards/depots/hq. (Add an optional `holdsStock: boolean` to Site, default
true for yard/depot/hq.) "HQ Malé store", "Muthaafushi store" are locations.

---

## 4. Procurement → Inventory integration

The catalog populates from procurement. Touch points:

1. **PO `collect_items` (post-payment, pay-first):** add required field
   **`receivedLocationId`** (where goods physically land — usually HQ Malé store,
   since purchasing is in Malé). Add a **pick-or-create mapping** UI: each *material*
   PO line → existing item or new item.
2. **Side-effect `RECEIVE_INTO_INVENTORY`** (runs on `items_collected`):
   for each material line — upsert `InventoryItem`, recompute `avgCost`
   (`(oldQty*oldAvg + rcvQty*unitPrice)/(oldQty+rcvQty)`), post a `receipt`
   movement at `receivedLocationId`, upsert `StockBalance`. Link supplier → item.
3. **Service lines** (D-INV-1): no stock. Expensed directly against the ticket
   (recorded on the ticket / as a service-expense note). No catalog entry.
4. **New supplier** (D-INV-?): inline "add supplier" at sourcing → writes to
   Supplier Register, then available for award. Supplier linked to items it supplies.

## 5. Delivery → requestee (ties procurement to the original ticket)

`TRIGGER_DELIVERY` (on PO close) becomes: **create a StockTransfer** from the
received location (HQ store) → the **requestee's site** (e.g. Muthaafushi). This is
the logistics leg. Destination confirms receipt → stock now at Muthaafushi.

## 6. Consumption / expense

When the ticket's materials are actually used (ticket → resolved/closed), post
`consumption` movements decrementing the requestee site's balance, valued at avg
cost. Item persists; qty → adjusted. Also a manual **"Issue Stock"** action for
ad-hoc consumption outside a ticket.

---

## 7. UI surfaces (routes under `/wli/inventory`)

| Page | Route | Content |
|------|-------|---------|
| Item Catalog | `/wli/inventory/items` | List + add/edit catalog items; avg cost, total on-hand |
| Item Detail | `/wli/inventory/items/:id` | Balances across all locations + full movement history |
| Stock by Location | `/wli/inventory/stock` | Items × locations matrix; low-stock flags |
| Movements Ledger | `/wli/inventory/movements` | Filterable audit (item/location/type/date) |
| Transfers | `/wli/inventory/transfers` (+`/new`, `/:id`) | Logistics list + raise + track (requested→in_transit→received) |

Sidebar: new **Inventory** section. Owner role: `inventory_staff` (write);
`supervisor`/`gm` view; `super_admin` all.

---

## 8. Phasing

| Phase | Scope |
|-------|-------|
| **A — Data model** | Types (`InventoryItem`, `StockBalance`, `StockMovement`, `StockTransfer`), Firestore rules, `inventory.ts` service (postMovement, upsertBalance, recomputeAvgCost — all atomic) |
| **B — Procurement receipt** | `collect_items` gains `receivedLocationId` + pick-or-create mapping; `RECEIVE_INTO_INVENTORY` side-effect; services expensed |
| **C — Inventory UI** | Catalog, Item Detail, Stock-by-Location, Movements ledger + sidebar/routes |
| **D — Transfers (logistics)** | StockTransfer flow + UI; `TRIGGER_DELIVERY` → transfer to requestee site |
| **E — Consumption** | Ticket resolution consumes materials; manual "Issue Stock" |
| **F — Supplier capture** | Inline new-supplier at sourcing; supplier↔item linkage |

Build A→F in order. A+B+C is the usable core (buy → receive → see stock).

---

## 9. Roadmap impact

This is a **new major module** (Module 6 going full SCM). It slots in as the next
build, **ahead of** the remaining UI Polish + Mobile phases (polish/mobile stay
last). Scope grew — overall % completion will dip accordingly; that's honest SCM
accounting, not regression.

## 10. Open items / future

- FIFO/batch costing (currently weighted average)
- Stock reorder points / low-stock alerts → could feed the AI Brief
- Stock-take / cycle-count adjustments UI (the `adjustment` movement type exists for this)
- Barcode/QR for items (later)
