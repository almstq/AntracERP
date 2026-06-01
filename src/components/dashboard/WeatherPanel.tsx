import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Wind, Eye, CloudSun } from 'lucide-react';
import type { Site } from '../../types/org';
import {
  fetchSiteWeather, isWeatherConfigured, windCategory, type SiteWeather,
} from '../../lib/services/weather';

interface Props {
  sites: (Site & { id: string })[];
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
    <div className="rounded-lg bg-bg-surface border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-text-primary truncate">{w.siteName}</span>
        <img
          src={`https://openweathermap.org/img/wn/${w.icon}@2x.png`}
          alt={w.conditionMain}
          width={40} height={40}
          className="-my-2 shrink-0"
        />
      </div>
      <div className="flex items-baseline gap-1 -mt-1">
        <span className="text-lg font-bold text-text-primary">{w.tempC}°</span>
        <span className="text-[10px] text-text-muted capitalize truncate">{w.description}</span>
      </div>
      <div className="mt-2 space-y-1 text-[11px]">
        <div className="flex items-center gap-1.5">
          <Wind size={12} className={TONE_CLASS[wind.tone]} />
          <span className={TONE_CLASS[wind.tone]}>{w.windMs} m/s</span>
          <span className="text-text-muted">· {wind.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye size={12} className={visKm < 5 ? 'text-amber' : 'text-text-muted'} />
          <span className={visKm < 5 ? 'text-amber' : 'text-text-secondary'}>{visKm.toFixed(1)} km</span>
          <span className="text-text-muted">visibility</span>
        </div>
      </div>
    </div>
  );
}

export function WeatherPanel({ sites }: Props) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {weather.map((w) => <WeatherTile key={w.siteId} w={w} />)}
        </div>
      )}
    </Card>
  );
}
