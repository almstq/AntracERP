import { writeFileSync } from 'node:fs';

const generatedAt = new Date().toISOString();
const boardPath = 'D:/!starq/starqNexus/data/antrac-erp-tasks.json';
const evidencePath = 'D:/!starq/starqNexus/data/evidence/ANTRAC_ERP_MVP_TO_FINAL_FORM_BOARD_2026-06-14.md';

const project = 'antrac-erp';
const workers = ['codex', 'claude', 'cipher', 'elder', 'hermes'];

function task(id, phase, sprint, title, status, depends_on, workers, description, extra = {}) {
  return {
    id,
    phase,
    sprint,
    title,
    workers,
    status,
    depends_on,
    dispatched_at: extra.dispatched_at ?? '2026-06-14',
    dispatched_by: extra.dispatched_by ?? 'codex',
    description,
    date_range: extra.date_range ?? 'TBD',
    priority: extra.priority ?? 'P1',
    lane: extra.lane ?? phase,
    acceptance: extra.acceptance ?? [],
    project,
  };
}

const tasks = [
  task(
    'ERP-MVP-000',
    'Phase 0 - Current MVP Baseline',
    'MVP Baseline',
    'Current Antrac ERP MVP - operational prototype baseline',
    'done',
    [],
    ['cipher', 'codex', 'claude'],
    'Label the existing Antrac ERP build as MVP: React/Vite/Firebase app with auth, WLI workflows, CRM, procurement, inventory, fuel, document vault, dashboards, reports center, role registry, map, storage rules, hosting config, and green production build. This is the baseline to stabilize, not the final ERP form.',
    {
      priority: 'P0',
      date_range: '2026-05-29 to 2026-06-14',
      acceptance: [
        'Board clearly marks current build as MVP, not final ERP',
        'Existing delivered modules remain recorded as completed history',
        'Future work starts from this baseline without re-deriving scope',
      ],
    },
  ),
  task(
    'ERP-MVP-001',
    'Phase 0 - Current MVP Baseline',
    'MVP Baseline',
    'MVP feature inventory and proof pack',
    'done',
    ['ERP-MVP-000'],
    ['codex'],
    'Document what currently exists: workflow engine, tickets, PR/RFQ/PO, 4-tier payment chain, CRM, deployments, inventory, fuel requests, document vault, reports center, role registry, user assignment, territory map, Firebase rules/storage/hosting, env checker, and build status.',
    {
      priority: 'P0',
      date_range: '2026-06-14',
      acceptance: [
        'MVP scope can be audited without chat history',
        'Known non-MVP gaps are not presented as completed',
      ],
    },
  ),
  task(
    'ERP-MVP-002',
    'Phase 0 - Current MVP Baseline',
    'MVP Baseline',
    'MVP risk register - security, finance, workflow, UX',
    'next',
    ['ERP-MVP-001'],
    ['codex', 'elder'],
    'Create a concise ship-risk register: client-side permission dependence, coarse Firestore rules, missing ledger, incomplete asset financial model, reactive maintenance, partial procurement controls, inventory valuation gap, and workflow validation not fully server-side.',
    {
      priority: 'P0',
      acceptance: [
        'Risks ranked P0/P1/P2',
        'Each risk has owner, mitigation, and ship decision',
      ],
    },
  ),

  task(
    'ERP-SHIP-001',
    'Phase 1 - Org-Syncable MVP Ship Gate',
    'Ship Gate',
    'Org model sync - Holding, SBU, site, store, asset, staff, user',
    'next',
    ['ERP-MVP-000'],
    ['codex', 'claude'],
    'Make org hierarchy the single operating spine: Antrac Holding -> WLI/MPL/EMS -> sites -> stores -> assets -> staff/users. Ensure all core records carry orgId/sbuId/siteId/currentSiteId/storeId consistently and can be synced into StarqNexus/OrgSync.',
    {
      priority: 'P0',
      acceptance: [
        'Every user has roleId, orgId, siteIds, status',
        'Every asset has sbuId/currentSiteId and can be tied to a site',
        'Every store belongs to a site/SBU',
        'OrgSync can consume the hierarchy without manual mapping',
      ],
    },
  ),
  task(
    'ERP-SHIP-002',
    'Phase 1 - Org-Syncable MVP Ship Gate',
    'Ship Gate',
    'Access control hardening - registry roles plus territory enforcement',
    'next',
    ['ERP-SHIP-001'],
    ['codex'],
    'Convert role registry into deployable security posture: all users assigned via roleId; seeded and SA-created roles are equal; workflowActors remain internal authority grants; Firestore rules enforce pending-user gate, SA role management, and first-pass territory gates for site-owned data.',
    {
      priority: 'P0',
      acceptance: [
        'Pending users cannot read business data',
        'SA alone can create/edit roles and assign users',
        'Site users cannot read/update out-of-territory site assets/staff/tickets where rules can enforce it',
        'Role edit and assignment activity is logged',
      ],
    },
  ),
  task(
    'ERP-SHIP-003',
    'Phase 1 - Org-Syncable MVP Ship Gate',
    'Ship Gate',
    'Role desk as user desk - action inbox, territory, assets, staff',
    'done',
    ['ERP-SHIP-001'],
    ['codex'],
    'Role desks show assigned users, their sites, assets in territory, staff in territory, and pending workflow actions. WLI users land on their desk instead of generic module home.',
    {
      priority: 'P0',
      date_range: '2026-06-14',
      acceptance: [
        'SA act-as selector shows all roles with assignees',
        'User desk shows assigned sites/assets/staff',
        'Unassigned roles are visibly flagged',
      ],
    },
  ),
  task(
    'ERP-SHIP-004',
    'Phase 1 - Org-Syncable MVP Ship Gate',
    'Ship Gate',
    'Territory map - site users see zoomed assigned ground view',
    'done',
    ['ERP-SHIP-003'],
    ['codex'],
    'Fleet map accepts focusSiteIds and zooms to assigned territory. Site users see their assigned sites and ground assets/staff spread around markers instead of whole-fleet default.',
    {
      priority: 'P0',
      date_range: '2026-06-14',
      acceptance: [
        'Map page labels My Territory for site users',
        'Assigned-site map starts zoomed in',
        'Assets and staff in territory are visible and clickable via info windows',
      ],
    },
  ),
  task(
    'ERP-SHIP-005',
    'Phase 1 - Org-Syncable MVP Ship Gate',
    'Ship Gate',
    'CFO reports MVP pack - owner decision screen',
    'done',
    ['ERP-MVP-000'],
    ['codex'],
    'Reports Center added for Management KPIs: cash collected, outstanding/overdue AR, AR aging, advances/retention, site/asset P&L proxy, utilization, procurement spend/savings, supplier exposure, billing leakage, inventory exceptions, and exception watchlist.',
    {
      priority: 'P0',
      date_range: '2026-06-14',
      acceptance: [
        'CFO/Director/GM can access reports',
        'Reports identify CFO-grade data gaps separately from computed MVP KPIs',
        'CSV/export actions remain visible where implemented',
      ],
    },
  ),
  task(
    'ERP-SHIP-006',
    'Phase 1 - Org-Syncable MVP Ship Gate',
    'Ship Gate',
    'Production deploy readiness - env, build, rules, hosting, handover',
    'blocked',
    ['ERP-SHIP-002', 'ERP-SHIP-005'],
    ['codex', 'cipher'],
    'Final ship gate: run prod build, env checker, Firebase rules validation/deploy plan, hosting config, and handover. Blocked until Ali authorizes irreversible publish/deploy actions.',
    {
      priority: 'P0',
      acceptance: [
        'npm run build passes',
        'npm run check:prod passes with real env',
        'Firestore/storage rules reviewed and ready to deploy',
        'Handover document lists exact deploy steps and rollback plan',
      ],
    },
  ),
  task(
    'ERP-SHIP-007',
    'Phase 1 - Org-Syncable MVP Ship Gate',
    'Ship Gate',
    'MVP QA walkthrough - roles, territory, reports, workflows',
    'todo',
    ['ERP-SHIP-002', 'ERP-SHIP-003', 'ERP-SHIP-004', 'ERP-SHIP-005'],
    ['elder', 'claude'],
    'Run hands-on QA as Super Admin, Director/CFO, GM, Supervisor/site user, Procurement, Inventory, Finance, Operator, and Mechanic. Verify role desk, map scope, reports visibility, key workflow actions, and blocked unauthorized access.',
    {
      priority: 'P0',
      acceptance: [
        'QA matrix completed by role',
        'Every failed action has bug task or ship waiver',
        'No clickable UI dead-ends remain in MVP paths',
      ],
    },
  ),

  task(
    'ERP-SEC-001',
    'Phase 2 - Security and Governance',
    'Security Hardening',
    'Server-side RBAC matrix - module/function/read/write/admin',
    'todo',
    ['ERP-SHIP-002'],
    ['codex'],
    'Introduce a formal access matrix compatible with Firestore rules and app UI: module access, function path access, CRUD level, workflow authority, territory scope, and finance-sensitive flags. Treat client permissions as UX only, not security.',
    {
      priority: 'P0',
      acceptance: [
        'Access matrix generated from registry or deploy-safe config',
        'Rules and UI consume the same permission language where possible',
        'Security tests cover pending, site user, finance, GM, SA',
      ],
    },
  ),
  task(
    'ERP-SEC-002',
    'Phase 2 - Security and Governance',
    'Security Hardening',
    'Record-level territory rules for assets, staff, sites, tickets, stores',
    'todo',
    ['ERP-SEC-001'],
    ['codex'],
    'Harden Firestore rules so site-scoped users cannot read/write records outside assigned site territory. Cover assets currentSiteId, staff siteId/assignedAsset site, tickets siteId, stores siteId, stock balances storeId, and documents entity/site metadata where available.',
    {
      priority: 'P0',
      acceptance: [
        'Out-of-territory reads fail in emulator/rules tests',
        'All-site roles still work',
        'Documents without site metadata are classified or quarantined',
      ],
    },
  ),
  task(
    'ERP-SEC-003',
    'Phase 2 - Security and Governance',
    'Security Hardening',
    'Workflow validation server-side - Cloud Functions authority gate',
    'todo',
    ['ERP-SEC-001'],
    ['codex', 'claude'],
    'Move critical transition validation and side-effects to server/Cloud Functions: allowed workflow actor, required fields, notes, current state, SoD checks, timeline append, notifications, and linked entity side-effects.',
    {
      priority: 'P0',
      acceptance: [
        'Client cannot force illegal status transition',
        'Timeline is append-only from trusted executor',
        'Side-effects cannot be skipped by client patch',
      ],
    },
  ),
  task(
    'ERP-SEC-004',
    'Phase 2 - Security and Governance',
    'Security Hardening',
    'Segregation of duties and approval limits',
    'todo',
    ['ERP-SEC-003'],
    ['codex', 'elder'],
    'Add SoD rules and monetary limits: requester cannot approve own PR/PO/payment without override; approval authority by role and amount; admin override requires reason and audit event.',
    {
      priority: 'P0',
      acceptance: [
        'Self-approval blocked by default',
        'Amount limits are configurable',
        'Override produces immutable log with reason',
      ],
    },
  ),
  task(
    'ERP-SEC-005',
    'Phase 2 - Security and Governance',
    'Security Hardening',
    'Audit log v2 - immutable governance ledger',
    'todo',
    ['ERP-SEC-003', 'ERP-SEC-004'],
    ['claude'],
    'Normalize audit events for role edits, user assignment, workflow transitions, finance postings, document upload/delete, inventory adjustments, period close/open, and admin overrides. Add filters and export.',
    {
      priority: 'P1',
      acceptance: [
        'Audit events include actor, real actor, acted role, entity, before/after, reason, timestamp',
        'Events are append-only',
        'SA/CFO can export audit trail',
      ],
    },
  ),

  task(
    'ERP-FIN-001',
    'Phase 3 - Finance Foundation',
    'Ledger MVP',
    'Chart of accounts and accounting dimensions',
    'todo',
    ['ERP-SHIP-005'],
    ['codex', 'claude'],
    'Create CFO-grade accounting foundation: chart of accounts, account types, SBU/site/asset/customer/supplier dimensions, currencies, tax codes, and posting status. Keep simple enough for Antrac but aligned to real accounting.',
    {
      priority: 'P0',
      acceptance: [
        'Accounts and dimensions are managed records',
        'Every financial document can carry cost/profit dimensions',
        'Reports can group by SBU, site, asset, asset class, customer, supplier',
      ],
    },
  ),
  task(
    'ERP-FIN-002',
    'Phase 3 - Finance Foundation',
    'Ledger MVP',
    'Journal entries and immutable postings',
    'todo',
    ['ERP-FIN-001'],
    ['codex'],
    'Implement journal entry model with debit/credit lines, balanced posting validation, draft/posted/void status, period, source document link, and immutable posted entries.',
    {
      priority: 'P0',
      acceptance: [
        'Journal must balance before posting',
        'Posted entries cannot be edited; corrections use reversing entries',
        'Every invoice/payment/bill can link to journal entries',
      ],
    },
  ),
  task(
    'ERP-FIN-003',
    'Phase 3 - Finance Foundation',
    'Ledger MVP',
    'AR/AP ledgers - invoices, vendor bills, payments, allocations',
    'todo',
    ['ERP-FIN-002'],
    ['claude'],
    'Turn customer invoices, vendor bills, receipts, and payments into financial documents with posting, allocation, ageing, status, due dates, advances, retention, credit notes, and payable stages.',
    {
      priority: 'P0',
      acceptance: [
        'AR aging comes from posted invoices and allocations',
        'AP aging comes from vendor bills and payments',
        'Advance/retention balances reconcile to documents',
      ],
    },
  ),
  task(
    'ERP-FIN-004',
    'Phase 3 - Finance Foundation',
    'Ledger MVP',
    'Bank and cash register with reconciliation workflow',
    'todo',
    ['ERP-FIN-003'],
    ['claude'],
    'Add cash/bank accounts, deposits, withdrawals, bank statement import placeholder, manual reconciliation, unreconciled items, and cash position report.',
    {
      priority: 'P1',
      acceptance: [
        'Cash position reconciles to payments and bank/cash movements',
        'Unreconciled transactions are visible to CFO',
        'Bank reconciliation status feeds exception watchlist',
      ],
    },
  ),
  task(
    'ERP-FIN-005',
    'Phase 3 - Finance Foundation',
    'Ledger MVP',
    'Period close controls',
    'todo',
    ['ERP-FIN-002'],
    ['codex'],
    'Add accounting periods with open/locked/closed states. Prevent financial document edits/postings into closed periods without controlled reopening and audit.',
    {
      priority: 'P1',
      acceptance: [
        'Closed period rejects new posting',
        'Reopen requires SA/CFO and reason',
        'Reports can filter by accounting period',
      ],
    },
  ),

  task(
    'ERP-AST-001',
    'Phase 4 - Asset Financial Core',
    'Asset Truth',
    'Asset financial master - cost, book value, depreciation, permits',
    'todo',
    ['ERP-FIN-001'],
    ['codex'],
    'Extend asset register with acquisition cost/date, depreciation method, residual value, book value, insurance, permits, registration, ownership status, rental eligibility, disposal status, and expiry alerts.',
    {
      priority: 'P0',
      acceptance: [
        'Every revenue asset can carry financial master data',
        'Missing financial master data appears as report exception',
        'Permit/insurance expiry alerts visible',
      ],
    },
  ),
  task(
    'ERP-AST-002',
    'Phase 4 - Asset Financial Core',
    'Asset Truth',
    'Asset P&L - revenue, repair, fuel, crew, depreciation',
    'todo',
    ['ERP-AST-001', 'ERP-FIN-003'],
    ['claude'],
    'Compute asset-level margin from posted revenue and allocated costs. Include repair spend, fuel, crew/labor, depreciation, consumables, downtime cost, and unallocated cost warnings.',
    {
      priority: 'P0',
      acceptance: [
        'Owner can rank assets by net contribution',
        'Asset P&L distinguishes posted facts from estimates',
        'Unallocated costs are visible, not hidden',
      ],
    },
  ),
  task(
    'ERP-AST-003',
    'Phase 4 - Asset Financial Core',
    'Asset Truth',
    'Asset lifecycle states and disposal workflow',
    'todo',
    ['ERP-AST-001'],
    ['codex'],
    'Add lifecycle states: acquired, active, deployed, idle, maintenance, down, disposed. Disposal workflow posts financial impact and removes asset from availability.',
    {
      priority: 'P1',
      acceptance: [
        'Disposed assets no longer appear as available',
        'Disposal requires approval and audit',
        'Lifecycle history remains visible',
      ],
    },
  ),

  task(
    'ERP-MNT-001',
    'Phase 5 - Maintenance and Reliability',
    'Maintenance',
    'Preventive maintenance schedules and service calendar',
    'todo',
    ['ERP-AST-001'],
    ['codex'],
    'Convert reactive tickets into maintenance management: service intervals by asset class, calendar, due/overdue service, meter/hour reading support, and planned maintenance work orders.',
    {
      priority: 'P0',
      acceptance: [
        'Assets can have PM plans',
        'Overdue service appears on dashboard/reports',
        'Maintenance calendar filters by site/asset/mechanic',
      ],
    },
  ),
  task(
    'ERP-MNT-002',
    'Phase 5 - Maintenance and Reliability',
    'Maintenance',
    'Failure codes, root cause, MTBF, MTTR',
    'todo',
    ['ERP-MNT-001'],
    ['claude'],
    'Add structured failure capture and reliability analytics: failure category, root cause, downtime start/end, repair start/end, mechanic assignment, MTBF, MTTR, downtime by asset/site/reason.',
    {
      priority: 'P0',
      acceptance: [
        'Fleet Uptime report uses real downtime fields',
        'MTBF/MTTR computed by asset',
        'Repeated failure assets flagged',
      ],
    },
  ),
  task(
    'ERP-MNT-003',
    'Phase 5 - Maintenance and Reliability',
    'Maintenance',
    'Spare parts and mechanic labor consumption',
    'todo',
    ['ERP-MNT-002', 'ERP-INV-001'],
    ['codex', 'claude'],
    'Tie maintenance work orders to stock consumption and mechanic labor. Consume spare parts from stores, allocate mechanic hours, and push cost to asset P&L.',
    {
      priority: 'P1',
      acceptance: [
        'Parts consumed create stock movements',
        'Labor hours roll into asset cost',
        'Maintenance cost report reconciles to inventory/ledger',
      ],
    },
  ),

  task(
    'ERP-INV-001',
    'Phase 6 - Procurement and Inventory Control',
    'Inventory Control',
    'Inventory valuation and item costing',
    'todo',
    ['ERP-FIN-001'],
    ['codex'],
    'Upgrade inventory from quantities to valuation: standard/average cost, stock value, cost history, valuation accounts, zero-cost exceptions, landed cost placeholder, and valuation report.',
    {
      priority: 'P0',
      acceptance: [
        'Stock valuation report is CFO-readable',
        'Zero-cost stock is flagged',
        'Stock movements carry cost impact',
      ],
    },
  ),
  task(
    'ERP-INV-002',
    'Phase 6 - Procurement and Inventory Control',
    'Inventory Control',
    'Reorder rules, cycle counts, stock adjustments',
    'todo',
    ['ERP-INV-001'],
    ['claude'],
    'Add reorder min/max, low-stock alerts, cycle count schedules, adjustment approvals, scrap/write-off workflow, and stock discrepancy audit.',
    {
      priority: 'P1',
      acceptance: [
        'Low stock appears before stores are empty',
        'Adjustments require approval and reason',
        'Cycle count variance is reported',
      ],
    },
  ),
  task(
    'ERP-P2P-001',
    'Phase 6 - Procurement and Inventory Control',
    'Procure to Pay',
    'RFQ comparison and supplier performance',
    'todo',
    ['ERP-SHIP-005'],
    ['claude'],
    'Strengthen procurement controls: RFQ comparison table, quote savings, single-quote exception, supplier lead time, supplier quality, urgent/direct spend reporting, and preferred supplier history.',
    {
      priority: 'P1',
      acceptance: [
        'GM can compare quotes cleanly',
        'Single-quote PRs appear as exception',
        'Supplier exposure report includes lead-time/performance indicators',
      ],
    },
  ),
  task(
    'ERP-P2P-002',
    'Phase 6 - Procurement and Inventory Control',
    'Procure to Pay',
    '3-way match - PO, goods receipt, vendor bill',
    'todo',
    ['ERP-P2P-001', 'ERP-FIN-003', 'ERP-INV-001'],
    ['codex'],
    'Implement audit-grade procure-to-pay closure: PO approval, goods receipt, vendor bill, quantity/price variance, payment approval, inventory/expense posting, and exception handling.',
    {
      priority: 'P0',
      acceptance: [
        'Vendor bill cannot be paid without matching policy',
        'Price/quantity variance is visible',
        'Received inventory updates stock and valuation',
      ],
    },
  ),

  task(
    'ERP-O2C-001',
    'Phase 7 - Commercial and Rental Operations',
    'Order to Cash',
    'Rental rate cards and contract terms',
    'todo',
    ['ERP-AST-001', 'ERP-FIN-003'],
    ['codex'],
    'Add customer/asset/site rate cards, mobilization/demobilization terms, minimum rental period, deposits/advances, retention, GST/tax, currency, and approval for discount/override.',
    {
      priority: 'P0',
      acceptance: [
        'Quotation pulls controlled rate terms',
        'Discounts/overrides are logged',
        'Advance/retention terms flow to invoice/payment reports',
      ],
    },
  ),
  task(
    'ERP-O2C-002',
    'Phase 7 - Commercial and Rental Operations',
    'Order to Cash',
    'Asset reservation calendar and conflict detection',
    'todo',
    ['ERP-O2C-001'],
    ['claude'],
    'Prevent double-booking by adding reservation calendar across enquiries, quotations, work orders, deployments, maintenance, and downtime. Show availability conflicts before quote/work order confirmation.',
    {
      priority: 'P0',
      acceptance: [
        'Asset cannot be deployed to overlapping confirmed jobs without override',
        'Sales can see available assets by date/site/class',
        'Maintenance reservations block commercial availability',
      ],
    },
  ),
  task(
    'ERP-O2C-003',
    'Phase 7 - Commercial and Rental Operations',
    'Order to Cash',
    'Unbilled work and revenue leakage controls',
    'todo',
    ['ERP-O2C-001', 'ERP-FIN-003'],
    ['codex'],
    'Detect active/completed work orders that are not invoiced, invoiced but unpaid, deployed past end date, missing customer PO/reference, and contracts expiring soon.',
    {
      priority: 'P0',
      acceptance: [
        'Unbilled work appears in CFO exception watchlist',
        'Expired deployments are flagged',
        'Work order status ties to invoice/payment state',
      ],
    },
  ),

  task(
    'ERP-RPT-001',
    'Phase 8 - CFO and Owner Reporting Pack',
    'Reports',
    'P&L by SBU, site, asset, asset class',
    'todo',
    ['ERP-FIN-003', 'ERP-AST-002'],
    ['codex', 'claude'],
    'Build final-form P&L reports from ledger and cost dimensions, not only live operational estimates. Include WLI/MPL/EMS, sites, asset classes, individual assets, revenue, direct cost, allocated cost, depreciation, net margin.',
    {
      priority: 'P0',
      acceptance: [
        'P&L ties to posted financial documents',
        'Drill-down from KPI to source records',
        'Unallocated cost shown separately',
      ],
    },
  ),
  task(
    'ERP-RPT-002',
    'Phase 8 - CFO and Owner Reporting Pack',
    'Reports',
    'Cash flow, AR/AP ageing, budget vs actual',
    'todo',
    ['ERP-FIN-004', 'ERP-FIN-005'],
    ['claude'],
    'Create CFO cash pack: cash position, cash forecast, AR aging, AP aging, overdue risk, upcoming payables, budget vs actual by SBU/site/asset category, and variance explanations.',
    {
      priority: 'P0',
      acceptance: [
        'Cash forecast uses due dates and expected collections/payments',
        'Budget variance can be filtered by period/cost center',
        'AR/AP aging reconciles to ledgers',
      ],
    },
  ),
  task(
    'ERP-RPT-003',
    'Phase 8 - CFO and Owner Reporting Pack',
    'Reports',
    'Fleet utilization, downtime, reliability, maintenance cost',
    'todo',
    ['ERP-MNT-002', 'ERP-AST-002'],
    ['codex'],
    'Turn Fleet Uptime into executive operations pack: utilization, idle assets, down assets, maintenance backlog, downtime trend, MTBF, MTTR, repair cost, repeated failures, site/asset class drill-down.',
    {
      priority: 'P0',
      acceptance: [
        'Fleet report can answer which assets are earning, idle, or failing',
        'Downtime is measured in time windows, not only status',
        'CSV export and drill-down exist',
      ],
    },
  ),
  task(
    'ERP-RPT-004',
    'Phase 8 - CFO and Owner Reporting Pack',
    'Reports',
    'Exception cockpit - owner daily control room',
    'todo',
    ['ERP-RPT-001', 'ERP-RPT-002', 'ERP-RPT-003'],
    ['elder', 'codex'],
    'Build the owner cockpit around exceptions: overdue AR, urgent payables, blocked approvals, unbilled work, idle high-value assets, down revenue assets, low stock, expired permits/insurance, unreconciled bank items, missing cost allocations.',
    {
      priority: 'P0',
      acceptance: [
        'Owner sees the top risks in one screen',
        'Every exception links to source record',
        'Exceptions can be assigned/cleared with audit',
      ],
    },
  ),

  task(
    'ERP-UX-001',
    'Phase 9 - UX Industrialization',
    'UX',
    'Exception-first home pages by role',
    'todo',
    ['ERP-RPT-004', 'ERP-SHIP-003'],
    ['elder'],
    'Refine landing pages so users do not browse modules. Each role sees pending actions, overdue items, territory, alerts, assigned records, and recent activity. Keep operational UI dense and work-focused.',
    {
      priority: 'P1',
      acceptance: [
        'Every role has a meaningful first screen',
        'No visible action dead-ends',
        'Mobile field users can complete common tasks quickly',
      ],
    },
  ),
  task(
    'ERP-UX-002',
    'Phase 9 - UX Industrialization',
    'UX',
    'Global search, saved filters, drill-down patterns',
    'todo',
    ['ERP-UX-001'],
    ['claude'],
    'Add cross-module search and reusable filtering for assets, staff, customers, tickets, PRs, POs, invoices, work orders, suppliers. Standardize KPI drill-down patterns.',
    {
      priority: 'P2',
      acceptance: [
        'Users can find a record without knowing the module',
        'Report drill-down uses same source-record pattern',
        'Saved filters survive reload',
      ],
    },
  ),
  task(
    'ERP-UX-003',
    'Phase 9 - UX Industrialization',
    'UX',
    'Mobile field workflow polish',
    'todo',
    ['ERP-UX-001'],
    ['codex', 'elder'],
    'Optimize mobile flows for operators, mechanics, supervisors, inventory: ticket creation, diagnosis, dispatch, receipt, map, asset lookup, photo/document upload, offline-tolerant drafts if needed.',
    {
      priority: 'P1',
      acceptance: [
        'Field workflows fit mobile viewport',
        'Forms preserve drafts on accidental navigation',
        'Upload/proof chain works from phone',
      ],
    },
  ),

  task(
    'ERP-SNP-001',
    'Phase 10 - Snapshot Registry and Document Control',
    'Snapshot Registry',
    'Universal registry serials for every operational document',
    'todo',
    ['ERP-SHIP-001', 'ERP-SEC-005'],
    ['codex'],
    'Create one governed serial-number system for every record created by the app: tickets, PRs, POs, RFQs, work orders, invoices, payments, assets, staff, suppliers, stores, stock transfers, fuel requests, deployments, documents, notes, and knowledge/event captures. Each registry entry needs prefix, sequence, fiscal period/site/SBU dimensions, status, owner, createdBy, createdAt, and immutable audit trail.',
    {
      priority: 'P0',
      acceptance: [
        'Every new business object receives a human-readable serial number',
        'Serials are unique, monotonic per registry policy, and never reused',
        'Serial format supports SBU/site/year prefixes where needed',
        'Registry can search any serial and open its source record',
      ],
    },
  ),
  task(
    'ERP-SNP-002',
    'Phase 10 - Snapshot Registry and Document Control',
    'Snapshot Registry',
    'Mandatory field schemas and workflow completion gates',
    'todo',
    ['ERP-SNP-001', 'ERP-SEC-003'],
    ['codex', 'claude'],
    'Define mandatory field schemas by entity and workflow state. A record cannot move to the next gate unless required fields, attachments, approvals, comments, cost/asset/site/customer links, and proof metadata are complete. Each incomplete record must show missing-field checklist and block reason.',
    {
      priority: 'P0',
      acceptance: [
        'Ticket/PR/PO/work order gates have explicit required fields',
        'UI shows missing mandatory fields before transition',
        'Server-side workflow executor rejects incomplete transitions',
        'Gate checklist is printable/auditable with the record',
      ],
    },
  ),
  task(
    'ERP-SNP-003',
    'Phase 10 - Snapshot Registry and Document Control',
    'Snapshot Registry',
    'Print-ready templates for tickets, PRs, POs, work orders, invoices',
    'todo',
    ['ERP-SNP-001', 'ERP-SNP-002'],
    ['elder', 'codex'],
    'Create print/PDF-ready document layouts for all primary records. Each document should include logo/header, serial, dates, parties, site/SBU, asset/staff/customer/supplier links, line items, approvals, notes, attachments index, QR/deep link, current status, and full workflow history summary.',
    {
      priority: 'P0',
      acceptance: [
        'Ticket print view is clean enough for field/legal/audit use',
        'PR and PO print views include approval chain and quote basis',
        'Invoice/work order print views include commercial terms',
        'Print output works from browser without layout breakage',
      ],
    },
  ),
  task(
    'ERP-SNP-004',
    'Phase 10 - Snapshot Registry and Document Control',
    'Snapshot Registry',
    'Event snapshots and version history for every workflow object',
    'todo',
    ['ERP-SNP-002'],
    ['claude'],
    'Every important event must capture a point-in-time snapshot: before/after state, actor, acted role, entity fields, linked records, required-field status, comments, attachments, and workflow gate result. Users should be able to enter any event and see progress at that moment.',
    {
      priority: 'P0',
      acceptance: [
        'Each workflow transition stores a compact immutable snapshot',
        'Snapshot viewer can replay progress by event',
        'Before/after deltas are visible for key fields',
        'Snapshots link to printable record state',
      ],
    },
  ),
  task(
    'ERP-SNP-005',
    'Phase 10 - Snapshot Registry and Document Control',
    'Snapshot Registry',
    'Knowledge capture registry - notes become governed records',
    'todo',
    ['ERP-SNP-001', 'ERP-SNP-004'],
    ['codex', 'elder'],
    'Treat user-created knowledge, notes, correction comments, site observations, asset facts, supplier facts, and customer notes as first-class registry records. Each gets serial, category, linked entity, author, status, review state, snapshot, and promotion path into master data or workflow correction.',
    {
      priority: 'P0',
      acceptance: [
        'Every note/comment can be linked to an asset/site/ticket/PR/PO/customer/supplier',
        'Knowledge records have serial numbers and review status',
        'Approved knowledge can update master data with audit trail',
        'Rejected/superseded knowledge remains searchable',
      ],
    },
  ),
  task(
    'ERP-SNP-006',
    'Phase 10 - Snapshot Registry and Document Control',
    'Snapshot Registry',
    'Progress snapshot console - StarqOS-style operational memory',
    'todo',
    ['ERP-SNP-004', 'ERP-SNP-005'],
    ['codex'],
    'Build an operational memory console inspired by StarqOS but scaled to Antrac ERP: event stream, record snapshots, gate progress, who changed what, what is missing, what was approved, and what knowledge changed the registry. This becomes the audit cockpit for live data collection.',
    {
      priority: 'P1',
      acceptance: [
        'User can search by serial, person, site, asset, workflow, or date',
        'Each event opens a snapshot of record progress',
        'Incomplete gates and pending comments are visible',
        'Console supports export for audit/handover',
      ],
    },
  ),
];

