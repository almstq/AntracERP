# Antrac Nexus

**Group Asset Management ERP — Antrac Holding Pvt. Ltd**

> A unified platform for managing all physical assets across the Antrac Group's subsidiaries —
> fleet, vessels, equipment, and the full operational lifecycle behind each one.

**Security posture:** DEBUG-SAFE, not PRODUCTION-SECURE. The repository no longer keeps
Firebase or Google Maps runtime keys directly in the primary source files, but production
security still requires key rotation, Google Cloud domain/API restrictions, and Vercel
environment verification before Finance data goes live.

---

## About Antrac Group

**Antrac Holding Pvt. Ltd** is a multi-sector holding company established in 2003, headquartered
in Malé, Republic of Maldives. Operating under the tagline *"Navigating Excellence"*, Antrac is
the nation's leading marine services provider — handling over 90% of foreign trade vessels,
cruise ships, superyachts, and naval vessels in Maldivian waters. The Group operates across
marine services, bunkering & fuel supply, logistics, resort development, automobile services,
and heavy equipment rental. It is a five-time consecutive recipient of the **Gold 100 Award**.

---

## What Antrac Nexus Does

Every subsidiary in the Antrac Group owns and operates physical assets — heavy equipment, vessels,
vehicles, and machinery. Managing those assets across multiple SBUs, sites, and atolls requires
a system that tracks not just where assets are, but what's wrong with them, what parts they need,
who approved the purchase, where the parts are stored, and whether the job got done.

**Antrac Nexus** provides exactly that — a single platform covering:

- **Asset registers** — every piece of equipment owned across every SBU
- **Issue tracking** — problems raised against assets, routed through a validation chain
- **Procurement** — purchase requests tied to approved issues, full RFQ → PO → finance pipeline
- **Warehouse & inventory** — spare parts and materials, stock levels per store, movement ledger
- **Fleet operations** — deployments, site assignments, compliance and permit dates
- **CRM & rentals** — client pipeline and contract management for rental SBUs
- **Compliance** — trade licences, insurance, regulatory deadlines per asset and entity

The platform is built in two layers: **Antrac HQ (Layer 1)** provides group-level oversight
and consolidated visibility across all subsidiaries; each **SBU (Layer 2)** operates as a
self-contained module with its own asset registers, workflows, and role hierarchy. Modules are
onboarded one SBU at a time — WLI is the first.

---

## Platform Layers & Module Status

The platform is structured in two layers. Antrac HQ sits at Layer 1 with group-wide oversight
across all subsidiaries. Each SBU operates as a self-contained module at Layer 2.

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1 — Antrac HQ                               🔜 Planned  │
│  Group asset overview · Directors · HR · Finance & Accounts     │
│  Cross-SBU reporting · Consolidated compliance                  │
└───────────────────┬─────────────────────────────────────────────┘
                    │  (group visibility across all SBUs below)
        ┌───────────┼───────────────────┐
        ▼           ▼                   ▼
