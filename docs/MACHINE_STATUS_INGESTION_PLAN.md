# Machine Status Ingestion Plan
**Source:** `Machine Status as of 14.05.2026 till 02-06-26.docx`
**Extracted:** 2026-06-02 by Claude Code (Session 13)
**Execute in:** Next session — do NOT run until Mustarq confirms.

---

## What this document is

A field status report written by the supervisor covering all machines at **Muthaafushi** and **Bodufinolhu** as of 14 May 2026, with updates through 2 June 2026. It lists active faults, parts required, supplier quotes, and a general tools/consumables request list.

The goal is to turn this into **live ERP data**: tickets, PRs (where applicable), inventory items at 0 stock, and suppliers.

---

## 1. Suppliers to Create (5 new)

All suppliers currently in the system are the mock seed records. These are the real ones from the document.

| # | Name | Type | Location | Notes |
|---|------|------|----------|-------|
| 1 | **Anam Trade** | Parts supplier | Maldives (local) | Battery 12v/100A quote confirmed |
| 2 | **Leo Trade** | Tools & consumables supplier | Maldives (local) | Price refs: grease MVR 1,000; air compressor MVR 15,000; oil spray gun MVR 250; water hose MVR 500 |
| 3 | **Parts Master** | Heavy equipment spare parts | Maldives (local) | Head gasket quote received |
| 4 | **WEW (Welding Engineering Works)** | Fabrication / workshop service | Maldives (local) | Fabricating bushes, hoses |
| 5 | **ELM Marine** | Marine & heavy parts | Maldives (local) | Boom steel bush stocked here |

> **Al Dahr** (Dubai) is already referenced in the asset registry as the Al Dahr batch supplier — add to supplier register if not already present.

---

## 2. Asset Location / Status Corrections

Before raising tickets, these asset records need correcting based on the status report (more recent than the DB ingestion):

| Asset Code | Asset | Current DB State | Correction Needed |
|-----------|-------|-----------------|-------------------|
| WL-HV-0005 | Kobelco SK380 High Bed | `operational` at Muthaafushi | → `down` (multiple active faults: battery burst, bushes, hoses) |
| WL-HV-0006 | Komatsu PC350 Low Bed | `down` at Muthaafushi | ✓ Already correct |
| WL-HV-0007 | Komatsu PC350 High Bed | `down` at Bodufinolhu | ✓ Already correct |
| WL-HV-0009 | Komatsu PC350 Low Bed | `idle`, location blank | → `operational` (working but slow), location → `bodufinolhu` |
| WL-HV-0023 | CAT 745C Dump Truck | `down` at Bodufinolhu | → `operational` (running, with known issues — not grounded) |

> **Volvo A40G at Muthaafushi:** The doc mentions a Volvo A40G at Muthaafushi with a broken door glass. Registry has WL-HV-0001 at Bodufinolhu and WL-HV-0002 at Thilafushi. One of these has moved. Flag for Mustarq to confirm which unit (0001 or 0002) is actually at Muthaafushi. For now, raise the ticket against the asset code Mustarq confirms.

---

## 3. Issue Tickets to Create (6 tickets)

All tickets dated **14/05/2026**. Use the `reportedAt` field to backdate.

---

### Ticket A — Komatsu PC350 Low Bed, Muthaafushi
**Asset:** WL-HV-0006 · **Site:** muthaafushi · **Urgency:** critical · **Date:** 14/05/2026

**Description:**
Boom steel bush needs replacement. Part sourced from ELM Marine. Payment sent 14 May 2026 and completed 1 June 2026. Currently fabricating at WEW.

**Status at time of report:** Part paid for, fabrication in progress (WEW). Recommend creating ticket at `gm_approved` stage since payment was already executed.

**Required materials:**
| Item | Supplier | Quote Status |
|------|----------|-------------|
| Boom steel bush (Komatsu PC350) | ELM Marine | Paid — payment done 1 June |

**Required services:**
| Service | Supplier | Notes |
|---------|----------|-------|
| Bush fabrication | WEW | In progress |

---

### Ticket B — Kobelco SK380 High Bed, Muthaafushi
**Asset:** WL-HV-0005 · **Site:** muthaafushi · **Urgency:** critical · **Date:** 14/05/2026

