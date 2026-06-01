import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { useWorkOrderList, useInvoiceList, useAllPayments } from '../../../lib/hooks/useCrmData';
import { useAssetList } from '../../../lib/hooks/useWorkflowData';
import { formatMoney } from '../../../lib/utils/money';
import { formatDate } from '../../../lib/utils/format';
import { AlertTriangle, DollarSign, Clock, TrendingDown, ChevronRight, BarChart2 } from 'lucide-react';
import { PageContainer } from '../../../components/shared/PageContainer';

const INV_STATUS_STYLE: Record<string, string> = {
  draft:           'bg-border text-text-muted',
  sent:            'bg-blue/10 text-blue',
  partially_paid:  'bg-amber/10 text-amber',
  fully_paid:      'bg-teal/20 text-teal',
  overdue:         'bg-red/10 text-red',
  void:            'bg-border text-text-muted',
};
const INV_STATUS_LABELS: Record<string, string> = {
  draft:           'Draft',
  sent:            'Sent',
  partially_paid:  'Partially Paid',
  fully_paid:      'Fully Paid',
  overdue:         'Overdue',
  void:            'Void',
};

export function FinanceDashboard() {
  const { data: workOrders, loading: wLoading } = useWorkOrderList();
  const { data: invoices, loading: iLoading } = useInvoiceList();
  const { data: payments, loading: pLoading } = useAllPayments();
  const { data: assets, loading: aLoading } = useAssetList();

  const loading = wLoading || iLoading || pLoading || aLoading;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Outstanding invoices (not fully paid, not void)
  const outstanding = invoices.filter(inv =>
    !['fully_paid', 'void', 'draft'].includes(inv.status)
  );
  const overdue = invoices.filter(inv => inv.status === 'overdue');

  // Totals
  const totalOutstanding = outstanding.reduce((s, inv) => s + inv.balance, 0);
  const totalOverdue = overdue.reduce((s, inv) => s + inv.balance, 0);
  const invoiceCurrency = invoices[0]?.currency ?? 'MVR';

  // Advances held across open WOs
  const openWOs = workOrders.filter(w => !['closed'].includes(w.status));
  const advancesHeld = openWOs.reduce((s, w) => s + w.advancePaid, 0);
  const retentionHeld = openWOs.reduce((s, w) => s + w.retentionHeld, 0);
  const woCurrency = workOrders[0]?.currency ?? 'MVR';

  // Payments this month
  const paymentsThisMonth = payments.filter(p =>
    new Date(p.receivedAt) >= monthStart
  );
  const paidThisMonth = paymentsThisMonth.reduce((s, p) => s + p.amount, 0);
  const paymentCurrency = payments[0]?.currency ?? 'MVR';

  // Asset utilisation
  const operationalAssets = assets.filter(a =>
    a.operationalStatus === 'operational' || a.operationalStatus === 'idle'
  );
  const deployedAssets = assets.filter(a => a.commercialStatus === 'deployed');
  const utilisationPct = operationalAssets.length > 0
    ? Math.round((deployedAssets.length / operationalAssets.length) * 100)
    : 0;

  // Sort outstanding by due date (overdue first)
  const sortedOutstanding = [...outstanding].sort((a, b) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (b.status === 'overdue' && a.status !== 'overdue') return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const stats = [
    { label: 'OUTSTANDING', value: loading ? '—' : formatMoney(totalOutstanding, invoiceCurrency as 'MVR' | 'USD'), icon: DollarSign, color: 'text-blue' },
    { label: 'OVERDUE', value: loading ? '—' : formatMoney(totalOverdue, invoiceCurrency as 'MVR' | 'USD'), icon: AlertTriangle, color: 'text-red' },
    { label: 'PAID THIS MONTH', value: loading ? '—' : formatMoney(paidThisMonth, paymentCurrency as 'MVR' | 'USD'), icon: TrendingDown, color: 'text-teal' },
    { label: 'ADVANCES HELD', value: loading ? '—' : formatMoney(advancesHeld, woCurrency as 'MVR' | 'USD'), icon: Clock, color: 'text-amber' },
    { label: 'UTILISATION', value: loading ? '—' : `${utilisationPct}%`, icon: BarChart2, color: 'text-violet' },
  ];

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between px-8 md:px-14 lg:px-16 py-5 border-b border-border bg-bg-panel sticky top-0 z-10">
        <h1 className="text-lg font-bold text-text-primary">Finance Dashboard</h1>
        <span className="text-xs text-text-muted">WLI Revenue Tracking</span>
      </div>

      <PageContainer>

        {/* Stats bar */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-5">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="text-center py-3 px-2">
              <Icon size={14} className={`mx-auto mb-1 ${color}`} />
              <p className={`text-sm font-bold ${color} leading-tight`}>{value}</p>
              <p className="text-[9px] tracking-wide text-text-muted mt-0.5">{label}</p>
            </Card>
          ))}
        </div>

        {/* Advances + Retention summary */}
        {(advancesHeld > 0 || retentionHeld > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {advancesHeld > 0 && (
              <Card>
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Advances Held</p>
                <p className="text-xl font-bold text-amber">{formatMoney(advancesHeld, woCurrency as 'MVR' | 'USD')}</p>
                <p className="text-[10px] text-text-muted mt-1">Across {openWOs.length} open work order(s)</p>
              </Card>
            )}
            {retentionHeld > 0 && (
              <Card>
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Retention Held</p>
                <p className="text-xl font-bold text-orange">{formatMoney(retentionHeld, woCurrency as 'MVR' | 'USD')}</p>
                <p className="text-[10px] text-text-muted mt-1">Released on WO closure</p>
              </Card>
            )}
          </div>
        )}

        {/* Asset Utilisation */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Asset Utilisation</p>
            <span className="text-sm font-bold text-violet">{loading ? '—' : `${utilisationPct}%`}</span>
          </div>
          <div className="h-2 rounded-full bg-bg-surface overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full bg-violet transition-all"
              style={{ width: `${utilisationPct}%` }}
            />
          </div>
          <p className="text-[10px] text-text-muted">
            {deployedAssets.length} deployed · {operationalAssets.length - deployedAssets.length} available · {operationalAssets.length} operational total
          </p>
        </Card>

        {/* Outstanding Invoices */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Outstanding Invoices
              {overdue.length > 0 && (
                <span className="ml-2 text-red">{overdue.length} overdue</span>
              )}
            </p>
            <Link to="/wli/crm/work-orders" className="text-[10px] text-blue flex items-center gap-0.5">
              Work Orders <ChevronRight size={11} />
            </Link>
          </div>
          <Card>
            {loading ? (
              <p className="text-xs text-text-muted p-2">Loading…</p>
            ) : sortedOutstanding.length === 0 ? (
              <p className="text-xs text-text-muted p-2">No outstanding invoices.</p>
            ) : (
              <div className="divide-y divide-border">
                {sortedOutstanding.map(inv => (
                  <Link
                    key={inv.id}
                    to={`/wli/crm/work-orders/${inv.workOrderId}`}
                    className="flex items-center justify-between p-3 hover:bg-bg-surface transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-text-primary">{inv.displayId}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${INV_STATUS_STYLE[inv.status] ?? 'bg-border text-text-muted'}`}>
                          {INV_STATUS_LABELS[inv.status] ?? inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">{inv.customerName}</p>
                      <p className="text-[10px] text-text-muted">
                        Due {formatDate(inv.dueDate)}
                        {inv.status === 'overdue' && (
                          <span className="text-red ml-1 font-medium">— OVERDUE</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <div className="text-right">
                        <p className="text-[9px] text-text-muted uppercase">Balance</p>
                        <p className={`text-xs font-semibold ${inv.status === 'overdue' ? 'text-red' : 'text-text-primary'}`}>
                          {formatMoney(inv.balance, inv.currency as 'MVR' | 'USD')}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Payments This Month */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
            Payments Received This Month
            {!loading && (
              <span className="ml-2 text-teal font-bold">
                {formatMoney(paidThisMonth, paymentCurrency as 'MVR' | 'USD')}
              </span>
            )}
          </p>
          <Card>
            {loading ? (
              <p className="text-xs text-text-muted p-2">Loading…</p>
            ) : paymentsThisMonth.length === 0 ? (
              <p className="text-xs text-text-muted p-2">No payments received this month yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {[...paymentsThisMonth]
                  .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
                  .map(p => (
                    <Link
                      key={p.id}
                      to={`/wli/crm/work-orders/${p.workOrderId}`}
                      className="flex items-center justify-between p-3 hover:bg-bg-surface transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-text-primary">{p.displayId}</p>
                        <p className="text-[10px] text-text-muted">{formatDate(p.receivedAt)} · {p.method.replace('_', ' ')}</p>
                        {p.reference && <p className="text-[10px] text-text-muted">Ref: {p.reference}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <p className="text-xs font-semibold text-teal">
                          {formatMoney(p.amount, p.currency as 'MVR' | 'USD')}
                        </p>
                        <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary" />
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </Card>
        </div>

      </PageContainer>
    </div>
  );
}