const epics = [
  { id: 'ERP-E00', phase: 'Phase 0 - Current MVP Baseline', title: 'Current Antrac ERP MVP - label and preserve baseline', window: 'Complete', status: 'done' },
  { id: 'ERP-E01', phase: 'Phase 1 - Org-Syncable MVP Ship Gate', title: 'Ship current ERP as org-syncable MVP', window: 'Now', status: 'next' },
  { id: 'ERP-E02', phase: 'Phase 2 - Security and Governance', title: 'Industry-grade RBAC, territory, workflow governance', window: 'Post-MVP', status: 'planned' },
  { id: 'ERP-E03', phase: 'Phase 3 - Finance Foundation', title: 'Ledger, AR/AP, bank/cash, close controls', window: 'Final Form Core', status: 'planned' },
  { id: 'ERP-E04', phase: 'Phase 4 - Asset Financial Core', title: 'Asset as financial and operational truth', window: 'Final Form Core', status: 'planned' },
  { id: 'ERP-E05', phase: 'Phase 5 - Maintenance and Reliability', title: 'Preventive maintenance, reliability, downtime', window: 'Final Form Operations', status: 'planned' },
  { id: 'ERP-E06', phase: 'Phase 6 - Procurement and Inventory Control', title: 'Valuation, 3-way match, stock governance', window: 'Final Form Controls', status: 'planned' },
  { id: 'ERP-E07', phase: 'Phase 7 - Commercial and Rental Operations', title: 'Rental order-to-cash and reservation controls', window: 'Final Form Revenue', status: 'planned' },
  { id: 'ERP-E08', phase: 'Phase 8 - CFO and Owner Reporting Pack', title: 'Owner cockpit and CFO-grade reports', window: 'Final Form Intelligence', status: 'planned' },
  { id: 'ERP-E09', phase: 'Phase 9 - UX Industrialization', title: 'Exception-first role UX and field mobility', window: 'Continuous', status: 'planned' },
  { id: 'ERP-E10', phase: 'Phase 10 - Snapshot Registry and Document Control', title: 'Serial-numbered document registry, gates, print views, event snapshots, and governed knowledge capture', window: 'Final Form Governance', status: 'planned' },
];

