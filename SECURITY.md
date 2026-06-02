# Security Policy

## Supported Versions

Antrac Nexus is under active private development. Security fixes are applied to the
current `main` branch only until formal release versioning is introduced.

| Version / Branch | Supported |
|---|---|
| `main` | Yes |
| Production (Vercel) deployment | Yes |
| Local development builds | Best effort |
| Archived commits / old handovers | No |

## Reporting a Vulnerability

**Please do not open public GitHub issues for security concerns.**

Report suspected vulnerabilities privately to the project owner (GitHub private
vulnerability reporting if enabled, or direct contact with the Antrac Nexus
administrator). Include as much detail as possible:

- Affected page, module, Firestore collection, Cloud Function, or workflow
- Steps to reproduce
- Screenshots or logs, with secrets redacted
- Whether it affects localhost, Vercel production, Firebase Auth, Firestore/Storage,
  Cloud Functions, Google Maps, FollowMe, or the AI providers

### Response Expectations

| Severity | Examples | Target Response |
|---|---|---|
| **Critical** | Exposed credentials, auth bypass, service-account leakage, finance-data exposure | Same day |
| **High** | Role escalation, unauthorized data access, unsafe Cloud Function behaviour | 1–2 business days |
| **Medium** | Dependency vulnerability, limited information disclosure, workflow hardening | 3–5 business days |
| **Low** | Documentation issue, low-risk configuration concern | Best effort |

Accepted vulnerabilities are fixed privately before public discussion. Declined
reports receive a short explanation where possible.

## Secrets & Credentials

Do not commit credentials, API keys, service-account JSON, OAuth client secrets,
`.env` / `.env.local` files, or generated local config.

Required runtime values must be injected through:

- Local environment variables (`.env.local`, gitignored)
- Vercel environment variables
- Firebase Cloud Functions config (for server-side keys)

Known sensitive surfaces:

- Firebase web configuration values
- Firebase Admin / service-account JSON (seed & admin scripts)
- Google Maps API key
- Gemini API key (server-side / functions)
- FollowMe API key (`FOLLOWME_KEY`, server-side)
- OpenWeatherMap API key

If a secret is accidentally committed: **rotate it immediately**, restrict its
allowed APIs/domains in Google Cloud Console, and resolve the GitHub secret-scanning
alert only after the key is revoked or safely restricted.

## Current Security Posture

Current repository state: **DEBUG-SAFE**, not yet **PRODUCTION-SECURE**.

Before treating Antrac Nexus as production-secure, verify:

- [ ] Exposed keys rotated or restricted in Google Cloud Console
- [ ] Vercel environment variables complete and correctly scoped
- [ ] Firebase Auth, Google OAuth origins, and API-key restrictions match production domains
- [ ] **Firestore security rules** reviewed — workflow-participant gates and per-collection
      rules tightened beyond the current coarse gates; side-effects moved server-side where needed
- [ ] Firebase Storage rules reviewed
- [ ] Secret-scanning alerts reviewed and resolved

> Note: workflow side-effects currently run client-side under the actor's auth, with
> coarse Firestore rules. Hardening path: move side-effects to Cloud Functions and
> tighten rules to fine-grained per-role authority before Finance data goes live.
