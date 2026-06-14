# Antrac ERP — MVP Risk Register (ERP-MVP-002)

**Version:** 1.0  
**Date:** 2026-06-14  
**Status:** ACTIVE  
**Owner:** Antrac ERP Specialist (Gemini CLI)  

---

## 1. Executive Summary
This document registers the architectural, security, financial, and operational risks of the **Antrac ERP MVP** release baseline. The MVP is designed to support the initial operational synchronization (OrgSync) for **Well Land Investment Pvt Ltd (WLI)**. These risks must be managed and mitigated before transitioning the application to the **Final Form** production phase.

---

## 2. Risk Registry

### Risk 1: Client-Side Permission Dependence
* **ID:** `RSK-SEC-001`  
* **Severity:** **HIGH**  
* **Operational Impact:** Low (internal staff trust) | **Security Impact:** High  
* **Description:** The system gates navigation items, sidebar groups, and form fields based on the `effectiveRole` stored in React context. A malicious user with access to browser developer tools could modify their local context role to bypass client-side gates and view restricted menu paths.
* **Mitigation (MVP):** Standardize route guards on module keys.
* **Resolution (Final Form):** Move all access verification to server-side checks and gate raw API/Firestore reads directly.

---

### Risk 2: Coarse Firestore Security Rules
* **ID:** `RSK-SEC-002`  
* **Severity:** **HIGH**  
* **Operational Impact:** Medium | **Security Impact:** High  
* **Description:** Current Firestore rules grant collection-wide read/write permissions based on general authentication status or coarse roles (e.g., check if user is not `pending`). There is no document-level or row-level validation verifying if the writer actually owns the asset or site.
* **Mitigation (MVP):** Keep audits and logs of all modifications in the immutable activity log.
* **Resolution (Final Form):** Harden rules to enforce that users can only write to documents belonging to their assigned site IDs (`request.auth.token.siteIds`).

---

### Risk 3: Client-Evaluated Workflow Transitions
* **ID:** `RSK-WF-001`  
* **Severity:** **HIGH**  
* **Operational Impact:** Low (staff follow standard SOPs) | **Security Impact:** High  
* **Description:** Transition validations (`validateTransition`) are performed in the client bundle before committing to Firestore. A user could write directly to Firestore bypassing the transitions rules (e.g. moving a PO straight to `payment_cleared` without CFO approval).
* **Mitigation (MVP):** Immutable append-only timelines and audit marker logging capture all transitions. Unofficial states are easily flagged by auditing.
* **Resolution (Final Form):** Implement workflow transitions exclusively via Firebase Cloud Functions acting as the sole authorized writer.

---

### Risk 4: Missing Financial Ledger & Journal Postings
* **ID:** `RSK-FIN-001`  
* **Severity:** **HIGH**  
* **Operational Impact:** High (finance relies on spreadsheets for ledger)  
* **Description:** The MVP lack a double-entry accounting ledger. Transactions (PO payments, PRs) are status changes on operational documents, rather than immutable journal entries posting debits and credits to accounts.
* **Mitigation (MVP):** Export PO data to Excel/PDF printouts for manual accountant entry into external ledger packages.
* **Resolution (Final Form):** Implement a double-entry General Ledger (GL) database collection with immutable transaction postings.

---

### Risk 5: Incomplete Asset Financial Master
* **ID:** `RSK-AST-001`  
* **Severity:** **MEDIUM**  
* **Operational Impact:** Medium  
* **Description:** The Asset register stores asset codes, current location, and status, but lacks financial fields (capital cost, salvage value, depreciation methods, and net book value). Asset P&L calculations (revenue vs. repairs) are approximated rather than dynamically driven from capital depreciation.
* **Mitigation (MVP):** Approximate asset repair costs on the Profitability report page without depreciation offsets.
* **Resolution (Final Form):** Add depreciation schedules and link asset records directly to the General Ledger.

---

### Risk 6: Lack of Preventive Maintenance Scheduling
* **ID:** `RSK-MNT-001`  
* **Severity:** **MEDIUM**  
* **Operational Impact:** High (risk of asset breakdown)  
* **Description:** The maintenance workflow is reactive (tickets are raised after failure occurs). The system lacks a scheduler, maintenance calendar, or automatic hour-meter triggers for routine servicing (e.g., oil changes every 250 hours).
* **Mitigation (MVP):** Site supervisors manually track machine engine meters and raise tickets for PM service.
* **Resolution (Final Form):** Build a preventive maintenance engine that monitors asset engine hours and generates servicing work orders automatically.

---

### Risk 7: Partial Procurement Controls & Approval Limits
* **ID:** `RSK-P2P-001`  
* **Severity:** **MEDIUM**  
* **Operational Impact:** Medium  
* **Description:** The system allows the General Manager to approve any PO. There are no role-based monetary approval limits (e.g., GM approves up to $10,000; CFO up to $50,000; Director above $50,000).
* **Mitigation (MVP):** Rely on verbal/offline authorization limits before signing in the portal.
* **Resolution (Final Form):** Enforce strict approval limit thresholds in the transition validation code.

---

### Risk 8: Inventory Valuation Gap
* **ID:** `RSK-INV-001`  
* **Severity:** **HIGH**  
* **Operational Impact:** High (tax reporting and balance sheet variances)  
* **Description:** Stock movements (receipts and issues) do not perform item unit cost calculations (FIFO, LIFO, or Weighted Average Costing). Inventory is valued at the last purchase price, which can distort financial margins.
* **Mitigation (MVP):** Perform physical monthly inventory counts and manual spreadsheet adjustments.
* **Resolution (Final Form):** Store cost logs on every stock ledger entry and implement moving weighted average costing on item profiles.

---

## 3. Risk Action Plan
| ID | Risk Title | MVP Owner | MVP Mitigation | Final Form Target Task |
| :--- | :--- | :--- | :--- | :--- |
| `RSK-SEC-001` | Client-Side Permission Dependence | SA | Module-key path guards | `ERP-SEC-001` |
| `RSK-SEC-002` | Coarse Firestore Security Rules | SA | Immutable logs | `ERP-SEC-002` |
| `RSK-WF-001` | Client-Evaluated Workflow | SA | Audit timelines | `ERP-SEC-003` |
| `RSK-FIN-001` | Missing Financial Ledger | SA / CFO | External bookkeeping | `ERP-FIN-001` / `ERP-FIN-002` |
| `RSK-AST-001` | Incomplete Asset Financials | SA / GM | Repair reports | `ERP-AST-001` / `ERP-AST-002` |
| `RSK-MNT-001` | Preventive Maintenance | SA / Sup. | Manual PM tickets | `ERP-MNT-001` |
| `RSK-P2P-001` | Partial Procurement limits | SA / CFO | Offline controls | `ERP-SEC-004` |
| `RSK-INV-001` | Inventory Valuation Gap | SA / CFO | Physical stock counts | `ERP-INV-001` |
