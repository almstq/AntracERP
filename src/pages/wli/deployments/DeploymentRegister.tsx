import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Truck } from 'lucide-react';
import { useDeployments } from '../../../lib/hooks/useReports';
import { deploymentEarned, endDeployment, RATE_BASIS_LABEL } from '../../../lib/services/deployments';
import { useSiteList } from '../../../lib/hooks/useWorkflowData';
import { formatMoney } from '../../../lib/utils/money';
import { useToast } from '../../../lib/context/ToastContext';

const COLS = '1.4fr 1fr 1.1fr 1fr 0.9fr 0.7fr';

export function DeploymentRegister() {
  const { data: deployments, loading, refresh } = useDeployments();
  const { data: sites } = useSiteList();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? id;

  const active = deployments.filter((d) => d.status === 'active');
  const totalEarned = deployments.reduce((s, d) => s + deploymentEarned(d), 0);
  const sorted = [...deployments].sort((a, b) => (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1));

  async function end(d: typeof deployments[number]) {
    if (!window.confirm(`End the deployment of ${d.assetCode}? The machine returns to Available.`)) return;
    setBusy(d.id);
    try {
      await endDeployment(d.id, d.assetId, new Date());
      toast('success', 'Deployment ended');
      refresh();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed');
    } finally { setBusy(null); }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Deployments</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : `${active.length} on hire`}</span>
          </p>
        </div>
        <div className="head-actions">
          <Link className="btn btn-primary" to="/wli/deployments/new"><Plus /> Deploy Machine</Link>
        </div>
      </div>

      <div className="sumbar">
        <div className="sumchip"><div className="sc-l">On Hire</div><div className="sc-v num">{active.length}<span className="sc-sub">machines</span></div></div>
        <div className="sumchip"><div className="sc-l">Revenue To Date</div><div className="sc-v num" style={{ color: 'var(--positive)' }}>{formatMoney(Math.round(totalEarned), 'MVR')}</div></div>
        <div className="sumchip"><div className="sc-l">Total Records</div><div className="sc-v num">{deployments.length}</div></div>
      </div>

      <div className="tbl">
        <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
          <span>Machine</span><span>Site</span><span>Rate</span><span>Earned</span><span>Status</span><span />
        </div>
        {loading ? (
          <div className="tbl-empty">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="tbl-empty">No deployments yet. Deploy a machine to start recording revenue.</div>
        ) : sorted.map((d) => (
          <div className="tbl-row" style={{ gridTemplateColumns: COLS, cursor: 'default' }} key={d.id}>
            <div className="tc-id" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Truck size={14} style={{ color: 'var(--text-muted)' }} />{d.assetCode}
              {d.customerName && <span className="tc-desc" style={{ marginTop: 0 }}>{d.customerName}</span>}
            </div>
            <div className="tc-txt">{siteName(d.siteId)}</div>
            <div className="tc-txt">{formatMoney(d.rate, d.currency)} <span className="text-text-muted">{RATE_BASIS_LABEL[d.rateBasis]}</span></div>
            <div className="tc-txt" style={{ fontWeight: 600, color: 'var(--positive)' }}>{formatMoney(Math.round(deploymentEarned(d)), d.currency)}</div>
            <div><span className={`badge ${d.status === 'active' ? 'b-pos' : 'b-muted'}`}><span className="bdot" />{d.status}</span></div>
            <div style={{ justifySelf: 'end' }}>
              {d.status === 'active' && (
                <button className="btn btn-ghost" style={{ padding: '4px 10px' }} onClick={() => end(d)} disabled={busy === d.id}>End</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
