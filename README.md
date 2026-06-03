# Antrac Nexus

**Group Resource Management ERP — Antrac Holding Pvt. Ltd**

> A unified platform for managing every physical asset across the Antrac Group's
> subsidiaries — fleet, vessels, equipment — and the full operational lifecycle
> behind each one: the issue raised against it, the parts it needs, who approved the
> spend, where those parts are stored, and whether the job got done.

**Security posture:** DEBUG-SAFE, not yet PRODUCTION-SECURE. Runtime keys (Firebase,
Google Maps, Gemini, FollowMe) are environment-injected, never committed. Production
still requires key rotation, Google Cloud domain/API restrictions, and Firestore
security-rule review before Finance data goes live.

---

## About Antrac Group

**Antrac Holding Pvt. Ltd** is a multi-sector holding company established in 2003,
headquartered in Malé, Republic of Maldives. Operating under the tagline
*"Navigating Excellence,"* Antrac is the nation's leading marine services provider —
handling the bulk of foreign trade vessels, cruise ships, superyachts, and naval
vessels in Maldivian waters. The Group operates across marine services, bunkering &
fuel supply, logistics, resort development, automobile services, and heavy-equipment
rental, and is a multiple-time recipient of the **Gold 100 Award**.

---

## What Antrac Nexus Does

Every subsidiary in the Antrac Group owns and operates physical assets — heavy
equipment, vessels, vehicles, and machinery — deployed across multiple SBUs, sites,
and atolls. Managing them requires a system that tracks not just *where* an asset is,
but what's wrong with it, what parts it needs, who approved the purchase, where the
parts are stored, who's crewing it, and whether the work is done.

**Antrac Nexus** is that system — a single platform covering:

- **Asset registers** — every vessel, vehicle, and piece of equipment, across every SBU
- **Issue tracking** — faults raised against assets, routed through a validation chain
- **Procurement** — purchase requests tied to approved issues; RFQ → quote → PO → a
  four-tier finance chain
- **Warehouse & inventory** — spare parts and materials, stock per store, movement ledger
- **Fleet operations** — site deployments, crew assignment, live vessel tracking, compliance
- **CRM & rentals** — client pipeline and rental contracts for the revenue side
- **Document Vault & PROOF CHAIN** — attributed, hash-verified document trail

The platform is built in two layers: **Antrac HQ (Layer 1)** provides group-level
oversight across all subsidiaries; each **SBU (Layer 2)** is a self-contained module
with its own registers, workflows, and role hierarchy. SBUs are onboarded one at a
time — **WLI is the first.**

---

## Platform Layers & Module Status

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1 — Antrac HQ                                 🟡 Building  │
│  Group overview · Directors · CFO · Group Finance · HR           │
│  Holding staff register · 4-tier payment authority               │
└───────────────────┬─────────────────────────────────────────────┘
                    │  (group oversight across all SBUs below)
        ┌───────────┼───────────────────┐
        ▼           ▼                   ▼
