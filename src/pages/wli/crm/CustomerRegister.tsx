import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { Users, Plus, Search, ChevronRight, TrendingUp, AlertCircle } from 'lucide-react';
import { listCustomers, createCustomer } from '../../../lib/services/crm';
import { useAuth } from '../../../lib/hooks/useAuth';
import { formatMoney } from '../../../lib/utils/money';
import type { Customer, CreditTerms } from '../../../types/crm';
import { PageContainer } from '../../../components/shared/PageContainer';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';
import { useToast } from '../../../lib/context/ToastContext';

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
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Customer Register</h1>
          <p className="text-xs text-text-muted">{loading ? 'Loading…' : `${customers.length} customers`}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAdding(v => !v)}>
          <Plus size={14} /> Add Customer
        </Button>
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

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-bg-surface border border-border text-text-primary"
          placeholder="Search customers…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Card>
        {loading ? (
          <LoadingSpinner text="Loading…" />
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <Users size={28} className="mx-auto text-text-muted mb-2" />
            <p className="text-xs text-text-muted">{search ? 'No customers match.' : 'No customers yet. Add your first one.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(c => (
              <Link key={c.id} to={`/wli/crm/customers/${c.id}`}
                className="flex items-center justify-between p-3 hover:bg-bg-surface transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-blue">{c.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{c.name}</p>
                    <p className="text-[10px] text-text-muted">{c.contactPerson} · {CREDIT_TERMS.find(t => t.value === c.creditTerms)?.label ?? c.creditTerms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {c.outstandingBalance > 0 && (
                    <div className="text-right hidden md:block">
                      <p className="text-[9px] text-text-muted uppercase tracking-wide">Outstanding</p>
                      <p className="text-xs font-medium text-amber">{formatMoney(c.outstandingBalance, c.currency as 'MVR' | 'USD')}</p>
                    </div>
                  )}
                  {c.lifetimeRevenue > 0 && (
                    <div className="text-right hidden md:block">
                      <p className="text-[9px] text-text-muted uppercase tracking-wide">Lifetime</p>
                      <p className="text-xs font-medium text-teal flex items-center gap-1">
                        <TrendingUp size={10} />{formatMoney(c.lifetimeRevenue, c.currency as 'MVR' | 'USD')}
                      </p>
                    </div>
                  )}
                  {c.activeWorkOrders > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue/10 text-blue">{c.activeWorkOrders} active WO</span>
                  )}
                  <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {customers.some(c => c.outstandingBalance > c.creditLimit && c.creditLimit > 0) && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber p-3 rounded-lg bg-amber/5 border border-amber/20">
          <AlertCircle size={14} />
          <span>Some customers are over their credit limit. Review outstanding balances.</span>
        </div>
      )}
    </PageContainer>
  );
}