const counts = {
  tasks: tasks.length,
  epics: epics.length,
  sprints: new Set(tasks.map((t) => t.sprint)).size,
  phases_in_window: new Set(tasks.map((t) => t.phase)).size,
};

const board = {
  _note: 'Antrac ERP board republished 2026-06-14. Current Antrac ERP is labeled MVP. Final Form is the SAP/Odoo-inspired ERP target scaled to Antrac assets, sites, SBUs, roles, finance, maintenance, procurement, inventory, commercial rental operations, and CFO reporting. Engineering board only; operational org-sync data remains in Antrac OrgSync.',
  project,
  generated_at: generatedAt,
  execution_window_days: 180,
  product_horizon: {
    current_label: 'Antrac ERP MVP',
    target_label: 'Antrac ERP Final Form',
    mvp_priority: 'Ship org-syncable MVP first: secure users, roles, territory, reports, map, production gate.',
    final_form_priority: 'Grow into ERP-grade finance, asset accounting, maintenance, procurement, inventory valuation, rental operations, and CFO reporting.',
  },
  totals: counts,
  workers,
  tasks,
  epics,
  bugs: [],
  improvements: [
    {
      id: 'ERP-IMP-001',
      title: 'Do not build more dashboards on weak data',
      status: 'active',
      description: 'Upgrade source-of-truth records first: org, roles, territory, assets, finance documents, ledger, inventory valuation, and maintenance facts. Reports should become stronger as facts harden.',
    },
    {
      id: 'ERP-IMP-002',
      title: 'Client permissions are UX only',
      status: 'active',
      description: 'Industry ERP posture requires server-side rules/functions to enforce access, transitions, SoD, and audit.',
    },
    {
      id: 'ERP-IMP-003',
      title: 'Every business fact must become a governed snapshot',
      status: 'active',
      description: 'Tickets, PRs, POs, work orders, invoices, notes, and knowledge comments need serials, mandatory fields, workflow gates, print-ready views, and event snapshots so the app becomes operational memory, not just forms.',
    },
  ],
};

