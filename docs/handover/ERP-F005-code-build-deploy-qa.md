# ERP-F005 Code / Build / Deploy QA

Date: 2026-06-14

## Scope

Sanity-check role registry seed/hydrate, Firestore security rules, Firebase Hosting config, production build/env checks, and release docs.

## Findings Closed

- Role registry persistence exists in code (`customRoles` plus `appConfig/roleOverrides`) but Firestore rules did not allow those collections. Added assigned-user read and Super Admin write rules.
- CRM rules were mismatched with app collections. The app writes `enquiries`, `quotations`, `workOrders`, `invoices`, and `payments`; rules only covered `crmEnquiries` and `jobs`. Added the real collection rules.
- Fresh-browser custom-role users could be routed before registry hydration. Auth now hydrates role config before setting an assigned live user.
- Firebase Hosting was missing from `firebase.json`. Added `dist` hosting, SPA rewrite, and static asset cache headers.
- Production env validation was implicit. Added `npm run check:prod`, which validates required Firebase web env before running the production build.
- Storage rules allowed any authenticated pending user to read/write attachments. Storage now gates attachments to assigned users, enforces size/content-type checks, and supports uploader/admin deletion for new uploads.

## Release Checklist

1. Populate `.env.local` locally or configure the same variables in the hosting provider:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
2. Optional feature keys:
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_OPENWEATHER_API_KEY`
   - `VITE_GEMINI_API_KEY`
   - `VITE_GEMINI_MODEL`
3. Run `npm run lint`.
4. Run `npm run check:prod`.
5. Deploy rules before opening Finance/CRM data to live users:
   - `firebase deploy --only firestore:rules,storage`
6. Deploy functions after billing/secrets are ready:
   - `firebase deploy --only functions`
7. Deploy hosting if Firebase Hosting is used:
   - `firebase deploy --only hosting`

## Notes

- Built-in role defaults are still code-seeded from `navConfig`; only built-in overrides and custom roles persist to Firestore.
- Existing Storage objects uploaded before this pass may not have `uploadedById` object metadata. Super Admin can still delete those objects; uploader self-delete applies to new uploads.
- Firestore rules remain coarse per collection. The app transition tables still enforce per-stage workflow authority.
