# Inventory & SCM / Warehouse Module — Build Plan

**Module:** 6 — Inventory & Warehouse (full SCM)
**Status:** PLAN — pending build (next major module after planning sign-off)
**Author:** Claude Code · **Date:** 2026-06-01 (rev 2 — added Store entity + Warehouse module)
**Decisions locked with Mustarq:** see "Decisions" below.

---

## 1. Principle

> **Items are permanent catalog entries. Quantity lives in STORES. Only
> quantity-by-store moves — and every move is logged, so each item has a journey.**

Stock is *born* from procurement (received into a store), *flows* between stores
via logistics transfers, and *dies* (decrements) on consumption. Every change is an
append-only ledger entry — nothing is deleted, quantities adjust. The catalog and
suppliers **populate themselves from what WLI buys**.

**You can't move what you can't locate** — so **Stores** are the foundation. A
**Store** is a named stock-holding place attached to a Site (HQ Malé Store,
Muthaafushi Store, Thilafushi Yard Store…). Stores are the nodes; movements are the
edges; the ledger is the journey.

This is its **own Warehouse module** in the nav — not an action under Operations.

> **REFLECT, DON'T ENFORCE (Decision 26):** the system digitizes Antrac's *existing*
> practice. Enterprise-grade controls (three-way match, reorder, etc.) are added as
> **optional capture + advisory flags — never hard gates that change behavior.**
> Practice changes are recommendations for leadership, not software mandates.
> See `SCM_BENCHMARK.md`.

---

## 2. Decisions (locked 2026-06-01)

| # | Decision | Choice |
|---|----------|--------|
| D-INV-1 | Services vs materials | **Services = direct expense** (no stock). Only materials become inventory. Service PO lines are expensed against the ticket at delivery. |
| D-INV-2 | PO line → catalog item | **Pick-or-create at collection.** Inventory staff maps each material line to an existing catalog item or creates a new one. Prevents duplicate SKUs. |
| D-INV-3 | Inter-store transfer | **Operational, no approval.** Inventory/supervisor raises → in-transit → destination confirms receipt. Logistics tracking, no GM gate. |
| D-INV-4 | Costing | **Weighted moving average** per item (recomputed on each receipt). Consumption + transfers value at avg cost. (FIFO deferred.) |
| D-INV-5 | Stock location granularity | **Stores** (named, attached to a Site). A site may have 1+ stores. Stock balances + movements key off `storeId`. Prerequisite for everything else. |
| D-INV-6 | Reflect not enforce | Enterprise-grade controls are **optional capture + advisory flags**, never hard gates that change Antrac practice. See `SCM_BENCHMARK.md`. |

### Benchmarked enhancements (all optional / advisory — D-INV-6)
Folded into the phases below, none change practice:
- **3-way reconciliation flag** — received qty + invoice qty/price vs PO; shows a
  mismatch badge, does **not** block payment (Phase B).
- **Landed cost** — optional freight + customs-duty capture at receipt → truer
  weighted-avg cost; blank behaves as today (Phase B).
- **Batch/serial** — optional per-item flag `none|batch|serial` (Phase A item, Phase E capture).
- **Reorder point** — optional per item-store; advisory low-stock alert, no auto-PO (Phase C).
- **Stock reservation** — optional, reserve vs ticket/work order (Phase E).
- **Transfer = marine logistics** — link transfer to vessel/trip + shipping cost (Phase D, the differentiator).
- Alt-UoM, cycle-count UI, GL/cost-center — fields now where cheap, UI deferred.

---

## 3. Data Model

### Store  (`stores` collection) — stock-holding location  ⟵ NEW, the foundation
A named warehouse/store attached to a site. Stock lives here.
```
id, code (STR-###), name, siteId, siteName (denormalized), type ('main'|'yard'|'site'|'transit'),
managerStaffId?, active, createdAt, updatedAt
```
Created via the **Stores register** (add stores to existing sites). HQ Malé Store is
the default purchasing/receiving store.

### InventoryItem  (`inventoryItems` collection) — the catalog/SKU
Permanent definition. Holds **no** quantity.
```
id, code (ITM-YYYYMM-###), name, category ('parts'|'consumables'|'tools'|'other'),
uom, description?, avgCost (MVR), supplierIds[], createdFromPoId?, active,
createdAt, updatedAt
```

### StockBalance  (`stockBalances` collection) — quantity per item × STORE
Doc id = `${itemId}_${storeId}` for idempotent upsert.
```
id, itemId, storeId, qtyOnHand, uom, updatedAt
```

### StockMovement  (`stockMovements` collection) — append-only ledger (the journey)
Every stock change. Never edited or deleted.
```
id, itemId, type ('receipt'|'transfer_out'|'transfer_in'|'consumption'|'adjustment'),
qty (absolute, +ve), storeId,                  // for receipt/consumption/adjustment
fromStoreId?, toStoreId?,                       // for transfers
unitCost?, totalCost?,                          // valuation
sourceType ('po'|'transfer'|'ticket'|'manual'), sourceId?,
actorId, notes?, createdAt
```

### StockTransfer  (`stockTransfers` collection) — logistics (store → store)
```
id, displayId (TRF-YYYYMM-###), fromStoreId, toStoreId,
lineItems: [{ itemId, qty, uom }],
status ('requested'|'in_transit'|'received'|'cancelled'),
raisedById, dispatchedById?, dispatchedAt?, receivedById?, receivedAt?,
notes?, createdAt, updatedAt
```
On **received** → posts `transfer_out` (fromStore) + `transfer_in` (toStore)
movements, updates both balances. This is the item's logged journey leg.

