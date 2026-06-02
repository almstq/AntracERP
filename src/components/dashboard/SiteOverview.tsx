import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Ship, Truck, Wrench, AlertTriangle, Wind, Eye, TrendingDown, Users, UserCog,
  type LucideIcon,
} from 'lucide-react';
import type { Site, Staff } from '../../types/org';
import type { Asset, AssetClass } from '../../types/asset';
import { STAFF_TYPE_LABEL } from '../../types/org';
import {
  fetchSiteWeather, isWeatherConfigured, windCategory, type SiteWeather,
} from '../../lib/services/weather';

interface TicketLite {
  id: string;
  siteId?: string;
  status: string;
  urgency?: string;
}

interface Props {
  sites: (Site & { id: string })[];
  assets: (Asset & { id: string })[];
  staff: (Staff & { id: string })[];
  tickets: TicketLite[];
}

const OP_BADGE: Record<string, string> = {
  operational: 'b-pos',
  idle: 'b-info',
  maintenance: 'b-warn',
  down: 'b-danger',
};

const CLASS_ICON: Record<AssetClass, LucideIcon> = {
  vessel: Ship,
  vehicle: Truck,
  equipment: Wrench,
};

const SITE_TYPE_LABEL: Record<string, string> = {
  project: 'Project Site',
  office: 'Office',
  yard: 'Yard',
  vessel: 'Vessel',
  depot: 'Depot',
  hq: 'HQ',
};

