import { useMemo } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Timer, Ship, Truck, type LucideIcon } from 'lucide-react';
import { useAssetList, useTicketList, useSiteList } from '../../../lib/hooks/useWorkflowData';

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

/**
 * Fleet Uptime — the operational-performance proof. Availability now, per-machine
 * reliability (breakdowns + repair turnaround), and month-by-month repair
 * throughput (breakdowns reported vs resolved) — the record of the fleet being
 * brought back under control.
 */
export function FleetUptime() {
  const { data: assets } = useAssetList();
  const { data: tickets } = useTicketList();
  const { data: sites } = useSiteList();

  const fleet = useMemo(() => assets.filter((a) => !a.pendingDelivery), [assets]);
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? id;

  const stats = useMemo(() => {
    const total = fleet.length;
    const up = fleet.filter((a) => a.operationalStatus === 'operational' || a.operationalStatus === 'idle').length;
    const down = fleet.filter((a) => a.operationalStatus === 'down' || a.operationalStatus === 'maintenance').length;
    const availability = total ? Math.round((up / total) * 100) : 0;

    const resolved = tickets.filter((t) => RESOLVED.has(t.status));
    let turnaroundSum = 0; let turnaroundN = 0;
    for (const t of resolved) {
      const start = asDate(t.reportedAt) ?? asDate(t.createdAt);
      const end = asDate(t.updatedAt);
      if (start && end && end >= start) { turnaroundSum += (end.getTime() - start.getTime()) / DAY; turnaroundN += 1; }
    }
    const avgTurnaround = turnaroundN ? Math.round((turnaroundSum / turnaroundN) * 10) / 10 : 0;

    return { total, up, down, availability, resolvedCount: resolved.length, avgTurnaround };
  }, [fleet, tickets]);

  // Per-machine reliability
  const machineRows = useMemo(() => {
    const byAsset = new Map<string, { all: typeof tickets; open: number; turnSum: number; turnN: number; last: Date | null }>();
    for (const t of tickets) {
      const key = t.assetId ?? t.assetCode ?? '';
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
        return {
          id: a.id, code: a.code, label: `${a.make} ${a.model}`, cls: a.assetClass,
          site: siteName(a.currentSiteId), status: a.operationalStatus,
          breakdowns: rec?.all.length ?? 0, open: rec?.open ?? 0,
          turn: rec && rec.turnN ? Math.round((rec.turnSum / rec.turnN) * 10) / 10 : null,
          last: rec?.last ?? null,
        };
      })
      .sort((a, b) => b.breakdowns - a.breakdowns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleet, tickets]);

  // Monthly throughput — reported vs resolved
  const months = useMemo(() => {
    const m = new Map<string, { reported: number; resolved: number }>();
    const bump = (key: string, f: 'reported' | 'resolved') => {
      const cur = m.get(key) ?? { reported: 0, resolved: 0 }; cur[f] += 1; m.set(key, cur);
    };
    for (const t of tickets) {
      const rep = asDate(t.reportedAt) ?? asDate(t.createdAt);
      if (rep) bump(rep.toISOString().slice(0, 7), 'reported');
      if (RESOLVED.has(t.status)) { const end = asDate(t.updatedAt); if (end) bump(end.toISOString().slice(0, 7), 'resolved'); }
    }
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 6);
  }, [tickets]);

  const metrics: { label: string; value: string; tint: string; icon: LucideIcon }[] = [
    { label: 'Fleet Availability', value: `${stats.availability}%`, tint: stats.availability >= 70 ? 'tint-pos' : 'tint-warn', icon: Activity },
    { label: 'Down / Maintenance', value: String(stats.down), tint: 'tint-danger', icon: AlertTriangle },
    { label: 'Breakdowns Resolved', value: String(stats.resolvedCount), tint: 'tint-pos', icon: CheckCircle2 },
    { label: 'Avg Repair Turnaround', value: stats.avgTurnaround ? `${stats.avgTurnaround} d` : '—', tint: 'tint-info', icon: Timer },
  ];
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const fmtMonth = (k: string) => new Date(`${k}-01`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  const fmtDate = (d: Date | null) => (d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—');

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
      </div>

      <div className="metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div className="metric" key={m.label}>
              <div className="metric-top"><span className="metric-label">{m.label}</span><span className={`metric-ic ${m.tint}`}><Icon /></span></div>
              <div className="metric-val num">{m.value}</div>
            </div>
          );
        })}
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
          <div className="tbl-head" style={{ gridTemplateColumns: '1.5fr 0.9fr 0.9fr 0.8fr 0.8fr 1fr' }}>
            <span>Machine</span><span>Site</span><span>Status</span><span>Breakdowns</span><span>Open</span><span>Avg Turnaround</span>
          </div>
          {machineRows.length === 0 ? (
            <div className="tbl-empty">No fleet data yet.</div>
          ) : machineRows.map((m) => {
            const Icon = m.cls === 'vessel' ? Ship : Truck;
            const down = m.status === 'down' || m.status === 'maintenance';
            return (
              <div className="tbl-row" style={{ gridTemplateColumns: '1.5fr 0.9fr 0.9fr 0.8fr 0.8fr 1fr', cursor: 'default' }} key={m.id}>
                <div className="tc-id" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Icon size={14} style={{ color: 'var(--text-muted)' }} />{m.code} <span className="tc-desc" style={{ marginTop: 0 }}>{m.label}</span></div>
                <div className="tc-txt">{m.site}</div>
                <div><span className={`badge ${down ? 'b-danger' : 'b-pos'}`}><span className="bdot" />{m.status}</span></div>
                <div className="tc-txt">{m.breakdowns}</div>
                <div className="tc-txt" style={{ color: m.open > 0 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: m.open > 0 ? 600 : 400 }}>{m.open}</div>
                <div className="tc-txt">{m.turn != null ? `${m.turn} d` : '—'} <span className="text-text-muted" style={{ fontSize: 10 }}>{m.last ? `· last ${fmtDate(m.last)}` : ''}</span></div>
              </div>
            );
          })}
        </div>
      </div>

      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 14 }}>
        Turnaround = days from the issue reported to its repair resolved. Availability = operational + idle as a share of the active fleet.
      </p>
    </div>
  );
}
