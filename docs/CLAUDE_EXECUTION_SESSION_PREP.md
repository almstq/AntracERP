# CLAUDE EXECUTION — SESSION PREP

**Prepared:** 2026-06-03 (end of build session, pre-execution)
**Source of truth:** `docs/ANTRAC_ERP_ENGINEERING_READINESS_REPORT.md` (Cipher, reconciled review)
**This file:** the implementer's runbook for the NEXT session. Prep only — nothing here is implemented yet.

---

## OBJECTIVE

Execute ONLY the **Claude Execution Package** (10 ordered steps) from the readiness report.
Raise Engineering Readiness from **42% → 90%+** while preserving functionality and avoiding regressions.

## OPERATING RULES (from the directive)

1. Follow the execution order exactly.
2. Do not re-audit.
3. Do not redesign architecture.
4. Do not create new roadmap items.
5. Do not perform speculative refactors.
6. Complete ONE execution item at a time.
7. After each item: **verify build → verify functionality → commit → report readiness improvement.**

## BASELINE (per report)

- Functional completeness: **90%** (43/44 phases)
- Engineering maturity: **42%** ← the number we're raising
- Production readiness: **35%**
- Build: `tsc + vite` clean ✓

---

## ⚠️ RECONCILIATION FLAGS — READ BEFORE STEP 1 AND STEP 2

The report was authored from static source-code scans. Two of its prescriptions conflict with
behaviour we **verified live in the browser this session** (real Firebase + real Gemini key). Per
Rule 7 (avoid regressions), these are flagged for confirmation — NOT silently followed, NOT silently ignored.

### FLAG A — ✅ RESOLVED 2026-06-03 (Step 2 + 2.1, Mustarq-authorized model change)
- Report says: *"Change MODEL to `gemini-1.5-flash`, change ENDPOINT to `/v1` (not v1beta)."*
- **Live evidence this session:** that exact config (`gemini-1.5-flash` on `/v1`) produced a runtime
  **HTTP 404 — "models/gemini-1.5-flash is not found for API version v1"** in the user's browser console.
- **RESOLUTION:** The report's model line was stale AND a live probe of the production key (2026-06-03)
  found the whole **`gemini-2.0-flash` family is off the free tier** (`429 RESOURCE_EXHAUSTED limit:0`),
  while the **`gemini-2.5` family returns 200**. With Mustarq's explicit sign-off, the model was changed:
  - `MODEL` → **`gemini-2.5-flash`**, now env-overridable via `VITE_GEMINI_MODEL` (commit `90eff29`).
  - `thinkingConfig.thinkingBudget = 0` added — 2.5 thinking-on-by-default ate the token budget and
    truncated briefs; disabling it restored full output (commit `f45b610`).
  - ENDPOINT stays `/v1beta` (reverting to `/v1` still 404s — the original flag holds).
  - Verified end-to-end live: ops-brief generates, `finishReason: STOP`.
- **Net:** the report's prescription (revert to 1.5/v1) was correctly NOT followed; the real fix was a
  forward move to 2.5-flash. No action remains for the next session.

### FLAG B — Step 1 login is PARTIALLY DONE; report's AuthContext fix is additive
- This session already fixed the navigation race in `Login.tsx` (navigate via an auth-state `useEffect`
  once `user` resolves, not eagerly) — commit `b8e794f`.
- The report's prescribed `setLoading(true)` before `await getDoc` in `AuthContext.tsx` is a **different,
  complementary** fix (the loading-state gap) and is still valid to add.
- **Action:** Add the AuthContext `setLoading(true)` fix + the `isProcessing` UI state on the button.
  Keep the existing effect-based navigation. Verify the "click twice" symptom is gone end-to-end.

---

## EXECUTION SEQUENCE (do in this order, one at a time)

> Status legend: ⬜ not started · 🟨 partially done this session · ✅ effectively done (verify only)

### Step 1 — Fix Double Login · P0 · ~2h · ✅ DONE (commit `f7ab71d`)
- File: `src/lib/context/AuthContext.tsx`, `src/pages/Login.tsx`
- ✅ `setLoading(true)` added after the `if (!fbUser)` guard, before `await getDoc` (FLAG B).
- ✅ `isProcessing` state in `Login.tsx` → disables both buttons + "Signing in…" during auth.
- ✅ Kept existing effect-based navigation.
- **Accept:** met — tsc/vite/eslint clean; button disabled mid-auth.

### Step 2 — Stabilize Gemini AI · P0 · ~4h · ✅ DONE (commits `26e62a8`, `90eff29`, `f45b610`)
- File: `src/lib/services/ai.ts` (+ new `src/lib/services/ai.prompts.ts`)
- ✅ FLAG A resolved (see above): model → `gemini-2.5-flash` (env-overridable), thinking disabled,
  endpoint stays `/v1beta`. Mustarq-authorized; verified live.
- ✅ Exponential backoff retry for 429 + 503 (max 3), abort-aware.
- ✅ Prompts moved to `ai.prompts.ts` (wording preserved for mock-mode detection).
- ✅ Retry buttons added to both AI components' error states.
- **Accept:** met — brief generates live (`finishReason: STOP`), prompts centralized, build clean.

