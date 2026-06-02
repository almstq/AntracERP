# FollowMe Vessel Tracking — Integration

**Status:** Architecture built & policy-compliant (v0.26.0). **Inert until an API key is provisioned.**
**Policy source:** FollowMe API integration policy (internal handoff).
**API docs:** https://followme.mv/api · use **v5** only.

---

## ⚠️ ACTION REQUIRED (Mustarq / Nexus)

The integration is wired but **cannot show live data until two things happen**:

1. **Request an API key** from **info@followme.mv** (keys are issued by request; they
   grant access to the vessels under your account).
2. **Set the key server-side** (never in the browser):
   ```
   cd functions
   firebase functions:secrets:set FOLLOWME_KEY      # or set env FOLLOWME_KEY
   npm install && npm run build && firebase deploy --only functions,firestore:rules
   ```
   Then `syncFollowMe` runs every minute and the app lights up automatically.

> **One unknown to verify with a live sample:** the v5 response **field names**
> (lat/lng/speed/heading/etc.) are **not documented**. The backend stores the raw
> payload + a best-effort normalization (`normalizeVessel` in `functions/src/index.ts`).
> When the first real response arrives, check `followmeCache` docs and adjust the
> `pickNum`/`pickStr` key lists if a field didn't map.

---

## Compliance with FollowMe Terms of Use

| Requirement | How it's met |
|-------------|--------------|
| **API key server-side only** | `FOLLOWME_KEY` read in the Cloud Function; never shipped to the browser |
| **Browser never calls FollowMe API** | Frontend reads the Firestore **cache** only (`useFollowMeFleet`). The only browser→followme.mv contact is an outbound hyperlink to their *public web page* (not the API) |
| **≤ 1 request / 60s** | `syncFollowMe` scheduled `every 1 minutes`, one call to the fleet endpoint |
| **Mandatory branding** | `FollowMeBadge` ("Powered by FollowMe Tracking Service" + official logo `followme.mv/api/images/icon_50.png`) on the Map page and every vessel's Live Tracking card |
| **Graceful downtime** | Failures write `followmeMeta/status {ok:false,error}`; UI shows "FollowMe service temporarily unavailable", never crashes |
| **Internal-ops only (not a paid feature)** | Shown only inside the internal Antrac ops portal, behind auth; not exposed to paying customers |

## Architecture (mandated)

```
Browser (React)                Firestore (cache)            Cloud Function            FollowMe API v5
─────────────                  ─────────────────            ──────────────            ───────────────
useFollowMeFleet()  ──read──>  followmeCache/{id}   <─write──  syncFollowMe   ──GET──>  /my/{key}/
FleetMapView / AssetDetail      followmeMeta/status            (every 60s)               (key = path seg)
```

The browser **never** holds the key or calls FollowMe's API.

## v5 API contract (from https://followme.mv/api/v5)

- Base: `https://followme.mv/api/v5/` · key is a **path segment**.
- `GET /my/{key}/` — list vessels under your account *(used by the cache)*
- `GET /my/{key}/{vesselId}/` — single vessel
- `GET /public/{key}/` and `/public/{key}/{vesselId}/` — public vessels
- Response JSON shape: **undocumented** → stored raw + normalized (see above).

## Files

| File | Role |
|------|------|
| `functions/src/index.ts` → `syncFollowMe` | Scheduled (1 min) server-side cache: fetch v5 fleet → `followmeCache` + `followmeMeta` |
| `src/lib/services/followme.ts` | `useFollowMeFleet()` reads the Firestore cache; `followMeStatusText()` |
| `src/components/shared/FollowMeBadge.tsx` | Mandatory attribution badge + logo |
| `src/types/asset.ts` → `trackingId`, `followMeUrl()` | Per-vessel FollowMe ID + public-page URL |
| `src/pages/wli/registers/AssetDetail.tsx` | Vessel Live Tracking card (ID field, live position, badge) |
| `src/components/workflow/FleetMapView.tsx` | Plots live vessel GPS markers from the cache |
| `src/pages/wli/registers/FleetMap.tsx` | Map page: live vessels + legend + badge |
| `firestore.rules` | `followmeCache` / `followmeMeta` — read: auth; write: false (function only) |

## Cache schema

`followmeCache/{followmeId}`: `{ followmeId, name, lat, lng, speed, heading, lastUpdate, online, raw, cachedAt }`
`followmeMeta/status`: `{ ok, lastSync, count, error }`

## Vessel registry link

`Asset.trackingId` **is** the FollowMe vessel ID (e.g. WL-VS-0001 → `18599`). Set it on
the vessel's detail page (Edit → "FollowMe Tracking ID"). The cache is keyed by this ID,
so a vessel's live position resolves by `positions[asset.trackingId]`.

---

## Deferred (next phase) — dedicated "Fleet Operations" module

The policy asks for a dedicated sidebar section **Fleet Operations** with submenus:
**Live Fleet · Vessel Tracking · Vessel History · ETA Board · FollowMe Registry**, with
role gating (GM full · Operations tracking+ETA · Finance view · Management dashboard).
The data layer (cache + hook + map) is ready; these are presentation pages to build once
the key is live and the real response shape is confirmed. **Trip history / ETA** also need
periodic snapshot persistence (extend `syncFollowMe` to append position history).