┌───────────────┐  ┌─────────────┐  ┌──────────────┐
│  LAYER 2      │  │  LAYER 2    │  │  LAYER 2     │
│  SBU 1 · WLI  │  │  SBU 2 · MPL│  │  SBU 3 · EMS │
│  ✅ Active    │  │  🟡 Partial │  │  🔜 Planned  │
│               │  │             │  │              │
│ Heavy equip.  │  │ Bunkering & │  │ Expert Motor │
│ Marine ops    │  │ fuel supply │  │ Service /    │
│ Project sites │  │ (approver)  │  │ automobile   │
└───────────────┘  └─────────────┘  └──────────────┘
```

---

## SBU 1 — WLI (Well Land Investment Pvt. Ltd)

WLI runs a mixed fleet of land assets, vessels, and support equipment, deployed to
construction and utility project sites across the Maldives. Its business is
**equipment rental** — generating leads, converting to contracts, and deploying
assets + crew to client sites. Fleet maintenance is the cost side that protects
that revenue.

### Modules

| Module | Status | Description |
|---|---|---|
| **Command Center** | ✅ Live | Role-scoped dashboard: live fleet readiness, action inbox, per-site overview (assets + crew + in-charge + open issues), crewing-gap flags, weather, AI brief |
| **Issue → Closure Pipeline** | ✅ Live | Full ticket lifecycle — operator raises → mechanic diagnoses → supervisor checks → GM approves → procurement → delivery → close, with a Firestore-backed timeline |
| **Procurement** | ✅ Live | Two PR origins — **ticket-spawned** (from a mechanic diagnosis) and **direct/group-level** (raised by authorised non-field roles with a mandatory justification + GM approval gate). Then RFQ (1 PDF/supplier) → competitive quotes → GM comparison & award → PO → **four-tier payment chain** (WLI Finance → Antrac Finance → CFO → Director), pay-first before collection |
| **Warehouse & Inventory** | ✅ Live | Stores register, item catalogue, stock balances per store, full movement ledger, transfers, pick-or-create on collection |
| **Fleet / Asset Registers** | ✅ Live | Vessels, vehicles, support equipment; specs, repair history, deployment history, condition, crew |
| **Sites & In-Charge** | ✅ Live | Site profiles, GPS, asset & staff assignment, explicit site in-charge (incl. cross-org HQ project managers) |
| **Staff & HR** | ✅ Live | Per-module rosters (WLI / Holding / MPL), staff↔asset pairing, captain + deck-crew for vessels, work-permit fields |
| **CRM & Rentals** | ✅ Live | Customer register, enquiry → quotation → work order → invoice, asset utilisation |
| **Fuel & Water (WLI ↔ MPL)** | ✅ Live | Cross-SBU fuel/water request workflow; MPL Terminal Manager is the approval node; auto-deducts inventory on collection |
| **Map** | ✅ Live | Theme-aware Google Map of sites + assets + crew; live AIS vessel positions via FollowMe |
| **Document Vault & PROOF CHAIN** | ✅ Live | Aggregated vault, upload attribution, SHA-256 integrity, weekly snapshot Cloud Function |
| **AI Advisor** | ✅ Live | Gemini-backed brief, GM price-comparison recommendation, mechanic diagnosis assist; graceful no-key fallback |
| **Reports & Analytics** | 🔜 Planned | Fleet utilisation, procurement spend, ticket backlog, GM digest |

### Issue-to-Purchase SOP

Procurement has two legitimate doors, both with an approval gate before sourcing:

- **Maintenance purchases** must trace to a **GM-approved issue ticket** — the PR
  auto-spawns from the mechanic's diagnosis, so every repair material links to the
  fault it resolves. Field crew (operators/mechanics) only ever go through this door.
- **Direct / general requests** (office, project materials, services, stock) are
  raised by authorised non-field roles — Supervisors and above, Procurement, Finance,
  Inventory, and HQ staff — with a **mandatory justification (why)** and **location
  (where)**. A direct PR requires **GM approval** (requester ≠ approver) before it
  joins the same sourcing → award → PO → payment chain. PRs are SBU-tagged, so the
  request surface is shared across the WLI and Holding modules.

```
Issue raised against an asset
  → [Gate 1] Technical review      (Mechanic — PR auto-spawns on hold)
  → [Gate 2] Supervisor check      (Site Supervisor)
  → [Gate 3] GM approval           (activates the PR)
  → RFQ to suppliers → quotes collected
  → GM compares & awards (may split across suppliers)
  → Purchase Order generated (one per supplier)
  → Four-tier payment chain:  WLI Finance → Antrac Finance → CFO → Director
  → Payment settled  (PAY-FIRST — no goods collected until paid)
  → Collection (tax invoice) → delivery to site → warehouse receipt
  → Parts issued to the ticket → requestee confirms
  → Ticket closed   (or a child ticket spawns if the fault persists)