writeFileSync(boardPath, `${JSON.stringify(board, null, 2)}\n`, 'utf8');

const markdown = `# Antrac ERP Board Publish - MVP to Final Form

Generated: ${generatedAt}

## Labels
- Current build: **Antrac ERP MVP**
- Target build: **Antrac ERP Final Form**

## Ship Priority
Ship the org-syncable MVP first. The MVP must prove users, roles, sites, assets, staff, territory, reports, map, and deploy readiness before final-form finance/asset/accounting depth is attempted.

## Board Location
- JSON source: \`data/antrac-erp-tasks.json\`
- Generated TS: \`src/data/antracErpTasks.generated.ts\`

## Phase Summary
${epics.map((e) => `- ${e.id}: ${e.title} (${e.status})`).join('\n')}

## Start Here
1. Pick up \`ERP-MVP-002\` to finish the risk register.
2. Then complete \`ERP-SHIP-001\` and \`ERP-SHIP-002\`.
3. Treat \`ERP-SHIP-006\` as blocked until Ali authorizes production deploy actions.
4. Do not start finance final-form tasks until MVP ship gate is green.

## Current Counts
- Tasks: ${counts.tasks}
- Epics: ${counts.epics}
- Phases: ${counts.phases_in_window}
`;

writeFileSync(evidencePath, markdown, 'utf8');

console.log(`Wrote ${boardPath}`);
console.log(`Wrote ${evidencePath}`);
console.log(`${tasks.length} tasks, ${epics.length} epics`);
