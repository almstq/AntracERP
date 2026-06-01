import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { ArrowLeft, Building2, Phone, Mail, MapPin, TrendingUp, FileText, Briefcase, CreditCard } from 'lucide-react';
import { getCustomer } from '../../../lib/services/crm';
import { formatMoney } from '../../../lib/utils/money';
import type { Customer } from '../../../types/crm';
import { PageContainer } from '../../../components/shared/PageContainer';

const CREDIT_TERMS_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery', net_15: 'Net 15 Days', net_30: 'Net 30 Days', net_60: 'Net 60 Days',
};

function StatTile({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg bg-bg-surface border border-border">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={13} className={accent ? 'text-teal' : 'text-text-muted'} />
        <span className="text-[9px] uppercase tracking-wider text-text-muted">{label}</span>
      </div>
      <p className={`text-sm font-semibold ${accent ? 'text-teal' : 'text-text-primary'}`}>{value}</p>
      {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

export function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getCustomer(id).then(c => { setCustomer(c); setLoading(false); });
  }, [id]);

  if (loading) return <div className="p-6 text-xs text-text-muted">Loading…</div>;
  if (!customer) return <div className="p-6 text-xs text-text-muted">Customer not found.</div>;

  const cur = customer.currency as 'MVR' | 'USD';
  const creditUtilPct = customer.creditLimit > 0
    ? Math.round((customer.outstandingBalance / customer.creditLimit) * 100) : 0;

  return (
    <PageContainer className="max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wli/crm/customers" className="text-text-muted hover:text-text-primary"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary">{customer.name}</h1>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${customer.active ? 'bg-teal/10 text-teal' : 'bg-border text-text-muted'}`}>
              {customer.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-text-muted">{customer.displayId}{customer.tradeName ? ` · ${customer.tradeName}` : ''}</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Lifetime Revenue" value={formatMoney(customer.lifetimeRevenue, cur)} icon={TrendingUp} accent />
        <StatTile label="Outstanding" value={formatMoney(customer.outstandingBalance, cur)}
          sub={customer.creditLimit > 0 ? `${creditUtilPct}% of limit` : undefined}
          icon={CreditCard}
          accent={creditUtilPct > 80} />
        <StatTile label="Active WOs" value={String(customer.activeWorkOrders)} icon={Briefcase} />
        <StatTile label="Credit Terms" value={CREDIT_TERMS_LABELS[customer.creditTerms] ?? customer.creditTerms}
          sub={customer.creditLimit > 0 ? `Limit: ${formatMoney(customer.creditLimit, cur)}` : 'No limit'}
          icon={FileText} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact */}
        <Card header={<span className="text-sm font-medium">Contact Details</span>}>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-text-secondary">
              <Building2 size={13} className="text-text-muted flex-shrink-0" />
              <span className="font-medium text-text-primary">{customer.contactPerson}</span>
            </div>
            {customer.contactEmail && (
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail size={13} className="text-text-muted flex-shrink-0" />
                <a href={`mailto:${customer.contactEmail}`} className="text-blue hover:underline">{customer.contactEmail}</a>
              </div>
            )}
            {customer.contactPhone && (
              <div className="flex items-center gap-2 text-text-secondary">
                <Phone size={13} className="text-text-muted flex-shrink-0" />
                <span>{customer.contactPhone}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-2 text-text-secondary">
                <MapPin size={13} className="text-text-muted flex-shrink-0 mt-0.5" />
                <span>{customer.address}</span>
              </div>
            )}
            {customer.gstNumber && (
              <div className="flex items-center gap-2 text-text-muted">
                <span className="text-[10px]">GST Reg:</span>
                <span className="font-mono text-xs">{customer.gstNumber}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Activity — shell (to be wired when WOs/invoices exist) */}
        <Card header={<span className="text-sm font-medium">Recent Activity</span>}>
          <div className="space-y-2">
            <Link to={`/wli/crm/enquiries?customer=${customer.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-surface text-xs text-text-secondary">
              <span>Enquiries</span>
              <span className="text-text-muted">→</span>
            </Link>
            <Link to={`/wli/crm/work-orders?customer=${customer.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-surface text-xs text-text-secondary">
              <span>Work Orders</span>
              <span className="text-text-muted">→</span>
            </Link>
            <Link to={`/wli/crm/invoices?customer=${customer.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-surface text-xs text-text-secondary">
              <span>Invoices & Payments</span>
              <span className="text-text-muted">→</span>
            </Link>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