```

### Role Hierarchy (11-actor model)

| Role | Scope |
|---|---|
| **Super Admin** | Full access + act-as any role |
| **General Manager** | Full read/write; final approver for issues, quotes, awards |
| **Director** | Final stage of the payment chain; group oversight |
| **CFO** | Third stage of the payment chain |
| **Antrac Finance** | HQ finance review of WLI purchase orders (cross-layer) |
| **Holding HR** | Group workforce administration |
| **Supervisor / Site In-Charge** | Issue Gate 2, site operations, fleet & crew deployment |
| **Mechanic** | Issue Gate 1 (technical review), material movements |
| **Procurement Staff** | PR → RFQ → PO → delivery |
| **Inventory Staff** | Warehouse and stock movement |
| **WLI Finance** | First stage of the payment chain; disbursement |
| **Operator** | Raises issues against the asset they crew |
| **MPL Manager** | Approves WLI fuel & water requests |
| **Pending** | Authenticated, awaiting role assignment |

### Audit Trail & Upward Reporting

Every status change, approval, stock movement, and award is written to the entity's
Firestore timeline with a timestamp, the acting user, their role, and a description.
This is the foundation of upward reporting to Antrac HQ: when Layer 1 reporting is
built, it reads each SBU's live collections to produce consolidated group views —
asset utilisation, cross-SBU procurement spend, workforce compliance, financial
roll-ups — with no SBU manually "sending" anything.

All entities carry permanent IDs (e.g. `WL-HV-0002`, `WL-MV-0001`, `ANT-EMP-0001`)
that survive status changes and stay traceable across the full history.

---

## SBU 2 — MPL (Maldives Petroleum Link · Bunkering & Fuel Supply)

Live as the **approval node** for WLI's fuel & water requests — the MPL Terminal
Manager accepts/declines, and approved volumes deduct from inventory on collection.
Full MPL module scope (fuel-asset register, bunkering vessels, consumption tracking)
is planned.

## SBU 3 — EMS (Expert Motor Service)

Automobile services arm. Planned scope: vehicle catalogue, import/sales records,
workshop job cards, service history, parts management.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | **React 19 + TypeScript + Vite 8 + Tailwind 4** — web (Helix design system, light/dark) |
| Auth | Firebase Auth with Google Sign-In (SSO); 11-actor role model + Act-As |
| Database | **Cloud Firestore** — live operational store (assets, staff, sites, tickets, PRs, POs, inventory, CRM, timelines, notifications) |
| File Storage | Firebase Storage — per-entity uploads, SHA-256 client-side integrity hashing |
| Serverless | Firebase Cloud Functions (weekly PROOF-CHAIN snapshot; FollowMe AIS sync cache) |
| AI | Gemini Flash (REST) via `ai.ts` — advisory, role-gated, graceful no-key fallback |
| Maps | Google Maps JavaScript API (theme-aware) |
| Vessel tracking | FollowMe AIS — server-cached, "Powered by FollowMe" attribution |
| Weather | OpenWeatherMap — per-site wind/visibility tiles |
| Hosting | Vercel (auto-deploy on push to `main`) |

---

## Architecture

```
Antrac Nexus (React + TS + Vite)
│
├── Firebase Auth — Google SSO; effective role + Act-As resolved in AuthContext
│
├── Cloud Firestore  (live operational database)
│   ├── sites · assets · staff · suppliers
│   ├── tickets (+ timeline) · purchaseRequests · purchaseOrders (+ timeline)
│   ├── inventoryItems · stockBalances · stockMovements · stockTransfers · stores
│   ├── customers · enquiries · quotations · workOrders · invoices · payments
│   ├── fuelRequests · notifications · inventoryBalances
│   └── declarative workflow engine (ticket / PR / PO / fuel state machines)
│
├── Firebase Storage — uploads with uploadedByName + SHA-256 integrity
│
├── Cloud Functions
│   ├── weeklyOpsSnapshot — Sunday PDF, saved to the Vault, tagged weekly_snapshot
│   └── syncFollowMe — 1-min AIS position cache (browser reads cache only)
│
└── External APIs (key-gated, graceful fallback)
    ├── Gemini Flash — AI brief, price-comparison & diagnosis assist
    ├── Google Maps — sites/assets/crew, live vessel positions
    └── OpenWeatherMap — per-site marine-safety tiles
