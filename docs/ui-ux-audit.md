# Antrac ERP — UI/UX Audit

> **Date:** 2026-06-01  
> **Scope:** All pages (45+) and shared components (20+)  
> **App:** React + TypeScript + Tailwind CSS + Firebase  

---

## Table of Contents

1. [Critical Issues](#-critical-issues)
2. [Significant Issues](#-significant-issues)
3. [Minor Issues](#-minor-issues)
4. [What's Done Well](#-whats-done-well)
5. [Prioritized Action Plan](#-prioritized-action-plan)

---

## 🔴 Critical Issues

### 1. Card Spacing Double-Margin

**File:** `src/components/ui/Card.tsx:11`

```tsx
<div className={`rounded-xl border border-border bg-bg-surface shadow-card ${className} m-4`}>
```

- `Card` hardcodes `m-4` (16px margin on all sides). When used inside `PageContainer` (which provides `px-8 md:px-14 lg:px-16`), extra horizontal margin creates uneven spacing.
- Inner padding is `p-8` (32px), which combined with `m-4` eats ~48px per side on small screens.

**Recommendation:**
- Remove `m-4` from Card. Let the parent container control spacing.
- If card-level margin is needed, push it to call sites via `className`.

---

### 2. Loading States — Fragmented & Inconsistent

**Problem:**
- `LoadingSpinner.tsx` exists with a proper spinner animation but is barely used anywhere.
- Most pages render plain text: `<div className="p-6 text-xs text-text-muted">Loading…</div>`
- Some pages show loading inline in subtitle text (`RoleInbox.tsx:20`), others show full-page centered text.
- No skeleton loaders anywhere — content flashes from "Loading…" text to full page on every navigation.

**Files affected:** Almost every page file.

**Recommendation:**
- Adopt `LoadingSpinner` as the standard loading indicator across all pages.
- Create a `PageSkeleton` component for list pages (e.g., 5-6 gray placeholder rows).
- Create a `DetailSkeleton` for detail pages (placeholder card layout).

---

### 3. Empty States — Inconsistent Quality

**Problem:**
- Some pages use the `EmptyState` component (MPL dashboard, Document Vault).
- Most pages use raw `<p>` tags with inconsistent messaging.
- `StockByStore.tsx:51`: "No stock in this store yet." — not actionable, no CTA.
- `PurchaseRequestList.tsx:22`: Informative but has no action button.

**Recommendation:**
- Standardize on the `EmptyState` component across all pages.
- Every empty state should include a clear CTA (e.g., "Add your first item", "Create a transfer").
- Provide contextual help text explaining _why_ something might be empty (e.g., "PRs appear once a GM approves an issue ticket").

---

### 4. Forms Bypass the Shared `Input` Component

**Problem:**
Almost all forms define their own raw CSS class string instead of using `<Input>`:

```tsx
const field = 'text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary';
```

This affects NewTicket, NewFuelRequest, CustomerRegister, NewEnquiry, NewTransfer, ItemCatalog, StoresRegister, and more.

**Consequences:**
- No consistent label styling
- No consistent error state styling (red border)
- No consistent focus ring
- Drift over time — changes to `Input` won't propagate to raw `field` usages
- `Input` component at `src/components/ui/Input.tsx` has built-in `label`, `error`, and `helperText` props going unused

**Recommendation:**
- Refactor all forms to use `<Input>`, `<select>`, and `<textarea>` wrappers that apply the same shared classes.
- Create an `InputSelect` and `InputTextarea` component or extend `Input` to support `as` prop.

---

## 🟠 Significant Issues

### 5. Missing Toast/Notification System

**Problem:**
There is no global toast/notification feedback after mutations. Examples:
- Creating a customer — silently navigates to the list
- Saving quotes — no confirmation
- Raising an invoice — no success message
- Recording a payment — no feedback

Users may wonder if their action succeeded or be unsure of the result.

**Recommendation:**
- Add a lightweight toast system (e.g., a `ToastProvider` context + `useToast` hook).
- Show toasts after all successful mutations: "Customer created", "Payment recorded", "Quotes saved".
- Show error toasts as an alternative to (or in addition to) inline error text.

---

### 6. Accessibility Gaps

#### 6a. Color-Only Status Indicators

**Files:**
- `NewFuelRequest.tsx:143-157` — urgency toggle buttons use red/amber/teal with no text differentiation beyond the word itself
- `MovementsLedger.tsx:89` — movement type badges use text+color (good), but icon colors alone in some contexts convey meaning

**Recommendation:**
- Ensure every status/priority indicator combines color with text, icon, or both.
- For toggle groups like urgency, use `role="radiogroup"` and `aria-checked`.

#### 6b. Icon-Only Buttons Missing Aria Labels

**Files affected:**
- `PurchaseRequestDetail.tsx` — `+ RFQ` buttons, `Eye` buttons
- `NewTransfer.tsx:129` — `Trash2` delete button
- `WorkOrderDetail.tsx` — `Download` buttons, `Plus` buttons
- `CustomerRegister.tsx` — `ChevronRight` links

**Recommendation:**
```tsx
<button aria-label="Delete line item" onClick={() => removeLine(i)}>
  <Trash2 size={14} />
</button>
```

#### 6c. Keyboard Navigation Gaps

- List item links (`hover:bg-bg-surface`) lack visible `:focus-visible` styles.
- Tab order in complex forms (sourcing matrix) is unpredictable.
- Date pickers (`<input type="date">`) have inconsistent browser rendering.

**Recommendation:**
- Add `focus-visible:ring-2 focus-visible:ring-blue/50` to all interactive list rows.
- Audit tab order in the procurement sourcing matrix.

---

### 7. Navigation & Wayfinding

#### 7a. No Breadcrumbs

Deeply nested pages (e.g., Ticket → PR → PO → Detail) have no breadcrumb trail — only simple back-arrow links. Users can get lost in a 4-level hierarchy.

**Affected pages:**
- `TicketDetail.tsx` → links to PR → links to PO → all just back arrows
- `PurchaseRequestDetail.tsx` → links to Ticket and PO
- `WorkOrderDetail.tsx` → links to Enquiry and Customer

**Recommendation:**
- Add breadcrumbs to detail pages, e.g.: `Tickets → TK-0042 → PR-0003`
- Keep it subtle (small, muted text above the heading).

#### 7b. Active Link Matching Too Broad

**File:** `src/components/layout/Sidebar.tsx:140`

```tsx
const isActive = (item: NavItem) =>
  item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
```

`/wli/tickets` matches both `/wli/tickets` and `/wli/tickets/new`. With `end: false`, both will highlight "Issue Tickets" even on the "New Ticket" page.

**Recommendation:**
- Use a more precise matching strategy (e.g., react-router's `useMatch` or split path segments).

#### 7c. `navigate(-1)` is Unreliable

**File:** `FuelDispatchDetail.tsx:32`

```tsx
<button onClick={() => navigate(-1)}>Back to Dispatches</button>
```

If the user navigated directly to this URL, `-1` goes to whatever was in browser history before the app — potentially exiting the application.

**Recommendation:**
- Always use explicit routes for back navigation: `<Link to="/mpl/dispatches">`.

---

### 8. Mobile Responsiveness Issues

| Issue | File | Detail |
|-------|------|--------|
| Complex table layouts | `PurchaseRequestDetail.tsx:184` | Sourcing matrix uses `<table>` with `.overflow-x-auto` — functional but cramped on <768px |
| Card eats too much space | `Card.tsx:11` | `m-4` + `p-8` on mobile leaves little content width |
| Inconsistent sticky headers | WLIDashboard, SalesDashboard, FinanceDashboard | Custom headers outside PageContainer with fixed padding break on small screens |
| Side-by-side stat columns | Various | `grid grid-cols-3` on dashboards — too many columns for mobile |

**Recommendation:**
- Audit all grid layouts: `grid-cols-3` → `grid-cols-2` on mobile, `grid-cols-5` → `grid-cols-3`.
- Fix Card to not add margin on mobile.
- Standardize on one header pattern across all pages.

---

### 9. Hardcoded Mock Data Visible to Users

| Page | Data Source | Status |
|------|------------|--------|
| `HoldingDashboard.tsx` | Hardcoded object | Show static "WLI: 12 tickets" etc. |
| `RFQList.tsx` | `MOCK_RFQS` | No live data integration |
| `FuelDispatchList.tsx` | `MOCK_FUEL_DISPATCHES` | No live data integration |
| `FuelDispatchDetail.tsx` | `MOCK_FUEL_DISPATCHES` | Shows "Phase 2B" message |
| `InterSBUTransferList.tsx` | `MOCK_INTERSBU_TRANSFERS` | No live data integration |
| `UserList.tsx` | Hardcoded array | 4 mock users only |

**Recommendation:**
- For shipping: connect mock pages to the same data hooks pattern used elsewhere (e.g., `useEntity`, `usePRList`).
- Remove "Phase 2B" messages from production-facing UI — replace with an empty state or hide the feature.
- `HoldingDashboard` should read real data from sub-SBU dashboards.

---

### 10. Layout Inconsistency Between Pages

Three distinct layout patterns exist:

| Layout Pattern | Pages | Characteristics |
|----------------|-------|-----------------|
| **A — Header in PageContainer** | TicketList, RoleInbox, EnquiryList, WorkOrderList, CustomerRegister, most list pages | Heading + subtitle inside `PageContainer`. Consistent spacing. |
| **B — Custom sticky header outside PageContainer** | SalesDashboard, FinanceDashboard | Sticky `border-b` header at top, content below in PageContainer. |
| **C — Custom non-sticky header outside PageContainer** | WLIDashboard | Header with its own padding, no sticky behavior. |

**Recommendation:**
- Standardize on **Pattern A** for list pages and **Pattern B** (sticky header) for dashboard pages.
- Create a shared `PageHeader` component that handles both cases.

---

## 🟡 Minor Issues

### 11. Tiny Font Sizes

Heavy use of `text-[9px]`, `text-[10px]`, `text-[11px]` across the app. While appropriate for metadata and labels, some instances are uncomfortably small:

- `SalesDashboard.tsx:116`: Stat values use `text-2xl` but labels use `text-[9px]` — 4x difference is jarring.
- `FinanceDashboard.tsx:101`: Similar pattern.
- `WLIDashboard.tsx:76`: Stat card labels at `text-xs tracking-wide`.

**Recommendation:**
- Establish a type scale: labels at `text-[10px]`, body at `text-xs` (12px), headings at `text-sm`/`text-base`.
- Use `text-[9px]` only for truly secondary metadata (timestamps, IDs).

---

### 12. Missing Search & Filter on List Pages

Pages without search/filter despite having significant data volume:

| Page | Items | Search? | Filter? |
|------|-------|---------|---------|
| `PurchaseRequestList.tsx` | Variable | ❌ | ❌ |
| `PurchaseOrderList.tsx` | Variable | ❌ | ❌ |
| `WorkOrderList.tsx` | Variable | ❌ | ❌ |
| `EnquiryList.tsx` | Variable | ❌ | ❌ |
| `TicketList.tsx` | Variable | ❌ | ❌ |
| `FuelRequestList.tsx` | Variable | ❌ | ❌ |

Pages that DO have search: CustomerRegister, ItemCatalog.

**Recommendation:**
- Add search to all list pages. Follow the pattern in `CustomerRegister.tsx:125-132` (search icon + input).
- Add status/type filter dropdowns for pages with multiple statuses (Work Orders, Enquiries).

---

### 13. Form Validation — No Inline Feedback

All forms show errors as a single `<p className="text-xs text-red">` at the bottom. No field-level highlighting or per-field error messages.

**Affected forms:** CustomerRegister, NewTicket, NewFuelRequest, NewEnquiry, NewTransfer, ItemCatalog, StoresRegister, LocationRegister, AssetRegister, StaffRegister, SupplierRegister.

**Recommendation:**
- Highlight errored fields with a red border (`border-red`).
- Show per-field error messages below each field.
- Validate on blur (not just on submit) for a better UX.

---

### 14. No Data Refresh Mechanism

List pages fetch data only on mount (`useEffect` with empty deps or hook init). There is no:
- Auto-polling / real-time listener
- Pull-to-refresh
- Refresh button (except `CustomerRegister.tsx` which manually calls `load()`)

**Affected pages:** Most list pages.

**Recommendation:**
- Add a refresh button (small icon in the header) for all list pages.
- Consider using Firestore `onSnapshot` for real-time updates on critical lists.
- At minimum, refresh on navigation (react-router's `useEffect` with location key).

---

### 15. Missing Confirmation on Destructive Actions

| Action | File | Confirmation? |
|--------|------|---------------|
| Deactivate store | `StoresRegister.tsx:109` | ❌ |
| Toggle supplier active | `SupplierRegister.tsx` | ❌ |
| Record payment | `WorkOrderDetail.tsx` | ❌ |
| Reassign asset location | `AssetRegister.tsx:41` | ❌ |
| Delete line item | `NewTransfer.tsx:129`, `NewEnquiry.tsx:40` | ❌ |

**Recommendation:**
- Add a lightweight confirmation dialog for all destructive/irreversible actions.
- A simple `confirm()` works for MVP, but a proper modal is better.

---

### 16. EMS Dashboard is a Placeholder

**File:** `EMSDashboard.tsx:8`

```tsx
<p className="text-xs text-text-muted">Coming Soon</p>
```

Navigation still shows EMS as an accessible module.

**Recommendation:**
- Either hide EMS from the navigation sidebar until implemented, or
- Show a more informative placeholder with planned features and timeline.

---

### 17. Theme Toggle Inconsistency

**File:** `ThemeToggle.tsx`

- The toggle is placed at the bottom of the sidebar, below the logout button — easy to miss.
- It shows "Light mode" / "Dark mode" text but doesn't persist immediately — there's a brief flash on page load before the stored theme is applied.

**Recommendation:**
- Move theme toggle near the user avatar or use a floating button.
- Apply the theme from `localStorage` in a `<script>` tag before React hydrates to avoid flash.

---

### 18. Miscellaneous UI Polish

| Issue | File | Detail |
|-------|------|--------|
| Duplicate imports | `FuelRequestList.tsx:2` | `import React from 'react'` is unused |
| Inconsistent back link styling | Multiple pages | Some use `<Link>` with arrow, some use `<button onClick={navigate(-1)}>` |
| No animation on page transitions | App | Pages snap in with no fade/slide |
| Invoice form layout | `WorkOrderDetail.tsx:103-113` | Grid columns `col-span-12` + individual `col-span-*` — fragile on small screens |
| Payment chain visual | `PurchaseOrderDetail.tsx:84-93` | Simple dot indicators — no timeline connector lines between steps |

---

## ✅ What's Done Well

1. **Dark/Light theme** — Smooth transition with CSS custom properties. Well-implemented.
2. **Consistent design tokens** — Colors, spacing, and shadows are centralized in `index.css`.
3. **`PageContainer` component** — Provides consistent horizontal padding and max-width across pages.
4. **Workflow engine** — Status transitions, timelines, and role-based actions are thoughtfully designed.
5. **Mobile sidebar drawer** — Floating sheet with backdrop blur is well-executed.
6. **Button loading states** — `disabled={busy}` with "Saving…"/"Submitting…" text is consistent.
7. **Action inbox** — Role-based task aggregation on dashboards is a strong UX pattern.
8. **Error boundaries** — `RouteError` component at the router level.
9. **FileUpload component** — Reusable with preview modal across multiple entity types.
10. **EmptyState component** — Good concept, just needs wider adoption.

---

## 📋 Prioritized Action Plan

### Phase 1 — Quick Wins (1-2 hours each)

| # | Task | Impact | Files |
|---|------|--------|-------|
| 1 | Standardize loading states — adopt `LoadingSpinner` everywhere | High | All pages |
| 2 | Remove `m-4` from `Card.tsx`, audit all call sites | High | `Card.tsx` + 30+ files |
| 3 | Add `aria-label` to all icon-only buttons | Medium | ~15 files |
| 4 | Add search to list pages missing it | Medium | PR/PO/WO/Enquiry/Ticket lists |
| 5 | Fix `navigate(-1)` → explicit `<Link>` in FuelDispatchDetail | Low | `FuelDispatchDetail.tsx` |

### Phase 2 — Structured Improvements (3-4 hours each)

| # | Task | Impact | Files |
|---|------|--------|-------|
| 6 | Add toast notification system | High | New context + all mutation pages |
| 7 | Refactor forms to use shared `Input` component | High | ~10 form pages |
| 8 | Standardize page layout (PageHeader component) | Medium | All dashboards + list pages |
| 9 | Add empty state CTAs everywhere | Medium | ~15 pages |
| 10 | Add `focus-visible` styles to interactive list rows | Medium | All list pages |

### Phase 3 — Deep Work (5-8 hours each)

| # | Task | Impact | Files |
|---|------|--------|-------|
| 11 | Connect MPL/Holding pages to live data hooks | High | MPL pages + HoldingDashboard |
| 12 | Add confirmation dialogs for destructive actions | Medium | ~8 pages |
| 13 | Responsive audit — test every page at 375px, 768px, 1440px | High | All pages |
| 14 | Add breadcrumb navigation to detail pages | Medium | ~10 detail pages |
| 15 | Add inline form validation (per-field errors, blur validation) | Medium | All form pages |

---

*Generated from codebase inspection of `src/pages/`, `src/components/`, and supporting files.*
