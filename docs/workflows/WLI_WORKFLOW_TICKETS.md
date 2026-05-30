# ANTRAC ERP — WLI ISSUE TICKET TO CLOSURE WORKFLOW
# Complete workflow definition for Claude Code implementation
# Every stage, every actor, every status transition defined

---

## ACTORS INVOLVED

| Actor | Role | App Role |
|---|---|---|
| Operator / Captain | Raises issue on asset | operator |
| Mechanic | Technical diagnosis | mechanic |
| Site Supervisor | Field verification | supervisor |
| General Manager | Approval authority | gm / super_admin |
| Proc Staff | Procurement execution | proc_staff |
| WLI Finance | Payment processing | finance_wli |
| WLI Inventory | Collection & delivery | inventory_staff |
| Antrac Finance | HQ payment | antrac_finance |
| CFO | Financial verification | cfo |
| Director | Final payment approval | director |
| Requestee | Confirms receipt & closes | operator / mechanic |

---

## STAGE 1 — ISSUE RAISED
**Actor:** Operator (for vehicles) / Captain (for vessels)
**Status:** `draft` → `submitted`

**Form fields:**
- Asset ID (auto from assigned asset)
- Location (auto from asset GPS + manual override)
- Issue description (text)
- Photo upload (optional)
- Operator recommendation for rectification (text)
- Urgency: CRITICAL / URGENT / ROUTINE

**Action:** Submit → ticket lands in Mechanic inbox
**Notification:** Mechanic receives push notification

---

## STAGE 2 — TECHNICAL DIAGNOSIS
**Actor:** Mechanic
**Status:** `submitted` → `diagnosed`

**Mechanic adds to form:**
- Technical diagnosis (text)
- Revised rectification recommendation (text)
- Material required? (toggle YES/NO)
- Service required? (toggle YES/NO)

**If Material required = YES, capture per item:**
- Item description
- Brand (optional)
- UOM (unit of measure)
- Quantity required
- Item category (parts / consumables / tools / other)
- Notes

**If Service required = YES, capture:**
- Service description
- Specialist type required (mechanical / electrical / hydraulic / fabrication / other)
- Estimated duration
- Notes

**Business rule:**
- PR is triggered automatically at this stage BUT placed ON HOLD
- PR status = `on_hold` — not visible to proc staff yet
- PR will only activate after GM approval in Stage 4

**Action:** Mechanic submits diagnosis → lands in Supervisor inbox
**Notification:** Supervisor receives push notification

---

## STAGE 3 — SUPERVISOR CHECK
**Actor:** Site Supervisor
**Status:** `diagnosed` → `supervisor_checked`

**Supervisor actions:**
- Review issue + mechanic diagnosis
- Add supervisor notes (optional)
- Verify location and asset details
- Digital sign-off (name + timestamp)

**Action:** Supervisor approves → lands in GM inbox
**Notification:** GM receives push notification with summary card

---

## STAGE 4 — GM APPROVAL
**Actor:** General Manager
**Status:** `supervisor_checked` → `gm_approved` OR `rejected`

**GM sees a visual summary card (not wall of text):**
- Asset icon + ID + name
- Location / site
- Issue summary (2 lines)
- Mechanic diagnosis (2 lines)
- Required materials list (chips: qty + item name)
- Required services list (chips)
- Signature trail: Operator ✅ → Mechanic ✅ → Supervisor ✅
- Urgency badge

**GM actions:**
- APPROVE → PR activates, moves to proc staff dashboard
- REJECT → ticket returned with rejection reason
- REQUEST INFO → sent back to mechanic with specific question

**On GM approval:**
- Issue ticket status → `gm_approved`
- PR status changes from `on_hold` → `approved`
- PR is automatically marked as GM-approved (no second approval needed)
- PR lands in Proc Staff dashboard immediately
- Notification sent to Proc Staff

---

## STAGE 5 — PROCUREMENT — PR ACCEPTANCE
**Actor:** Proc Staff
**Status:** `approved` → `pr_accepted`

