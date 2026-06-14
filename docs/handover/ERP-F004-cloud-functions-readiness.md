# ERP-F004 — Cloud Functions Hardening Readiness Audit

**Date:** 2026-06-12
**Last Updated:** 2026-06-12 (operator pre-condition verification)
**Status:** Audit/Planning only — no code changes
**Depends on:** ERP-F003 (next actionable)

## Executive Summary

Firebase project is configured and authenticated. Functions source code exists with 2 functions (weeklyOpsSnapshot, syncFollowMe). Cloud Functions API enabled and billing configured by operator. Deploy test intentionally deferred — ready for first deploy attempt. Firestore rules are comprehensive. Client-side side effects are identified and documented for migration planning.

## 1. Firebase Project State

| Item | Status | Detail |
|---|---|---|
| Login | ✓ | a.musthaq@gmail.com |
| Project | ✓ | antrac-erp (ID: antrac-erp) |
| Project Number | ✓ | 495293655582 |
| .firebaserc | ✓ | default → antrac-erp |
| firebase.json | ✓ | Configured for Firestore, Storage, Functions |
| Firestore DB | ✓ | (default), location: asia-south1 |
| Firestore Rules | ✓ | Comprehensive (see §4) |
| Firestore Indexes | ✓ | 8 composite indexes |
| Storage Rules | ✓ | Configured |
| Functions Source | ✓ | functions/src/index.ts (397 lines) |
| Cloud Functions API | ✅ **ENABLED** | Confirmed by operator in Google Cloud Console |
| Billing | ✅ **CONFIGURED** | Confirmed by operator |
| Deploy Test | ⏳ **NOT YET ATTEMPTED** | `firebase deploy --only functions` intentionally deferred |
| Functions List | ⏳ **PENDING** | `firebase functions:list` — expected to work after deploy |

## 2. Functions Source Analysis

**File:** `functions/src/index.ts` (397 lines)

### Function 1: `weeklyOpsSnapshot`
- **Trigger:** Scheduled, every Sunday 23:59 MV (UTC+5) = 18:59 UTC
- **Memory:** 512MiB, timeout 300s
- **Region:** asia-south1
- **What it does:**
  - Queries Firestore for week's tickets, PRs, POs, fuel requests, work orders, document uploads
  - Builds PDF snapshot using pdfkit
  - Uploads to Firebase Storage (`snapshots/{weekLabel}.pdf`)
  - Creates a `documents` vault record
- **Side effects:** Storage write, Firestore document create
- **Dependencies:** pdfkit, firebase-admin, firebase-functions

### Function 2: `syncFollowMe`
- **Trigger:** Scheduled, every 1 minute
- **Memory:** 256MiB, timeout 30s
- **Region:** asia-south1
- **What it does:**
  - Reads FOLLOWME_KEY from env/secret
  - Calls FollowMe API v5 (GET /api/v5/my/{key}/)
  - Normalizes vessel data (lat, lng, speed, heading, online status)
  - Writes to `followmeCache` collection (batch write)
  - Writes meta to `followmeMeta/status`
- **Side effects:** Firestore batch write (followmeCache), meta write
- **Dependencies:** None (uses native fetch)
- **Compliance:** Server-side only, browser never calls FollowMe API

### Build Configuration
- **Node:** 20
- **Dependencies:** firebase-admin ^12.0.0, firebase-functions ^5.0.0, pdfkit ^0.14.0
- **Dev deps:** @types/node, @types/pdfkit, typescript ^5.3.0
- **Output:** lib/index.js

## 3. Why `firebase functions:list` Fails

Possible causes (in order of likelihood):

1. **No functions deployed yet** — Source exists but `firebase deploy --only functions` may not have been run
2. **Cloud Functions API not enabled** — Google Cloud Console may need `cloudfunctions.googleapis.com` enabled
3. **Billing not configured** — Cloud Functions requires billing enabled on the project
4. **Permission issue** — Firebase CLI may not have `cloudfunctions.functions.list` permission
5. **Region mismatch** — Functions configured for `asia-south1` but project may not support it

