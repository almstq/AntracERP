# Antrac ERP — Master Architecture Document

**Owner:** Nexus (starqOS Coordinator)
**Created:** 2026-05-29
**Last updated:** 2026-05-29 (Correction: WLI rental business model, CRM Phase 2, dual asset status)
**Status:** ACTIVE — Phase 1 Pending Mustarq Approval
**Classification:** Internal — starqOS team only

**Sources consolidated:**
- `projects/ANTRAC ERP — MODULE ARCHITECTURE.txt` (Mustarq's definitive module brief)
- `workspaces/cipher/architecture/2026-05-29-codebase-audit.md` (Cipher's audit)
- `new directive/additional requiremnets ANTRAC ERP — MODULE ARCHITECTURE - Copy.txt` (additional architecture requirements)
- `workspaces/vector/strategies/2026-05-29-antrac-erp-stakeholder-requirements.md` (Vector's stakeholder analysis)
- `workspaces/lens/research/2026-05-29-antrac-erp-intelligence.md` (Lens's research)
- Mustarq correction 2026-05-29: WLI rental business model, CRM Phase 2, dual asset status

---

## 1. System Overview

**What:** Cloud-hosted, web-first Group Resource Management System for Antrac Holding Group (Maldives).
**Why:** The group runs on complete fragmentation — no system, manual processes everywhere, data scattered across phones, WhatsApp, Excel, and memory.
**Who:** WLI is the primary SBU — a revenue-generating equipment rental company. Its sole business purpose is to generate leads, convert them to rental contracts, and execute rental operations. Fleet management, maintenance, procurement, and fuel are the operational cost side that supports this rental business.

### Critical Architectural Principle

**WLI exists to rent equipment and generate revenue.** Every module must support this purpose directly or indirectly. The CRM & Equipment Rental module is WLI's core revenue engine — NOT a post-MVP add-on. It moves to Phase 2.

### Revenue Chain

```
Lead → Enquiry → Quotation → Contract → Deployment → Operations → Return → Invoice → Collection
```

This chain touches: CRM, Assets (availability), Procurement (parts), Maintenance (asset readiness), Fuel (consumption), Finance (billing), Operations (execution).

### Group Structure

| SBU | Full Name | Role | MVP Scope |
|-----|-----------|------|-----------|
| Antrac HQ | Holding Company | Finance, HR, Directors. Final payment authority. | Finance oversight layer |
| SBU_WLI | Well Land Investment | **Equipment rental company.** Core: leads, contracts, deployments, billing. 30 staff, 4 sites. | **PRIMARY — all MVP modules** |
| SBU_MPL | Maldives Petroleum Link | Fuel import, bunkering, distribution. | Fuel supply records only |
| SBU_EMS | Expert Motor Services | Vehicle and motor services. | NOT in MVP |

### Sites

| Site | Type | Key Function |
|------|------|-------------|
| Thilafushi | WLI Site | Primary operations base |
| Bodufinolhu | WLI Site | Equipment deployment |
| Muthaafushi | WLI Site | Equipment deployment |
| Goidhoo | WLI Site | Equipment deployment |
| Malé (HQ) | Antrac HQ | Finance, directors, HR |

---

## 2. WLI Staff Functions and Portals

Each staff member has a role-scoped portal and dashboard:

### Sales & Marketing Staff
- Generate and track rental leads
- Prepare and send rental quotations
- Convert leads to signed rental contracts
- Promote equipment availability to market
- Track client relationships and follow-ups
- **Dashboard:** Lead pipeline, quotation status, conversion rates, revenue forecast

### Operations Staff (site-based)
- Daily equipment pre-start checklists
- Issue reporting (machine breakdowns, defects)
- Fuel logging per asset
- Confirm parts received at site
- Equipment deployment and return confirmation
- **Dashboard:** My site status, open tickets, today's checklists, pending receipts

### Maintenance Staff (mechanics)
- Receive and action work orders
- Log parts used and labour hours
- Update ticket status and resolution notes
- Request parts via procurement
- **Dashboard:** My work orders, parts status, assigned tickets

### Procurement Staff
- Attend purchase requisitions from all departments
- Source suppliers and obtain quotes
- Generate purchase orders
- Follow up on deliveries
- **Dashboard:** PR queue, RFQ status, PO tracking, delivery follow-ups

### Finance Staff (WLI-side)
- Submit payment requests to HQ Finance
- Track payment status
- Reconcile receipts and invoices
- **Dashboard:** Payment request status, pending approvals, invoice tracking

### GM (Mustarq)
- Full visibility across all functions
- Approve procurement above threshold
- Review and close maintenance tickets
- Sign off rental contracts
- Report to Antrac HQ Directors
- **Dashboard (Command Centre):** All sites, all open items, approval queue, alerts, revenue vs cost

### HQ Finance
- Review and process payment requests from all SBUs
- Route to Director for approval above threshold
- **Dashboard:** Approval queue, PO review, payment processing

### HQ Directors
- Final payment approvals above threshold
- Group-level dashboards
- **Dashboard:** Revenue summary, cost breakdown, **asset utilisation per SBU**, approval queue, KPIs

---

## 3. MVP Modules (8 Core)

### Module 1: Asset Management
**The foundation. Every operational module references assets.**

**Functions:**
- Complete asset register (fleet, vessels, vehicles, generators, support equipment)
- Asset classification and tagging (asset ID system: WL-HV-XXXX)

**DUAL ASSET STATUS (from day one):**
Every asset has two simultaneous states:
- **Operational status:** Working / Grounded / In Maintenance
- **Commercial status:** Available / Deployed to Client / Reserved

Both visible on asset card, asset list, and all dashboards. A single asset can be "Working + Deployed to Client" or "Grounded + Available" etc.

- Site assignment and transfer history
- Operator/driver assignment
- Utilisation tracking (hours, trips, deployments)
- Lifetime cost tracking (maintenance + parts + fuel per asset)
- Asset documentation (registration, insurance, certifications, photos)
- Depreciation tracking

**Asset Utilisation Metric (key for Directors):**
Asset Utilisation = (days deployed to clients / total available days) × 100%
Per asset, per period. Prominent on Director dashboard. This is the number that justifies WLI's existence to Antrac.

**Data relationships:** Maintenance (work orders), Procurement (parts), Inventory (parts consumed), Fuel (consumption), Staff (operator), Logistics (deployments), CRM (rental contracts).

### Module 2: CRM & Equipment Rentals — MOVED TO PHASE 2
**WLI's core revenue engine. This is not post-MVP.**

**Functions:**
- Client register (companies, contacts, client sites)
- Equipment availability calendar (free / deployed / reserved) — shows both operational and commercial status
- Lead → enquiry → quote → contract pipeline
- Rate sheet management (per asset type, per duration, MVR + USD)
- Rental agreement generation
- Client site deployment tracking
- Equipment deployment and return workflow
- Billing and invoice generation
- Collections and payment tracking
- Rental revenue per asset reporting
- **Asset utilisation calculation:** (days deployed / total available) × 100%

**Data relationships:** Assets (availability + status), Finance (invoices/billing), Operations (deployment), Staff (sales assignments).

### Module 3: Maintenance Management (CMMS)
**Keeps rental assets operational and available for deployment.**

**Functions:**
- Issue reporting with structured ticket system (IR-XXXX)
- Ticket fields: asset, site, reporter, category, severity (Critical/High/Medium/Low), description, symptoms, photos
- Status workflow: Reported → Under Review → Parts Identified → Parts Requested → Parts Ordered → Parts Received → Resolved → Closed
- Work order generation from tickets
- Technician/mechanic assignment
- Parts requirement linking (triggers Procurement)
- Preventive maintenance scheduling (by hours, date, condition)
- PM compliance tracking and overdue alerts
- Resolution documentation (what was done, parts used, labour hours)
- Cost per ticket (parts + labour + transport)
- Asset maintenance history (full timeline per asset)
- Recurring issue detection and flagging
- **Impact on asset operational status:** Working ↔ Grounded ↔ In Maintenance

**Data relationships:** Assets, Procurement, Inventory, Staff, Finance, CRM (asset availability affects contracts).

### Module 4: Procurement
**Supplies parts and materials for all operations.**

**Functions:**
- Purchase Requisition creation from any module (Maintenance, Inventory, Operations)
- PR approval workflow (threshold-based routing)
- RFQ management
- Supplier quotation capture (amount, currency, validity, attachments)
- Quote comparison and selection
- PO generation from approved quotes
- PO approval workflow: Requestor → WLI Management → HQ Finance → Director
- Three-way matching (PO + delivery note + invoice)
- Supplier performance tracking
- Procurement analytics (spend per supplier/asset/site/period)

**Data relationships:** Maintenance, Inventory, Finance, Suppliers, Assets.

### Module 5: Inventory & Warehouse
**Multi-site stock visibility and movement tracking.**

**Functions:**
- Stock register per site (5 locations)
- Item master (categories, specifications, min/max, reorder points)
- Stock receipt from procurement deliveries
- Stock issue to work orders/operations
- Inter-site transfers with dispatch tracking
- Stock take / physical count reconciliation
- Low stock alerts per site (auto-generate PR draft after 3 days)
- Consumption tracking per asset, site, period
- Full movement log (received, issued, transferred, adjusted)

**Data relationships:** Procurement, Maintenance, Logistics, Assets.

### Module 6: Finance & Approvals
**Financial control layer. Not full accounting — manages approvals, cost tracking, revenue tracking.**

**Functions:**
- Payment request management (generated from approved POs)
- Multi-level approval workflow (threshold-based)
- Payment status tracking (Requested → Under Review → Approved → Processed → Paid)
- Payment slip attachment and reference tracking
- Dual currency (MVR/USD) with exchange rate management
- Cost centre tracking (per SBU, site, department)
- Budget tracking and variance reporting
- Accounts Payable visibility
- **Rental revenue tracking** (invoices generated from CRM module)
- Financial dashboards for HQ Directors

**Data relationships:** All modules (cost + revenue attribution).

### Module 7: Human Resources & Staff Management
**Syncs with external HR API. Does NOT replicate payroll.**

**Functions:**
- Staff register (synced from HR API)
- Role and designation management
- Site assignment and transfer history
- Vehicle/equipment assignment per staff member
- Reporting structure
- Skills and certification tracking
- Attendance and presence tracking per site
- Staff cost allocation to sites and cost centres
- Contact information and emergency details

**HR API integration:** One-way sync, nightly batch, local Firestore cache with `synced_at` timestamp.

**Data relationships:** Assets, Maintenance, Sites, all modules (identity + permissions).

### Module 8: Logistics & Transport
**Physical movement coordination — equipment deployment, parts, vessels.**

**Functions:**
- Vessel register (landing craft, support vessels)
- Vessel operational status and readiness
- VPCW (Vessel Provisioning & Crew Welfare) tracking
- Crew assignment per vessel
- Voyage planning and logging (origin, destination, cargo, crew, departure, arrival)
- Parts collection coordination (Malé suppliers → site)
- Dispatch planning (vessel, trip, cargo)
- Delivery confirmation at destination
- Equipment mobilisation/demobilisation between sites and client sites
- Transport cost tracking per trip

**Data relationships:** Procurement, Inventory, Assets, Maintenance, Staff, CRM (equipment deployment to clients).

### Module 9: Fuel Management
**Fuel consumption tracking + MPL reconciliation. Largest variable cost for rental operations.**

**Functions:**
- Daily fuel consumption logging per asset, per site
- Fuel receipt logging (MPL deliveries)
- Tank level tracking per site
- Consumption vs delivery reconciliation
- Consumption rate analysis (litres per hour per asset)
- Anomaly detection (unusual patterns)
- Cost tracking (MVR/USD)
- MPL supply record integration (what MPL says vs what site recorded)
- Fuel efficiency reporting per asset type

**Data relationships:** Assets, Sites, Finance, MPL integration.

---

## 4. Post-MVP Modules (3 Supporting)

### Module 10: Reporting & Business Intelligence
- Role-based dashboards per staff function (Sales, Operations, Maintenance, Procurement, Finance, GM, Directors)
- Asset utilisation reporting — **the key Director metric**
- Rental revenue analytics (per asset, per client, per period)
- Maintenance analytics (MTTR, MTBF, PM compliance)
- Procurement analytics (spend trends, supplier performance)
- Custom report builder

### Module 11: Document Management & SOP Generation
- Centralised document repository
- Version-controlled SOPs generated from workflow data + audit trail
- Document approval workflow
- Compliance tracking

### Module 12: AI Operations Advisor
- Claude-powered diagnosis from ticket history
- Parts recommendation based on similar past issues
- Predictive maintenance suggestions
- Anomaly detection across modules
- Natural language query interface

---

## 5. Cross-Module Architecture

### Shared Data Entities
All modules connect through these shared entities:
- `asset_id` — links all asset-related data
- `staff_id` — links all personnel data
- `site_id` — links all site-scoped data
- `supplier_id` — links all vendor data
- `client_id` — links all CRM/rental data
- `attachment_id` — links all documents/photos
- `contract_id` — links all rental agreements

### Access Control — Dual Layer
**Role-based (8 levels):** Sales / Operations / Mechanic / Procurement / WLI Finance / Manager (GM) / HQ Finance / Director / Admin
**Site-based (5 locations):** Thilafushi / Bodufinolhu / Muthaafushi / Goidhoo / HQ

### Dashboard Entry Points Per Role

| Role | Default View | Key Information |
|------|-------------|-----------------|
| Sales Staff | Lead Pipeline | Leads, quotations, contracts, follow-ups |
| Operations Staff | My Site | Checklists, tickets, fuel log, receipts |
| Mechanic | My Work Orders | Assigned tickets, parts status, resolution |
| Procurement Staff | PR Queue | Requisitions, RFQs, POs, deliveries |
| WLI Finance | Payment Status | Requests, approvals, invoices |
| WLI Manager (Mustarq) | Command Centre | All functions, approvals, alerts, revenue vs cost |
| HQ Finance | Approval Queue | Pending payments, PO review |
| Director | Group Overview | **Asset utilisation**, revenue summary, cost breakdown, KPIs |

---

## 6. Technical Architecture

### Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind 4
- **Backend:** Firebase (Firestore + Auth + Cloud Functions + Hosting)
- **State:** React Query (server state) + Context (auth/org)
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Routing:** React Router DOM

### Codebase Strategy
**BUILD ON EXISTING React scaffold.** Key files to keep:
- `src/components/ui/*` — All UI primitives
- `src/components/shared/*` — Shared components
- `src/lib/context/*` — AuthContext, OrgContext
- `src/lib/hooks/*` — useAuth, useOrgContext, usePermissions
- `src/lib/firebase/*` — Firebase client
- `src/lib/permissions/*` — Role definitions
- `src/lib/utils/*` — Utilities
- `src/routes/ProtectedRoute.tsx`
- ALL WLI page components (adapt from mock to real data)

---

## 7. Build Sequence (CORRECTED)

### Phase 1 — Foundation
**Asset Management (with dual status) + HR/Staff + Site structure + Data models for CRM**
- Firestore schemas for all shared entities (including dual asset status + client/contract entities)
- Dual asset status data model: operational + commercial from day one
- Client register + rental contract data models (schema only, UI in Phase 2)
- Site access control implementation
- Data import tools (CSV import for fleet register, staff list, supplier list, client list)
- Opening balance entry screens
- Flutter mock data extraction
- **Role-based portal framework** — each staff function gets scoped dashboard route

### Phase 2 — Revenue + Operations Core
**CRM & Equipment Rentals + Maintenance/CMMS + Procurement + Inventory**
- CRM: Lead pipeline, quotation workflow, contract generation, deployment tracking, billing
- Equipment availability calendar showing dual status
- Maintenance: Ticket system with workflow engine
- Procurement: PR/RFQ/PO pipeline
- Inventory: Stock management with multi-site visibility
- **Asset utilisation calculation** — (days deployed / total available) × 100%
- Role-based dashboards for: Sales, Operations, Maintenance, Procurement, WLI Finance

### Phase 3 — Financial Control
**Finance & Approvals + Fuel Management**
- Payment request workflow with configurable thresholds
- Dual currency handling (MVR/USD) exchange rate snapshots
- Rental revenue tracking linked to CRM contracts
- Fuel consumption + MPL reconciliation
- Invoice generation from rental contracts

### Phase 4 — Logistics
**Logistics & Transport**
- Vessel operations, crew management, voyage logging
- Equipment mobilisation/demobilisation between sites and client sites
- Parts collection coordination
- VPCW tracking

### Phase 5 — Intelligence
**Reporting & BI + Manager Command Centre**
- Role-based dashboards for all 8 staff functions
- **Director dashboard: asset utilisation, revenue, cost, KPIs**
- Manager Command Centre — operational brain pulling from all modules
- Rental revenue analytics per asset, client, period

### Phase 6 — Growth
**Document Management + AI Advisor**
- SOP generation from audit trail
- Claude-powered maintenance diagnosis
- Predictive maintenance + anomaly detection

---

## 8. Notifications, Offline, Audit, Multi-Language

*(Unchanged from previous version — see Notification & Escalation Engine, Offline Capability, Audit Trail, Multi-Language sections above)*

---

## 9. Governance

**Approval workflow:**
1. Cipher proposes (schema, component structure, API design)
2. Mustarq reviews and approves
3. Grid builds under Cipher's direction
4. Cipher reviews all code before task completion
5. Nexus reports to Mustarq

**Priority rule:** Nothing gets built until Mustarq approves Cipher's Phase 1 schema proposal — which must include dual asset status and CRM data models.
