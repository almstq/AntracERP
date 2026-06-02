import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Building2, TrendingUp, FileText, Briefcase, CreditCard, Pencil, ChevronRight,
} from 'lucide-react';
import { getCustomer, updateCustomer } from '../../../lib/services/crm';
import { formatMoney } from '../../../lib/utils/money';
import type { Customer, CreditTerms } from '../../../types/crm';
import { Input } from '../../../components/shared/Input';
import { InputSelect } from '../../../components/shared/InputSelect';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';
import { useToast } from '../../../lib/context/ToastContext';

const CREDIT_TERMS: { value: CreditTerms; label: string }[] = [
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'net_15', label: 'Net 15 Days' },
  { value: 'net_30', label: 'Net 30 Days' },
  { value: 'net_60', label: 'Net 60 Days' },
];
const CREDIT_LABEL = Object.fromEntries(CREDIT_TERMS.map((t) => [t.value, t.label]));

export function CustomerDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getCustomer(id).then((c) => { setCustomer(c); setLoading(false); });
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '', tradeName: '', contactPerson: '', contactEmail: '', contactPhone: '',
    address: '', gstNumber: '', creditTerms: 'cod' as CreditTerms, creditLimit: '', currency: 'MVR', active: 'true',
  });
  const setF = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function startEdit() {
    if (!customer) return;
    setForm({
      name: customer.name, tradeName: customer.tradeName ?? '', contactPerson: customer.contactPerson ?? '',
      contactEmail: customer.contactEmail ?? '', contactPhone: customer.contactPhone ?? '',
      address: customer.address ?? '', gstNumber: customer.gstNumber ?? '',
      creditTerms: customer.creditTerms, creditLimit: String(customer.creditLimit ?? 0),
      currency: customer.currency, active: String(customer.active),
    });
    setEditing(true);
  }
  async function save() {
    if (!customer) return;
    setBusy(true);
    try {
      await updateCustomer(customer.id, {
        name: form.name, tradeName: form.tradeName || undefined, contactPerson: form.contactPerson,
        contactEmail: form.contactEmail || undefined, contactPhone: form.contactPhone || undefined,
        address: form.address || undefined, gstNumber: form.gstNumber || undefined,
        creditTerms: form.creditTerms, creditLimit: parseFloat(form.creditLimit) || 0,
        currency: form.currency as 'MVR' | 'USD', active: form.active === 'true',
      });
      toast('success', 'Customer updated');
      setEditing(false);
      load();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Update failed');
    } finally { setBusy(false); }
  }

  if (loading) return <div className="page"><LoadingSpinner text="Loading…" /></div>;
  if (!customer) return <div className="page"><p className="empty-note">Customer not found.</p></div>;

  const cur = customer.currency as 'MVR' | 'USD';
  const creditUtilPct = customer.creditLimit > 0 ? Math.round((customer.outstandingBalance / customer.creditLimit) * 100) : 0;

  const metrics = [
    { label: 'Lifetime Revenue', value: formatMoney(customer.lifetimeRevenue, cur), tint: 'tint-accent', icon: TrendingUp },
    { label: 'Outstanding', value: formatMoney(customer.outstandingBalance, cur), tint: creditUtilPct > 80 ? 'tint-danger' : 'tint-warn', icon: CreditCard },
    { label: 'Active WOs', value: String(customer.activeWorkOrders), tint: 'tint-info', icon: Briefcase },
    { label: 'Credit Terms', value: CREDIT_LABEL[customer.creditTerms] ?? customer.creditTerms, tint: 'tint-pos', icon: FileText },
  ];

  return (
    <div className="page">
      <Link to="/wli/crm/customers" className="dback"><ArrowLeft /> Customers</Link>

      <div className="dhead">
        <div>
          <span className="eyebrow">{customer.displayId}</span>
          <h1 className="dtitle">{customer.name}</h1>
          <div className="dhead-badges">
            <span className={`badge ${customer.active ? 'b-pos' : 'b-muted'}`}><span className="bdot" />{customer.active ? 'Active' : 'Inactive'}</span>
            {customer.tradeName && <span className="tc-sub">{customer.tradeName}</span>}
          </div>
        </div>
        <div className="dhead-actions">
          {!editing && <button className="btn btn-ghost" onClick={startEdit}><Pencil /> Edit</button>}
        </div>
      </div>

      {/* KPI metrics */}
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div className="metric" key={m.label}>
              <div className="metric-top">
                <span className="metric-label">{m.label}</span>
                <span className={`metric-ic ${m.tint}`}><Icon /></span>
              </div>
              <div className="metric-val" style={{ fontSize: 18 }}>{m.value}</div>
            </div>
          );
        })}
      </div>

      <div className="detail" style={{ marginTop: 16 }}>
        <div className="dcol">
          <div className="dcard">
            <div className="dcard-h"><h3><Building2 /> {editing ? 'Edit Customer' : 'Contact Details'}</h3></div>
            <div className="dcard-b">
              {editing ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div className="kv">
                    <div><div className="k">Company</div><Input value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="Company name" /></div>
                    <div><div className="k">Trade name</div><Input value={form.tradeName} onChange={(e) => setF('tradeName', e.target.value)} placeholder="Trade name" /></div>
                    <div><div className="k">Contact person</div><Input value={form.contactPerson} onChange={(e) => setF('contactPerson', e.target.value)} placeholder="Contact person" /></div>
                    <div><div className="k">Email</div><Input value={form.contactEmail} onChange={(e) => setF('contactEmail', e.target.value)} placeholder="Email" /></div>
                    <div><div className="k">Phone</div><Input value={form.contactPhone} onChange={(e) => setF('contactPhone', e.target.value)} placeholder="Phone" /></div>
                    <div><div className="k">GST reg.</div><Input value={form.gstNumber} onChange={(e) => setF('gstNumber', e.target.value)} placeholder="GST number" /></div>
                    <div style={{ gridColumn: '1 / -1' }}><div className="k">Address</div><Input value={form.address} onChange={(e) => setF('address', e.target.value)} placeholder="Address" /></div>
                    <div><div className="k">Credit terms</div>
                      <InputSelect value={form.creditTerms} onChange={(e) => setF('creditTerms', e.target.value)}>
                        {CREDIT_TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </InputSelect>
                    </div>
                    <div><div className="k">Credit limit</div><Input type="number" value={form.creditLimit} onChange={(e) => setF('creditLimit', e.target.value)} placeholder="0" /></div>
                    <div><div className="k">Currency</div>
                      <InputSelect value={form.currency} onChange={(e) => setF('currency', e.target.value)}>
                        <option value="MVR">MVR</option><option value="USD">USD</option>
                      </InputSelect>
                    </div>
                    <div><div className="k">Status</div>
                      <InputSelect value={form.active} onChange={(e) => setF('active', e.target.value)}>
                        <option value="true">Active</option><option value="false">Inactive</option>
                      </InputSelect>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="primary" size="sm" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="kv">
                  <div><div className="k">Contact person</div><div className="v">{customer.contactPerson || '—'}</div></div>
                  <div><div className="k">Email</div><div className="v">{customer.contactEmail || '—'}</div></div>
                  <div><div className="k">Phone</div><div className="v">{customer.contactPhone || '—'}</div></div>
                  <div><div className="k">GST reg.</div><div className="v"><span className="mono">{customer.gstNumber || '—'}</span></div></div>
                  <div style={{ gridColumn: '1 / -1' }}><div className="k">Address</div><div className="v">{customer.address || '—'}</div></div>
                  <div><div className="k">Credit limit</div><div className="v">{customer.creditLimit > 0 ? formatMoney(customer.creditLimit, cur) : 'No limit'}</div></div>
                  <div><div className="k">Currency</div><div className="v">{customer.currency}</div></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dcol">
          <div className="dcard">
            <div className="dcard-h"><h3>Recent Activity</h3></div>
            <div className="dcard-b">
              <Link className="linkrow" to={`/wli/crm/enquiries?customer=${customer.id}`}>
                <div style={{ flex: 1 }}><div className="lr-id" style={{ fontFamily: 'var(--font-ui)' }}>Enquiries</div></div><ChevronRight className="lr-chev" />
              </Link>
              <Link className="linkrow" to={`/wli/crm/work-orders?customer=${customer.id}`}>
                <div style={{ flex: 1 }}><div className="lr-id" style={{ fontFamily: 'var(--font-ui)' }}>Work Orders</div></div><ChevronRight className="lr-chev" />
              </Link>
              <Link className="linkrow" to={`/wli/crm/finance?customer=${customer.id}`}>
                <div style={{ flex: 1 }}><div className="lr-id" style={{ fontFamily: 'var(--font-ui)' }}>Invoices & Payments</div></div><ChevronRight className="lr-chev" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
