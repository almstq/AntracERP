import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Plus, ShieldAlert, Clock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/shared/Input';
import { InputSelect } from '../components/shared/InputSelect';
import { useAuth } from '../lib/hooks/useAuth';
import { useToast } from '../lib/context/ToastContext';
import { listActivity, addManualEntry, type ActivityEntry, type ActivityCategory } from '../lib/services/activityLog';

const GM_PLUS = ['gm', 'director', 'cfo', 'antrac_finance', 'super_admin'];
const COLS = '150px 1.7fr 1fr 110px';

const CAT_BADGE: Record<ActivityCategory, string> = {
  workflow: 'b-info', access: 'b-accent', registry: 'b-warn', admin: 'b-pos', manual: 'b-muted',
};
const CATEGORIES: ActivityCategory[] = ['workflow', 'access', 'registry', 'admin', 'manual'];

// Best route to inspect a logged entity, by type.
function entityHref(e: ActivityEntry): string | null {
  if (!e.entityId) return null;
  switch (e.entityType) {
    case 'ticket': return `/wli/tickets/${e.entityId}`;
    case 'purchase_request': return `/wli/procurement/requests/${e.entityId}`;
    case 'purchase_order': return `/wli/procurement/orders/${e.entityId}`;
    case 'fuel_request': return `/wli/fuel/requests/${e.entityId}`;
    case 'work_order': return `/wli/crm/work-orders/${e.entityId}`;
    case 'role': return `/admin/roles`;
    case 'user': return `/admin/users`;
    default: return null;
  }
}

export function SystemLog() {
  const { user, effectiveRole, actor: authActor } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<'all' | ActivityCategory>('all');
  const [adding, setAdding] = useState(false);

  const isSA = user?.role === 'super_admin';
  const allowed = GM_PLUS.includes(effectiveRole);

  // Manual backdate form
  const [mDate, setMDate] = useState('');
  const [mCat, setMCat] = useState<ActivityCategory>('workflow');
  const [mSummary, setMSummary] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setEntries(await listActivity(300));
    setLoading(false);
  }
  useEffect(() => { if (allowed) void load(); }, [allowed]);

  async function submitManual() {
    if (!mDate || !mSummary.trim() || !user) return;
    setBusy(true);
    try {
      await addManualEntry({
        occurredAt: new Date(mDate),
        category: mCat,
        summary: mSummary.trim(),
        actorId: authActor?.id ?? user.uid,
        actorName: authActor?.name ?? user.displayName,
        actorRole: authActor?.role ?? user.role,
        adminOverride: authActor?.adminOverride,
        performedByRole: authActor?.realRole,
      });
      toast('success', 'Backdated entry recorded');
      setMSummary(''); setMDate(''); setAdding(false);
      void load();
    } catch {
      toast('error', 'Failed to record entry');
    } finally { setBusy(false); }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) =>
      (cat === 'all' || e.category === cat) &&
      (!q || `${e.summary} ${e.actorName ?? ''} ${e.actorRole ?? ''} ${e.entityDisplayId ?? ''}`.toLowerCase().includes(q)),
    );
  }, [entries, search, cat]);

  if (!allowed) {
    return (
      <div className="page" style={{ maxWidth: 600 }}>
        <div className="tbl"><div className="tbl-empty">The system activity log is visible to GM and above.</div></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title"><FileText size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />System Activity Log</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : `${entries.length} recorded`}</span>
          </p>
        </div>
        {isSA && (
          <div className="head-actions">
            <Button variant="primary" size="sm" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Backdated entry</Button>
          </div>
        )}
      </div>

      {adding && isSA && (
        <Card className="mb-4">
          <p className="text-xs font-semibold text-text-primary mb-2">Record a historical (pre-go-live) entry</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
            <Input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} title="When it happened" />
            <InputSelect value={mCat} onChange={(e) => setMCat(e.target.value as ActivityCategory)}>
              {CATEGORIES.filter((c) => c !== 'manual').map((c) => <option key={c} value={c}>{c}</option>)}
            </InputSelect>
            <Input className="md:col-span-2" placeholder="What happened" value={mSummary} onChange={(e) => setMSummary(e.target.value)} />
            <Button variant="primary" size="sm" onClick={submitManual} disabled={busy || !mDate || !mSummary.trim()}>
              {busy ? 'Saving…' : 'Record'}
            </Button>
            <span className="hint md:col-span-3">Flagged as a manual entry. The act of adding it is also logged.</span>
          </div>
        </Card>
      )}

      <div className="toolbar">
        <div className="search-wrap">
          <Search />
          <input placeholder="Search activity, actor, record…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="chips">
          <button className={`chip${cat === 'all' ? ' on' : ''}`} onClick={() => setCat('all')}>all</button>
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="tbl">
        <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
          <span>When</span><span>Activity</span><span>Actor</span><span>Type</span>
        </div>
        {loading ? (
          <div className="tbl-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="tbl-empty">{search || cat !== 'all' ? 'No activity matches.' : 'No activity recorded yet.'}</div>
        ) : filtered.map((e) => {
          const href = entityHref(e);
          const inner = (
            <>
              <div>
                <div className="tc-txt">{e.occurredAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                <div className="tc-sub">{e.occurredAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="tc-id" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {e.summary}
                  {e.adminOverride && <span className="badge b-warn" style={{ fontSize: 9 }}><ShieldAlert size={9} /> OVERRIDE</span>}
                  {e.manual && <span className="badge b-muted" style={{ fontSize: 9 }}><Clock size={9} /> MANUAL</span>}
                </div>
                {e.entityDisplayId && <div className="tc-desc">{e.entityDisplayId}</div>}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="tc-txt">{e.actorName || e.actorRole || '—'}</div>
                <div className="tc-sub">{e.adminOverride ? `${e.performedByRole ?? 'super_admin'} as ${e.actorRole}` : e.actorRole}</div>
              </div>
              <div><span className={`badge ${CAT_BADGE[e.category]}`}><span className="bdot" />{e.category}</span></div>
            </>
          );
          return href ? (
            <Link key={e.id} to={href} className="tbl-row" style={{ gridTemplateColumns: COLS }}>{inner}</Link>
          ) : (
            <div key={e.id} className="tbl-row" style={{ gridTemplateColumns: COLS, cursor: 'default' }}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
