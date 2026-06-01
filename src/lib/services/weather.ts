/**
 * OpenWeatherMap — current weather for WLI sites.
 *
 * Free tier ("Current Weather Data") only: temp, wind, visibility, conditions.
 * No wave data (paid marine API) — wind speed + visibility are the marine-safety
 * signals we surface. Results cached per-site in sessionStorage for 30 min to
 * avoid hammering the API on every dashboard mount.
 */

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function isWeatherConfigured(): boolean {
  return !!API_KEY;
}

export interface SiteWeather {
  siteId: string;
  siteName: string;
  tempC: number;
  windMs: number;
  windDeg: number;
  visibilityM: number;
  humidity: number;
  description: string;
  icon: string;          // e.g. "04d"
  conditionMain: string; // e.g. "Clouds"
  fetchedAt: string;     // ISO
}

interface CacheEntry { data: SiteWeather; ts: number }

function cacheKey(siteId: string) { return `weather:${siteId}`; }

function readCache(siteId: string): SiteWeather | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(siteId));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache(siteId: string, data: SiteWeather) {
  try {
    sessionStorage.setItem(cacheKey(siteId), JSON.stringify({ data, ts: Date.now() } satisfies CacheEntry));
  } catch {
    // sessionStorage full / unavailable — non-fatal, just skip caching
  }
}

export async function fetchSiteWeather(
  siteId: string,
  siteName: string,
  lat: number,
  lng: number,
): Promise<SiteWeather> {
  if (!API_KEY) throw new Error('OpenWeatherMap API key not configured');

  const cached = readCache(siteId);
  if (cached) return cached;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401) throw new Error('Weather key not active yet (can take ~2h after creation)');
    throw new Error(`Weather fetch failed (${res.status})`);
  }
  const j = await res.json();

  const data: SiteWeather = {
    siteId,
    siteName,
    tempC: Math.round(j.main?.temp ?? 0),
    windMs: Math.round((j.wind?.speed ?? 0) * 10) / 10,
    windDeg: j.wind?.deg ?? 0,
    visibilityM: j.visibility ?? 10000,
    humidity: j.main?.humidity ?? 0,
    description: j.weather?.[0]?.description ?? '—',
    icon: j.weather?.[0]?.icon ?? '01d',
    conditionMain: j.weather?.[0]?.main ?? '—',
    fetchedAt: new Date().toISOString(),
  };

  writeCache(siteId, data);
  return data;
}

/** Marine-safety bucket from wind speed (m/s). */
export function windCategory(windMs: number): { label: string; tone: 'teal' | 'amber' | 'red' } {
  if (windMs < 8) return { label: 'calm', tone: 'teal' };
  if (windMs <= 13) return { label: 'moderate', tone: 'amber' };
  return { label: 'rough', tone: 'red' };
}