┌───────────────┐  ┌─────────────┐  ┌──────────────┐
│  LAYER 2      │  │  LAYER 2    │  │  LAYER 2     │
│  SBU 1 · WLI  │  │  SBU 2 · MPL│  │  SBU 3 · EMS │
│  ✅ Active Dev │  │  🔜 Planned │  │  🔜 Planned  │
│               │  │             │  │              │
│ Heavy equip.  │  │ Bunkering & │  │ Expert Motor │
│ Marine ops    │  │ fuel supply │  │ Service /    │
│ Infrastructure│  │ fleet assets│  │ automobile   │
└───────────────┘  └─────────────┘  └──────────────┘
```

---

## SBU 1 — WLI (Well Land Investment Pvt. Ltd)

WLI operates a mixed fleet of land assets, vessels, and support equipment deployed to
construction and utility project sites across the Maldives.

### Modules

| Module | Status | Description |
|---|---|---|
| **Command Center** | ✅ Live | Role-scoped dashboard: live asset stats, active issues, inbox, Executive Intelligence Center for GM/SA |
| **Issue Ticket Pipeline** | ✅ Live | Full 8-stage lifecycle — raise → technical → supervisor → GM → procurement → close |
| **Fleet Register** | ✅ Live | Land asset profiles (excavators, cranes, generators), deployments, permit tracking |
| **Vessel Register** | ✅ Live | Marine vessel register, charter records, crew assignment |
| **Equipment Register** | ✅ Live | Support and auxiliary equipment catalogue |
| **Sites & Projects** | ✅ Live | Site profiles, GPS coordinates, supervisor assignment |
| **Staff & HR** | ✅ Live | Staff roster, operator–asset pairing, work permit tracking |
| **CRM & Rentals** | ✅ Live | 14-stage rental pipeline, sidebar customer register, quotations, rental history |
| **Procurement** | ✅ Live | Full PR → RFQ → quote comparison → GM approval → PO + po_items → WLI Finance payment receipt; 8 role-scoped sidebar queues; document ledger; print-ready PR/RFQ/PO exports; inline AI Pipeline Advisor |
| **Inventory & Warehouse** | ✅ Live | Item catalogue, stock balances per store, full movement ledger |
| **Supplier Register** | ✅ Live | Supplier profiles with transaction and quote history |
| **Master Data & Compliance** | ✅ Live | Asset compliance calendar, trade licenses, document vault |
| **AI Issue Advisor** | ✅ Live | Workflow-native per-ticket analysis with RAG-lite local item/supplier lookup, strict JSON diagnosis, repair procedure, and one-click rectification item import |
| **AI Intelligence v2** | ✅ Live | Hardened OpenAI → Gemini → Groq fallback, procurement pipeline insights, and GM/SA Executive Intelligence Summary |
| **Finance Dashboard** | 🔜 Planned | OPEX tracking, payment queues, disbursement approvals |
| **Reports & Analytics** | 🔜 Planned | Fleet utilisation, procurement spend, ticket backlog, GM digest |
| **Role Assignment UI** | ✅ Live | Sheet-backed role management — new users upserted as `pending`; GM/SA approval stamps Firebase claims and sends Resend email; rejection purges the pending row without blacklisting |

### Issue-to-Purchase SOP

No purchase can be raised without a GM-approved issue ticket. Every procurement record traces
back to a specific asset problem; every material movement links to the ticket it resolves.

```
Issue Raised against asset
  → [Gate 1] Technical Review  (Mechanic)
  → [Gate 2] Supervisor Review (Site Manager)
  → [Gate 3] GM Approval
  → Purchase Request auto-generated
  → RFQ sent to suppliers → quotes collected
  → GM selects and approves quote
  → Purchase Order generated
  → Finance chain: WLI Finance → Antrac Finance → Director
  → Payment processed
  → Delivery to site → Warehouse receipt recorded
  → Parts issued to ticket from stock
  → Consumed or returned to store
  → Ticket closed
