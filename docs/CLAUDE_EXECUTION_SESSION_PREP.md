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

### FLAG A — Step 2 Gemini model/endpoint = CONFIRMED REGRESSION if applied verbatim
- Report says: *"Change MODEL to `gemini-1.5-flash`, change ENDPOINT to `/v1` (not v1beta)."*
- **Live evidence this session:** that exact config (`gemini-1.5-flash` on `/v1`) produced a runtime
  **HTTP 404 — "models/gemini-1.5-flash is not found for API version v1"** in the user's browser console.
- It was fixed to **`gemini-2.0-flash` on `/v1beta`** (commit `b8e794f`), which is the current working state.
- **Action for the implementer:** Apply the *rest* of Step 2 (retry/backoff for 429/503, move prompts to
  `ai.prompts.ts`, add Retry button). **HOLD the model/endpoint revert** — reverting re-introduces a
  confirmed 404. Confirm with Cipher/Mustarq before touching `MODEL`/`ENDPOINT`. Likely the report's
  model line is stale (the 404 only surfaces at runtime with a live key, not in a static scan).

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

### Step 1 — Fix Double Login · P0 · ~2h · 🟨 partial
- File: `src/lib/context/AuthContext.tsx`, `src/pages/Login.tsx`
- Add `setLoading(true)` immediately after the `if (!fbUser)` guard, BEFORE `await getDoc` (FLAG B).
- Add `isProcessing` state to `Login.tsx` → disable button + "Signing in…" during auth transition.
- Keep existing effect-based navigation (already in place).
- **Accept:** sign in (Google + email) once; no redirect-to-login flicker; button disabled mid-auth.

### Step 2 — Stabilize Gemini AI · P0 · ~4h · 🟨 partial (model already fixed)
- File: `src/lib/services/ai.ts` (+ new `src/lib/services/ai.prompts.ts`)
- ⚠️ FLAG A: do NOT revert model/endpoint. Keep `gemini-2.0-flash` / `/v1beta`.
- Add exponential backoff retry for 429 + 503 (max 3 retries).
- Move prompt strings from `AiBrief.tsx` + `AiDiagnosisHint.tsx` → `ai.prompts.ts`.
- Add a "Retry" button to AI error states.
- **Accept:** brief generates; transient 429/503 retried; prompts centralized; build clean.

### Step 3 — Enforce Site Scoping · P0 · ~1d · ⬜
- File: `src/lib/hooks/useWorkflowData.ts`
- Accept `siteIds` (from `AuthContext`); add `where('siteId', 'in', siteIds)` for site-bound roles.
- Apply to `useTicketList`, `useAssetList`, `useStaffList`, and other list hooks.
- NOTE: Firestore `in` is max 10 values; field roles have ≤4 sites so OK. Super/GM (all sites) skip filter.
- NOTE: this session scopes the *dashboards* by siteIds client-side; this step pushes it into the *query*.
- **Accept:** an operator's hooks return only their site's docs; GM/super unchanged; build clean.

### Step 4 — Add Test Coverage · P0 · ~2d · ⬜
- `npm i -D vitest @testing-library/react @testing-library/jest-dom`
- Create `src/lib/workflow/engine.test.ts`; test every transition + role gates + the ticket→PR→PO→approval flow.
- Add a `test` script to package.json.
- **Accept:** `npm test` green; workflow engine covered.

### Step 5 — Enable Strict Types · P1 · ~1-2d · ⬜
- File: `tsconfig.app.json` → `"strict": true`; fix all errors; remove `any`; handle null/undefined.
- **Accept:** `tsc + vite` clean under strict; no behavioural change.

### Step 6 — Create Signup Flow · P1 · ~1d · 🟨 partial (Google self-register exists)
- NOTE: Google sign-ups already self-register as `role: 'pending'` (AuthContext) + SA assigns roles. This step adds the EMAIL/PASSWORD path.
- Create `src/pages/Signup.tsx` (mirror Login); add `signup()` to AuthContext; wire `registerWithEmail`.
- On signup: create user doc `role: 'pending'` → redirect to `PendingApproval`. Add password validation (min 8 + complexity).
- **Accept:** email signup creates a pending user; lands on Pending; SA can assign.

### Step 7 — Tighten Firestore Rules · P1 · ~1d · 🟨 partial
- File: `firestore.rules`
- NOTE this session already: users self-create `role==pending` only; added `deployments`/`deploymentRevenue` rules.
- Remaining: restrict `_sequences` writes (currently `if isAuth()`) — ideally Cloud Functions only; make `auditEvents` strictly append-only (no update/delete — already `if false` on update/delete, verify); add required-field validation on critical collections.
- **Accept:** rules deploy; existing flows still work; sequences/audit locked down.

### Step 8 — Add Sentry Monitoring · P1 · ~1d · ⬜
- `@sentry/react` + `@sentry/vite-plugin`; init in `main.tsx`; error boundary around the router; source maps in prod.
- **Accept:** a thrown error is captured; boundary renders fallback.

### Step 9 — Code Splitting · P1 · ~1d · ⬜
- File: `src/routes/router.tsx` (note: report says `src/router.tsx` — actual path is `src/routes/router.tsx`).
- Wrap route elements in `React.lazy()`; `Suspense` with a loading skeleton; confirm bundle drop in build output.
- **Accept:** initial bundle smaller (currently ~1.17MB); routes load on demand; no broken routes.

### Step 10 — Offline Persistence · P1 · ~4h · ⬜
- File: `src/lib/firebase/client.ts`
- Add IndexedDB persistence (note: `enableIndexedDbPersistence` is deprecated in modern SDK — use
  `initializeFirestore(app, { localCache: persistentLocalCache(...) })` instead; same outcome).
- Handle multi-tab. Test: load, disconnect, verify cached data still loads.
- **Accept:** app loads cached data offline; no console errors on multi-tab.

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
