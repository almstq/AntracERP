# ANTRAC ERP — WLI ↔ MPL FUEL & WATER REQUEST WORKFLOW
# Inter-SBU workflow — WLI requests, MPL supplies, Director approves
# MPL module is lightweight — approval node only, no full portal

---

## CONTEXT

MPL (Maldives Petroleum Link) is the group's internal supplier for fuel and water.
WLI sites request fuel/water from MPL.
MPL does not yet have retail operations — this is internal group supply only.
MPL module in Antrac Nexus = limited dashboard, approval actions only.

---

## ACTORS

| Actor | Role | Entity |
|---|---|---|
| Site Supervisor | Raises fuel/water request | WLI |
| WLI Inventory Staff | Checks balance, accepts/rejects | WLI |
| General Manager | Approves request | WLI |
| MPL Manager | Receives, accepts, submits to Director | MPL |
| Antrac Director | Final approval | Antrac HQ |
| MPL Manager | Sends collection notice to requestee | MPL |
| Site Supervisor (requestee) | Collects and confirms | WLI |

---

## STAGE 1 — REQUEST RAISED
**Actor:** WLI Site Supervisor
**Status:** `draft` → `submitted`

**Form fields:**
- Request ID (auto: FUEL-YYYYMM-###)
- Request type: Fuel / Water / Both
- Fuel type (if fuel): Diesel / Petrol / Other
- Quantity requested
- UOM: Litres / Drums / Tonnes
- Site/location (dropdown from sites)
- Asset to be fuelled (dropdown from assets — optional)
- Urgency: CRITICAL / URGENT / ROUTINE
- Notes

**Action:** Submit → lands in WLI Inventory dashboard
**Notification:** WLI Inventory Staff notified

---

## STAGE 2 — WLI INVENTORY CHECK
**Actor:** WLI Inventory Staff
**Status:** `submitted` → `inventory_checked`

**Inventory Staff actions:**
- Views current WLI fuel/water balance
- Checks if requested quantity is within available balance
- If acceptable: ACCEPT → moves to GM approval
- If not enough balance: REJECT with reason → notifies supervisor

**Inventory Staff adds:**
- Current WLI balance (qty + UOM)
- Available qty to release
- Notes (if any adjustment to requested qty)

**Action:** Accept → lands in GM inbox
**Notification:** GM notified

---

## STAGE 3 — GM APPROVAL
**Actor:** General Manager
**Status:** `inventory_checked` → `gm_approved` OR `rejected`

**GM sees:**
- Request summary card
- Site + asset
- Requested qty vs available balance
- Inventory Staff notes
- Urgency badge

**GM actions:**
- APPROVE → forwarded to MPL Manager dashboard
- REJECT → returned to supervisor with reason

**Notification:** MPL Manager notified on approval

---

## STAGE 4 — MPL MANAGER ACCEPTANCE
**Actor:** MPL Manager (Shifan)
**Status:** `gm_approved` → `mpl_accepted`

**MPL Manager sees in dashboard:**
- Fuel/water request card from WLI
- Requesting site, quantity, type, urgency
- WLI GM approval badge ✅
- WLI inventory confirmation

**MPL Manager actions:**
- ACCEPT → submits to Antrac Director dashboard
- REJECT → returns to WLI GM with reason

**Notification:** Antrac Director notified

---

## STAGE 5 — DIRECTOR APPROVAL
**Actor:** Antrac Director (Hameed)
**Status:** `mpl_accepted` → `director_approved`

**Director sees:**
- Request summary
- WLI GM approval ✅
- MPL Manager acceptance ✅
- Quantity + type + requesting site

**Director actions:**
- APPROVE → MPL Manager notified to release
- REJECT → returned to MPL Manager with reason

**Notification:** MPL Manager notified on approval

---

## STAGE 6 — MPL RELEASE & COLLECTION NOTICE
**Actor:** MPL Manager
**Status:** `director_approved` → `ready_for_collection`

**MPL Manager actions:**
- Marks request as approved and ready
- Sends collection notice to WLI Supervisor (in-app notification + visible in supervisor's inbox)

**Collection notice contains:**
- Request ID
- Approved quantity
- Fuel/water type
- Collection point (MPL location)
- Valid until date (optional)
- MPL Manager signature + timestamp

**Notification:** WLI Site Supervisor receives collection notice

---

## STAGE 7 — COLLECTION & CLOSURE
**Actor:** WLI Site Supervisor (requestee)
**Status:** `ready_for_collection` → `collected` → `closed`

**Supervisor actions:**
- Arrives at MPL collection point
- Collects fuel/water
- Confirms collection in app:
  - Actual quantity collected
  - Date/time of collection
  - Photo (optional)
- Status → `collected`

**Auto-closure:**
- Request status → `closed`
- WLI Inventory balance updated (deducted)
- Activity logged with full timeline
- GM notified: request closed

---

## GM TIMELINE VIEW

```
FUEL-202606-001 — Diesel Request — Thilafushi

23 May 09:00  ● Request raised by Janaka — 500L Diesel
23 May 09:15  ● WLI Inventory checked — balance 1,200L, accepted
23 May 09:30  ● GM approved ✅
23 May 09:31  ● Forwarded to MPL Manager (Shifan)
23 May 10:00  ● MPL Manager accepted ✅
23 May 10:01  ● Forwarded to Director (Hameed)
23 May 10:45  ● Director approved ✅
23 May 11:00  ● MPL collection notice sent to Janaka
23 May 14:30  ● Janaka collected 500L Diesel ✅
23 May 14:30  ● FUEL-202606-001 CLOSED ✅
              WLI balance updated: 1,200L → 700L
```

---

## STATUS FLOW

```
draft → submitted → inventory_checked → gm_approved →
mpl_accepted → director_approved → ready_for_collection →
collected → closed
```

---

## NOTIFICATIONS MATRIX

| Event | Who gets notified |
|---|---|
| Request submitted | WLI Inventory Staff |
| Inventory accepted | GM |
| GM approved | MPL Manager |
| GM rejected | Supervisor |
| MPL accepted | Director |
| MPL rejected | WLI GM |
| Director approved | MPL Manager |
| Director rejected | MPL Manager + WLI GM |
| Collection notice sent | WLI Supervisor |
| Collection confirmed | GM + WLI Inventory |
| Request closed | GM |

---

## MPL DASHBOARD — SCOPE (LIMITED)

MPL Manager sees ONLY:
- Incoming fuel/water requests from WLI (pending acceptance)
- Requests forwarded to Director (pending approval)
- Approved requests — collection notices to send
- Closed requests history

MPL Manager does NOT have access to:
- WLI fleet or assets
- WLI procurement
- WLI finance
- Any other WLI module

MPL module is intentionally minimal.
Full MPL operational module to be built in a future phase when MPL retail operations begin.

---

## IMPLEMENTATION NOTES FOR CLAUDE CODE

1. Add `fuel_requests` tab to Antrac_Nexus_DB (already in data model — verify headers match fields above)
2. MPL Manager login = limited role `mpl_manager` — sees only MPL dashboard
3. Director approval uses existing `director` role — same inbox used for high-value POs
4. WLI Inventory balance tracked in a new `inventory_balance` tab: item (fuel/water), current_qty, uom, last_updated
5. When request is closed, auto-deduct from inventory_balance
6. Collection notice is an in-app notification + a viewable card in supervisor's inbox
7. All stages logged to activity_log with actor, timestamp, action
8. GM notified at every stage transition (same notification pattern as issue tickets)

---

*Antrac Nexus — WLI ↔ MPL Fuel & Water Workflow v1.0*
*Well Land Investment Pvt Ltd | May 2026*