### Step 3 — Enforce Site Scoping · P0 · ~1d · ✅ DONE + LIVE-VERIFIED (commit `98b505a`)
- File: `src/lib/hooks/useWorkflowData.ts` + new `listBySites()` in `src/lib/firebase/db.ts`.
- ⚠️ The prep one-liner ("`where('siteId','in',siteIds)` on all") was WRONG — corrected per live code:
  - assets scope on **`currentSiteId`** (NOT `siteId` — would've returned 0), sites on **document id**,
    tickets/staff on `siteId`. (Verified against the existing client-side scope in WLIDashboard/OperatorHome.)
  - Single-field `in` only (no `sbuId==` alongside) → rides the auto index, **no composite index** to deploy.
  - Reads `user.siteIds` via `useAuth`; empty → existing `sbuId==` query (GM/super/finance/etc. unchanged).
- Scope decision (Mustarq): **all four incl. staff**; asset-posted crew (assignedAssetId, no siteId) dropped
  for site-bound users — accepted.
- **Accept:** MET. Live-verified on prod data as a.musthaq (super_admin) running the real db.ts fns for
  site `thilafushi`: assets 35→18, staff 31→25, sites 5→1, tickets 0→0 — every scoped doc in-site, no
  query errored. Build (tsc+vite) clean.
- KNOWN: `useWorkflowData.ts` has 12 PRE-EXISTING `react-hooks/set-state-in-effect` lint errors (not from
  this step; tracked separately). Hook branch-selection logic verified by reading (trivial ternary).

### Step 4 — Add Test Coverage · P0 · ~2d · ✅ DONE (commit `bce726d`)
- Installed Vitest 4 + @testing-library/react + jest-dom + jsdom. Standalone `vitest.config.ts`
  (node env, no app plugins). Scripts `test`/`test:watch`. Test files excluded from prod build
  (tsconfig.app `exclude`).
- `src/lib/workflow/engine.test.ts` — **95 tests**: all 7 engine fns (incl. system-only exclusion,
  requiresNotes/Fields, system-role bypass); structural invariants over ALL 6 machines (reachability,
  no dead-ends, unique actions, labels-cover-states, super_admin-on-every-transition, zero-outgoing⇒terminal);
  full ticket→PR→PO walk incl. 4-tier payment chain + tier-ordering + side-effect bridges.
- **Accept:** MET. `npm test` → 95 passed; build (tsc -b + vite) clean; new files lint-clean.
- NOTE: executor (Firestore writes) NOT unit-tested here — needs Firebase mocks; the engine/business
  rules are fully covered. RTL+jsdom installed but not yet wired (no component tests yet).
- ✅✅ **P0 BLOCK (Steps 1–4) COMPLETE.** Readiness ~60%.

### Step 5 — Enable Strict Types · P1 · ~~1-2d~~ → 5 min · ✅ DONE (commit `0168b50`)
- A probe (tsconfig extends + strict:true, verified non-no-op via an injected TS18048) found the codebase
  ALREADY strict-clean: **0 errors**. The author coded as-if-strict throughout. So Step 5 = just the flag flip.
- `tsconfig.app.json` → `"strict": true`. No `any` removal / null-guarding needed.
- **Accept:** MET. `tsc -b + vite` clean under strict; `npm test` 95 passed; no behavioural change. Readiness ~65%.

### Step 6 — Create Signup Flow · P1 · ~1d · ✅ DONE (commit `2518253`)
- New `src/pages/Signup.tsx` (mirrors Login): email + password + confirm; password validation
  (min 8, ≥1 letter, ≥1 number); friendly Firebase error mapping; `isProcessing` button state;
  effect-on-user navigation.
- DEVIATION from prep (intentional, matches existing pattern): did NOT add `signup()` to AuthContext.
  Login calls `loginWithEmail`/`loginWithGoogle` from `auth.ts` directly (context `login()` is dev-mode-only),
  so Signup calls `registerWithEmail` directly too. The pending doc + redirect are ALREADY handled centrally:
  `registerWithEmail` signs the user in → AuthContext `onAuthStateChanged` writes `role:'pending'` →
  `ProtectedRoute` forwards pending→`/pending`. No new pending logic, no `PendingApproval` change.
- router: `{ path: '/signup' }`. Login ↔ Signup cross-links added.
- **Accept:** MET (by construction + build). `tsc -b strict + vite` clean; `npm test` 95; lint-clean.
  NOT live-tested — signup creates a real Firebase Auth account (a user action, not the agent's); verify
  in-browser at `/signup` when convenient. Readiness ~70%.

### Step 7 — Tighten Firestore Rules · P1 · ✅ DONE (curated) — committed `f9c45e0`, ⏳ OWNER DEPLOYS
- CONTEXT (Mustarq): this is his personal app, deployed to Vercel, onboarding location staff who
  self-sign-up. So the real risk is a public-URL registrant reading all data before approval — NOT
  org compliance. Curated to that reality; enterprise items deliberately skipped.
- DONE: new `hasAssignedRole()` (= authed && role != 'pending'); all business-collection reads +
  `_sequences` + the 3 loose `isAuth()` creates → `hasAssignedRole()`. Preserved: users self-read,
  self-register(`role=='pending'`), recipient-gated notifications. Audit append-only already enforced (verified).
- SKIPPED (intentional): Cloud Functions for `_sequences` (would break client number allocation),
  pervasive field validation, rules-level site isolation (UI scopes via Step 3; vetted staff = lower priority).
- ⚠️ Agent did NOT deploy (owner's security boundary). **Deploy:** `firebase deploy --only firestore:rules`
  (validates fail-safe). Post-deploy smoke: super_admin dashboards still load; a fresh signup sees only /pending.
- PARALLEL NOTE: `storage.rules` (file uploads) not reviewed this step — worth a glance if the vault is used publicly.
- **Accept:** rules written + committed; deploy + smoke-test pending on owner. Readiness ~72%.

### Step 8 — Error Monitoring · P1 · ✅ DONE (curated — error boundary only) — commit `b050e39`
- Did the self-contained half (protects staff, stays owner-controlled). Sentry (external SaaS, needs
  account/DSN, sends data out) DEFERRED as a future opt-in — not installed.
- New `src/components/shared/ErrorBoundary.tsx` (class component, no new dep), mounted ABOVE the
  providers + router in `main.tsx`. Catches what RouteError can't (provider errors, top-level
  /login /signup /pending, RouterProvider init). Branded Reload/Home fallback. `reportError()` is the
  single seam to add Sentry later with zero other changes.
- **Accept (re-scoped):** MET. boundary renders fallback on a thrown error; `tsc -b strict + vite` clean;
  `npm test` 95; lint-clean. Readiness ~78%.
- TODO if wanted later: `npm i @sentry/react @sentry/vite-plugin`, init in main.tsx, call
  `Sentry.captureException` inside `ErrorBoundary.reportError`, source maps in prod, set DSN env.

### Step 9 — Code Splitting · P1 · ~1d · ⬜  ← **THE ONLY REMAINING STEP** (Step 10 was done first)
- File: `src/routes/router.tsx` (note: report says `src/router.tsx` — actual path is `src/routes/router.tsx`).
- Wrap route elements in `React.lazy()`; `Suspense` with a loading skeleton; confirm bundle drop in build output.
- NOTE: routes use NAMED exports → lazy at a sensible grain (heavy feature modules) via
  `lazy(() => import('...').then(m => ({ default: m.X })))`, not all ~60 routes mechanically.
- **Accept:** initial bundle smaller (currently ~1.17MB); routes load on demand; no broken routes.

### Step 10 — Offline Persistence · P1 · ✅ DONE + LIVE-VERIFIED (commit `4c04a5e`)
- `client.ts`: `getFirestore` → `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager:
  persistentMultipleTabManager() }) })` (modern SDK; deprecated enableIndexedDbPersistence threw on multi-tab).
- HMR-safe guard: initializeFirestore is NOT idempotent (throws on module re-eval — caught live), so
  try/catch → fall back to `getFirestore(app)`. No-op in prod; fixes dev HMR + re-import.
- Live-verified (real auth): IndexedDB cache `firestore/[DEFAULT]/antrac-erp/main` present; app authed +
  rendering in TWO simultaneous tabs; no multi-tab persistence errors; guard confirmed (no re-init throw).
- Did this BEFORE Step 9 (Mustarq's call — offline is the win non-tech island staff actually feel).
- **Accept:** MET. build (tsc -b strict + vite) clean; `npm test` 95; lint-clean. Readiness ~85%.
- ⚠️ Commit `4c04a5e`'s message overstated "ALL 10 COMPLETE" — premature. **9 of 10 done; Step 9 pending.**

---

## READINESS TRACKING (update after each step)

| After Step | Target band (report) | Notes |
|---|---|---|
| 1–2 | ~45% | P0 stability (login, AI) |
| 3 | ~50% | data isolation |
| 4 | ~60% | tests = the big jump |
| 5 | ~65% | strict types |
| 6–7 | ~72% | onboarding + rule hardening |
| 8 | ~80% | observability |
| 9–10 | ~85–90% | perf + offline |

## COMMIT CADENCE

- One commit per step (Rule 7). Message: `chore(readiness): Step N — <title>`.
- Commit to `master` → push to `local` remote (the established workflow). Public `main` republished separately when the user chooses.
- After each: state the readiness delta in the report-back.

## OUT OF SCOPE (do NOT touch — Rules 3,4,5)

- P2/P3 items (CI/CD, image compression, onSnapshot, time-series, dynamic org, App.tsx consolidation, SVG opt, storage lifecycle).
- The "C" workstream (CSV export / print docs / audit-log report) and "D" hardening — separate track.
- Architecture redesign, speculative refactors, new roadmap items.

---

*Prep complete. Next session: start at Step 1, honour FLAG A + FLAG B, one item at a time.*