```

---

## Local Development

**Requirements:** Node 20+, npm, a Firebase project.

```bash
npm install
npm run dev          # → http://localhost:3000
```

Log in with **Google** as `super_admin` (not Developer Login — the mock has no token,
so writes are denied). Use the sidebar-footer **Act As** dropdown to test any role.

Create a gitignored `.env.local` with the web values (never commit it):

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GOOGLE_MAPS_API_KEY=...        # optional — Map lights up when present
VITE_OPENWEATHER_API_KEY=...        # optional — weather tiles
```

Server-side keys (Gemini, FollowMe) live in the deploy environment / Cloud Functions
config, never in the client bundle.

### Build & deploy

```bash
npm run build                                   # tsc + vite — 0 errors expected
firebase deploy --only firestore:rules          # security rules
firebase deploy --only functions                # Cloud Functions (needs billing)
```

Vercel auto-builds on push to `main`. Seed scripts (firebase-admin + service account
kept outside the repo) live under `seed/` and default to dry-run; pass `--commit` to write.

---

## Security

- `.env.local` and all `*.local` files are gitignored — web keys never committed.
- Service-account JSON for seeds/admin stays **outside** the repo, never committed.
- Role-based access enforced in the app (effective-role guards, **role-filtered
  navigation**, role-gated module switcher, module-level route gating) and in
  Firestore security rules (workflow-participant gates, per-collection rules).
- Each role lands on a view scoped to its job; field roles are scoped to their sites
  (`siteIds`). Act-As previews any role faithfully (nav, landing, and access switch).
- Uploads are attributed (`uploadedByName`) and integrity-hashed (SHA-256) on the client.
- See [`SECURITY.md`](SECURITY.md) for the reporting process and the production checklist.

### Known limitations (tracked, deferred to future patches)

- **Per-page route hardening within a module.** The sidebar hides every section a
  role can't use, and module access is role-gated — but in-module route access is
  currently enforced at the *module* level. A user could still reach a sibling page
  inside their own module by typing its URL directly (the nav never links them there).
  Firestore security rules remain the authoritative server-side gate; tightening the
  client to per-route role checks is a planned hardening pass.
- **Settings page.** The icon-rail gear is a placeholder; theme and density currently
  live in the sidebar footer. A consolidated Settings screen is planned.
- **AI brief model id.** `ai.ts` targets a Gemini model id that returns 404 on API
  `v1`; the brief falls back gracefully. A one-line model-id fix is pending.

---

## Repository Structure

```
.
├── src/
│   ├── components/      Helix shell, dashboard, workflow & register UI
│   ├── pages/           Module screens — wli/ holding/ mpl/ ems/
│   ├── lib/
│   │   ├── workflow/    Declarative engine + ticket/PR/PO/fuel state machines
│   │   ├── services/    Firestore access, registry, RFQ, AI, weather, FollowMe
│   │   ├── hooks/       Live data hooks (workflow + CRM)
│   │   └── permissions/ 11-actor role model
│   └── types/           Entity models (Asset, Staff, Site, workflow entities, CRM)
├── functions/          Cloud Functions (weekly snapshot, FollowMe sync)
├── seed/               Admin seed + registry/staff ingestion scripts (dry-run default)
├── docs/               Architecture, plans, workflows, UI spacing contract
│   └── legacy-nexus/   Archived Flutter-era README & docs (provenance)
├── firestore.rules     Security rules
└── README.md
```

---

*Antrac Nexus is proprietary software developed for Antrac Holding Pvt. Ltd.*
*© 2026 Antrac Holding Pvt. Ltd, Republic of Maldives. All rights reserved.*
