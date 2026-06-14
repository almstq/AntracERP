# Reports & KPI Audit

Date: 2026-06-14  
Scope: Antrac ERP reports section, reviewed from Business Owner, CFO, GM, Finance, Operations, Procurement, Inventory, Sales, HR, and Site Manager viewpoints.

## Executive Finding

The app exists to measure and manage KPIs. Right now the Reports section does not yet do that fully.

Current live report pages:

- `Revenue vs Repair`
- `Fleet Uptime`

These are useful operational views, but they are not enough for a business owner or CFO to run WLI/Antrac. The mandatory management pack must show cash, receivables, profitability, utilisation, downtime, approval bottlenecks, procurement leakage, inventory value, customer pipeline, workforce productivity, and exception/risk items.

The good news: most required source data is already modeled in the app. The missing work is mainly report design, rollups, period filters, and a few accounting fields.

## Audit Standard

A report is mandatory when it answers at least one of these management questions:

1. Are we making money?
2. Where is cash stuck?
3. Which machines, sites, customers, or suppliers are helping or hurting?
4. What is blocking work from closing?
5. Which manager must act today?
6. What trend is improving or deteriorating?
7. Can the CFO/owner trust the number and trace it to source documents?

## Existing Reports Assessment

### Revenue vs Repair

Status: Useful but incomplete.

Strengths:

- Links deployment revenue to repair spend.
- Shows site and machine-level profitability.
- Flags repair spend with no recorded revenue.
- Uses live deployment and PO/ticket/PR data.

Gaps:

- Not a full P&L. It ignores payroll, fuel, mobilisation/demobilisation cost, subcontract cost, overhead, depreciation, financing, and inventory consumption.
- Mixed currencies are displayed but not FX-normalized.
- Revenue is based on deployment terms/earned estimate, not necessarily invoiced/collected revenue.
- No period filter, budget comparison, gross margin trend, customer margin, or site contribution statement.

### Fleet Uptime

Status: Strong operational starting point.

Strengths:

- Tracks availability, down/maintenance count, resolved breakdowns, repair turnaround, crew gaps, and per-machine breakdown history.
- Gives managers a machine-level reliability list.

Gaps:

- Uptime is status-based, not hour-meter/time-series based.
- No utilisation percentage by billable days/hours vs available days/hours.
- No downtime cost or revenue-at-risk estimate per machine.
- No preventive maintenance compliance or repeat-fault analysis.

## Mandatory Report Pack

### 1. Owner Executive Scorecard

Audience: Business Owner, Director, GM, CFO  
Frequency: Daily snapshot, monthly close

Required KPIs:

- Revenue invoiced this month
- Cash collected this month
- Outstanding receivables
- Overdue receivables
- Net operating cash gap: collected revenue minus supplier payments
- Gross margin by site/project
- Fleet utilisation %
- Fleet availability %
- Open critical issues
- Purchases pending approval/payment
- Jobs completed but not invoiced
- Invoices sent but unpaid
- Top 5 profit machines
- Top 5 loss machines
- Top 5 overdue customers
- Top 5 blocked workflows

Data sources:

- `invoices`, `payments`, `workOrders`, `deployments`
- `purchaseOrders`, `purchaseRequests`, `tickets`
- `assets`, `sites`, `customers`

Why mandatory:

This is the cockpit. The owner should not open ten pages to know whether the company is healthy today.

### 2. CFO Cash & Receivables Report

Audience: CFO, Antrac Finance, WLI Finance, Owner  
Frequency: Daily

Required KPIs:

- Total invoices issued
- Total paid
- Total outstanding
- Current / 1-15 / 16-30 / 31-60 / 60+ ageing buckets
- Overdue amount by customer
- Collection rate: collected / invoiced
- Days Sales Outstanding
- Advance received
- Retention held
- Bad debt risk list
- Customer credit-limit breaches
- Invoices missing payment reference
- Payments recorded but not reconciled

Data sources:

- `invoices.total`, `invoices.amountPaid`, `invoices.balance`, `invoices.dueDate`, `invoices.status`
- `payments.amount`, `payments.receivedAt`, `payments.reference`
- `customers.creditTerms`, `customers.creditLimit`, `customers.outstandingBalance`