function SiteCard({
  site, allAssets, allStaff, allTickets,
}: {
  site: Site & { id: string };
  allAssets: (Asset & { id: string })[];
  allStaff: (Staff & { id: string })[];
  allTickets: TicketLite[];
}) {
  const siteAssets = allAssets.filter((a) => a.currentSiteId === site.id);
  const assetIdSet = new Set(siteAssets.map((a) => a.id));

  // Crew posted to a specific asset at this site, grouped by asset id.
  const crewByAsset = new Map<string, (Staff & { id: string })[]>();
  for (const p of allStaff) {
    if (p.assignedAssetId && assetIdSet.has(p.assignedAssetId)) {
      const list = crewByAsset.get(p.assignedAssetId) ?? [];
      list.push(p);
      crewByAsset.set(p.assignedAssetId, list);
    }
  }
  // Crew posted directly to the site (not tied to a specific asset here).
  const directCrew = allStaff.filter(
    (p) => p.siteId === site.id && !(p.assignedAssetId && assetIdSet.has(p.assignedAssetId)),
  );
  // Site in-charge is now explicit (site.inChargeStaffId) — may be an Antrac
  // manager, not WLI crew. Anyone else posted directly is "other crew".
  const otherCrew = directCrew.filter((p) => p.id !== site.inChargeStaffId);
  // Total people effectively at this site.
  const siteStaff = allStaff.filter(
    (p) => p.siteId === site.id || (p.assignedAssetId && assetIdSet.has(p.assignedAssetId)),
  );

  const openTickets = allTickets.filter(
    (t) => t.siteId === site.id && !['closed', 'rejected'].includes(t.status),
  );
  const critical = openTickets.filter((t) => t.urgency === 'critical').length;
  const urgent = openTickets.filter((t) => t.urgency === 'urgent').length;

  // Revenue at risk: non-operational assets at a project site
  const downAssets = siteAssets.filter(
    (a) => a.operationalStatus === 'down' || a.operationalStatus === 'maintenance',
  );
  const revenueAtRisk = site.type === 'project' && downAssets.length > 0;

  const [weather, setWeather] = useState<SiteWeather | null>(null);
  useEffect(() => {
    if (!isWeatherConfigured() || !site.location) return;
    fetchSiteWeather(site.id, site.name, site.location.lat, site.location.lng)
      .then(setWeather)
      .catch(() => {});
  }, [site.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="dcard" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── Card header ── */}
      <div className="dcard-h" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6, paddingBottom: 10 }}>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <span className="eyebrow" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={10} /> {SITE_TYPE_LABEL[site.type] ?? site.type}
            </span>
            <h3 style={{ marginTop: 3, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{site.name}</h3>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {siteAssets.length} asset{siteAssets.length !== 1 ? 's' : ''} · {siteStaff.length} crew
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
            {critical > 0 && (
              <span className="badge b-danger">
                <AlertTriangle size={9} /> {critical} critical
              </span>
            )}
            {urgent > 0 && <span className="badge b-warn">{urgent} urgent</span>}
            {openTickets.length > 0 && (
              <Link to="/wli/tickets" className="badge b-muted" style={{ textDecoration: 'none' }}>
                {openTickets.length} open
              </Link>
            )}
            {openTickets.length === 0 && (
              <span className="badge b-pos"><span className="bdot" />clear</span>
            )}
          </div>
        </div>

        {revenueAtRisk && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--danger)', fontSize: 11,
            background: 'color-mix(in srgb, var(--danger) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)',
            borderRadius: 6, padding: '4px 8px', width: '100%', boxSizing: 'border-box',
          }}>
            <TrendingDown size={12} />
            <span>
              {downAssets.length} asset{downAssets.length > 1 ? 's' : ''} non-operational at client site — revenue at risk
            </span>
          </div>
        )}
      </div>

      {/* ── Assets ── */}
      <div className="dcard-b" style={{ flex: 1 }}>
        {/* Site in-charge — explicit (Site.inChargeStaffId); flagged when missing */}
        {site.inChargeStaffId ? (
          <Link to={`/wli/locations/${site.id}`} style={{
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            marginBottom: 12, padding: '6px 8px', borderRadius: 6, textDecoration: 'none',
            background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
          }}>
            <UserCog size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', flexShrink: 0 }}>
              In charge
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{site.inChargeName}</span>
            {site.inChargeDesignation && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({site.inChargeDesignation})</span>
            )}
          </Link>
        ) : (
          <Link to={`/wli/locations/${site.id}`} style={{
            display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
            marginBottom: 12, padding: '6px 8px', borderRadius: 6, textDecoration: 'none',
            background: 'color-mix(in srgb, var(--warning) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--warning) 22%, transparent)',
            color: 'var(--warning)', fontSize: 11,
          }}>
            <AlertTriangle size={12} /> No in-charge assigned
          </Link>
        )}

        <div style={{ marginBottom: 14 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: 'var(--text-muted)',
          }}>
            Assets · {siteAssets.length}
          </span>

          {siteAssets.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>No assets deployed.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 7 }}>
              {siteAssets.map((a) => {
                const Icon = CLASS_ICON[a.assetClass] ?? Wrench;
                const isDown = a.operationalStatus === 'down' || a.operationalStatus === 'maintenance';
                const assetCrew = crewByAsset.get(a.id) ?? [];
                return (
                  <div
                    key={a.id}
                    style={{
                      borderRadius: 6,
                      background: isDown ? 'color-mix(in srgb, var(--danger) 6%, transparent)' : 'transparent',
                      border: isDown
                        ? '1px solid color-mix(in srgb, var(--danger) 18%, transparent)'
                        : '1px solid transparent',
                    }}
                  >
                    {/* Asset row */}
                    <Link
                      to={`/wli/assets/${a.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
                        textDecoration: 'none',
                      }}
                    >
                      <Icon size={13} style={{ color: isDown ? 'var(--danger)' : 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, minWidth: 92 }}>
                        {a.code}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.make} {a.model}
                      </span>
                      {a.condition && a.condition !== 'Good' && a.condition !== 'Unknown' && (
                        <span className="badge b-warn" style={{ flexShrink: 0, fontSize: 10 }}>{a.condition}</span>
                      )}
                      <span className={`badge ${OP_BADGE[a.operationalStatus] ?? 'b-muted'}`} style={{ flexShrink: 0, fontSize: 10 }}>
                        <span className="bdot" />{a.operationalStatus}
                      </span>
                    </Link>

                    {/* Nested crew assigned to this asset */}
                    <div style={{
                      paddingLeft: 29, paddingRight: 8, paddingBottom: assetCrew.length ? 5 : 4,
                      display: 'flex', flexWrap: 'wrap', gap: '3px 10px', alignItems: 'center',
                    }}>
                      {assetCrew.length === 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--warning)' }}>
                          <AlertTriangle size={10} /> no crew assigned
                        </span>
                      ) : assetCrew.map((p) => (
                        <Link key={p.id} to={`/wli/staff/${p.id}`} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Users size={10} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{p.name}</span>
                          {p.staffType && (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>· {STAFF_TYPE_LABEL[p.staffType]}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Other crew on site (not posted to a specific asset, excl. supervisors) ── */}
        {otherCrew.length > 0 && (
          <div style={{
            paddingTop: 12,
            borderTop: '1px solid var(--border-soft)',
            marginBottom: weather ? 12 : 0,
          }}>
            <span style={{
              fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.06em', color: 'var(--text-muted)',
            }}>
              Other crew on site · {otherCrew.length}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 12px', marginTop: 6 }}>
              {otherCrew.map((p) => (
                <Link key={p.id} to={`/wli/staff/${p.id}`} style={{ textDecoration: 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.name}</span>
                  {p.staffType && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 3 }}>
                      ({STAFF_TYPE_LABEL[p.staffType]})
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Weather footer (optional) ── */}
        {weather && (
          <div style={{
            paddingTop: 10, borderTop: '1px solid var(--border-soft)',
            display: 'flex', gap: 14, fontSize: 11,
            color: 'var(--text-muted)', flexWrap: 'wrap', alignItems: 'center',
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {weather.tempC}°C · {weather.description}
            </span>
            {(() => {
              const wc = windCategory(weather.windMs);
              const col = wc.tone === 'teal' ? 'var(--text-muted)' : wc.tone === 'amber' ? 'var(--warning)' : 'var(--danger)';
              return (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: col }}>
                  <Wind size={11} /> {weather.windMs} m/s {wc.label}
                </span>
              );
            })()}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Eye size={11} /> {(weather.visibilityM / 1000).toFixed(1)} km
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function SiteOverview({ sites, assets, staff, tickets }: Props) {
  // Malé HQ is the corporate office, not a deployment site — exclude it here.
  const deploymentSites = sites.filter((s) => s.type !== 'hq');
  if (deploymentSites.length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
      gap: 16,
    }}>
      {deploymentSites.map((site) => (
        <SiteCard
          key={site.id}
          site={site}
          allAssets={assets}
          allStaff={staff}
          allTickets={tickets}
        />
      ))}
    </div>
  );
}