**Pre-ERP-F004 actions needed:**
- [ ] Verify Cloud Functions API is enabled in Google Cloud Console
- [ ] Verify billing is configured
- [ ] Attempt `firebase deploy --only functions` to deploy existing functions
- [ ] If deploy fails, check error message for root cause
- [ ] After successful deploy, verify with `firebase functions:list`

## 4. Firestore Rules Summary

**File:** `firestore.rules` — Comprehensive, production-ready

### Auth Model
- `hasRole(role)` — checks `userRoles/{uid}.role`
- `hasAssignedRole()` — checks for non-pending, non-empty role
- `isOwner(uid)` — document ownership check

### Role Helpers
- `isSuperAdmin()`, `isGm()`, `isSiteManager(role)`, `isMechanic(role)`, `isProcurement(role)`, `isFinance(role)`, `isInventory(role)`, `isWliStaff(role)`

### Collection Access
| Collection | Read | Write | Notes |
|---|---|---|---|
| users | self | self (limited) | Pending signup flow |
| userRoles | auth | admin only | Role assignment |
| sites | role-gated | admin/GM | Site-scoped |
| staff | role-gated | admin/GM | Site-scoped |
| assets | role-gated | admin/GM | Site-scoped |
| tickets | role-gated | workflow participants | Timeline append-only |
| purchaseRequests | role-gated | workflow participants | Timeline append-only |
| purchaseOrders | role-gated | workflow participants | Timeline append-only |
| fuelRequests | role-gated | workflow participants | Timeline append-only |
| workOrders | role-gated | CRM workflow | |
| documents | auth | upload/append | Vault |
| followmeCache | auth | **no client writes** | Server-only (syncFollowMe) |
| followmeMeta | auth | **no client writes** | Server-only |
| notifications | user-specific | system | |
| auditEvents | auth | append-only | |
| suppliers | role-gated | admin/GM | |
| inventoryBalances | role-gated | admin/GM | |
| stockMovements | role-gated | admin/GM | |
| stockTransfers | role-gated | admin/GM | |
| sequenceCounters | admin | admin | |
| customers | role-gated | CRM | |
| crmEnquiries | role-gated | CRM | |
| jobs | role-gated | CRM | |
| aiTasks | admin | admin | |
| deployments | role-gated | admin/GM | |
| deploymentRevenue | role-gated | admin/GM | |

### Key Security Rules
- `followmeCache` and `followmeMeta`: **No client writes** — server-only via Cloud Functions
- `auditEvents`: Append-only (create allowed, update/delete denied)
- `timeline` subcollections: Append-only on tickets, PRs, POs, fuel requests
- `userRoles`: Only readable by authenticated users, writable by admin

## 5. Client-Side Side Effects (Migration Candidates for ERP-F004)

These are currently client-side operations that should be migrated to Cloud Functions for atomicity, security, and reliability.

### 5.1 Inventory Transactions
**File:** `src/lib/services/inventory.ts`
- `runTransaction()` — atomic stock balance update + movement recording
- `nextSeq()` — sequence counter increment (race condition risk)
- **Migration:** Move to Cloud Function triggered by inventory events

### 5.2 Document Upload/Delete
**File:** `src/lib/firebase/storage.ts`
- `uploadEntityFile()` — parallel SHA-256 + storage upload, then Firestore writes
- `deleteEntityFile()` — storage delete + vault doc delete + arrayRemove
- **Risk:** Client can fail mid-write, leaving orphaned storage objects or inconsistent Firestore state
- **Migration:** Cloud Function triggered by Storage upload event

### 5.3 Batch Operations
**File:** `src/lib/firebase/db.ts`
- `newBatch()`, `batchUpdate()`, `batchAddSub()`, `batchAddTop()`
- Used for atomic multi-write transitions
- **Risk:** Client-side batch limited to 500 operations, no retry logic
- **Migration:** Cloud Function for complex multi-step transitions

