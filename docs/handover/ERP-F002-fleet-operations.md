# ERP-F002 Track A — Implementation Log

**Feature:** Fleet Operations Presentation Layer
**Track:** A — Standalone, no external API dependency
**Status:** All phases complete, verified, done
**Date:** 2026-06-12
**Depends on:** ERP-M012 (done)
**Board:** ERP-F002 done, ERP-F003 unblocked, ERP-E05 done

## Architecture Rule

ANTRAC ERP must function standalone without third-party APIs. All fleet operations use internal Firestore data only. FollowMe is an optional future enhancement (Track B) — never a blocker.

## Validation Summary

| Check | Result |
|---|---|
| TypeScript validation | PASS — 0 errors |
| Production build validation | PASS |
| Vitest validation | PASS — 95/95 tests |
| Visual QA (Fleet Readiness) | PASS — cards display correctly with repair counts |
| Visual QA (Fleet Map) | PASS — list fallback renders asset table |
| Visual QA (Fleet Uptime) | PASS — all metrics, filters, tables render |
| CSV export QA | PASS — downloads with correct columns |
| Crew management QA | PASS — links navigate to staff register |
| Fleet Map link QA | PASS — card click navigates to /wli/map |
| Fleet Uptime link QA | PASS — section header link navigates to /wli/reports/uptime |
| Board sync QA | PASS — Nexus UI shows correct columns after TS regeneration |

## Architecture Rule

ANTRAC ERP must function standalone without third-party APIs. All fleet operations use internal Firestore data only. FollowMe is an optional future enhancement (Track B) — never a blocker.

## Phase 1 — Fleet Map Local Data Mode

**Files changed:**
- `src/components/workflow/FleetMapView.tsx` (200→205 lines)
- `src/pages/wli/registers/FleetMap.tsx` (48→44 lines)

**What was removed:**
- `followMeUrl` import from `FleetMapView.tsx`
- `VesselPos` interface from `FleetMapView.tsx`
- `vesselPositions` prop from `FleetMapView.tsx` Props interface
- `livePos()` function that read FollowMe cache positions
- FollowMe-specific Google Maps rendering loop (vessel GPS dots, speed/heading, "Track live" links)
- `useFollowMeFleet()` call from `FleetMap.tsx`
- `FollowMeBadge` import and rendering from `FleetMap.tsx`
- `followMeStatusText()` status display from `FleetMap.tsx`
- `vesselPositions={positions}` prop from `<FleetMapView>`

**What was preserved:**
- All site/asset/staff ring rendering on Google Maps (unchanged)
- Dark/light theme support (unchanged)
- All existing Google Maps functionality when `VITE_GOOGLE_MAPS_API_KEY` is set

**What was added:**
- Fleet list fallback when `!MAPS_KEY`: shows a data table with all assets (code, class, make/model, site, operational status color-coded, commercial status, assigned crew)
- Empty state when no assets: "No assets registered. Add assets in the Asset Register to see fleet data here."
- Page title renamed: "Map" → "Fleet Map"
- Legend simplified: "Sites / Live vessel" → "Sites"

**What was NOT touched (available for Track B):**
- `src/lib/services/followme.ts` — unchanged
- `src/components/shared/FollowMeBadge.tsx` — unchanged

## Phase 2 — Fleet Uptime Operational Dashboard

**Files changed:**
- `src/pages/wli/reports/FleetUptime.tsx` (187→346 lines)

**Summary metrics (4 cards):**
- Fleet Availability % — color-coded (green ≥70%, amber ≥50%, red <50%), shows "X of Y operational"
- Down / Maintenance — split counts
- Breakdowns Resolved — total resolved + "X total tickets"
- Avg Repair Turnaround — days, "reported → resolved"

**Secondary metrics (3 cards):**
- Commercial Status — available / deployed / soft-reserved with color dots
- Crew Gaps — operational vessels/vehicles with no assigned crew, link to Staff Register
- Fleet Composition — vessel / vehicle / equipment counts

**Asset class filter:**
- All Fleet / Vessels / Vehicles / Equipment buttons with live counts
- Filters all tables and metrics instantly

**Monthly throughput table:**
- Reported vs resolved by month (last 6 months)

**Per-machine reliability table:**
- Machine (linked to AssetDetail), Site, Status, Breakdowns, Open, Turnaround, Crew
- Sorted by breakdowns descending

**Export CSV:**
- All visible columns including crew

**Empty states:**
- No assets: icon + "No fleet data" + link to Asset Register

**Integration:**
- "Fleet Map" button in header → `/wli/map`
- "Manage crew" link → `/wli/staff`

**Data:** All from `useAssetList()`, `useTicketList()`, `useSiteList()`, `useStaffList()` — internal Firestore only.

## Phase 3 — Fleet Readiness Enhancements

**Status:** done, verified
**File:** `src/pages/wli/WLIDashboard.tsx` (269→297 lines)

**What was added:**
- Open repair counts per fleet group (land/vessel): computed from existing `tickets` data, matched by `assetId` or `assetCode` against scoped fleet assets
- Fleet Readiness section header: "Fleet Map" link → `/wli/map`, "Fleet Uptime" link → `/wli/reports/uptime`
- FleetCard component enhanced: accepts `openRepairs` prop, shows amber repair tag, clickable (navigates to `/wli/map`), cursor pointer + hint text
- Replaced "Asset register" link in section header with fleet-relevant links

**Verification:**
- TS 0 errors, build pass, vitest 95/95
- Fleet Readiness QA: cards display correctly with repair counts
- Fleet Map QA: list fallback renders asset table
- Fleet Uptime QA: all metrics, filters, tables render
- CSV export QA: downloads with correct columns
- Crew management QA: links navigate to staff register

---

## Validation Summary

| Check | Result |
|---|---|
| TypeScript validation | PASS — 0 errors |
| Production build validation | PASS |
| Vitest validation | PASS — 95/95 tests |
| Visual QA (Fleet Readiness) | PASS |
| Visual QA (Fleet Map) | PASS |
| Visual QA (Fleet Uptime) | PASS |
| CSV export QA | PASS |
| Crew management QA | PASS |

## Build/Verify Commands

```bash
cd D:\!starq\projects\antrac-erp
npx tsc -p tsconfig.app.json --noEmit
npm run build
npx vitest run
```

All phases pass: 0 TypeScript errors, build succeeds, 95/95 tests.
