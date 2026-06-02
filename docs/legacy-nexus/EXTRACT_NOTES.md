# Legacy Nexus — Extract Notes

**Source:** `github.com/almstq/antrac-nexus` (the **Flutter** predecessor of this app).
**Extracted:** 2026-06-02, before that GitHub repo was deleted.

The old repo was a Flutter Web build of the same Antrac ERP idea, backed by **Google
Sheets (31-tab workbook) + Google Drive**, with an OpenAI → Gemini → Groq AI fallback.
This current app is the **React 19 + TypeScript + Vite + Firebase** rebuild — same
domain and vision, different (and stronger) stack. Nothing from the Flutter codebase
is reused at runtime; only the **content/knowledge** below was carried over.

## What was kept (here, for provenance)

| File | What it is | Why kept |
|---|---|---|
| `FLUTTER_README.md` | The original, polished README | Source for the company narrative, layer model, SOP, role hierarchy — basis of the new root `README.md` |
| `FLUTTER_SECURITY.md` | Original security policy | Basis of the new root `SECURITY.md` |
| `FLUTTER_LOCAL_DEV.md` | Flutter local-dev notes | Reference (env-injection pattern) |
| `implementation_plan.artifact.md` | "Closed-Loop ERP Vision Alignment" plan | Captures the sidebar/Command-Center/ticket-journey/audit-log intent |
| `wl_icon.svg` | Well Land logo mark (navy + blue pillars + "WL") | Reusable brand asset — also copied to `public/wl_icon.svg` |

## Reusable knowledge carried into the new README

- **Antrac Group narrative** — est. 2003, Malé; "Navigating Excellence"; ~90% of
  foreign trade vessels / cruise / superyacht / naval traffic in Maldivian waters;
  Gold 100 Award; sectors: marine, bunkering & fuel, logistics, resort dev, auto, heavy rental.
- **Two-layer model** — Antrac HQ (Layer 1) over self-contained SBU modules (Layer 2);
  WLI first, then MPL, then EMS.
- **Issue-to-Purchase SOP** — no PR without a GM-approved ticket; every spend traces to an asset fault.
- **Upward-reporting principle** — HQ reads each SBU's live data; SBUs never manually "send" reports.

## Stack differences (old → new)

| Concern | Flutter app | This app |
|---|---|---|
| UI | Flutter Web / Dart | React 19 + TS + Vite + Tailwind (Helix) |
| Database | Google Sheets API (31 tabs) | Cloud Firestore |
| Files | Google Drive API | Firebase Storage (+ SHA-256) |
| AI | OpenAI → Gemini → Groq | Gemini Flash (no-key fallback) |
| Vessel tracking | — | FollowMe AIS (server-cached) |
| Hosting | Vercel (Flutter build) | Vercel (Vite build) + Firebase Functions |

> The old `DEV_TIMELINE.md`, `PHASE8_HANDOVER.md`, and `OPENAI_MIGRATION_PLAN.md`
> referenced in the Flutter README were **not present** in the repo snapshot (they lived
> outside the `app/` folder that was pushed). Nothing else of value was left behind.