### 5.4 Workflow Transitions
**File:** `src/lib/workflow/` (definitions with `sideEffects`)
- Side effects defined: `SOFT_RESERVE_ASSETS`, `CREATE_WORK_ORDER`, `DEDUCT_INVENTORY_BALANCE`, `RECEIVE_INTO_INVENTORY`, `TRIGGER_DELIVERY`, `CHECK_AND_CLOSE_PR`, `GENERATE_PRICE_COMPARE`, `CREATE_PO_PER_SUPPLIER`
- **Current:** Client executes side effects after state transition
- **Risk:** Partial execution, race conditions, no rollback
- **Migration:** Cloud Functions triggered by Firestore document changes

### 5.5 Notification Creation
**File:** `src/lib/workflow/notifications.ts`
- Client writes to `notifications` collection
- **Migration:** Cloud Function triggered by workflow state changes

### 5.6 Audit Event Logging
**File:** Various
- Client appends to `auditEvents` collection
- **Risk:** Client can skip or forge audit entries
- **Migration:** Cloud Function triggered by any document change

## 6. ERP-F004 Implementation Phases (Proposed)

### Phase A — Deploy Existing Functions
1. Enable Cloud Functions API in Google Cloud Console
2. Verify billing is configured
3. Deploy: `firebase deploy --only functions`
4. Verify: `firebase functions:list`
5. Test: Trigger `weeklyOpsSnapshot` manually via emulator

### Phase B — Audit & Monitoring
1. Add error logging/alerting to existing functions
2. Set up Cloud Monitoring dashboards
3. Test FollowMe sync with real API key
4. Verify PDF generation and storage upload

### Phase C — Migrate Client-Side Side Effects
1. Inventory transactions → Cloud Function
2. Document upload/delete → Storage-triggered Cloud Function
3. Workflow side effects → Firestore-triggered Cloud Function
4. Notification creation → Firestore-triggered Cloud Function
5. Audit logging → Firestore-triggered Cloud Function

### Phase D — Hardening
1. Add retry logic and dead letter queues
2. Implement idempotency for all functions
3. Add input validation
4. Set up function-level IAM
5. Configure secrets (FOLLOWME_KEY) via Secret Manager

## 7. Rollback Strategy

- All Cloud Functions deployed with `--only functions` — no impact on Firestore rules or Storage
- Client-side code remains functional during migration (dual-write period)
- Feature flags can control client vs. server execution
- Functions can be deleted without affecting client code
- Firestore rules already block client writes to server-only collections

## 8. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Cloud Functions API not enabled | ✅ **RESOLVED** | Confirmed enabled by operator 2026-06-12 |
| Billing not configured | ✅ **RESOLVED** | Confirmed configured by operator 2026-06-12 |
| Region asia-south1 not supported | MEDIUM | Test deploy, fallback to us-central1 |
| Functions deploy fails | MEDIUM | Use emulator for local testing first |
| Client-side migration breaks existing flows | MEDIUM | Dual-write period, feature flags |
| FollowMe API key not available | LOW | Function handles missing key gracefully |
| Deploy test not yet run | **NEW** | Ready for first deploy — no infrastructure blockers remain |

## 9. Pre-Conditions for ERP-F004 Coding

- [x] ~~Cloud Functions API enabled~~ ✅ Confirmed by operator 2026-06-12
- [x] ~~Billing configured on Google Cloud project~~ ✅ Confirmed by operator 2026-06-12
- [ ] `firebase deploy --only functions` succeeds — **READY TO ATTEMPT**
- [ ] `firebase functions:list` returns deployed functions — pending deploy
- [ ] Emulator tested locally
- [x] ERP-F003 (Machine Status Report) — next actionable per roadmap (ERP-F004 can proceed in parallel or after)