Gaps to add:

- Invoice issue date should be explicit if `createdAt` is not enough.
- Payment reconciliation status: `unreconciled | reconciled | disputed`
- Bank account / deposit reference
- FX rate when currency is USD

Why mandatory:

Profit is theory until cash is collected. This is CFO report number one.

### 3. Payables & Approval Liability Report

Audience: CFO, Antrac Finance, Director, WLI Finance, Procurement  
Frequency: Daily

Required KPIs:

- Supplier invoices pending payment
- POs in each approval stage
- Amount awaiting WLI Finance
- Amount awaiting Antrac Finance
- Amount awaiting CFO
- Amount awaiting Director
- Amount approved but not paid
- Paid but not collected from supplier
- Collected but not closed
- Average approval cycle time
- Oldest pending PO
- Rejected/returned payment requests
- Supplier exposure by supplier

Data sources:

- `purchaseOrders.status`, `purchaseOrders.total`, `purchaseOrders.currency`, `purchaseOrders.supplierName`
- PO timelines under `purchaseOrders/{id}/timeline`
- Documents attached to POs: tax invoice and payment receipt

Why mandatory:

The payment chain is one of the core reasons for the app. CFO must see money stuck by stage and owner.

### 4. Management P&L by Site / Project

Audience: Owner, CFO, GM  
Frequency: Weekly and monthly

Required KPIs:

- Revenue by site/project
- Direct repair cost
- Fuel/water cost
- Inventory consumption cost
- Mobilisation/demobilisation cost
- Staff/crew allocation cost
- External service/subcontract cost
- Gross profit
- Gross margin %
- Cost per deployed day
- Revenue per deployed day
- Revenue leakage: deployed but not invoiced
- Cost leakage: cost recorded but no revenue/customer

Data sources:

- `deployments`, `workOrders`, `invoices`, `payments`
- `purchaseOrders`, `tickets`, `stockMovements`, `fuelRequests`
- `staff`, `assets`, `sites`

Gaps to add:

- Cost-center/project code on every PO, fuel request, stock movement, work order, and staff assignment.
- Payroll/crew cost capture or imported monthly allocation.
- Landed cost/freight/customs fields for inventory.
- FX normalization.

Why mandatory:

The owner needs to know which sites are worth continuing, renegotiating, or stopping.

### 5. Asset Profitability & Utilisation Report

Audience: Owner, GM, CFO, Operations  
Frequency: Weekly

Required KPIs:

- Revenue per asset
- Repair spend per asset
- Fuel/consumable cost per asset
- Net contribution per asset
- Utilisation %: billable days / available days
- Availability %: up days / calendar days
- Downtime days
- Downtime cost / revenue at risk
- Repeat breakdown count
- MTBF: mean time between failures
- MTTR: mean time to repair
- Maintenance cost as % of asset revenue
- Machines earning below threshold
- Machines costing more than earning

Data sources:

- `assets`, `deployments`, `workOrders.assets`
- `tickets`, `purchaseRequests`, `purchaseOrders`
- `stockMovements`, `fuelRequests`

Gaps to add:

- Hour-meter readings.
- Downtime start/end timestamps, not only current status.
- Preventive maintenance schedule and completion record.

Why mandatory:

Fleet assets are capital. This report tells whether each machine deserves repair, replacement, redeployment, or disposal.

### 6. Procurement Spend & Savings Report

Audience: CFO, GM, Procurement, Owner  
Frequency: Weekly/monthly

Required KPIs:

- Total PR value
- Total PO value
- Spend by category
- Spend by supplier
- Spend by asset
- Spend by site
- Emergency/urgent spend %
- Direct PR vs ticket-linked PR spend
- Quote comparison savings: highest quote minus selected quote
- Single-quote purchases
- Repeat purchases
- Average RFQ cycle time
- Average quote-to-PO time
- Purchases without tax invoice
- Purchases without linked issue/work order/site

Data sources:

- `purchaseRequests.lineItems`, `purchaseRequests.quotes`
- `purchaseOrders.lineItems`, `purchaseOrders.total`
- `suppliers`, `tickets`, `assets`, `sites`

