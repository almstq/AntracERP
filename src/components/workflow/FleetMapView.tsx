import { useEffect, useRef, useState } from 'react';
import type { Site } from '../../types/org';
import type { Asset } from '../../types/asset';
import type { Staff } from '../../types/org';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

declare global {
  interface Window { google?: { maps?: unknown }; __gmapsLoading?: Promise<void> }
}

function loadMaps(key: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (window.__gmapsLoading) return window.__gmapsLoading;
  window.__gmapsLoading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(s);
  });
  return window.__gmapsLoading;
}

interface Props {
  sites: (Site & { id: string })[];
  assets: (Asset & { id: string })[];
  staff: (Staff & { id: string })[];
  height?: string;
}

export function FleetMapView({ sites, assets, staff, height = '60vh' }: Props) {
  const mapEl = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!MAPS_KEY) return;
    loadMaps(MAPS_KEY).then(() => setReady(true)).catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (!ready || !mapEl.current || sites.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gmaps = (window.google as any).maps;
    const withCoords = sites.filter((s) => s.location);
    if (withCoords.length === 0) return;
    const center = withCoords[0].location!;
    const map = new gmaps.Map(mapEl.current, { center, zoom: 7, mapTypeId: 'hybrid', disableDefaultUI: false });

    for (const site of withCoords) {
      const siteAssets = assets.filter((a) => a.currentSiteId === site.id);
      const siteStaff = staff.filter((p) => p.siteId === site.id);
      const marker = new gmaps.Marker({ position: site.location, map, title: site.name });
      const info = new gmaps.InfoWindow({
        content: `<div style="color:#111;font-size:12px;min-width:160px">
          <strong>${site.name}</strong><br/>${siteAssets.length} asset(s), ${siteStaff.length} staff
          ${siteAssets.map((a) => `<div>• ${a.code} ${a.make} ${a.model}</div>`).join('')}
          ${siteStaff.map((p) => `<div>· ${p.name} (${p.role})</div>`).join('')}
        </div>`,
      });
      marker.addListener('click', () => info.open(map, marker));
    }
  }, [ready, sites, assets, staff]);

  if (!MAPS_KEY) {
    return (
      <div className="rounded-lg bg-bg-surface border border-border p-4" style={{ minHeight: height }}>
        <p className="text-xs text-text-secondary mb-2">Google Maps API key not configured.</p>
        <ol className="text-xs text-text-muted list-decimal ml-4 space-y-1">
          <li>Google Cloud Console → enable <b>Maps JavaScript API</b></li>
          <li>Create an API key, enable <b>billing</b></li>
          <li>Add <code>VITE_GOOGLE_MAPS_API_KEY=key</code> to <code>.env.local</code>, restart dev server</li>
        </ol>
      </div>
    );
  }
  if (err) return <div className="rounded-lg bg-bg-surface border border-border p-4 text-xs text-red">{err}</div>;
  return <div ref={mapEl} className="w-full rounded-lg bg-bg-surface" style={{ height }} />;
}