```

### Role Hierarchy

| Role | Scope |
|---|---|
| **Super Admin** | Full access + act-on-behalf of any role |
| **General Manager** | Full read/write; final approver for issues, quotes, contracts |
| **Director** | Director-stage PO approvals; read access |
| **Ops Supervisor / Site Manager** | Issue Gate 2, site ops, fleet deployments |
| **Mechanic** | Issue Gate 1 (technical review), material movements |
| **Procurement Staff** | Full procurement pipeline: PR → RFQ → PO → delivery |
| **Inventory Staff** | Warehouse and stock movement management |
| **WLI Finance** | Disbursement authorisation, finance-stage PO approval |
| **Antrac Finance** | Antrac HQ finance review of WLI purchase orders (cross-layer role) |
| **Sales Staff** | CRM pipeline and rental contracts |
| **MPL Approver** | External fuel request approvals for WLI site operations (not the MPL SBU) |
| **Pending** | Authenticated, awaiting role assignment |

### Audit Trail & Reporting Foundation

Every action taken in the platform — status changes, approvals, stock movements, role changes,
procurement decisions — is recorded in the `activity_log` sheet with a full timestamp, the
acting user, their role, the entity type, the entity ID, and a description of the change.

This is the foundation of upward reporting to Antrac HQ. When Layer 1 is built, it reads
from each SBU's `activity_log` and entity sheets to produce consolidated group-level views —
asset utilisation across all SBUs, cross-SBU procurement spend, workforce compliance status,
and financial roll-ups — without any SBU needing to "send" reports manually.

All entities carry permanent unique IDs (e.g. `TKT-0042`, `PR-0015`, `FLT-0003`) that survive
status changes and remain traceable across the full audit history.

---

## SBU 2 — MPL (Bunkering & Fuel Supply)

Manages Antrac's fuel supply fleet and bunkering operations. Module scope (planned): fuel asset
register, bunkering vessel records, MPL approval workflow, fuel consumption tracking per site.

---

## SBU 3 — EMS (Expert Motor Service)

Manages Antrac's automobile services arm. Module scope (planned): vehicle catalogue, import and
sales records, workshop job cards, service history per vehicle, parts management.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Flutter 3.44 / Dart 3.12 — web only (Chrome, Edge) |
| Authentication | Firebase Auth with Google Sign-In (SSO) |
| Database | Google Sheets API v4 — 31-tab operational workbook |
| File Storage | Google Drive API v3 — service account, per-entity folder structure |
| AI | OpenAI gpt-4.1 (primary) → Gemini 1.5 Flash (secondary) → Groq Llama 3.3 70B (fallback) via `NexusAiService`; `AIAdvisorService` adds issue-specific RAG-lite context |
| Maps | Google Maps JavaScript API |
| Hosting | Vercel (auto-deploy on push to main) |
| State | `RefreshService` singleton (ValueNotifier) — no external state package |

---

## Architecture

```
Antrac Nexus (Flutter Web)
│
├── Firebase Auth — Google SSO; role loaded from Sheets users tab on login
│
├── Google Sheets API v4  (live operational database — 31 tabs)
│   ├── users, sites, staff
│   ├── fleet_assets, vessel_assets, equipment_assets
│   ├── tickets, ticket_items, activity_log
│   ├── purchase_requests, purchase_orders, po_items, rfq_quotes, procurement_documents
│   ├── inventory_items, inventory_stock, inventory_movements, storage_locations
│   ├── crm_enquiries, customers, rentals
│   ├── suppliers, price_history
│   └── compliance_calendar, document_vault, daily_log, call_log ...
│
├── Google Drive API v3
│   └── Antrac_Nexus/ root folder
│       └── per-entity subfolders (ticket attachments, quote docs, delivery receipts)
│
└── OpenAI / Gemini / Groq API proxies
    ├── Per-screen floating advisor (summary + top recommended action)
    └── Per-ticket AI Issue Advisor
        ├── RAG-lite scan of inventory, suppliers, price history, ticket_items
        └── Structured diagnosis, repair steps, parts list, Add All to Issue
    ├── Inline Procurement Pipeline Advisor
    │   └── PR/RFQ/PO milestone context + supplier and price-history RAG-lite scan
    └── Executive Intelligence Center
        └── GM/SA-only cross-module operational, procurement, asset, and finance brief
```

---

## Local Development

**Requirements:** Flutter 3.44+, Chrome, Git

```powershell
git clone <repo-url>
cd "Antrac Nexus\app"
flutter pub get
.\scripts\run_local.ps1 -Port 8080
```

App runs at `http://localhost:8080`. On first login, `SetupService.ensureMissingTabs()` creates
all 31 sheet tabs automatically — safe to run on every login.

Localhost now requires environment-injected Firebase and Google Maps values. See
[`docs/LOCAL_DEV.md`](docs/LOCAL_DEV.md) for the exact PowerShell variables and direct
`flutter run` command.