Gaps to add:

- Item category normalization.
- Reason code for single-source/direct purchase.
- Budget code/cost center.

Why mandatory:

Procurement is where margin leaks quietly.

### 7. Inventory Valuation & Stock Control Report

Audience: CFO, Inventory Manager, GM, Procurement  
Frequency: Weekly/monthly

Required KPIs:

- Inventory value on hand
- Stock value by store/site
- Slow-moving stock
- Dead stock
- Stockouts
- Negative/zero stock exceptions
- Receipts this period
- Issues/consumption this period
- Transfers in transit
- Adjustment/write-off value
- Items without average cost
- Items received but not matched to PO/tax invoice
- Inventory turnover

Data sources:

- `inventoryItems.avgCost`
- `stockBalances.qtyOnHand`
- `stockMovements`
- `stockTransfers`
- `stores`

Gaps to add:

- Minimum stock/reorder levels.
- Cycle count records.
- Stock adjustment reason and approver.
- Landed cost fields.

Why mandatory:

Inventory is cash sitting on shelves. CFO needs valuation; operations needs availability.

### 8. Workflow SLA & Bottleneck Report

Audience: Owner, GM, CFO, Department Heads  
Frequency: Daily/weekly

Required KPIs:

- Tickets by stage and age
- PRs by stage and age
- POs by stage and age
- Fuel requests by stage and age
- Enquiries/work orders by stage and age
- Average cycle time by workflow
- Stage breach count
- Oldest item per responsible role
- Rejections/returns by role
- Tasks waiting on GM/CFO/Director

Data sources:

- Entity status fields
- Timeline subcollections
- `notifications`

Gaps to add:

- SLA target table per workflow stage.
- Timeline event standardization with role, action, from/to status, and duration.

Why mandatory:

Managers do not just need totals; they need to know who must act today.

### 9. Sales Pipeline & Conversion Report

Audience: Owner, GM, Sales, CFO  
Frequency: Weekly

Required KPIs:

- New enquiries
- Active enquiries
- Quotation value sent
- Quotes accepted
- Quotes declined/expired
- Conversion rate: enquiry to quote, quote to work order
- Pipeline value by stage
- Expected mobilisation date
- Lost reason
- Customer segment/source
- Follow-up overdue
- Revenue forecast next 30/60/90 days

Data sources:

- `enquiries`, `quotations`, `workOrders`, `customers`

Gaps to add:

- Enquiry source.
- Lost reason.
- Probability/forecast close date.
- Sales owner.

Why mandatory:

This shows tomorrow's revenue before it becomes an invoice.

### 10. Work Order Execution & Billing Report

Audience: GM, Operations, Finance, Owner  
Frequency: Daily/weekly

Required KPIs:

- Active work orders
- Completed but not invoiced
- Invoiced but unpaid
- Average job duration
- Actual days/hours vs quoted
- Unbilled actuals
- Variation claims pending
- Retention pending release
- Customer sign-off missing
- Assets deployed beyond contract end date

Data sources:

- `workOrders`, `invoices`, `payments`, `deployments`

Gaps to add:

- Customer completion sign-off.
- Variation/change-order records.
- Actual utilisation logs by day/hour.

Why mandatory:

This closes the loop between operations and finance.

### 11. Fleet Maintenance & Reliability Report

Audience: GM, Site Managers, Mechanics, Owner  
Frequency: Weekly

Required KPIs:

- Open issues by urgency
- Critical machine-down issues
- Repeat faults
- Average diagnosis time
- Average repair time
- Parts wait time
- Payment wait time for repair parts
- Machines repaired this period
- Machines down over SLA
- Preventive maintenance compliance
- Mechanic workload

Data sources:

- `tickets`, `purchaseRequests`, `purchaseOrders`, `assets`, timeline events

Gaps to add:

- Preventive maintenance schedule.
- Fault category taxonomy.
- Downtime timestamp history.

Why mandatory:

Uptime drives rental revenue. This report explains why uptime is good or bad.

### 12. Fuel / Water Consumption & Cross-SBU Report

