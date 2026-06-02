# Helix Shell — Design System & Implementation

**Shipped:** 2026-06-02 (session 11) · **Version:** v0.19.0 · **Commit:** `42e42f6`
**Source:** Claude Design handoff (internal).
**Direction chosen:** **Helix** (cool technical console). Atlas (warm editorial) is fully
specced in the same bundle and can be wired as a runtime toggle later.

---

## What it is

A full **shell redesign** + redesigned **Command Center**, replacing the old
edge-to-edge Tailwind layout. The defining idea is a **floating-card shell**: every
panel (icon rail, sidebar, main) is a rounded card inset with a 16px gap off a
base background. Nothing touches the viewport wall — this structurally resolves the
long-running spacing complaints (see `UI_SPACING_CONTRACT.md`).

```
┌────────────────────────────────── base bg (16px padding) ──────────────────────────────────┐
│ ┌──────┐ ┌────────────────┐ ┌──────────────────────────────────────────────────────────┐ │
│ │ icon │ │   sidebar      │ │ topbar: breadcrumb · ⌘K search · bell/inbox/theme        │ │
│ │ rail │ │   (228px)      │ ├──────────────────────────────────────────────────────────┤ │
│ │ 62px │ │  brand         │ │ content (scroll) → <Outlet/>                              │ │
│ │      │ │  nav groups    │ │   .page: page-head · metrics · hero · sections           │ │
│ │ mods │ │  actor footer  │ │                                                          │ │
│ └──────┘ └────────────────┘ └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Token system

Tokens cascade from `data-dir` + `data-theme` on `<html>` (set in `index.html`,
kept in sync by `ThemeToggle`/`main.tsx`). Defined in `src/styles/shell.css`.

- **Fonts (Helix):** UI = Albert Sans · display = Space Grotesk · numerals = JetBrains Mono
- **Accent (Helix dark):** `#2FD4C0` (teal) · **base bg:** `#090C11` · **panel:** `#10151C`
- **Semantic:** `--positive` (lime), `--warning` (amber), `--danger` (coral), `--info` (blue)
- **Radii:** shell 14px · card 11px · md 8px · sm 6px · pill 7px
- **Density:** `data-density` compact/default/comfortable scales spacing via `--d` (CSS wired; no UI control yet)
- **Light mode:** full `[data-theme="light"]` token set; driven by the existing theme toggle

> The old Tailwind `--color-*` tokens remain untouched, so existing pages keep working.
> Helix tokens are a parallel set scoped to `.app` and the shell classes — no collision.

---

## Files

| File | Role |
|------|------|
| `index.html` | `data-dir=helix` / `data-theme` / `data-density` on `<html>` + Helix font imports |
| `src/styles/shell.css` | Helix token system (dark+light) + all shell & Command Center classes (ported, Helix-only) |
| `src/main.tsx` | imports `shell.css`; sets `data-theme` from saved theme before first paint |
| `src/components/shell/HelixShell.tsx` | Layout: rail · sidebar · main(topbar + Outlet); owns ⌘K + mobile-nav state |
| `src/components/shell/IconRail.tsx` | Module switcher rail (Holding/WLI/MPL/EMS) → real routes |
| `src/components/shell/ShellSidebar.tsx` | Brand, collapsible nav groups, actor footer (Act-As, theme, logout) |
| `src/components/shell/Topbar.tsx` | Route-derived breadcrumb, ⌘K trigger, notification/inbox/theme |
| `src/components/shell/CommandPalette.tsx` | ⌘K / Ctrl-K palette — jump-to routes + actions |
| `src/components/shell/navConfig.tsx` | Single source of nav (modules → groups → items) mapped to real routes + lucide icons |
| `src/components/layout/AppShell.tsx` | `ProtectedRoute` now renders `<HelixShell>` (replaced old Navbar/main) |
| `src/pages/wli/WLIDashboard.tsx` | Command Center rebuilt in Helix markup on real hooks |
| `src/components/dashboard/AiBrief.tsx` | added `variant="card"` (Morning Brief) |
| `src/components/dashboard/WeatherPanel.tsx` | added `variant="helix"` (bare tile grid) |

---

## Command Center composition (real data)

| Section | Source |
|---------|--------|
| Metric strip (Sites, Deployments, Open Tickets, Approvals, Available) | `useSiteList`, `useAssetList`, `useTicketList` |
| Hero — fleet map | real `FleetMapView` (Google Maps) framed in `.map-card` + live tags |
| Hero — Morning Brief | `AiBrief variant="card"` (Gemini, demo fallback) |
| Action Required | `useActionInbox(role)` → `.list .row` |
| Fleet Readiness (Land/Vessel bars + minitags) | `useAssetList` operational/deployed/down split |
| Site Weather | `WeatherPanel variant="helix"` (OpenWeatherMap) |

> **Sparklines/deltas intentionally omitted.** The prototype showed 7-point trend
> sparklines, but we have no historical time-series — fabricating trend data in a
> real ERP would be misleading. Metric cards show the honest current value only.

---

## Scope & deferrals (session 11)

**In:** the shell (all routes render in it) + the WLI Command Center, Helix direction, dark+light.

**Deferred (next passes):**
- **Tickets list + Ticket detail** — designed in the bundle (table + timeline/action panel); not yet built.
- **Remaining pages** (Procurement, CRM, Warehouse, Registers, MPL/Holding dashboards) render in the new shell but keep their **old Tailwind styling** until restyled.
- **Control dock** (Atlas/Helix/density/accent picker) — prototype-only tool, not for production.
- **Atlas direction** — fully specced; wire as a toggle only if Mustarq wants to compare.

**Known pre-existing issue surfaced (not from this work):** the AI Morning Brief shows
`models/gemini-1.5-flash is not found` — `ai.ts` uses an outdated model id. One-line fix pending.

---

## Verification

Built clean (0 TS errors) and **browser-verified on live data** via Claude-in-Chrome:
breadcrumb, ⌘K, metric strip (Sites 5 / Deployments 6 / Available 9), real Google map
with site nodes, AI card, fleet bars (Land 7/9 · 78%, Vessel 1/1 · 100%), and live
weather tiles all rendering correctly.
