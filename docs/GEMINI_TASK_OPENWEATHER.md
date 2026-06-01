# Gemini Task — OpenWeatherMap Vessel Weather Panel

**Read `GEMINI.md` (repo root) first.** Then this spec. Build exactly this, nothing more.

---

## Goal
A compact weather panel on the WLI Command Center showing **current conditions for each WLI
site that has geo-coordinates** — so the GM can see at a glance whether vessels can safely
sail between islands. The operationally important signals are **wind speed** and
**visibility** (rough seas / poor visibility = no sailing).

## Why wind + visibility (not waves)
OpenWeatherMap's **free** tier ("Current Weather Data") does NOT return wave height — that's a
paid marine product. Do not try to fetch wave data. The free endpoint gives temperature, wind
speed + direction, weather description + icon, visibility, humidity, cloud cover. Build around
those. Wind speed is the headline metric.

---

## Reference pattern
Read `src/components/workflow/FleetMapView.tsx` before coding. Mirror its approach for:
- reading the API key from `import.meta.env`
- the **no-key graceful fallback** (a panel with setup steps, not a crash)
- error state styling
- how it's consumed in `src/pages/wli/WLIDashboard.tsx` (you'll add the new panel there)

## Env var
`VITE_OPENWEATHER_API_KEY` — already added to `.env.local` by Mustarq. Read it via
`import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined`.

## API
```
GET https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={KEY}&units=metric
```
Relevant response fields:
- `name` (city/area name — may differ from site name; prefer the SITE name in UI)
- `weather[0].main`, `weather[0].description`, `weather[0].icon` (e.g. `"04d"`)
- `main.temp`, `main.humidity`
- `wind.speed` (metres/sec, because `units=metric`), `wind.deg`
- `visibility` (metres, max 10000)
- `clouds.all` (%)

Icon URL: `https://openweathermap.org/img/wn/{icon}@2x.png`

---

## Files in scope (create/edit ONLY these)
1. **CREATE** `src/lib/services/weather.ts`
   - `export interface SiteWeather { siteId; siteName; tempC; windMs; windDeg; visibilityM; description; icon; conditionMain; }`
   - `export async function fetchSiteWeather(siteId, siteName, lat, lng): Promise<SiteWeather>`
   - One fetch per site. Throw on non-2xx with a readable message.
   - **Surgical caching:** cache each site's result in `sessionStorage` keyed by siteId with a
     timestamp; reuse if < 30 minutes old (avoid hammering the API on every dashboard mount).

2. **CREATE** `src/components/dashboard/WeatherPanel.tsx`
   - Props: `{ sites: (Site & { id: string })[] }` (import `Site` from `../../types/org`).
   - Filter to `sites.filter(s => s.location)`. If none, render nothing (return `null`).
   - No-key fallback: if `VITE_OPENWEATHER_API_KEY` is missing, render a `<Card>` with short
     setup instructions (mirror FleetMapView's fallback). 
   - On mount, fetch weather for each located site (use the service; handle per-site errors so
     one failure doesn't blank the whole panel).
   - Layout: a `<Card header={…"Site Weather"…}>` containing a responsive grid
     (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`). One tile per site:
       - Site name (`text-xs font-medium text-text-primary`)
       - Weather icon (`<img>` from the icon URL, ~40px) + temp (`text-lg`)
       - Wind: `{windMs} m/s` — **colour-coded**: `text-teal` if < 8, `text-amber` if 8–13,
         `text-red` if > 13 (rough). Show a tiny label like "calm / moderate / rough".
       - Visibility: `{(visibilityM/1000).toFixed(1)} km` — `text-amber` if < 5 km.
       - Condition description (`text-[10px] text-text-muted capitalize`).
   - Loading state: simple `text-xs text-text-muted` "Loading weather…" per tile or panel.
   - Use lucide-react icons where helpful (`Wind`, `Eye`, `CloudSun`) — optional.

3. **EDIT** `src/pages/wli/WLIDashboard.tsx`
   - Import `WeatherPanel`. Render it **once**, directly below the existing Stats bar grid and
     above the "Action Required (Inbox)" section. Pass `sites={sites}` (already in scope via
     `useSiteList()`).
   - Do not change anything else in this file.

---

## Acceptance criteria
- [ ] `npm run build` clean (0 TS errors)
- [ ] With a valid key: panel shows one tile per located WLI site with temp, wind (colour-coded),
      visibility, condition + icon.
- [ ] Without a key: graceful fallback card with setup steps — NO crash, NO blank panel.
- [ ] One site's fetch failing does not blank the others.
- [ ] Re-mounting the dashboard within 30 min does NOT re-hit the API (sessionStorage cache works).
- [ ] Only the 3 files above were created/edited. No other files touched. No new dependencies.
- [ ] Styling uses only the tokens listed in GEMINI.md.

## Leave a note when done
List the files you created/edited and any assumptions or deviations, so Claude Code can review.
