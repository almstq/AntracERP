import { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, CheckCircle2, Timer, Ship, Truck, Download,
  Wrench, Filter, ChevronRight,
} from 'lucide-react';
import { useAssetList, useTicketList, useSiteList } from '../../../lib/hooks/useWorkflowData';
import { useStaffList } from '../../../lib/hooks/useWorkflowData';
import { exportCsv } from '../../../lib/utils/export';
import { Link } from 'react-router-dom';

const DAY = 86_400_000;
function asDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
  const t = v as { toDate?: () => Date; seconds?: number };
  if (typeof t.toDate === 'function') return t.toDate();
  if (typeof t.seconds === 'number') return new Date(t.seconds * 1000);
  return null;
}
const RESOLVED = new Set(['resolved', 'closed']);
const OPEN_EXCL = new Set(['closed', 'rejected']);

type AssetClassFilter = 'all' | 'vessel' | 'vehicle' | 'equipment';

/**
 * Fleet Uptime — operational-performance proof. Availability now, per-machine
 * reliability (breakdowns + repair turnaround), and month-by-month repair
 * throughput (breakdowns reported vs resolved).
 *
 * All data from internal Firestore via useAssetList / useTicketList / useSiteList.
 * No external API dependency.
 */
export function FleetUptime() {
  const { data: assets } = useAssetList();
  const { data: tickets } = useTicketList();
  const { data: sites } = useSiteList();
  const { data: staff } = useStaffList();
  const [classFilter, setClassFilter] = useState<AssetClassFilter>('all');

  // Filter out pending-delivery assets (not yet in fleet)
  const fleet = useMemo(() => {
    const base = assets.filter((a) => !a.pendingDelivery);
    if (classFilter === 'all') return base;
    return base.filter((a) => a.assetClass === classFilter);
  }, [assets, classFilter]);

  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? id;

  // ── Summary metrics ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = fleet.length;
    const operational = fleet.filter((a) => a.operationalStatus === 'operational').length;
    const idle = fleet.filter((a) => a.operationalStatus === 'idle').length;
    const maintenance = fleet.filter((a) => a.operationalStatus === 'maintenance').length;
    const down = fleet.filter((a) => a.operationalStatus === 'down').length;
    const up = operational + idle;
    const availability = total ? Math.round((up / total) * 100) : 0;

    // Commercial status breakdown
    const available = fleet.filter((a) => (a.commercialStatus || 'available') === 'available').length;
    const deployed = fleet.filter((a) => a.commercialStatus === 'deployed').length;
    const softReservedCount = fleet.filter((a) => a.commercialStatus === 'soft_reserved').length;

    // Repair turnaround from tickets linked to this fleet
    const fleetIds = new Set(fleet.map((a) => a.id));
    const fleetCodes = new Set(fleet.map((a) => a.code));
    const fleetTickets = tickets.filter((t) => {
      if (t.assetId && fleetIds.has(t.assetId)) return true;
      if (t.assetCode && fleetCodes.has(t.assetCode)) return true;
      return false;
    });
    const resolved = fleetTickets.filter((t) => RESOLVED.has(t.status));
    let turnaroundSum = 0; let turnaroundN = 0;
    for (const t of resolved) {
      const start = asDate(t.reportedAt) ?? asDate(t.createdAt);
      const end = asDate(t.updatedAt);
      if (start && end && end >= start) { turnaroundSum += (end.getTime() - start.getTime()) / DAY; turnaroundN += 1; }
    }
    const avgTurnaround = turnaroundN ? Math.round((turnaroundSum / turnaroundN) * 10) / 10 : 0;

    // Crew gaps — operational vessels/vehicles with no assigned crew
    const crewGaps = fleet.filter((a) =>
      (a.assetClass === 'vessel' || a.assetClass === 'vehicle') &&
      a.operationalStatus !== 'down' &&
      !staff.some((p) => p.assignedAssetId === a.id),
    ).length;

    return {
      total, operational, idle, maintenance, down, up, availability,
      available, deployed, softReserved: softReservedCount,
      resolvedCount: resolved.length, avgTurnaround,
      crewGaps, fleetTickets: fleetTickets.length,
    };
  }, [fleet, tickets, staff]);

  // ── Per-machine reliability ──────────────────────────────────────────────
  const machineRows = useMemo(() => {
    const fleetIds = new Map(fleet.map((a) => [a.id, a]));
    const fleetCodes = new Map(fleet.map((a) => [a.code, a]));
    const byAsset = new Map<string, { all: typeof tickets; open: number; turnSum: number; turnN: number; last: Date | null }>();
    for (const t of tickets) {
      const key = (t.assetId && fleetIds.has(t.assetId)) ? t.assetId
        : (t.assetCode && fleetCodes.has(t.assetCode)) ? t.assetCode
        : '';
      if (!key) continue;
      const cur = byAsset.get(key) ?? { all: [] as typeof tickets, open: 0, turnSum: 0, turnN: 0, last: null };
      cur.all.push(t);
      if (!OPEN_EXCL.has(t.status)) cur.open += 1;
      const rep = asDate(t.reportedAt) ?? asDate(t.createdAt);
      if (rep && (!cur.last || rep > cur.last)) cur.last = rep;
      if (RESOLVED.has(t.status)) {
        const end = asDate(t.updatedAt);
        if (rep && end && end >= rep) { cur.turnSum += (end.getTime() - rep.getTime()) / DAY; cur.turnN += 1; }
      }
      byAsset.set(key, cur);
    }
    return fleet
      .map((a) => {
        const rec = byAsset.get(a.id) ?? byAsset.get(a.code);
        const crew = staff.filter((p) => p.assignedAssetId === a.id);
        return {
          id: a.id, code: a.code, label: `${a.make} ${a.model}`, cls: a.assetClass,
          site: siteName(a.currentSiteId), status: a.operationalStatus,
          commercial: a.commercialStatus || 'available',
          breakdowns: rec?.all.length ?? 0, open: rec?.open ?? 0,
          turn: rec && rec.turnN ? Math.round((rec.turnSum / rec.turnN) * 10) / 10 : null,
          last: rec?.last ?? null,
          crew,
        };
      })
      .sort((a, b) => b.breakdowns - a.breakdowns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleet, tickets, staff]);

  // ── Monthly throughput ───────────────────────────────────────────────────
  const months = useMemo(() => {
    const fleetIds = new Set(fleet.map((a) => a.id));
    const fleetCodes = new Set(fleet.map((a) => a.code));
    const fleetTickets = tickets.filter((t) => {
      if (t.assetId && fleetIds.has(t.assetId)) return true;
      if (t.assetCode && fleetCodes.has(t.assetCode)) return true;
      return false;
    });
    const m = new Map<string, { reported: number; resolved: number }>();
    const bump = (key: string, f: 'reported' | 'resolved') => {
      const cur = m.get(key) ?? { reported: 0, resolved: 0 }; cur[f] += 1; m.set(key, cur);
    };
    for (const t of fleetTickets) {
      const rep = asDate(t.reportedAt) ?? asDate(t.createdAt);
      if (rep) bump(rep.toISOString().slice(0, 7), 'reported');
      if (RESOLVED.has(t.status)) { const end = asDate(t.updatedAt); if (end) bump(end.toISOString().slice(0, 7), 'resolved'); }
    }
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 6);
  }, [fleet, tickets]);

  // ── Filter options ──────────────────────────────────────────────────────
  const filterOptions: { value: AssetClassFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All Fleet', count: assets.filter((a) => !a.pendingDelivery).length },
    { value: 'vessel', label: 'Vessels', count: assets.filter((a) => !a.pendingDelivery && a.assetClass === 'vessel').length },
    { value: 'vehicle', label: 'Vehicles', count: assets.filter((a) => !a.pendingDelivery && a.assetClass === 'vehicle').length },
    { value: 'equipment', label: 'Equipment', count: assets.filter((a) => !a.pendingDelivery && a.assetClass === 'equipment').length },
  ];

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: '2-digit' });
  const fmtMonth = (k: string) => new Date(`${k}-01`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  const fmtDateShort = (d: Date | null) => (d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—');

  const hasData = fleet.length > 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Fleet Uptime</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>Well Land Investment · reliability</span>
            <span>·</span>
            <span className="num">{today}</span>
          </p>
        </div>
        <div className="head-actions">
          <Link className="btn btn-ghost" to="/wli/map"><Activity /> Fleet Map</Link>
          {hasData && (
            <button className="btn btn-ghost" onClick={() => exportCsv('fleet-uptime', machineRows.map((m) => ({
              machine: m.code, model: m.label, class: m.cls, site: m.site, status: m.status,
              commercial: m.commercial, breakdowns: m.breakdowns, open_issues: m.open,
              avg_turnaround_days: m.turn ?? '', last_breakdown: m.last ? fmtDateShort(m.last) : '',
              crew: m.crew.map((p) => p.name).join('; ') || '—',
            })))}><Download /> Export</button>
          )}
        </div>
      </div>

      {!hasData ? (
        <div className="empty-note" style={{ padding: '40px 0', textAlign: 'center' }}>
          <Ship size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ fontWeight: 600, marginBottom: 4 }}>No fleet data</p>
          <p className="text-xs text-text-muted" style={{ marginBottom: 16 }}>
            Add assets in the Asset Register to see fleet uptime reporting.
          </p>
          <Link className="btn btn-primary" to="/wli/assets">Go to Asset Register</Link>
        </div>
      ) : (
        <>
          {/* Class filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <Filter size={13} style={{ color: 'var(--text-muted)' }} />
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                className={`btn btn-sm ${classFilter === opt.value ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setClassFilter(opt.value)}
              >
                {opt.label} ({opt.count})
              </button>
            ))}
          </div>

          {/* Summary metrics */}
          <div className="metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="metric">
              <div className="metric-top">
                <span className="metric-label">Fleet Availability</span>
                <span className={`metric-ic ${stats.availability >= 70 ? 'tint-pos' : stats.availability >= 50 ? 'tint-warn' : 'tint-danger'}`}><Activity /></span>
              </div>
              <div className="metric-val num">{stats.availability}%</div>
              <div className="text-xs text-text-muted" style={{ marginTop: 2 }}>{stats.up} of {stats.total} operational</div>
            </div>
            <div className="metric">
              <div className="metric-top">
                <span className="metric-label">Down / Maintenance</span>
                <span className="metric-ic tint-danger"><AlertTriangle /></span>
              </div>
              <div className="metric-val num">{stats.down + stats.maintenance}</div>
              <div className="text-xs text-text-muted" style={{ marginTop: 2 }}>{stats.down} down · {stats.maintenance} maintenance</div>
            </div>
            <div className="metric">
              <div className="metric-top">
                <span className="metric-label">Breakdowns Resolved</span>
                <span className="metric-ic tint-pos"><CheckCircle2 /></span>
              </div>
              <div className="metric-val num">{stats.resolvedCount}</div>
              <div className="text-xs text-text-muted" style={{ marginTop: 2 }}>{stats.fleetTickets} total tickets</div>
            </div>
            <div className="metric">
              <div className="metric-top">
                <span className="metric-label">Avg Repair Turnaround</span>
                <span className="metric-ic tint-info"><Timer /></span>
              </div>
              <div className="metric-val num">{stats.avgTurnaround ? `${stats.avgTurnaround} d` : '—'}</div>
              <div className="text-xs text-text-muted" style={{ marginTop: 2 }}>reported → resolved</div>
            </div>
          </div>

          {/* Secondary metrics row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            <div className="card" style={{ padding: '10px 14px' }}>
              <div className="text-xs text-text-muted" style={{ marginBottom: 4 }}>Commercial Status</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span className="minitag"><i style={{ background: 'var(--text-muted)' }} /> {stats.available} available</span>
                <span className="minitag"><i style={{ background: 'var(--accent)' }} /> {stats.deployed} deployed</span>
                {stats.softReserved > 0 && <span className="minitag"><i style={{ background: 'var(--warning)' }} /> {stats.softReserved} soft-reserved</span>}
              </div>
            </div>
            <div className="card" style={{ padding: '10px 14px' }}>
              <div className="text-xs text-text-muted" style={{ marginBottom: 4 }}>Crew Gaps</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {stats.crewGaps > 0 ? (
                  <span className="badge b-warn"><AlertTriangle size={10} /> {stats.crewGaps} uncrewed</span>
                ) : (
                  <span className="badge b-pos"><CheckCircle2 size={10} /> All crewed</span>
                )}
                <Link to="/wli/staff" className="text-xs" style={{ color: 'var(--info)' }}>Manage crew <ChevronRight size={10} /></Link>
              </div>
            </div>
            <div className="card" style={{ padding: '10px 14px' }}>
              <div className="text-xs text-text-muted" style={{ marginBottom: 4 }}>Fleet Composition</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span className="minitag"><i style={{ background: 'var(--info)' }} /> {fleet.filter((a) => a.assetClass === 'vessel').length} vessels</span>
                <span className="minitag"><i style={{ background: 'var(--positive)' }} /> {fleet.filter((a) => a.assetClass === 'vehicle').length} vehicles</span>
                <span className="minitag"><i style={{ background: 'var(--accent)' }} /> {fleet.filter((a) => a.assetClass === 'equipment').length} equipment</span>
              </div>
            </div>
          </div>

          {/* Monthly throughput */}
          {months.length > 0 && (
            <div className="section">
              <div className="section-head"><h2>Repair Throughput <span className="hint">reported vs resolved</span></h2></div>
              <div className="tbl">
                <div className="tbl-head" style={{ gridTemplateColumns: '1.4fr 1fr 1fr' }}><span>Month</span><span>Reported</span><span>Resolved</span></div>
                {months.map(([k, v]) => (
                  <div className="tbl-row" style={{ gridTemplateColumns: '1.4fr 1fr 1fr', cursor: 'default' }} key={k}>
                    <div className="tc-id">{fmtMonth(k)}</div>
                    <div className="tc-txt">{v.reported}</div>
                    <div className="tc-txt" style={{ color: 'var(--positive)', fontWeight: 600 }}>{v.resolved}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-machine reliability */}
          <div className="section">
            <div className="section-head"><h2>By Machine <span className="hint">breakdowns &amp; turnaround</span></h2></div>
            <div className="tbl">
              <div className="tbl-head" style={{ gridTemplateColumns: '1.5fr 0.8fr 0.8fr 0.7fr 0.7fr 0.9fr 1fr' }}>
                <span>Machine</span><span>Site</span><span>Status</span><span>Breakdowns</span><span>Open</span><span>Turnaround</span><span>Crew</span>
              </div>
              {machineRows.length === 0 ? (
                <div className="tbl-empty">No fleet data yet.</div>
              ) : machineRows.map((m) => {
                const Icon = m.cls === 'vessel' ? Ship : m.cls === 'vehicle' ? Truck : Wrench;
                const isDown = m.status === 'down' || m.status === 'maintenance';
                return (
                  <div className="tbl-row" style={{ gridTemplateColumns: '1.5fr 0.8fr 0.8fr 0.7fr 0.7fr 0.9fr 1fr', cursor: 'default' }} key={m.id}>
                    <div className="tc-id" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <Link to={`/wli/assets/${m.id}`} style={{ fontWeight: 600, textDecoration: 'none' }}>{m.code}</Link>
                      <span className="tc-desc" style={{ marginTop: 0, fontSize: 10 }}>{m.label}</span>
                    </div>
                    <div className="tc-txt">{m.site}</div>
                    <div><span className={`badge ${isDown ? 'b-danger' : 'b-pos'}`}><span className="bdot" />{m.status}</span></div>
                    <div className="tc-txt">{m.breakdowns}</div>
                    <div className="tc-txt" style={{ color: m.open > 0 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: m.open > 0 ? 600 : 400 }}>{m.open}</div>
                    <div className="tc-txt">{m.turn != null ? `${m.turn} d` : '—'}</div>
                    <div className="tc-txt" style={{ fontSize: 10 }}>
                      {m.crew.length > 0 ? m.crew.map((p) => p.name).join(', ') : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
            Turnaround = days from issue reported to repair resolved. Availability = (operational + idle) / active fleet.
            Assets pending delivery are excluded. Data source: internal Firestore.
          </p>
        </>
      )}
    </div>
  );
}
