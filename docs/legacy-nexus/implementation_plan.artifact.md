# Closed-Loop ERP Vision Alignment

This major refactor aligns the Antrac Nexus app with the "WELL LAND OPS v1.0" vision, transforming it from a simple mobile tool into a professional closed-loop operations platform.

## User Review Required

- **Navigation Change**: Moving from a Bottom Bar to a Sidebar layout (as seen in the previous build) for better ERP usability.
- **Workflow Audit**: Every ticket event (Raised, Checked, PO, Delivery) will now trigger an entry in `Sheet_Asset_History_Log`.

## Proposed Changes

### Core Infrastructure & UI
#### [MainShell](file:///C:/Antrac Nexus/app/lib/screens/main_shell.dart)
- Replace `NavigationBar` with a professional **Sidebar** layout.
- Add "Command Center", "Operations", "Resources", "Business & Governance" sections.

#### [HomeTab (Command Center)](file:///C:/Antrac Nexus/app/lib/screens/tabs/home_tab.dart)
- Unified dashboard: Map (Spatial) + Inbox (Actionable) + Readiness (Statistical).
- Live counters for Land Fleet, Sea Vessels, Staff, and Project Sites.

---

### Intelligent Ticketing (The Journey)
#### [TicketDetail](file:///C:/Antrac Nexus/app/lib/screens/tickets/ticket_detail_screen.dart)
- **Messaging Flow**: Implement a timeline-style "Ticket Journey" view.
- **Audit Trail**: Integrate with `AssetHistoryService` to show individual events (e.g. "Janaka raised ticket", "GM approved PO").

#### [RaiseTicketScreen](file:///C:/Antrac Nexus/app/lib/screens/forms/raise_ticket_screen.dart)
- Add "Recommended Solution" and "Items/Services Required" fields.
- Mandatory site/asset/requestee linkage.

---

### Audit & Persistence
#### [NEW] [asset_history_service.dart](file:///C:/Antrac Nexus/app/lib/services/asset_history_service.dart)
- Logic to write every operational event to `Sheet_Asset_History_Log`.

#### [SheetsService](file:///C:/Antrac Nexus/app/lib/services/sheets_service.dart)
- Verify mapping for all 25 operational sheets mentioned in the vision.

## Verification Plan

### Manual Verification
1.  **Orchestra Test**: Raise a ticket -> Check history log -> Approve as GM -> Verify secondary entry in PR sheet.
2.  **Layout Test**: Toggle between desktop/mobile widths; ensure Sidebar collapses or hides correctly.
3.  **Data Integrity**: Verify that `Sheet_Audit_Log` captures the full JSON snapshot on every ticket update.
