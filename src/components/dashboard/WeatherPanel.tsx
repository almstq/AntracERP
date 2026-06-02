import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Wind, Eye, CloudSun } from 'lucide-react';
import type { Site } from '../../types/org';
import {
  fetchSiteWeather, isWeatherConfigured, windCategory, type SiteWeather,
} from '../../lib/services/weather';

interface Props {
  sites: (Site & { id: string })[];
  variant?: 'card' | 'helix';
}

const HELIX_TONE: Record<'teal' | 'amber' | 'red', string> = {
  teal: 'var(--positive)', amber: 'var(--warning)', red: 'var(--danger)',
};

function HelixWeatherTile({ w }: { w: SiteWeather }) {
  const wind = windCategory(w.windMs);
  const visKm = w.visibilityM / 1000;
  return (
    <div className="wx">
      <div className="wx-top">
        <div>
          <div className="wx-name">{w.siteName}</div>
          <div className="wx-cond">{w.description}</div>
        </div>
        <span className="wx-ic">
          <img src={`https://openweathermap.org/img/wn/${w.icon}@2x.png`} alt={w.conditionMain} width={34} height={34} />
        </span>
      </div>
      <div className="wx-temp num">{w.tempC}°</div>
      <div className="wx-metrics">
        <span className="wx-m" style={{ color: HELIX_TONE[wind.tone] }}>
          <Wind /><span className="v">{w.windMs} m/s</span>
          <span style={{ color: 'var(--text-muted)' }}>{wind.label}</span>
        </span>
        <span className="wx-m" style={{ color: visKm < 5 ? 'var(--warning)' : 'var(--text-muted)' }}>
          <Eye /><span className="v">{visKm.toFixed(1)} km</span>
          <span style={{ color: 'var(--text-muted)' }}>vis</span>
        </span>
      </div>
    </div>
  );
}

const TONE_CLASS: Record<'teal' | 'amber' | 'red', string> = {
  teal: 'text-teal',
  amber: 'text-amber',
  red: 'text-red',
};

function WeatherTile({ w }: { w: SiteWeather }) {
  const wind = windCategory(w.windMs);
  const visKm = w.visibilityM / 1000;
  return (
    <div className="rounded-lg bg-bg-surface border border-border p-6 flex flex-col gap-5">
      {/* Name + condition + icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-text-primary truncate">{w.siteName}</p>
          <p className="text-[10px] text-text-muted capitalize truncate">{w.description}</p>
        </div>
        <img
          src={`https://openweathermap.org/img/wn/${w.icon}@2x.png`}
          alt={w.conditionMain}
          width={44} height={44}
          className="-mt-1 shrink-0"
        />
      </div>

      {/* Temperature */}
      <div className="text-3xl font-bold text-text-primary leading-none">{w.tempC}°</div>

      {/* Metrics — full-width row, divider above */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border-soft text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Wind size={13} className={`${TONE_CLASS[wind.tone]} shrink-0`} />
          <span className={`${TONE_CLASS[wind.tone]} font-medium`}>{w.windMs} m/s</span>
          <span className="text-text-muted truncate">{wind.label}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <Eye size={13} className={`${visKm < 5 ? 'text-amber' : 'text-text-muted'} shrink-0`} />
          <span className={visKm < 5 ? 'text-amber font-medium' : 'text-text-secondary'}>{visKm.toFixed(1)} km</span>
          <span className="text-text-muted truncate">vis</span>
        </div>
      </div>
    </div>
  );
}

export function WeatherPanel({ sites, variant = 'card' }: Props) {
  const located = sites.filter((s) => s.location);
  const [weather, setWeather] = useState<SiteWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [errCount, setErrCount] = useState(0);

  useEffect(() => {
    if (!isWeatherConfigured() || located.length === 0) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    Promise.allSettled(
      located.map((s) => fetchSiteWeather(s.id, s.name, s.location!.lat, s.location!.lng)),
    ).then((results) => {
      if (cancelled) return;
      const ok = results.filter((r): r is PromiseFulfilledResult<SiteWeather> => r.status === 'fulfilled').map((r) => r.value);
      setWeather(ok);
      setErrCount(results.length - ok.length);
      setLoading(false);
    });
    return () => { cancelled = true; };
    // located is derived from sites; depend on the id list so we refetch when sites change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [located.map((s) => s.id).join(',')]);

  // No located sites — nothing to show
  if (located.length === 0) return null;

  // Helix variant — bare tile grid (no Card wrapper)
  if (variant === 'helix') {
    if (!isWeatherConfigured()) return <div className="empty-note">Weather not configured — add VITE_OPENWEATHER_API_KEY.</div>;
    if (loading) return <div className="empty-note">Loading weather…</div>;
    if (weather.length === 0) return <div className="empty-note">Weather unavailable. A new key can take ~2h to activate.</div>;
    return <div className="wx-grid">{weather.map((w) => <HelixWeatherTile key={w.siteId} w={w} />)}</div>;
  }

  // Key missing — graceful setup fallback
  if (!isWeatherConfigured()) {
    return (
      <Card header={<span className="text-sm font-medium flex items-center gap-2"><CloudSun size={14} /> Site Weather</span>}>
        <p className="text-xs text-text-secondary mb-2">OpenWeatherMap API key not configured.</p>
        <ol className="text-xs text-text-muted list-decimal ml-4 space-y-1">
          <li>Get a free key at <b>openweathermap.org</b> (Current Weather Data)</li>
          <li>Add <code>VITE_OPENWEATHER_API_KEY=key</code> to <code>.env.local</code></li>
          <li>Restart the dev server</li>
        </ol>
      </Card>
    );
  }

  return (
    <Card header={
      <div className="flex items-center justify-between w-full">
        <span className="text-sm font-medium flex items-center gap-2"><CloudSun size={14} /> Site Weather</span>
        {errCount > 0 && <span className="text-[10px] text-amber">{errCount} site(s) unavailable</span>}
      </div>
    }>
      {loading ? (
        <p className="text-xs text-text-muted py-2">Loading weather…</p>
      ) : weather.length === 0 ? (
        <p className="text-xs text-text-muted py-2">
          Weather unavailable. If the key is new, it can take ~2h to activate.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {weather.map((w) => <WeatherTile key={w.siteId} w={w} />)}
        </div>
      )}
    </Card>
  );
}