Audience: CFO, GM, MPL Manager, Director  
Frequency: Weekly/monthly

Required KPIs:

- Fuel requested
- Fuel approved
- Fuel collected
- Fuel consumed by asset/site
- Water requested/collected
- Rejections and reasons
- MPL approval cycle time
- Director approval cycle time
- WLI inventory balance after deductions
- Cost per litre/tonne/drum
- Consumption per operating day/hour

Data sources:

- `fuelRequests`, `inventoryBalances`, `stockMovements`, `assets`, `sites`

Gaps to add:

- Unit cost for fuel/water issues.
- Consumption reading by asset/hour.
- Supplier/source of MPL stock.

Why mandatory:

Fuel is a major operating cost and cross-SBU control point.

### 13. Customer Profitability & Credit Risk Report

Audience: Owner, CFO, GM, Sales  
Frequency: Monthly

Required KPIs:

- Revenue by customer
- Gross margin by customer
- Outstanding by customer
- Overdue by customer
- Average collection days
- Credit limit usage %
- Active work orders
- Disputes/void invoices
- Repeat business value
- Customer concentration risk

Data sources:

- `customers`, `workOrders`, `invoices`, `payments`, `purchaseOrders`, `deployments`

Gaps to add:

- Customer group/category.
- Dispute status.
- Customer credit hold flag.

Why mandatory:

Not every high-revenue customer is profitable or healthy.

### 14. Supplier Performance Report

Audience: Procurement, CFO, GM  
Frequency: Monthly

Required KPIs:

- Spend by supplier
- On-time delivery %
- Average lead time
- Quote win rate
- Price competitiveness
- Rejected/returned items
- Open payables by supplier
- Single-supplier dependency
- Supplier category coverage

Data sources:

- `suppliers`, `purchaseRequests.quotes`, `purchaseOrders`, PO/timeline events

Gaps to add:

- Promised delivery date.
- Actual delivery date.
- Quality/rejection reason.

Why mandatory:

Supplier performance affects downtime, cash, and procurement savings.

### 15. HR / Crew Productivity & Compliance Report

Audience: GM, HR, Site Managers, Owner  
Frequency: Weekly/monthly

Required KPIs:

- Staff assigned vs unassigned
- Crew gaps by site/asset
- Assets without operator/captain/crew
- Staff utilisation
- Work permit/visa/passport expiry
- Training/certification expiry
- Overtime or attendance exception, if captured
- Site manpower count

Data sources:

- `staff`, `assets`, `sites`, `deployments`

Gaps to add:

- Attendance/timekeeping.
- Certification records.
- Expiry fields normalized for alerts.

Why mandatory:

Machines do not earn without crews, and compliance failures create operational risk.

## Role-Based Report Menu

### Business Owner / Director

Must see:

- Executive Scorecard
- Management P&L by site/project
- Asset Profitability & Utilisation
- Cash & Receivables
- Payables & Approval Liability
- Workflow SLA & Bottlenecks
- Customer Profitability
- Fuel / Cross-SBU Report

### CFO

Must see:

- Cash & Receivables
- Payables & Approval Liability
- Management P&L
- Inventory Valuation
- Customer Credit Risk
- Procurement Spend & Savings
- Supplier Exposure
- Tax invoice/payment receipt exception report

### General Manager

Must see:

- Executive Scorecard
- Fleet Uptime
- Asset Profitability
- Workflow SLA
- Procurement Spend
- Work Order Execution
- Sales Pipeline
- Site Performance

### WLI Finance

Must see:

- Outstanding invoices
- Payments received
- Payment requests to HQ
- Supplier invoices pending
- Invoices missing payment/receipt
- Retention and advance report

### Antrac Finance / CFO / Director

Must see:

- Payment approval queue
- Amount pending by stage
- Oldest pending approvals
- Supplier exposure
- High-value PO review
- Returned/rejected payment requests

### Procurement Manager

Must see:

- PR/RFQ/PO cycle report
- Supplier spend/performance
- Quote comparison savings
- Urgent purchase rate
- Single-source purchases
- Pending tax invoice/receipt exceptions

### Inventory Manager

