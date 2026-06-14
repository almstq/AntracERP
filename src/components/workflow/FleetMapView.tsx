import { useEffect, useRef, useState } from 'react';
import type { Site } from '../../types/org';
import type { Asset } from '../../types/asset';
import type { Staff } from '../../types/org';
import { STAFF_TYPE_LABEL } from '../../types/org';

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

// ── Google Maps dark style (matches the Helix dark surfaces) ──────────────────
const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0f151d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f151d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9DAFBD' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#232D39' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1A212B' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#5F6E7C' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1016' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#34414F' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#10151c' }] },
];

interface ThemeColors { site: string; asset: string; staff: string; label: string; infoBg: string; infoText: string; infoSub: string; }
function colorsFor(dark: boolean): ThemeColors {
  return dark
    ? { site: '#2FD4C0', asset: '#5B9DF5', staff: '#A9E635', label: '#E9F1F7', infoBg: '#151B24', infoText: '#E9F1F7', infoSub: '#9DAFBD' }
    : { site: '#0C9E8D', asset: '#2E73D8', staff: '#5E920F', label: '#0C141C', infoBg: '#FFFFFF', infoText: '#0C141C', infoSub: '#788593' };
}

interface Props {
  sites: (Site & { id: string })[];
  assets: (Asset & { id: string })[];
  staff: (Staff & { id: string })[];
  height?: string;
  focusSiteIds?: string[];
}

