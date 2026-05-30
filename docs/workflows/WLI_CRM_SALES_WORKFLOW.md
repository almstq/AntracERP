# ANTRAC ERP — WLI CRM & SALES WORKFLOW
# Customer Register + Enquiry to Work Order Closure
# Full lifecycle with all actors defined

---

## ACTORS

| Actor | Role | Entity |
|---|---|---|
| Sales Staff | Receives enquiry, logs scope | WLI |
| Ops Staff | Checks availability, assigns assets | WLI |
| General Manager | Approves availability + signs off quotation | WLI |
| WLI Finance | Prepares quotation, raises invoice, tracks payment | WLI |
| Customer | Receives quote, confirms work order, pays | External |
| Antrac HQ Finance | Sees all invoices raised by WLI | Antrac |

---

## MODULE A — CUSTOMER REGISTER

Every customer is a record in the system before any sales activity begins.

**Customer record fields:**
- Customer ID (auto: CUST-###)
- Company name
- Contact person name
- Designation
- Phone / WhatsApp
- Email
- Address / island
- Customer type: Corporate / Government / Individual
- Credit terms: Cash / 30 days / 60 days / 90 days
- Credit limit (MVR)
- Status: Active / Inactive / Blacklisted
- Notes
- Lifetime revenue (auto-calculated from closed work orders)
- Active work orders count (live)
- Outstanding balance (live)

**Customer directory in Sales tab:**
- Searchable list of all customers
- Each customer card shows: name, active WOs, outstanding balance, last interaction
- Tap → full customer profile with complete history of enquiries, quotes, work orders, invoices, payments

---

## MODULE B — SALES WORKFLOW

### STAGE 1 — ENQUIRY RECEIVED & LOGGED
**Actor:** WLI Sales Staff
**Status:** `enquiry` → `logged`

**Enquiry form fields:**
- Enquiry ID (auto: ENQ-YYYYMM-###)
- Customer (select from customer register or add new)
- Date received
- Channel: Phone / Email / WhatsApp / Walk-in / Referral
- Linked call log ID (if logged in call log first)
- Scope of work (detailed text)
- Required asset types (multi-select from asset categories: Excavator / Dump Truck / LCT / Crane / etc.)
- Specific assets requested (optional — select from asset registry)
- Date required (start date)
- Approximate project duration (days / weeks / months)
- Project location / island / site
- Special requirements (notes)
- Urgency: Standard / Urgent

**Action:** Submit → lands in Ops Staff dashboard
**Notification:** Ops Staff notified

---

### STAGE 2 — OPS AVAILABILITY CHECK
**Actor:** WLI Ops Staff (Supervisor level)
**Status:** `logged` → `availability_checked`

**Ops Staff actions:**
- Reviews scope and required asset types
- Checks Thilafushi base (and other sites) for asset availability
- Checks each required asset: status, current deployment, expected return date

**Fills availability form:**
- Per requested asset type:
  - Available asset (select specific asset from registry)
  - Asset current status
  - Available from date
  - Available until date (if on existing deployment)
  - Deployment conflict? YES/NO
  - Alternative asset suggested (if primary not available)
- Overall availability: FULLY AVAILABLE / PARTIALLY AVAILABLE / NOT AVAILABLE
- Ops notes (any conditions, caveats)
- Mobilisation requirements (transport needed? which vessel/route?)

**Action:** Submit → lands in GM inbox
**Notification:** GM notified

---

### STAGE 3 — GM APPROVAL OF AVAILABILITY
**Actor:** General Manager
**Status:** `availability_checked` → `gm_approved` OR `declined`

**GM sees:**
- Customer name + enquiry scope
- Required assets vs available assets (side by side)
- Ops notes
- Proposed dates

**GM actions:**
- APPROVE — confirm assets and dates for quotation
- DECLINE — return with reason (e.g. assets committed elsewhere)
- MODIFY — adjust asset selection or dates before approving

**On approval:**
- Assigned assets are soft-reserved (flagged as pending deployment)
- Status → `gm_approved`
- Moves to WLI Finance to prepare quotation

**Notification:** WLI Finance notified

---

### STAGE 4 — QUOTATION PREPARATION
**Actor:** WLI Finance Staff
**Status:** `gm_approved` → `quotation_drafted`

**WLI Finance has full form details to prepare quotation:**
- Customer details (auto from customer register)
- Scope of work (from enquiry)
- Assigned assets (from ops approval)
- Dates and duration
- Rate sheet (pulled from WLI rate sheet: WL-RS-2026-001)

**Quotation auto-populated with:**
- Quotation number (auto: QT-YYYYMM-###)
- WLI letterhead
- Customer name + address
- Date
- Validity period (default 7 days)
- Scope of work description
- Asset(s) table: asset type, rate (MVR/hr or MVR/day), estimated hours/days, subtotal
- Mobilisation/demobilisation charges
- Fuel policy (included / separate)
- GST (8%)
- Total amount (MVR)
- Payment terms (from customer credit terms)
- Advance payment required: YES/NO
  - If YES: advance amount (MVR) + percentage
  - Balance payable on completion
- Bank details
- Authorised by (GM name + designation)
- Notes / special conditions

**Action:** Draft complete → moves to GM for sign-off
**Notification:** GM notified

---

### STAGE 5 — GM QUOTATION SIGN-OFF
**Actor:** General Manager
**Status:** `quotation_drafted` → `quotation_approved`

**GM reviews quotation:**
- All figures correct
- Scope matches what was agreed
- Payment terms appropriate for this customer

**GM actions:**
- APPROVE & SIGN — quotation locked, GM digital signature applied
- EDIT — send back to Finance with changes
- Mark advance payment required (toggle) — if not already set

**On approval:**
- Quotation PDF generated with GM signature + date
- Status → `quotation_approved`

**Notification:** WLI Finance notified to send to customer

---

### STAGE 6 — QUOTATION SENT TO CUSTOMER
**Actor:** WLI Finance Staff
**Status:** `quotation_approved` → `quotation_sent`

**WLI Finance:**
- Downloads quotation PDF
- Sends to customer manually (email / WhatsApp)
- Marks as sent in system with date/time

**If advance payment required:**
- WLI Finance dashboard shows: advance payment expected
- Tracks advance payment receipt separately
- Notifies Sales Staff to follow up

**Status → `quotation_sent`**
**Notification:** Sales Staff notified to follow up with customer

---

### STAGE 7 — CUSTOMER RESPONSE
**Two paths:**

**Path A — Customer ACCEPTS:**
**Actor:** WLI Sales Staff
- Sales Staff marks quote as accepted
- If advance required: confirm advance payment received before proceeding
- If no advance: proceed directly
- Status → `quote_accepted`
- Work Order created automatically (see Module C)
- Notification: GM + Ops + Finance notified

**Path B — Customer DECLINES / NO RESPONSE:**
**Actor:** WLI Sales Staff
- Mark as declined with reason
- OR mark as follow-up required with follow-up date
- Asset soft-reservation released
- Status → `declined` / `follow_up`
- Enquiry archived

---

## MODULE C — WORK ORDER

### STAGE 8 — WORK ORDER CREATED
**Auto-generated from accepted quotation**

**Work Order fields (auto-populated):**
- Work Order ID (auto: WO-YYYYMM-###)
- Linked Enquiry ID
- Linked Quotation ID
- Customer name
- Scope of work
- Assigned assets (confirmed)
- Assigned operators (from asset assignments)
- Start date
- Expected end date
- Site / island
- Contract value (MVR) — from quotation total
- Advance received (MVR) — if applicable
- Balance due on completion (MVR)
- Payment terms
- Retention % (if applicable — holdback until snag clearance)
- Status: `active`

**On work order creation:**
- Assets status → `deployed` (confirmed, not just soft-reserved)
- Assets appear on Sales tab as Active Deployments
- Ops Staff notified to mobilise
- GM notified: work order live

---

### STAGE 9 — OPS EXECUTION & FOLLOW-UP
**Actor:** WLI Ops Staff / Site Supervisor
**Status:** `active` → `in_progress`

**Ops team follows up:**
- Monitor deployment progress
- Raise issue tickets against deployed assets if problems arise (links back to issue ticket workflow)
- Daily log updates linked to work order
- Any scope changes flagged to GM

**Work order progress visible to all actors at all times**

---

### STAGE 10 — WORK COMPLETION
**Actor:** WLI Ops Staff / Site Supervisor
**Status:** `in_progress` → `completed`

**Ops marks work as complete:**
- Completion date
- Total actual hours/days worked (may differ from estimate)
- Completion notes
- Photo upload (optional)

**Action:** Status → `completed`
**Notification:** WLI Finance notified to raise invoice
**GM notified:** Work marked complete

---

### STAGE 11 — INVOICE RAISED
**Actor:** WLI Finance Staff
**Status:** `completed` → `invoiced`

**WLI Finance raises invoice:**
- Invoice number (auto: INV-YYYYMM-###)
- Linked Work Order ID
- Customer details
- Scope summary
- Actual hours/days worked (from ops completion form)
- Rate × actual hours/days = amount
- Less: advance received (if any)
- Less: retention held (if applicable)
- GST
- **Net amount due**
- Payment due date (based on credit terms)
- Bank details
- Invoice PDF generated

**Invoice immediately reflected on:**
- WLI Finance dashboard (outstanding invoices)
- Antrac HQ Finance dashboard (all WLI invoices — read only view)
- GM dashboard (finance snapshot)

**WLI Finance sends invoice to customer manually (email/WhatsApp)**
**Status → `invoiced`**
**Notification:** Sales Staff notified to follow up payment

---

### STAGE 12 — PAYMENT COLLECTION
**Actor:** WLI Sales Staff + WLI Finance
**Status:** `invoiced` → `partially_paid` / `fully_paid`

**Payment tracking on invoice:**
- Full payment received → mark paid → upload payment receipt → status `fully_paid`
- Partial payment → record amount → outstanding balance auto-calculated → status `partially_paid`
- Overdue (past payment due date) → auto-flag on Finance dashboard → alert to Sales Staff to follow up

**If retention was held:**
- Retention released after snag clearance
- Separate retention invoice raised for retention amount
- Same payment collection flow

**Antrac HQ Finance sees:**
- All invoices raised
- Payment status per invoice
- Outstanding amounts
- Overdue flags

---

### STAGE 13 — WORK ORDER CLOSURE
**Actor:** WLI Sales Staff / WLI Finance
**Status:** `fully_paid` → `closed`

**Closure checklist:**
- Invoice paid in full ✅
- Retention released (if applicable) ✅
- Asset returned to base (ops confirms) ✅
- Customer satisfaction noted (optional)

**On closure:**
- Work Order status → `closed`
- Assets status → returned to `operational` / `standby`
- Customer record updated: lifetime revenue + WO count
- All linked enquiry, quotation, work order, invoices archived under customer profile

**GM notified:** Work order closed, revenue confirmed

---

## GM / ALL ACTORS — WORK ORDER TIMELINE VIEW

```
WO-202606-001 — Fenaka Corporation — Excavator + LCT Deployment

20 May 10:00  ● Enquiry received by Sales — scope logged (ENQ-202606-001)
20 May 10:30  ● Ops checked availability — WL-HV-0009 + WL-MV-001 available ✅
20 May 11:00  ● GM approved availability ✅ — assets soft-reserved
20 May 14:00  ● WLI Finance drafted quotation — MVR 698,760
20 May 15:00  ● GM signed off quotation ✅
20 May 15:30  ● Quotation sent to Fenaka Corporation
21 May 09:00  ● Customer accepted quote ✅ — advance MVR 100,000 required
21 May 14:00  ● Advance payment received ✅ — WLI Finance confirmed
21 May 14:01  ● Work Order WO-202606-001 created — assets deployed
22 May 08:00  ● Ops mobilised — WL-HV-0009 + WL-MV-001 dispatched
01 Jun 17:00  ● Ops marked work complete ✅
01 Jun 17:01  ● WLI Finance notified to raise invoice
02 Jun 09:00  ● Invoice INV-202606-001 raised — MVR 598,760 (less advance)
02 Jun 09:30  ● Invoice sent to Fenaka Corporation
15 Jun 14:00  ● Full payment received ✅ — receipt uploaded
15 Jun 14:01  ● WO-202606-001 CLOSED ✅
              Revenue confirmed: MVR 698,760
              Customer lifetime value updated
```

---

## STATUS FLOW SUMMARY

```
ENQUIRY:
enquiry → logged → availability_checked → gm_approved →
quotation_drafted → quotation_approved → quotation_sent →
quote_accepted / declined / follow_up

WORK ORDER:
active → in_progress → completed → invoiced →
partially_paid / fully_paid → closed

INVOICE:
raised → sent → partially_paid / fully_paid / overdue → closed
```

---

## NOTIFICATIONS MATRIX

| Event | Who gets notified |
|---|---|
| Enquiry logged | Ops Staff |
| Availability checked | GM |
| GM approved availability | WLI Finance |
| Quotation drafted | GM |
| GM signed quotation | WLI Finance |
| Quotation sent | Sales Staff |
| Advance payment received | GM + Ops |
| Quote accepted — WO created | GM + Ops + Finance |
| Quote declined | GM |
| Ops marked complete | WLI Finance + GM |
| Invoice raised | Sales Staff + Antrac HQ Finance + GM |
| Payment received (full) | GM + Finance |
| Payment overdue | Sales Staff + GM |
| Work order closed | GM |

---

## THINGS YOU MIGHT HAVE MISSED — ADDED

**1. Credit terms per customer**
Some clients (Fenaka, government entities) get 30/60/90 day credit.
Payment due date on invoice auto-calculated from credit terms.
Overdue auto-flagged when due date passes without payment.

**2. Retention**
On larger projects, customers may hold 5-10% until snag clearance.
Retention % field on work order.
Retention invoice raised separately after snag cleared.

**3. Soft reservation vs hard deployment**
Assets are soft-reserved (flagged, not committed) from GM availability approval.
Assets become hard-deployed only when work order is confirmed.
Prevents double-booking assets across multiple enquiries.

**4. Scope change management**
If actual hours/days worked differ from quotation estimate, Finance raises invoice on actuals.
Any major scope changes mid-project flagged to GM for approval before proceeding.

**5. Antrac HQ Finance visibility**
All WLI invoices visible to Antrac HQ Finance in read-only view.
No action required from HQ for standard invoices — only visibility.
HQ Finance action only required when WLI Finance escalates (e.g. disputed invoice, bad debt).

---

## IMPLEMENTATION NOTES FOR CLAUDE CODE

New Google Sheets tabs required:
- `customers` — customer register
- `enquiries` — sales enquiry log
- `quotations` — all quotations
- `work_orders` — active and closed work orders
- `invoices` — all invoices with payment status
- `payments` — payment records per invoice

The `rentals` tab already in the DB can be merged with `enquiries` or kept as a separate simpler rental log for short-term dry hires.

Sales tab in the app should show:
- Active Work Orders (deployed, earning)
- Open Enquiries (in pipeline)
- Quotations Sent (awaiting response)
- Follow-up Required (overdue responses)
- Customer Directory

WLI Finance tab should show:
- Invoices outstanding
- Payments received this month
- Overdue invoices (red flag)
- Advance payments held
- Antrac HQ Finance reflection (read-only mirror)

---

*Antrac Nexus — WLI CRM & Sales Workflow v1.0*
*Well Land Investment Pvt Ltd | May 2026*