**Description:**
Multiple active faults: (1) Battery burst — battery 12v/100A needs replacement with wiring, clamps and lugs. (2) Hydraulic tank outer door hinges broken. (3) Cabin side glass broken — Perspex sheet requested. (4) Arm-to-bucket link bush damaged. (5) Bucket bush damaged. (6) Hydraulic hose damage. Items 4–6 currently fabricating at WEW.

**Status at time of report:** Active — parts sourcing stage. Battery quote received from Anam Trade. No quotes yet for clamps/lugs/wires. Fabrication ongoing at WEW.

**Required materials:**
| Item | Supplier | Quote Status |
|------|----------|-------------|
| Battery 12v/100A | Anam Trade | Quote received |
| Battery clamp × 8 pcs | Anam Trade (TBC) | No quote yet |
| Cable lug × 8 pcs | TBC | No quote yet |
| Battery wires 20ft | TBC | No quote yet |
| Perspex sheet (cabin glass) | TBC | No quote yet |
| Hydraulic tank door hinges | TBC | No quote yet |

**Required services:**
| Service | Supplier | Notes |
|---------|----------|-------|
| Arm-to-bucket link bush fabrication | WEW | In progress |
| Bucket bush fabrication | WEW | In progress |
| Hydraulic hose fabrication | WEW | In progress |

---

### Ticket C — Volvo A40G Dump Truck, Muthaafushi
**Asset:** WL-HV-???? (confirm: 0001 or 0002) · **Site:** muthaafushi · **Urgency:** routine · **Date:** 14/05/2026

**Description:**
Cab door glass is broken and needs to be replaced.

**Required materials:**
| Item | Supplier | Quote Status |
|------|----------|-------------|
| Door glass for VOLVO A40G | TBC | No quote yet |

---

### Ticket D — CAT 745C Dump Truck, Bodufinolhu
**Asset:** WL-HV-0023 · **Site:** bodufinolhu · **Urgency:** urgent · **Date:** 14/05/2026

**Description:**
(1) AC and start motor power supply is bypassed/hard-wired directly — needs proper ECU/electrical programming per electrician Lkamal. (2) Back tyre has damage and needs assessment/replacement.

**Required services:**
| Service | Supplier | Notes |
|---------|----------|-------|
| Electrical/ECU programming | Lkamal (internal staff) | AC + start motor wiring |

**Required materials:**
| Item | Supplier | Quote Status |
|------|----------|-------------|
| Rear tyre for CAT 745C | TBC | No quote yet |

---

### Ticket E — Komatsu PC350 Low Bed, Bodufinolhu
**Asset:** WL-HV-0009 · **Site:** bodufinolhu · **Urgency:** urgent · **Date:** 14/05/2026

**Description:**
Machine is operational but running slow. Hydraulic pump needs replacement. Second hydraulic pump quotation requested from Dubai supplier.

**Status at time of report:** Quote requested from Dubai (Al Dahr). Awaiting quote.

**Required materials:**
| Item | Supplier | Quote Status |
|------|----------|-------------|
| Hydraulic pump for Komatsu PC350 | Al Dahr (Dubai) | Quote requested — pending |

---

### Ticket F — Komatsu PC350 High Bed, Bodufinolhu
**Asset:** WL-HV-0007 · **Site:** bodufinolhu · **Urgency:** critical · **Date:** 14/05/2026

**Description:**
(1) Machine running slow — main hydraulic pump needs replacement. Quotation requested from Al Dahr Dubai. (2) Machine overheats after a few hours — head gasket needs replacement. Quote received from Parts Master.

**Status at time of report:** Two concurrent faults. Head gasket quote received, hydraulic pump quote pending.

**Required materials:**
| Item | Supplier | Quote Status |
|------|----------|-------------|
| Hydraulic pump for Komatsu PC350 | Al Dahr (Dubai) | Quote requested — pending |
| Head gasket kit for Komatsu PC350 | Parts Master | Quote received |

---

## 4. Inventory Items to Add (all at 0 stock)

These come from the standalone items list at the bottom of the document — a general workshop/tools/consumables request. Add to inventory with `currentQty: 0` so they appear in the catalog and can be received when procured.

### Store: Main Workshop / Thilafushi Base