export function FleetMapView({ sites, assets, staff, height = '60vh', focusSiteIds = [] }: Props) {
  const mapEl = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') !== 'light');

  useEffect(() => {
    if (!MAPS_KEY) return;
    loadMaps(MAPS_KEY).then(() => setReady(true)).catch((e) => setErr(e.message));
  }, []);

  // Re-style the map when the app theme toggles.
  useEffect(() => {
  const obs = new MutationObserver(() => setDark(document.documentElement.getAttribute('data-theme') !== 'light'));
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => obs.disconnect();
  }, []);

  useEffect(() => {
  if (!ready || !mapEl.current || sites.length === 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gmaps = (window.google as any).maps;
  const focus = new Set(focusSiteIds);
  const withCoords = sites.filter((s) => s.location);
  const focusSites = focus.size > 0 ? withCoords.filter((s) => focus.has(s.id)) : withCoords;
  const boundsSites = focusSites.length > 0 ? focusSites : withCoords;
  if (withCoords.length === 0) return;
  const isTerritoryView = focus.size > 0 && focusSites.length > 0;
  const c = colorsFor(dark);

  const map = new gmaps.Map(mapEl.current, {
    center: boundsSites[0].location!,
    zoom: isTerritoryView ? 15 : 10,
    mapTypeId: 'roadmap',
    disableDefaultUI: false,
    gestureHandling: 'cooperative',
    styles: dark ? DARK_STYLE : [],
    backgroundColor: dark ? '#0f151d' : '#E7ECF1',
  });

  const bounds = new gmaps.LatLngBounds();
  for (const site of boundsSites) bounds.extend(site.location!);
  map.fitBounds(bounds);
  gmaps.event.addListenerOnce(map, 'idle', () => {
    const maxZoom = isTerritoryView ? (boundsSites.length === 1 ? 16 : 14) : 13;
    const minZoom = isTerritoryView ? 13 : 8;
    if (map.getZoom() > maxZoom) map.setZoom(maxZoom);
    if (map.getZoom() < minZoom) map.setZoom(minZoom);
  });

  const dot = (fill: string, scale = 6) => ({
    path: gmaps.SymbolPath.CIRCLE, scale, fillColor: fill, fillOpacity: 1, strokeColor: c.infoBg, strokeWeight: 2,
  });
  const openInfo = (marker: unknown, html: string) => {
    const info = new gmaps.InfoWindow({ content: `<div style="color:${c.infoText};font-size:12px;min-width:170px;padding:2px 4px">${html}</div>` });
    (marker as { addListener: (e: string, cb: () => void) => void }).addListener('click', () => info.open(map, marker));
  };

  // Staff effective site = assigned asset's site, else own site.
  const assetById = new Map(assets.map((a) => [a.id, a]));
  const staffSite = (p: Staff & { id: string }) =>
    (p.assignedAssetId && assetById.get(p.assignedAssetId)?.currentSiteId) || p.siteId;

  for (const site of withCoords) {
    const siteAssets = assets.filter((a) => a.currentSiteId === site.id);
    const siteStaff = staff.filter((p) => staffSite(p) === site.id);

    // Site marker (named).
    const siteMarker = new gmaps.Marker({
      position: site.location, map, title: site.name,
      label: { text: site.name, color: c.label, fontSize: '11px', fontWeight: 'bold' },
      icon: dot(c.site, 10), zIndex: 50,
    });
    openInfo(siteMarker,
      `<strong style="font-size:13px">${site.name}</strong>
       <div style="color:${c.infoSub};margin:4px 0">${siteAssets.length} asset(s) · ${siteStaff.length} staff</div>`);

    // Ring out the assets + staff around the site so they're individually visible.
    const ring = [
      ...siteAssets.map((a) => ({ kind: 'asset' as const, a })),
      ...siteStaff.map((p) => ({ kind: 'staff' as const, p })),
    ];
    const R = isTerritoryView ? 0.0028 : 0.0055; // tighter ground spread for site users
    ring.forEach((item, i) => {
      const ang = (2 * Math.PI * i) / Math.max(ring.length, 1);
      const pos = { lat: site.location!.lat + R * Math.cos(ang), lng: site.location!.lng + R * Math.sin(ang) };
      if (item.kind === 'asset') {
        const m = new gmaps.Marker({ position: pos, map, title: item.a.code, icon: dot(c.asset, 6), zIndex: 20 });
        openInfo(m, `<strong>${item.a.code}</strong> — ${item.a.make} ${item.a.model}
          <div style="color:${c.infoSub};margin-top:2px">${item.a.type} · ${item.a.operationalStatus}</div>
          <div style="color:${c.asset};font-size:10px;margin-top:2px">${site.name}</div>`);
      } else {
        const p = item.p;
        const onAsset = p.assignedAssetId ? assetById.get(p.assignedAssetId) : undefined;
        const type = p.staffType ? STAFF_TYPE_LABEL[p.staffType] : p.role;
        const m = new gmaps.Marker({
          position: pos, map, title: p.name, zIndex: 20,
          icon: { ...dot(c.staff, 5.5), path: gmaps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 4 },
        });
        openInfo(m, `<strong>${p.name}</strong>
          <div style="color:${c.infoSub};margin-top:2px">${type}</div>
          ${onAsset ? `<div style="color:${c.staff};font-size:10px;margin-top:2px">on ${onAsset.code} · ${site.name}</div>` : `<div style="color:${c.infoSub};font-size:10px;margin-top:2px">${site.name}</div>`}`);
      }
    });
  }
  }, [ready, sites, assets, staff, dark, focusSiteIds]);

  if (!MAPS_KEY) {
    // No Google Maps key — show a useful fleet list instead of blocking setup screen.
    const hasAssets = assets.length > 0;
    return (
      <div className="rounded-lg bg-bg-surface border border-border" style={{ minHeight: height }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="text-xs text-text-secondary">Fleet Overview — List View</span>
          <span className="text-xs text-text-muted">{assets.length} assets · {sites.length} sites</span>
        </div>
        {!hasAssets ? (
          <div className="empty-note" style={{ padding: 20 }}>No assets registered. Add assets in the Asset Register to see fleet data here.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="text-text-muted" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Code</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Class</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Make/Model</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Site</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Operational</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Commercial</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Crew</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => {
                  const site = sites.find((s) => s.id === a.currentSiteId);
                  const crew = staff.filter((p) => p.assignedAssetId === a.id);
                  const opColor = a.operationalStatus === 'operational' ? 'var(--positive)' : a.operationalStatus === 'down' ? 'var(--danger)' : a.operationalStatus === 'maintenance' ? 'var(--warning)' : 'var(--info)';
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '5px 10px', fontWeight: 600 }}>{a.code}</td>
                      <td style={{ padding: '5px 10px', textTransform: 'capitalize' }}>{a.assetClass}</td>
                      <td style={{ padding: '5px 10px' }}>{a.make} {a.model}</td>
                      <td style={{ padding: '5px 10px' }}>{site?.name ?? '—'}</td>
                      <td style={{ padding: '5px 10px', color: opColor, textTransform: 'capitalize' }}>{a.operationalStatus}</td>
                      <td style={{ padding: '5px 10px', textTransform: 'capitalize' }}>{a.commercialStatus ?? 'available'}</td>
                      <td style={{ padding: '5px 10px' }}>{crew.length > 0 ? crew.map((p) => p.name).join(', ') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
  if (err) return <div className="rounded-lg bg-bg-surface border border-border p-4 text-xs text-red">{err}</div>;
  return <div ref={mapEl} className="w-full rounded-lg bg-bg-surface" style={{ height }} />;
}