**Proc Staff sees PR card:**
- PR number (auto: PR-YYYYMM-###)
- Linked ticket ID
- Asset + site
- Items list with qty + UOM
- Services list
- GM approved badge ✅
- Urgency

**Action:** Proc Staff taps ACCEPT PR
- PR status → `pr_accepted`
- Supplier search section unlocks on PR form

---

## STAGE 6 — PROCUREMENT — SUPPLIER ASSIGNMENT & RFQ
**Actor:** Proc Staff
**Status:** `pr_accepted` → `rfq_sent`

**For each item/service on the PR:**
- Proc Staff searches supplier database
- Checks historical availability (Gemini suggests based on price history)
- Assigns supplier(s) to items
- Multiple suppliers can be assigned to same item (for competitive quotes)

**RFQ Generation:**
- One RFQ document generated PER SUPPLIER
- RFQ auto-populated with: RFQ number, WLI letterhead, items assigned to that supplier, UOM, qty, delivery address, response deadline
- Export each RFQ as PDF
- RFQs are sent manually by Proc Staff to suppliers (email/WhatsApp outside app)

**PR form — quotation upload section:**
- For each supplier contacted, a "Upload Quotation" slot appears
- Proc Staff uploads received quote PDF
- System extracts: supplier name, items, unit prices, total, date
- Each uploaded quote updates the PR quote count

**Status:** `rfq_sent`
**Notification:** GM notified that RFQs have been sent

---

## STAGE 7 — QUOTATION REVIEW
**Actor:** General Manager (with Proc Staff support)
**Status:** `rfq_sent` → `quotes_under_review`

**Each time a quote is uploaded:**
- GM receives push notification: "New quote received for PR-YYYYMM-###"
- GM can view individual quote details

**Gemini price comparison (auto-generated when 2+ quotes exist):**
- Side-by-side comparison table: Item | Supplier A | Supplier B | Supplier C
- Recommended supplier highlighted (best price + historical reliability)
- Price variance % shown per item
- Historical average price shown for reference

**GM actions per item:**
- SATISFIED — select preferred supplier + price for this item
- NEED MORE QUOTES — tap to notify Proc Staff → Proc Staff notified to chase more suppliers
- SPLIT ORDER — select different suppliers for different items

**Once GM satisfied with all items:**
- GM confirms final supplier selection per item
- Status → `gm_quote_approved`
- Notification sent to Proc Staff

---

## STAGE 8 — PURCHASE ORDER GENERATION
**Actor:** Proc Staff
**Status:** `gm_quote_approved` → `po_raised`

**Proc Staff actions:**
- Reviews GM-approved supplier selections
- Confirms and submits
- PO auto-generated per supplier (one PO per supplier)

**PO auto-populated with:**
- PO number (auto: PO-YYYYMM-###)
- WLI letterhead
- Supplier details
- Items: description, qty, UOM, unit price, total
- Delivery address (destination site)
- Payment terms
- GM authorised signatory

**PO exported as PDF**
**Proc Staff sends PO PDF to supplier manually**

**On PO creation:**
- PO appears on WLI Finance dashboard immediately
- PO appears on WLI Inventory dashboard (items expected)
- GM notified: PO raised

---

## STAGE 9 — SUPPLIER CONFIRMATION & COLLECTION
**Actor:** WLI Inventory Staff
**Status:** `po_raised` → `items_ready_for_collection`

**When supplier confirms availability:**
- Proc Staff or Inventory updates PO status → `supplier_confirmed`
- WLI Inventory dashboard shows: items ready for collection, supplier name, PO details, collection address

**Inventory Staff collects items:**
- Marks items as collected
- Uploads photo of received items
- Uploads paid/delivery invoice (tax invoice from supplier)
- Status → `items_collected`

**WLI Finance dashboard updates:**
- PO raised ✅
- Items collected ✅
- Tax invoice received ✅

---

## STAGE 10 — WLI FINANCE PROCESSING
**Actor:** WLI Finance Staff
**Status:** `items_collected` → `payment_request_sent`

**WLI Finance actions:**
- Reviews: PO + quotation + tax invoice
- Packages as payment request
- Forwards to Antrac HQ Finance dashboard

**What is forwarded:**
- PO document
- Approved quotation
- Tax invoice
- Price comparison summary

---

## STAGE 11 — ANTRAC HQ FINANCE APPROVAL CHAIN
**Actors:** Antrac Finance → CFO → Director
**Status:** `payment_request_sent` → `payment_completed`

**Step 1 — Antrac Finance:**
- Receives payment request in dashboard
- Reviews documents
- Accepts → forwards to CFO
- Status → `antrac_finance_accepted`

**Step 2 — CFO:**
- Reviews and verifies
- Approves → forwards to Director
- Status → `cfo_verified`

**Step 3 — Director:**
- Final approval
- Approves payment
- Status → `director_approved`

**Step 4 — Antrac Finance executes:**
- Completes payment to supplier
- Uploads payment receipt to system
- Status → `payment_completed`
- Notification sent to WLI Finance

---

## STAGE 12 — PAYMENT RECEIPT & PO CLOSURE
**Actor:** WLI Finance → Proc Staff
**Status:** `payment_completed` → `po_closed`

**WLI Finance:**
- Receives payment receipt notification
- Downloads/views payment slip
- Accepts receipt → confirms to system
- Status → `wli_finance_confirmed`

**Proc Staff dashboard updates:**
- Payment slip received ✅
- Proc Staff manually sends payment slip to supplier
- Marks PO as closed
- Status → `po_closed`

**GM notified:** PO closed, payment complete

---

## STAGE 13 — DELIVERY TO REQUESTEE
**Actor:** WLI Inventory Staff → Requestee
**Status:** `po_closed` → `items_delivered`

**WLI Inventory dashboard:**
- Shows: item delivery request for original requestee
- Site / location to deliver to
- Items list

**Inventory Staff delivers items to requestee on site**

**Requestee confirms receipt:**
- Opens original ticket
- Confirms items received (checklist per item)
- Upload photo (optional)
- Status → `items_delivered`

---

## STAGE 14 — ISSUE RESOLUTION
**Actor:** Requestee (Operator / Captain)
**Status:** `items_delivered` → `resolved` OR `persists`

**Requestee uses materials/service to address the issue**

**Updates issue ticket:**
- ISSUE RESOLVED:
  - Add resolution notes
  - Confirm fix applied
  - Status → `closed`
  - All linked PR/PO marked closed
  
- ISSUE PERSISTS:
  - Describe what was tried
  - What is still happening
  - New workflow triggered from Stage 1 again
  - Linked to original ticket as a child ticket

---

## GM MASTER TIMELINE VIEW

For every ticket, GM can tap "View Full Timeline" to see:

```
TKT-202606-001 — WL-HV-0007 Hydraulic Pump Failure

23 May 14:32  ● Ticket raised by Janaka (Operator)
23 May 15:10  ● Mechanic diagnosis added — material + service required
23 May 16:45  ● Supervisor checked and signed — Sampath
23 May 17:02  ● GM approved ✅ — PR auto-generated
23 May 17:02  ● PR-202606-003 created (ON HOLD → ACTIVE)
24 May 09:15  ● PR accepted by Proc Staff
24 May 10:30  ● RFQ sent to 3 suppliers (IEPL India, Parts Master, RKL)
25 May 11:00  ● Quote received — Parts Master MVR 28,400
25 May 14:20  ● Quote received — IEPL India MVR 24,800
25 May 14:20  ● Gemini price comparison generated
25 May 15:00  ● GM selected IEPL India — approved ✅
25 May 15:30  ● PO-202606-001 generated — sent to IEPL India
25 May 15:30  ● WLI Finance notified
26 May 09:00  ● Antrac Finance accepted
26 May 10:00  ● CFO verified
26 May 11:00  ● Director approved ✅
26 May 14:00  ● Payment completed — receipt uploaded
26 May 14:05  ● WLI Finance confirmed receipt
26 May 14:30  ● PO closed — Proc Staff notified
27 May 09:00  ● Items collected from supplier — invoice uploaded
27 May 14:00  ● Items delivered to Janaka at Thilafushi
27 May 14:15  ● Janaka confirmed receipt ✅
28 May 08:00  ● Janaka marked issue RESOLVED
28 May 08:00  ● TKT-202606-001 CLOSED ✅
```

Every entry shows: timestamp, actor name, action taken, any notes.

---

## STATUS FLOW SUMMARY

```
TICKET:
draft → submitted → diagnosed → supervisor_checked → 
gm_approved / rejected → closed

PR:
on_hold → approved → pr_accepted → rfq_sent → 
quotes_under_review → gm_quote_approved → po_raised → closed

PO:
raised → supplier_confirmed → items_collected → 
payment_request_sent → antrac_finance_accepted → 
cfo_verified → director_approved → payment_completed → 
wli_finance_confirmed → po_closed

DELIVERY:
items_ready → items_collected → items_delivered → confirmed

ISSUE:
open → in_progress → resolved / persists → closed
```

---

## NOTIFICATIONS MATRIX

| Event | Who gets notified |
|---|---|
| Ticket submitted | Mechanic |
| Diagnosis added | Supervisor |
| Supervisor checked | GM |
| GM approved | Proc Staff |
| GM rejected | Operator + Mechanic |
| PR accepted | GM |
| RFQ sent | GM |
| Quote uploaded | GM |
| Price comparison ready | GM |
| GM approved supplier | Proc Staff |
| PO raised | WLI Finance + Inventory + GM |
| Supplier confirmed | Inventory + Proc Staff |
| Items collected + invoice | WLI Finance + GM |
| Payment request sent | Antrac Finance |
| Director approved | Antrac Finance |
| Payment completed | WLI Finance + GM |
| PO closed | Proc Staff + GM |
| Items delivered | Requestee |
| Receipt confirmed | GM + Inventory |
| Issue closed | GM |

---

## IMPLEMENTATION INSTRUCTION FOR CLAUDE CODE

Build this complete workflow in the Tickets module. The current placeholder must be replaced with this full flow.

Key rules:
1. PR is auto-created at Stage 2 (mechanic diagnosis) with status `on_hold` — not visible to proc staff until GM approves
2. GM approval of ticket = automatic GM approval of PR — no second approval step
3. One RFQ PDF generated per supplier — not one RFQ for all suppliers
4. Gemini price comparison auto-generates when 2+ quotes are uploaded
5. GM can approve different suppliers for different items on same PR (split order)
6. One PO per supplier — if split order, multiple POs generated
7. GM receives notification at every stage transition
8. Full timeline visible to GM on every ticket
9. Requestee can view their ticket's journey status at any time (read-only)
10. All timestamps stored in activity_log tab in Google Sheets

---

*Antrac Nexus — WLI Issue to Resolution Workflow v1.0*
*Well Land Investment Pvt Ltd | May 2026*
