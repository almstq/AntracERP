import { useEffect, useRef, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { useAssetList, useStaffList, useSiteList } from '../../../lib/hooks/useWorkflowData';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// Minimal typing for the global google.maps we use.
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

export function FleetMap() {
  const { data: sites } = useSiteList();
  const { data: assets } = useAssetList();
  const { data: staff } = useStaffList();
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
    const center = withCoords[0]?.location ?? { lat: 4.1755, lng: 73.5093 };
    const map = new gmaps.Map(mapEl.current, { center, zoom: 7, mapTypeId: 'hybrid' });

    for (const site of withCoords) {
      const siteAssets = assets.filter((a) => a.currentSiteId === site.id);
      const siteStaff = staff.filter((p) => p.siteId === site.id);
      const marker = new gmaps.Marker({ position: site.location, map, title: site.name });
      const info = new gmaps.InfoWindow({
        content: `<div style="color:#111;font-size:12px;min-width:160px">
          <strong>${site.name}</strong><br/>
          ${siteAssets.length} asset(s), ${siteStaff.length} staff
          ${siteAssets.map((a) => `<div>• ${a.code} ${a.make} ${a.model}</div>`).join('')}
          ${siteStaff.map((p) => `<div>· ${p.name} (${p.role})</div>`).join('')}
        </div>`,
      });
      marker.addListener('click', () => info.open(map, marker));
    }
  }, [ready, sites, assets, staff]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-lg font-bold text-text-primary mb-4">Fleet & Staff Map</h1>

      {!MAPS_KEY ? (
        <Card>
          <p className="text-xs text-text-secondary mb-2">Google Maps API key not configured.</p>
          <ol className="text-xs text-text-muted list-decimal ml-4 space-y-1">
            <li>Google Cloud Console → enable <b>Maps JavaScript API</b></li>
            <li>Create an API key, enable <b>billing</b> on the project</li>
            <li>Add <code>VITE_GOOGLE_MAPS_API_KEY=your_key</code> to <code>.env.local</code> and restart dev server</li>
          </ol>
        </Card>
      ) : err ? (
        <Card><p className="text-xs text-red">{err}</p></Card>
      ) : (
        <Card>
          <div ref={mapEl} className="w-full h-[60vh] rounded-lg bg-bg-surface" />
          <p className="text-[10px] text-text-muted mt-2">{assets.length} assets · {staff.length} staff across {sites.filter((s) => s.location).length} located sites</p>
        </Card>
      )}
    </div>
  );
}