In debug/localhost builds, `SetupService` pins the app to the master workbook
`1t_vND0SR2TfGNW3K-qpAPwEd5WDbdi36gdcw73h4FrE` and prewarms the high-use
Sheets cache (`tickets`, `ticket_items`, `purchase_requests`, procurement docs,
quotes, POs, inventory, suppliers, and users) so existing operational records
render after boot instead of showing stale or empty browser-local state.

For local AI testing, add `openai_api_key` and `groq_api_key` to gitignored
`assets/config/app_secrets.json`. Gemini must be passed with a fresh local compile-time define:
`--dart-define=GEMINI_API_KEY=<your-new-secure-gemini-key>`. Production AI keys stay server-side
in Vercel env vars and are accessed through `/api/openai`, `/api/gemini`, and `/api/groq`.

---

## Vercel Deployment

Includes `vercel.json` and `scripts/vercel_build.sh`. On push to `main`, Vercel installs Flutter,
runs `flutter build web --release`, and serves `build/web` as a single-page application.

---

## Credentials

Gitignored — must exist locally, must never be committed.

| File | Purpose |
|---|---|
| `assets/config/service_account.json` | Local debug only: Google Drive + Sheets service account key |
| `assets/config/app_secrets.json` | Local debug only: OpenAI/Groq keys (`openai_api_key`, `groq_api_key`) |

Production credentials are not bundled into Flutter web. Vercel stores `SERVICE_ACCOUNT_JSON`,
`OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, Firebase web values, and
`GOOGLE_MAPS_API_KEY` as environment variables. AI and service-account credentials are served
only through Edge proxy functions; Firebase and Maps values are injected at build time.

Google OAuth origins and Maps API key restrictions must be configured in Google Cloud Console.

---

## Security

- `assets/config/` is fully gitignored — credentials cannot be committed accidentally
- Runtime Firebase options are loaded only from `--dart-define`; missing values throw a
  startup `StateError`.
- `web/index.html` contains only a Maps placeholder. `scripts/vercel_build.sh` injects
  `GOOGLE_MAPS_API_KEY` during Vercel builds, and `scripts/run_local.ps1` injects it
  temporarily for localhost.
- Role-based access enforced client-side (`_canSeeRoute()`, `UserRole` guards) and
  server-side (role column in Sheets `users` tab)
- User approvals call `/api/admin/set-claims`, stamp `{ approved: true }`, and
  send `Antrac Nexus ERP — Account Approved` through Resend. Rejections send
  `Antrac Nexus ERP — Registration Status Update`, delete the pending `users`
  row, invalidate local cache, and leave the email eligible for future registration.
- Admin dashboard action cards route directly into the live ledgers for compliance,
  suppliers, inventory, and the full activity log audit trail.
- Infrastructure reference IDs are documented in the root project `DEV_TIMELINE.md`

---

## Repository Structure

```
app/
├── lib/
│   ├── config/       Route constants, theme, workflow status enums
│   ├── models/       25+ entity models (Sheets row ↔ Dart object)
│   ├── services/     30+ service classes (Sheets, Drive, Auth, AI)
│   └── screens/      Module UIs — tabs, detail screens, forms
├── web/              Flutter web entry point, manifest, icons
├── scripts/          Vercel build script
└── README.md         This file

../DEV_TIMELINE.md                     Master development reference
../PHASE8_HANDOVER.md                  Active handover — Phase 8 closure notes
../PHASE8_AUDIT_FINDINGS.md            Phase 8 code audit findings (all resolved)
../OPENAI_MIGRATION_PLAN.md            OpenAI → Gemini → Groq AI migration guide
../.old/                               Archived handovers (CRM, Wave 1 audit, pre-Phase 8)
```

---

*Antrac Nexus is proprietary software developed for Antrac Holding Pvt. Ltd.*  
*© 2025 Antrac Holding Pvt. Ltd, Republic of Maldives. All rights reserved.*