### Sites
Sites stay as-is (the existing Location/Site register). **Stores reference a site**
via `siteId`. A site with no store can't hold stock until a store is added to it.

---

## 4. Procurement → Inventory integration

The catalog populates from procurement. Touch points:

1. **PO `collect_items` (post-payment, pay-first):** add required field
   **`receivedStoreId`** (which store the goods land in — usually HQ Malé Store,
   since purchasing is in Malé). Add a **pick-or-create mapping** UI: each *material*
   PO line → existing item or new item.
2. **Side-effect `RECEIVE_INTO_INVENTORY`** (on `items_collected`): for each material
   line — upsert `InventoryItem`, recompute `avgCost`
   (`(oldQty*oldAvg + rcvQty*unitPrice)/(oldQty+rcvQty)`), post a `receipt` movement
   into `receivedStoreId`, upsert `StockBalance`. Link supplier → item.
3. **Service lines** (D-INV-1): no stock. Expensed against the ticket. No catalog entry.
4. **New supplier:** inline "add supplier" at sourcing → Supplier Register → available
   for award. Supplier linked to items it supplies.

## 5. Delivery → requestee (procurement → ticket journey)

`TRIGGER_DELIVERY` (on PO close) becomes: **create a StockTransfer** from the
receiving store (HQ Store) → the **requestee site's store** (e.g. Muthaafushi Store).
That's the logistics leg. Destination confirms receipt → stock now at Muthaafushi
Store, journey logged.

## 6. Consumption / expense

When the ticket's materials are used (ticket → resolved/closed), post `consumption`
movements decrementing the destination store's balance at avg cost. Item persists;
qty adjusts. Also a manual **"Issue Stock"** action for ad-hoc consumption.

---

## 7. The battery example — traced with stores

```
1. Muthaafushi raises ticket → needs Battery (material)
2. Procurement (Malé): RFQ → quote → PO → pay-first chain → COLLECT
3. "Mark Collected": receivedStoreId = HQ Malé Store; pick-or-create Battery
   → InventoryItem created · receipt +1 → StockBalance Battery@HQ Store = 1
4. PO closed → TRIGGER_DELIVERY → StockTransfer HQ Store → Muthaafushi Store
   → in_transit → received: transfer_out −1 HQ, transfer_in +1 Muthaafushi
5. Muthaafushi uses it → consumption −1 @ Muthaafushi Store → balance 0, item lives on
→ Full journey visible in the movement ledger for that battery.
```

---

## 8. UI — the WAREHOUSE module (routes under `/wli/warehouse`)

New dedicated **Warehouse** sidebar section (owner: `inventory_staff`; `supervisor`/
`gm` view; `super_admin` all):

| Page | Route | Content |
|------|-------|---------|
| **Stores** | `/wli/warehouse/stores` | Register stores, attach to sites, edit/deactivate. **Foundation — build first.** |
| Item Catalog | `/wli/warehouse/items` | List + add/edit catalog items; avg cost, total on-hand |
| Item Detail | `/wli/warehouse/items/:id` | Balances across all stores + full movement history (the journey) |
| Stock by Store | `/wli/warehouse/stock` | Items × stores matrix; low-stock flags; per-store view |
| Movements | `/wli/warehouse/movements` | Filterable ledger (item/store/type/date) |
| Transfers | `/wli/warehouse/transfers` (+`/new`, `/:id`) | Logistics: raise + track (requested→in_transit→received) |

---

## 9. Phasing

| Phase | Scope |
|-------|-------|
| **A — Foundation** | **Store entity + Stores register UI (add stores to sites)** + Warehouse sidebar section. Then types (`InventoryItem`, `StockBalance`, `StockMovement`, `StockTransfer`), Firestore rules, `inventory.ts` service (postMovement, upsertBalance, recomputeAvgCost — atomic). |
| **B — Procurement receipt** | `collect_items` gains `receivedStoreId` + pick-or-create mapping; `RECEIVE_INTO_INVENTORY` side-effect; services expensed |
| **C — Warehouse UI** | Item Catalog, Item Detail, Stock-by-Store, Movements ledger |
| **D — Transfers (logistics)** | StockTransfer flow + UI; `TRIGGER_DELIVERY` → transfer to requestee site's store |
| **E — Consumption** | Ticket resolution consumes materials; manual "Issue Stock" |
| **F — Supplier capture** | Inline new-supplier at sourcing; supplier↔item linkage |

Build A→F. **A first** — no stock can exist until stores do. A+B+C = usable core
(define stores → buy → receive → see stock by store).

---

## 10. Roadmap impact

New major module (Module 6 full SCM/Warehouse). Slots in as the next build, **ahead
of** UI Polish + Mobile (those stay last). Scope grew — overall % dips accordingly;
honest SCM accounting, not regression.

## 11. Open items / future

- FIFO/batch costing (currently weighted average)
- Reorder points / low-stock alerts → could feed the AI Brief
- Stock-take / cycle-count UI (`adjustment` movement type exists for this)
- Multiple stores per site already supported (e.g. HQ main + HQ spares)
- Barcode/QR for items + stores (later)