| # | Item | Supplier | Unit | Approx Price | Notes |
|---|------|----------|------|-------------|-------|
| 1 | Air Compressor | Leo Trade | unit | MVR 15,000 | |
| 2 | Oil spray gun | Leo Trade | unit | MVR 250 | |
| 3 | Water hose 50ft | Leo Trade | roll | MVR 500 | |
| 4 | Compressor hose 50ft | Leo Trade | roll | — | |
| 5 | Pressure air gun | Leo Trade | unit | — | |
| 6 | Hose clip | Leo Trade | pcs | — | Pack of 10 |
| 7 | Extension cord cable 3-core | Leo Trade | m | — | "3co cable" |
| 8 | Grinding wheel 4" | Leo Trade | pcs | — | |
| 9 | Cup brush 4" | Leo Trade | pcs | — | |
| 10 | Undercoat paint | Leo Trade | can | — | |
| 11 | Wire clip (crocodile clip) | Leo Trade | pcs | — | |
| 12 | Grease | Leo Trade | bucket | MVR 1,000 | "Leo Trade 1000" = likely price |
| 13 | Welding rod | Generic | pcs | — | |
| 14 | Pin bolt 8" 16mm (half thread + lock nut) | Generic/local | pcs | — | |

> **Already in stock (do not add):**
> - Grease gun → HQ stock
> - Pressure washer → MPL stock
> - Welding machine → likely in workshop already

### Spare Parts (machine-specific, add to parts store)

| # | Item | Machine | Supplier | Notes |
|---|------|---------|----------|-------|
| 1 | Boom steel bush | Komatsu PC350 | ELM Marine / WEW | Ticket A |
| 2 | Battery 12v/100A | Kobelco SK380 | Anam Trade | Ticket B |
| 3 | Battery clamp | Kobelco SK380 | TBC | Ticket B, 8 pcs |
| 4 | Cable lug | Kobelco SK380 | TBC | Ticket B, 8 pcs |
| 5 | Battery wires 20ft | Kobelco SK380 | TBC | Ticket B |
| 6 | Arm-to-bucket link bush | Kobelco SK380 | WEW (fabricate) | Ticket B |
| 7 | Bucket bush | Kobelco SK380 | WEW (fabricate) | Ticket B |
| 8 | Hydraulic hose (custom) | Kobelco SK380 | WEW (fabricate) | Ticket B |
| 9 | Bucket sim bushing 100mm ID × 160mm OD | Kobelco SK380 | WEW | 2mm + 3mm thickness |
| 10 | Perspex sheet (cabin glass) | Kobelco SK380 | TBC | Ticket B |
| 11 | Hydraulic tank door hinges | Kobelco SK380 | TBC | Ticket B |
| 12 | Door glass | Volvo A40G | TBC | Ticket C |
| 13 | Rear tyre CAT 745C | CAT 745C | TBC | Ticket D |
| 14 | Hydraulic pump | Komatsu PC350 | Al Dahr (Dubai) | Tickets E + F |
| 15 | Head gasket kit | Komatsu PC350 | Parts Master | Ticket F |

---

## 5. Execution Order (next session)

1. **Add suppliers** (5 new: Anam Trade, Leo Trade, Parts Master, WEW, ELM Marine) → via Supplier Register in-app or seed
2. **Correct asset statuses** (WL-HV-0005 → down; WL-HV-0009 → operational + location bodufinolhu; WL-HV-0023 → operational)
3. **Confirm Volvo A40G unit** — Mustarq to confirm which code (0001 or 0002) is at Muthaafushi
4. **Create inventory items at 0 stock** — workshop tools list + spare parts list
5. **Create 6 tickets** via the ERP (backdated to 14/05/2026), with materials + services attached
6. **Advance ticket workflows** to match current actual state:
   - Ticket A (boom bush): advance to `gm_approved` (payment was done)
   - Ticket B (Kobelco multi-fault): leave at `submitted` / `diagnosed` — sourcing active
   - Tickets C, D, E, F: leave at `submitted` — sourcing pending

---

## 6. Open Questions for Mustarq

1. **Which Volvo A40G** (WL-HV-0001 or WL-HV-0002) is currently at Muthaafushi?
2. **Al Dahr as supplier** — add formally to supplier register? They supplied the new equipment batch and are being quoted for hydraulic pumps.
3. **Lkamal (electrician)** — is he an internal staff member or an external contractor? If external, add as a supplier/service contact.
4. **Grease/Leo Trade price "1000"** — is that MVR 1,000 per bucket, or a product code?
5. **Welding machine** — is there already one in the workshop, or does this need to be procured?

---

*Plan written by Claude Code — do not execute until Mustarq approves in next session.*
