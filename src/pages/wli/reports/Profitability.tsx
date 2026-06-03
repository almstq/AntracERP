import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Wrench, Banknote, AlertTriangle, Plus, Ship, Truck, Download, type LucideIcon,
} from 'lucide-react';
import { usePOList, useTicketList, usePRList, useAssetList, useSiteList } from '../../../lib/hooks/useWorkflowData';
import { useDeployments } from '../../../lib/hooks/useReports';
import { deploymentEarned } from '../../../lib/services/deployments';
import { formatMoney } from '../../../lib/utils/money';
import { exportCsv } from '../../../lib/utils/export';

const fm = (n: number) => formatMoney(Math.round(n), 'MVR');
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

/**
 * Revenue vs Repair — the profitability view. Repair spend is computed live from
 * the procurement chain (PO → ticket/PR → machine + site). Revenue is computed
 * from deployment records (rate × time on hire) — mandatory at deployment, so
 * every deployed machine has a real revenue figure. Honest about gaps: a machine
 * or site with repair cost but no deployment revenue is flagged, never faked to 0.
 */
export function Profitability() {
  const { pathname } = useLocation();
  const inWli = pathname.startsWith('/wli');
  const { data: pos } = usePOList();
  const { data: tickets } = useTicketList();
  const { data: prs } = usePRList();
  const { data: assets } = useAssetList();
  const { data: sites } = useSiteList();
  const { data: deployments } = useDeployments();

  const ticketById = useMemo(() => new Map(tickets.map((t) => [t.id, t])), [tickets]);
  const prById = useMemo(() => new Map(prs.map((p) => [p.id, p])), [prs]);
  const assetById = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);
  const fieldSites = useMemo(() => sites.filter((s) => s.type !== 'hq'), [sites]);

  const calc = useMemo(() => {
    // ── Repair spend: resolve each PO to a machine + site via its ticket (or PR) ──
    const repairBySite = new Map<string, number>();
    const repairByAsset = new Map<string, { cost: number; tickets: Set<string> }>();
    let machineRepair = 0;
    let generalSpend = 0;
    for (const po of pos) {
      const total = Number(po.total) || 0;
      if (total <= 0) continue;
      const t = po.ticketId ? ticketById.get(po.ticketId) : undefined;
      const pr = po.purchaseRequestId ? prById.get(po.purchaseRequestId) : undefined;
      const assetId = t?.assetId ?? pr?.assetId;
      const siteId = t?.siteId ?? pr?.siteId;
      if (assetId) {
        machineRepair += total;
        if (siteId) repairBySite.set(siteId, (repairBySite.get(siteId) ?? 0) + total);
        const cur = repairByAsset.get(assetId) ?? { cost: 0, tickets: new Set<string>() };
        cur.cost += total;
        if (t?.id) cur.tickets.add(t.id);
        repairByAsset.set(assetId, cur);
      } else {
        generalSpend += total;
      }
    }

    // ── Revenue: deployment rate × time on hire ──
    const revenueBySite = new Map<string, number>();
    const revenueByAsset = new Map<string, number>();
    let totalRevenue = 0;
    for (const d of deployments) {
      const earned = deploymentEarned(d);
      totalRevenue += earned;
      revenueBySite.set(d.siteId, (revenueBySite.get(d.siteId) ?? 0) + earned);
      revenueByAsset.set(d.assetId, (revenueByAsset.get(d.assetId) ?? 0) + earned);
    }

    return { repairBySite, repairByAsset, machineRepair, generalSpend, revenueBySite, revenueByAsset, totalRevenue };
  }, [pos, ticketById, prById, deployments]);

  const net = calc.totalRevenue - calc.machineRepair;
  const profitable = net >= 0;

  const siteRows = fieldSites.map((s) => {
    const rev = calc.revenueBySite.get(s.id) ?? 0;
    const cost = calc.repairBySite.get(s.id) ?? 0;
    return { id: s.id, name: s.name, rev, cost, net: rev - cost, noRevenue: cost > 0 && rev === 0 };
  }).sort((a, b) => a.net - b.net);

  const machineRows = useMemo(() => {
    const ids = new Set<string>([...calc.repairByAsset.keys(), ...calc.revenueByAsset.keys()]);
    return [...ids].map((assetId) => {
      const a = assetById.get(assetId);
      const site = a ? sites.find((s) => s.id === a.currentSiteId) : undefined;
      const rev = calc.revenueByAsset.get(assetId) ?? 0;
      const cost = calc.repairByAsset.get(assetId)?.cost ?? 0;
      return {
        id: assetId, code: a?.code ?? assetId, label: a ? `${a.make} ${a.model}` : '—',
        cls: a?.assetClass, site: site?.name ?? a?.currentSiteId ?? '—',
        status: a?.operationalStatus ?? '—', rev, cost, net: rev - cost,
        tickets: calc.repairByAsset.get(assetId)?.tickets.size ?? 0,
      };
    }).sort((x, y) => x.net - y.net); // worst (biggest loss) first
  }, [calc, assetById, sites]);

  const metrics: { label: string; value: string; tint: string; icon: LucideIcon }[] = [
    { label: 'Deployment Revenue', value: fm(calc.totalRevenue), tint: 'tint-pos', icon: Banknote },
    { label: 'Repair Spend', value: fm(calc.machineRepair), tint: 'tint-danger', icon: Wrench },
    { label: profitable ? 'Net Profit' : 'Net Loss', value: fm(Math.abs(net)), tint: profitable ? 'tint-pos' : 'tint-danger', icon: profitable ? TrendingUp : TrendingDown },
  ];

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Revenue vs Repair</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>Well Land Investment · profitability</span>
            <span>·</span>
            <span className="num">{today}</span>
          </p>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={() => exportCsv('revenue-vs-repair', machineRows.map((m) => ({
            machine: m.code, model: m.label, site: m.site, status: m.status,
            revenue: Math.round(m.rev), repair: Math.round(m.cost), net: Math.round(m.net),
          })))}><Download /> Export</button>
          {inWli && (
            <>
              <Link className="btn btn-ghost" to="/wli/deployments">Deployments</Link>
              <Link className="btn btn-primary" to="/wli/deployments/new"><Plus /> Deploy Machine</Link>
            </>
          )}
        </div>
      </div>

      {/* Verdict banner */}
      <div className="card" style={{ padding: '16px 18px', marginBottom: 18, borderLeft: `3px solid var(--${profitable ? 'positive' : 'danger'})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {profitable ? <TrendingUp style={{ color: 'var(--positive)' }} /> : <AlertTriangle style={{ color: 'var(--danger)' }} />}
          <strong style={{ fontSize: 15 }}>
            {calc.totalRevenue === 0
              ? 'No deployment revenue recorded yet — deploy machines with their agreed rates to see the full picture.'
              : profitable
                ? `WLI is in profit by ${fm(net)} on recorded figures.`
                : `WLI is running at a loss of ${fm(Math.abs(net))} on recorded figures.`}
          </strong>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
          Repair spend is live from the procurement chain. Revenue = deployment rate × time on hire. Machines/sites with repair cost but no deployment revenue are flagged below. Amounts in MVR (mixed currency not FX-converted).
        </p>
      </div>

      {/* Headline metrics */}
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div className="metric" key={m.label}>
              <div className="metric-top">
                <span className="metric-label">{m.label}</span>
                <span className={`metric-ic ${m.tint}`}><Icon /></span>
              </div>
              <div className="metric-val num" style={{ fontSize: 'calc(26px * var(--d))' }}>{m.value}</div>
            </div>
          );
        })}
      </div>

      {/* Per-site P&L */}
      <div className="section">
        <div className="section-head"><h2>By Site <span className="hint">revenue vs repair</span></h2></div>
        <div className="tbl">
          <div className="tbl-head" style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr 0.9fr' }}>
            <span>Site</span><span>Revenue</span><span>Repair</span><span>Net</span><span>Margin</span>
          </div>
          {siteRows.length === 0 ? (
            <div className="tbl-empty">No site data yet.</div>
          ) : siteRows.map((r) => (
            <div className="tbl-row" style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr 0.9fr', cursor: 'default' }} key={r.id}>
              <div className="tc-id">{r.name}{r.noRevenue && <span className="badge b-warn" style={{ marginLeft: 8 }}><AlertTriangle size={9} /> no revenue</span>}</div>
              <div className="tc-txt">{r.rev > 0 ? fm(r.rev) : '—'}</div>
              <div className="tc-txt">{r.cost > 0 ? fm(r.cost) : '—'}</div>
              <div className="tc-txt" style={{ color: r.net >= 0 ? 'var(--positive)' : 'var(--danger)', fontWeight: 600 }}>{fm(r.net)}</div>
              <div className="tc-txt">{r.rev > 0 ? `${pct(r.net, r.rev)}%` : '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-machine: revenue vs repair = net (earners vs bleeders) */}
      <div className="section">
        <div className="section-head"><h2>By Machine <span className="hint">earning or bleeding</span></h2></div>
        <div className="tbl">
          <div className="tbl-head" style={{ gridTemplateColumns: '1.5fr 0.9fr 0.9fr 1fr 1fr 1fr' }}>
            <span>Machine</span><span>Site</span><span>Status</span><span>Revenue</span><span>Repair</span><span>Net</span>
          </div>
          {machineRows.length === 0 ? (
            <div className="tbl-empty">No deployment or repair data yet.</div>
          ) : machineRows.map((m) => {
            const Icon = m.cls === 'vessel' ? Ship : Truck;
            const down = m.status === 'down' || m.status === 'maintenance';
            return (
              <div className="tbl-row" style={{ gridTemplateColumns: '1.5fr 0.9fr 0.9fr 1fr 1fr 1fr', cursor: 'default' }} key={m.id}>
                <div className="tc-id" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Icon size={14} style={{ color: 'var(--text-muted)' }} />{m.code} <span className="tc-desc" style={{ marginTop: 0 }}>{m.label}</span></div>
                <div className="tc-txt">{m.site}</div>
                <div><span className={`badge ${down ? 'b-danger' : 'b-pos'}`}><span className="bdot" />{m.status}</span></div>
                <div className="tc-txt">{m.rev > 0 ? fm(m.rev) : '—'}</div>
                <div className="tc-txt">{m.cost > 0 ? fm(m.cost) : '—'}</div>
                <div className="tc-txt" style={{ color: m.net >= 0 ? 'var(--positive)' : 'var(--danger)', fontWeight: 600 }}>{fm(m.net)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {calc.generalSpend > 0 && (
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 14 }}>
          Plus {fm(calc.generalSpend)} in general (non-machine) procurement, excluded from repair spend above.
        </p>
      )}
    </div>
  );
}
