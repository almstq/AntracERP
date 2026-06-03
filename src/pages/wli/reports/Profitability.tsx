import { useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, Wrench, Banknote, AlertTriangle, Plus, Ship, Truck, type LucideIcon,
} from 'lucide-react';
import { usePOList, useTicketList, usePRList, useAssetList, useSiteList } from '../../../lib/hooks/useWorkflowData';
import { useDeploymentRevenue } from '../../../lib/hooks/useReports';
import { useAuth } from '../../../lib/hooks/useAuth';
import { createDeploymentRevenue } from '../../../lib/services/reports';
import { useToast } from '../../../lib/context/ToastContext';
import { formatMoney } from '../../../lib/utils/money';

const fm = (n: number) => formatMoney(n, 'MVR');
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

/**
 * Revenue vs Repair — the profitability view. Repair spend is computed live from
 * the procurement chain (PO → ticket/PR → machine + site). Revenue is the
 * deployment-revenue figures entered from Finance/CFO. Honest about gaps: a site
 * with repair cost but no recorded revenue is flagged, never shown as a false 0.
 */
export function Profitability() {
  const { user, effectiveRole } = useAuth();
  const { toast } = useToast();
  const { data: pos } = usePOList();
  const { data: tickets } = useTicketList();
  const { data: prs } = usePRList();
  const { data: assets } = useAssetList();
  const { data: sites } = useSiteList();
  const { data: revenue, refresh: refreshRevenue } = useDeploymentRevenue();

  const canRecord = ['gm', 'finance_wli', 'cfo', 'director', 'super_admin'].includes(effectiveRole);

  const ticketById = useMemo(() => new Map(tickets.map((t) => [t.id, t])), [tickets]);
  const prById = useMemo(() => new Map(prs.map((p) => [p.id, p])), [prs]);
  const assetById = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);
  const fieldSites = useMemo(() => sites.filter((s) => s.type !== 'hq'), [sites]);

  // ── Repair spend: resolve each PO to a machine + site via its ticket (or PR) ──
  const calc = useMemo(() => {
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
        generalSpend += total; // direct/office PRs — not machine repair
      }
    }

    const revenueBySite = new Map<string, number>();
    let totalRevenue = 0;
    for (const r of revenue) {
      const amt = Number(r.amount) || 0;
      totalRevenue += amt;
      revenueBySite.set(r.siteId, (revenueBySite.get(r.siteId) ?? 0) + amt);
    }

    return { repairBySite, repairByAsset, machineRepair, generalSpend, revenueBySite, totalRevenue };
  }, [pos, ticketById, prById, revenue]);

  const net = calc.totalRevenue - calc.machineRepair;
  const profitable = net >= 0;

  const siteRows = fieldSites.map((s) => {
    const rev = calc.revenueBySite.get(s.id) ?? 0;
    const cost = calc.repairBySite.get(s.id) ?? 0;
    return { id: s.id, name: s.name, rev, cost, net: rev - cost, noRevenue: cost > 0 && rev === 0 };
  }).sort((a, b) => a.net - b.net); // worst first — the bleed shows at the top

  const machineRows = [...calc.repairByAsset.entries()]
    .map(([assetId, v]) => {
      const a = assetById.get(assetId);
      const site = a ? sites.find((s) => s.id === a.currentSiteId) : undefined;
      return {
        id: assetId, code: a?.code ?? assetId, label: a ? `${a.make} ${a.model}` : '—',
        cls: a?.assetClass, site: site?.name ?? a?.currentSiteId ?? '—',
        status: a?.operationalStatus ?? '—', cost: v.cost, tickets: v.tickets.size,
      };
    })
    .sort((a, b) => b.cost - a.cost);

  const metrics: { label: string; value: string; tint: string; icon: LucideIcon }[] = [
    { label: 'Deployment Revenue', value: fm(calc.totalRevenue), tint: 'tint-pos', icon: Banknote },
    { label: 'Repair Spend', value: fm(calc.machineRepair), tint: 'tint-danger', icon: Wrench },
    { label: profitable ? 'Net Profit' : 'Net Loss', value: fm(Math.abs(net)), tint: profitable ? 'tint-pos' : 'tint-danger', icon: profitable ? TrendingUp : TrendingDown },
  ];

  // ── Inline "record revenue" form ──
  const [addOpen, setAddOpen] = useState(false);
  const [siteId, setSiteId] = useState('');
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState('');
  const [contractRef, setContractRef] = useState('');
  const [busy, setBusy] = useState(false);

  async function saveRevenue() {
    if (!user) return;
    if (!siteId) { toast('error', 'Pick a site.'); return; }
    if (!amount || Number(amount) <= 0) { toast('error', 'Enter an amount.'); return; }
    setBusy(true);
    try {
      await createDeploymentRevenue(
        { siteId, period, amount: Number(amount), currency: 'MVR', contractRef: contractRef || undefined },
        { id: user.uid, role: effectiveRole, name: user.displayName },
      );
      toast('success', 'Revenue recorded');
      setAddOpen(false); setAmount(''); setContractRef('');
      refreshRevenue();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed to record');
    } finally { setBusy(false); }
  }

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
        {canRecord && (
          <div className="head-actions">
            <button className="btn btn-primary" onClick={() => setAddOpen((v) => !v)}><Plus /> Record Revenue</button>
          </div>
        )}
      </div>

      {/* Verdict banner */}
      <div className="card" style={{ padding: '16px 18px', marginBottom: 18, borderLeft: `3px solid var(--${profitable ? 'positive' : 'danger'})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {profitable ? <TrendingUp style={{ color: 'var(--positive)' }} /> : <AlertTriangle style={{ color: 'var(--danger)' }} />}
          <strong style={{ fontSize: 15 }}>
            {calc.totalRevenue === 0
              ? 'No deployment revenue recorded yet — enter the figures from Finance/CFO to see the full picture.'
              : profitable
                ? `WLI is in profit by ${fm(net)} on recorded figures.`
                : `WLI is running at a loss of ${fm(Math.abs(net))} on recorded figures.`}
          </strong>
        </div>
        <p className="text-muted" style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
          Repair spend is computed live from the procurement chain. Revenue is what's been recorded so far — sites with cost but no revenue are flagged below. Amounts in MVR (mixed currency not FX-converted).
        </p>
      </div>

      {/* Inline revenue entry */}
      {addOpen && (
        <div className="card" style={{ padding: 16, marginBottom: 18 }}>
          <div className="kv" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, alignItems: 'end' }}>
            <div>
              <div className="k">Site</div>
              <select className="side-foot-sel" style={{ marginTop: 4 }} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                <option value="">Select…</option>
                {fieldSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <div className="k">Month</div>
              <input type="month" className="side-foot-sel" style={{ marginTop: 4 }} value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
            <div>
              <div className="k">Amount (MVR)</div>
              <input type="number" min="0" className="side-foot-sel" style={{ marginTop: 4 }} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 250000" />
            </div>
            <div>
              <div className="k">Contract ref (optional)</div>
              <input className="side-foot-sel" style={{ marginTop: 4 }} value={contractRef} onChange={(e) => setContractRef(e.target.value)} placeholder="client / contract" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={saveRevenue} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            <button className="btn btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

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

      {/* Per-machine repair ranking — the money pits */}
      <div className="section">
        <div className="section-head"><h2>Repair Spend by Machine <span className="hint">highest first</span></h2></div>
        <div className="tbl">
          <div className="tbl-head" style={{ gridTemplateColumns: '1.4fr 1fr 0.9fr 1fr 0.7fr' }}>
            <span>Machine</span><span>Site</span><span>Status</span><span>Repair Spend</span><span>Tickets</span>
          </div>
          {machineRows.length === 0 ? (
            <div className="tbl-empty">No repair POs recorded yet.</div>
          ) : machineRows.map((m) => {
            const Icon = m.cls === 'vessel' ? Ship : Truck;
            const down = m.status === 'down' || m.status === 'maintenance';
            return (
              <div className="tbl-row" style={{ gridTemplateColumns: '1.4fr 1fr 0.9fr 1fr 0.7fr', cursor: 'default' }} key={m.id}>
                <div className="tc-id" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Icon size={14} style={{ color: 'var(--text-muted)' }} />{m.code} <span className="tc-desc" style={{ marginTop: 0 }}>{m.label}</span></div>
                <div className="tc-txt">{m.site}</div>
                <div><span className={`badge ${down ? 'b-danger' : 'b-pos'}`}><span className="bdot" />{m.status}</span></div>
                <div className="tc-txt" style={{ fontWeight: 600 }}>{fm(m.cost)}</div>
                <div className="tc-txt">{m.tickets}</div>
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