Must see:

- Stock valuation
- Low/zero stock
- Stock movement ledger
- Transfers in transit
- Receipts pending put-away
- Consumption by asset/site

### Operations / Site Manager

Must see:

- Site performance
- Open issues
- Down machines
- Crew gaps
- Repairs over SLA
- Fuel/water pending
- Work orders active at site

### Sales Manager

Must see:

- Sales pipeline
- Quote conversion
- Follow-up overdue
- Customer profitability
- Work orders awaiting mobilisation
- Revenue forecast

## Priority Build Roadmap

### Phase 1 — Mandatory CFO/Owner Pack

1. Executive Scorecard
2. Cash & Receivables
3. Payables & Approval Liability
4. Management P&L by Site/Project
5. Workflow SLA & Bottlenecks

Reason: these reports directly control cash, profit, approvals, and management action.

### Phase 2 — Operational Profitability Pack

1. Asset Profitability & Utilisation
2. Procurement Spend & Savings
3. Inventory Valuation & Stock Control
4. Work Order Execution & Billing
5. Fleet Maintenance & Reliability

Reason: these explain why profit/cash is moving.

### Phase 3 — Growth and Governance Pack

1. Sales Pipeline & Conversion
2. Customer Profitability & Credit Risk
3. Supplier Performance
4. Fuel / Cross-SBU Consumption
5. HR / Crew Productivity & Compliance

Reason: these support scaling, forecasting, and risk control.

## KPI Formula Examples

| KPI | Formula |
|---|---|
| Collection rate | `sum(payments.amount) / sum(invoices.total)` |
| Outstanding receivables | `sum(invoices.balance where status != fully_paid and status != void)` |
| Overdue receivables | `sum(invoice.balance where dueDate < today and balance > 0)` |
| DSO | `(average accounts receivable / monthly credit sales) * days in period` |
| Gross margin % | `(revenue - direct cost) / revenue` |
| Fleet utilisation % | `billable deployed days / available fleet days` |
| Fleet availability % | `(operational + idle assets) / active fleet` |
| MTTR | `average(resolvedAt - reportedAt)` |
| Approval cycle time | `stage exit timestamp - stage entry timestamp` |
| Quote savings | `highest valid quote - selected quote` |
| Inventory value | `sum(stockBalance.qtyOnHand * inventoryItem.avgCost)` |
| Stock turnover | `cost of consumed/issued inventory / average inventory value` |

## Data Model Gaps To Close

The current model can support a large part of the pack, but CFO-grade reporting needs these additions:

- `costCenterId` / `projectId` on POs, PRs, stock movements, fuel requests, invoices, payments, work orders, deployments.
- FX rate captured at transaction time for USD/MVR normalization.
- Payment reconciliation status and bank reference.
- Invoice issue date, not only created date.
- Supplier promised delivery date and actual delivery date.
- Customer credit hold/dispute fields.
- SLA targets per workflow stage.
- Downtime start/end events per asset.
- Hour-meter or daily utilisation logs.
- Preventive maintenance schedule/completion.
- Inventory reorder levels and cycle count records.
- Landed cost fields for freight/duty/handling.
- Payroll or crew-cost allocation method.

## Report UX Requirements

Every report should support:

- Date range filter: today, week, month, quarter, custom.
- SBU/site/customer/asset/supplier filters.
- Currency normalization toggle.
- Drill-down from KPI to source records.
- CSV export.
- PDF/monthly management pack export.
- Exception-first view: show what needs action first.
- Role-specific default landing report.
- Snapshot timestamp and data freshness indicator.

## Audit Verdict

Reports are currently underbuilt relative to the purpose of the app.

The Reports section should become the management control center, not a side menu. `Revenue vs Repair` and `Fleet Uptime` should remain, but they need to sit inside a broader KPI reporting suite led by:

1. Executive Scorecard
2. CFO Cash & Receivables
3. Payables & Approval Liability
4. Management P&L by Site/Project
5. Workflow SLA & Bottlenecks

Those five reports are the minimum viable owner/CFO pack. Without them, the app can operate workflows, but it cannot yet fully measure and manage the business.
