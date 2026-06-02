# Registry Mass-Ingestion Plan — Assets & Staff

**Source:** WL Ops Command Center registry export (internal; converted from `WL_Ops_Command_Center_updated.xlsx`).
**Target:** Antrac ERP Firestore (`assets`, `staff` collections).
**Scope (as requested):** assets (heavy fleet + marine) + staff. Issues/PRs/compliance/logs **out of scope** for this pass (notes below on converting them later).

---

## What gets ingested

| Source table | Count | → ERP collection | assetClass / notes |
|--------------|-------|------------------|--------------------|
| `fleet_status` (heavy) | 31 unique codes (`WL-HV-0001…0031`); `WL-HV-0007` duplicated | `assets` | `vehicle` (trucks/pickup) or `equipment` (excavators/cranes/loaders/forklift/bobcat) |
| `marine_vessels` | 4 (`WL-MV-0001…0004`) | `assets` | `vessel` |
| `staff_register` | 31 (`WL-EMP-0001…0031`) | `staff` | + `operators` table merges asset assignments |

**Total: ~35 assets + 31 staff.**

---

## Field mapping

### Asset (heavy + marine)
| ERP field | From source | Rule |
|-----------|-------------|------|
| `code` | `fleet_id` / `vessel_id` | preserved exactly (doc id = slug of code) |
| `make` | `brand` | — |
| `model` | `model` | — |
| `type` | `vehicle_type` / `type` | — |
| `assetClass` | `vehicle_type` keyword | Excavator/Crane/Loader/Bobcat/Forklift → `equipment`; Dump Truck/Hauler/Pickup → `vehicle`; marine → `vessel` |
| `operationalStatus` | `status` | Operational/Active/Running → `operational`; Grounded → `down`; Standby → `idle`; Drydocked → `maintenance`; Unknown / Pending Delivery → `idle` (+flag) |
| `commercialStatus` | `assigned_project` | has a project (resort dev) → `deployed`; else `available` |
| `currentSiteId` | `current_location` | mapped to existing site (see below); Unknown/Pending → blank |
| `trackingId` | — | set `WL-MV-0001` (LCT 1) → `18599` |
| **NEW** `regNo`, `chassisNo`, `engineNo` | `reg_no`, `chassis_no`, `engine_no` | preserve VIN/engine data |
| **NEW** `knownIssue` | `known_issue` | preserve fault narrative |
| **NEW** `assignedProject` | `assigned_project` | — |
| **NEW** `lastMaintenanceText` | `last_maintenance` | raw string (mixed formats) |
| **NEW** `sourceId` | `fleet_id` | provenance / dedupe key |

### Staff
| ERP field | From source | Rule |
|-----------|-------------|------|
| `displayId` | `staff_id` | `WL-EMP-0001…` preserved |
| `name` | `full_name` | — |
| `designation` | `designation` | — |
| `staffType` | `designation` | Captain→`captain`; Crew,*→`vessel_crew`; *Operator→`operator`; *Driver→`driver`; Supervisor*→`supervisor`; Mechanic→`mechanic`; Welder/Carpenter/Helper→`support_staff`; Terminal Staff→`terminal_staff` |
| `role` (permission) | derived | GM→`gm`; Supervisor*→`supervisor`; Mechanic→`mechanic`; else→`operator` |
| `assignedAssetId` | `operators.assigned_asset_id` | resolve asset code → doc id (e.g. WL-EMP-0007 → WL-HV-0010) |
| `status` | `status` | Full Time/Probation → `active` |
| **NEW** `employmentStatus` | `status` | preserve "Full Time" / "Probation" |
| **NEW** `nationality`, `grade`, `joinedDateText`, `contactNo` | resp. | preserve HR data |
| **NEW** `sourceId` | `staff_id` | provenance |

> **Model change:** all NEW fields are **optional & backward-compatible** — existing records are unaffected.

### Location → site mapping
`Thilafushi — Base` → Thilafushi site · `Bodufinolhu` → Bodufinolhu site · `Muthaafushi` → Muthaafushi site ·
`Unknown` / `Pending Delivery` → unassigned (blank) + flagged in the dry-run report.
*(The script resolves a site by name-match against existing `sites`; unmatched → blank.)*

---

## Mechanism

A one-shot **admin ingestion script** `seed/ingest-registry.ts` (firebase-admin + service account, same pattern as `seed/admin-seed.ts`):

1. Reads the parsed records (embedded JSON or a derived `seed/data/registry.json`).
2. Maps each per the tables above.
3. **`--dry-run`** (default): prints exactly what it would create/update + every flag (duplicate IDs, unmapped sites, status guesses) — **writes nothing**.
4. **`--commit`**: upserts by `code`/`displayId` (idempotent — safe to re-run).

Run: `npx ts-node seed/ingest-registry.ts "<service-account.json>" --dry-run` → review → `--commit`.

---

## ⚠️ Decisions needed before any write

1. **Existing mock data conflicts.** The ERP currently holds ~10 placeholder assets + a few staff whose **codes collide** with the real registry (e.g. seed `WL-HV-0003 = CAT 320D` vs registry `WL-HV-0003 = ISUZU 14T`; seed `WL-HV-0007 = LIEBHERR` vs registry `KOMATSU PC350`). The real registry should win. Options: **(A) Replace** — clear mock assets/staff, import the registry clean; **(B) Upsert** — registry overwrites matching codes, leaves non-matching mock (e.g. the seeded generator) in place. *Note: a few demo tickets are linked to seeded asset `WL-GN-0003`; Replace would orphan them.*
2. **Duplicate `WL-HV-0007`.** Two machines share it. Options: import the 2nd as **`WL-HV-0007B`** (keep both, flagged), or import one + flag the other for manual fix.

## Deferred (available on request, not in this pass)
- Convert **grounded machines / open PRs** (`pr_log`, `dashboard_open_actions`) into real **Issue Tickets / Purchase Requests** so the repair backlog is live in the workflow.
- `compliance` table → an asset/vessel compliance tracker (permits, insurance, survey expiries).
- `document_vault_*` → seed document-vault placeholders per asset.
