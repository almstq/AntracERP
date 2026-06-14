import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { Plus, Search, ChevronRight, TrendingUp, AlertCircle } from 'lucide-react';
import { listCustomers, createCustomer } from '../../../lib/services/crm';
import { useAuth } from '../../../lib/hooks/useAuth';
import { formatMoney } from '../../../lib/utils/money';
import type { Customer, CreditTerms } from '../../../types/crm';
import { useToast } from '../../../lib/context/ToastContext';

const COLS = '1.8fr 1fr 1fr 0.8fr 24px';

const CREDIT_TERMS: { value: CreditTerms; label: string }[] = [
  { value: 'cod', label: 'COD' },
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_60', label: 'Net 60' },
];

const BLANK = {
  name: '', tradeName: '', contactPerson: '', contactEmail: '',
  contactPhone: '', address: '', gstNumber: '',
  creditTerms: 'net_30' as CreditTerms, creditLimit: '50000',
  currency: 'MVR' as 'MVR' | 'USD',
};

export function CustomerRegister() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof typeof BLANK>(k: K, v: typeof BLANK[K]) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await listCustomers('wli');
      setCustomers(data);
    } finally { setLoading(false); }
  }

  async function addCustomer() {
    if (!form.name.trim()) { setErr('Company name required'); return; }
    if (!form.contactPerson.trim()) { setErr('Contact person required'); return; }
    setBusy(true); setErr(null);
    try {
      await createCustomer({
        orgId: user?.orgId ?? 'antrac',
        sbuId: 'wli',
        name: form.name.trim(),
        tradeName: form.tradeName.trim() || undefined,
        contactPerson: form.contactPerson.trim(),
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        address: form.address.trim() || undefined,
        gstNumber: form.gstNumber.trim() || undefined,
        creditTerms: form.creditTerms,
        creditLimit: parseFloat(form.creditLimit) || 0,
        currency: form.currency,
        active: true,
      });
      toast('success', 'Customer created');
      setForm(BLANK);
      setAdding(false);
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setErr(msg);
      toast('error', msg);
    }
    finally { setBusy(false); }
  }

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Customer Register</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{loading ? 'Loading…' : `${customers.length} customers`}</span>
          </p>
        </div>
        <div className="head-actions">
          <Button variant="primary" size="sm" onClick={() => setAdding(v => !v)}><Plus size={14} /> Add Customer</Button>
        </div>
      </div>

      {adding && (
        <Card className="mb-4">
          <p className="text-xs font-semibold text-text-primary mb-3">New Customer</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <Input placeholder="Company name *" value={form.name} onChange={e => set('name', e.target.value)} />
            <Input placeholder="Trade name (optional)" value={form.tradeName} onChange={e => set('tradeName', e.target.value)} />
            <Input placeholder="Contact person *" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
            <Input placeholder="Email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
            <Input placeholder="Phone" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} />
            <Input placeholder="GST reg. number" value={form.gstNumber} onChange={e => set('gstNumber', e.target.value)} />
            <Input className="md:col-span-2" placeholder="Address" value={form.address} onChange={e => set('address', e.target.value)} />
            <Input placeholder="Credit limit (MVR)" type="number" value={form.creditLimit} onChange={e => set('creditLimit', e.target.value)} />
            <div className="flex gap-2">
              <InputSelect className="flex-1" value={form.creditTerms} onChange={e => set('creditTerms', e.target.value as CreditTerms)}>
                {CREDIT_TERMS.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
              </InputSelect>
              <InputSelect className="w-20" value={form.currency} onChange={e => set('currency', e.target.value as 'MVR' | 'USD')}>
                <option value="MVR">MVR</option>
                <option value="USD">USD</option>
              </InputSelect>
            </div>
          </div>
          {err && <p className="text-xs text-red mt-1">{err}</p>}
          <div className="flex gap-2 mt-3">
            <Button variant="primary" size="sm" onClick={addCustomer} disabled={busy}>{busy ? 'Saving…' : 'Save Customer'}</Button>
            <Button variant="secondary" size="sm" onClick={() => { setAdding(false); setErr(null); }}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="toolbar">
        <div className="search-wrap">
          <Search />
          <input placeholder="Search customers, contacts…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="tbl">
        <div className="tbl-head" style={{ gridTemplateColumns: COLS }}>
          <span>Customer</span><span>Outstanding</span><span>Lifetime</span><span>Active WO</span><span />
        </div>
        {loading ? (
          <div className="tbl-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="tbl-empty">{search ? 'No customers match.' : 'No customers yet. Add your first one.'}</div>
        ) : filtered.map(c => (
          <Link key={c.id} to={`/wli/crm/customers/${c.id}`} className="tbl-row" style={{ gridTemplateColumns: COLS }}>
            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar" style={{ width: 28, height: 28, flexShrink: 0 }}>{c.name.charAt(0)}</div>
              <div style={{ minWidth: 0 }}>
                <div className="tc-id">{c.name}</div>
                <div className="tc-desc">{c.contactPerson} · {CREDIT_TERMS.find(t => t.value === c.creditTerms)?.label ?? c.creditTerms}</div>
              </div>
            </div>
            <div className="tc-txt mono" style={{ color: c.outstandingBalance > 0 ? 'var(--warning)' : undefined }}>
              {c.outstandingBalance > 0 ? formatMoney(c.outstandingBalance, c.currency as 'MVR' | 'USD') : '—'}
            </div>
            <div className="tc-txt mono" style={{ color: c.lifetimeRevenue > 0 ? 'var(--positive)' : undefined }}>
              {c.lifetimeRevenue > 0 ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><TrendingUp size={11} />{formatMoney(c.lifetimeRevenue, c.currency as 'MVR' | 'USD')}</span>
              ) : '—'}
            </div>
            <div>{c.activeWorkOrders > 0 ? <span className="badge b-info"><span className="bdot" />{c.activeWorkOrders} WO</span> : <span className="tc-sub">—</span>}</div>
            <ChevronRight className="tc-chev" />
          </Link>
        ))}
      </div>

      {customers.some(c => c.outstandingBalance > c.creditLimit && c.creditLimit > 0) && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber p-3 rounded-lg bg-amber/5 border border-amber/20">
          <AlertCircle size={14} />
          <span>Some customers are over their credit limit. Review outstanding balances.</span>
        </div>
      )}
    </div>
  );
}
