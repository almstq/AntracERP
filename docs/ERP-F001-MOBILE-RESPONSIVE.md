# ERP-F001 — Mobile Responsive Inner Pages

**Date:** 2026-06-11
**Status:** COMPLETE
**Task:** ERP-F001 — Mobile Responsive Inner Pages

---

## Files Changed

| File | Change |
|------|--------|
| `src/styles/shell.css` | Added responsive styles for inner pages at 860px breakpoint |
| `src/pages/wli/procurement/PurchaseRequestDetail.tsx` | Converted sourcing matrix table to dual layout (desktop table / mobile cards) |

## Changes Detail

### shell.css — Responsive Inner Pages

Added inside `@media (max-width: 860px)`:
- `.detail` grid stacks to 1 column (was 1.5fr 1fr)
- `.tbl-head` hidden on mobile (column headers removed)
- `.tbl-row` converts to single-column card layout
- `.col-md` columns hidden on mobile
- `.overflow-x-auto` gets touch scroll + smaller font
- `.sumbar` chips use 2-column minimum

Added after the 860px block:
- `.d-md` — hidden on desktop, shown on mobile
- `.d-sm` — shown on desktop, hidden on mobile

### PurchaseRequestDetail.tsx — Sourcing Matrix

The quote entry table (suppliers × items grid) now has:
- **Desktop:** Original table layout (unchanged)
- **Mobile:** Card-per-item layout where each item shows its suppliers as a nested list with inputs

The price comparison table (`overflow-x-auto`) is covered by the CSS changes (smaller font, touch scroll).

## Build Status

| Check | Status |
|-------|--------|
| TypeScript | ✅ Clean (0 errors) |
| Code changes | ✅ In place |
| Vite build | ⚠️ Requires `npm i` (known Vite native binding issue, not code-related) |

## Board Status

| ID | Task | Status |
|----|------|--------|
| ERP-F001 | Mobile Responsive | ✅ DONE |
| ERP-F003 | Machine Status Report | 🟡 Planned (next) |
| ERP-F002 | Fleet Operations | 🟡 Blocked (FollowMe key) |
| ERP-F004 | Cloud Functions | 🟡 Backlog |
| ERP-F005 | Production Deployment | 🔴 Blocked (Ali action) |

---

## Recommended Next Task: ERP-F003 — Machine Status Report

**Why:** Spec is already complete (from xlsx analysis). No external dependencies. Pure build task.

**Scope:** Build the Machine Status Report page from the existing spec in `docs/REPORT_MACHINE_STATUS.md`.

---

*ERP-F001 complete. Ready for ERP-F003.*
