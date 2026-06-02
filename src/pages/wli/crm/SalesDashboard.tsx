import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { useEnquiryList, useQuotationList, useWorkOrderList } from '../../../lib/hooks/useCrmData';
import { useAssetList } from '../../../lib/hooks/useWorkflowData';
import { formatMoney } from '../../../lib/utils/money';
import { formatDate } from '../../../lib/utils/format';
import {
  Briefcase, TrendingUp, Send, RotateCcw, BarChart2, ChevronRight,
} from 'lucide-react';
import { PageContainer } from '../../../components/shared/PageContainer';
import { PageHeader } from '../../../components/shared/PageHeader';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';

const WO_STATUS_STYLE: Record<string, string> = {
  active:          'bg-blue/10 text-blue',
  in_progress:     'bg-violet/10 text-violet',
  completed:       'bg-amber/10 text-amber',
  invoiced:        'bg-amber/15 text-amber',
  partially_paid:  'bg-teal/10 text-teal',
  fully_paid:      'bg-teal/20 text-teal',
  closed:          'bg-border text-text-muted',
};
const WO_STATUS_LABELS: Record<string, string> = {
  active:         'Active',
  in_progress:    'In Progress',
  completed:      'Completed',
  invoiced:       'Invoiced',
  partially_paid: 'Partly Paid',
  fully_paid:     'Fully Paid',
  closed:         'Closed',
};

const PIPELINE_LABELS: Record<string, string> = {
  logged:               'New',
  availability_checked: 'Avail. Checked',
  gm_approved:          'GM Approved',
  quotation_drafted:    'Quote Drafted',
  quotation_approved:   'Quote Approved',
  quotation_sent:       'Quote Sent',
  quote_accepted:       'Accepted',
  follow_up:            'Follow-up',
  quote_declined:       'Declined',
  closed:               'Closed',
};
const PIPELINE_STYLE: Record<string, string> = {
  logged:               'bg-blue/10 text-blue',
  availability_checked: 'bg-violet/10 text-violet',
  gm_approved:          'bg-teal/10 text-teal',
  quotation_drafted:    'bg-amber/10 text-amber',
  quotation_approved:   'bg-amber/15 text-amber',
  quotation_sent:       'bg-orange/10 text-orange',
  quote_accepted:       'bg-green/10 text-green',
  follow_up:            'bg-blue/10 text-blue',
  quote_declined:       'bg-red/10 text-red',
  closed:               'bg-border text-text-muted',
};

export function SalesDashboard() {
  const { data: enquiries, loading: eLoading } = useEnquiryList();
  const { data: quotations, loading: qLoading } = useQuotationList();
  const { data: workOrders, loading: wLoading } = useWorkOrderList();
  const { data: assets, loading: aLoading } = useAssetList();

  const loading = eLoading || qLoading || wLoading || aLoading;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Stats
  const activeWOs = workOrders.filter(w =>
    ['active', 'in_progress', 'completed', 'invoiced', 'partially_paid'].includes(w.status)
  );
  const openEnquiries = enquiries.filter(e =>
    !['closed', 'quote_declined', 'quote_accepted'].includes(e.status)
  );
  const quotationsSent = quotations.filter(q => q.status === 'sent');
  const followUps = enquiries.filter(e => e.status === 'follow_up');
  const wonThisMonth = enquiries.filter(e =>
    e.status === 'quote_accepted' && new Date(e.updatedAt) >= monthStart
  );

  // Asset utilisation
  const operationalAssets = assets.filter(a =>
    a.operationalStatus === 'operational' || a.operationalStatus === 'idle'
  );
  const deployedAssets = assets.filter(a => a.commercialStatus === 'deployed');
  const utilisationPct = operationalAssets.length > 0
    ? Math.round((deployedAssets.length / operationalAssets.length) * 100)
    : 0;

  // Active revenue value
  const pipelineValue = activeWOs.reduce((s, w) => s + w.contractValue, 0);
  const activeCurrency = activeWOs[0]?.currency ?? 'MVR';

  const stats = [
    { label: 'ACTIVE WOs', value: activeWOs.length, icon: Briefcase, color: 'text-blue' },
    { label: 'OPEN ENQUIRIES', value: openEnquiries.length, icon: TrendingUp, color: 'text-violet' },
    { label: 'QUOTES SENT', value: quotationsSent.length, icon: Send, color: 'text-amber' },
    { label: 'FOLLOW-UPS', value: followUps.length, icon: RotateCcw, color: 'text-orange' },
    { label: 'WON THIS MONTH', value: wonThisMonth.length, icon: BarChart2, color: 'text-teal' },
  ];

  return (
    <div className="pb-8">
      <PageHeader title="Sales Dashboard" subtitle="CRM & Revenue" sticky />

      <PageContainer>

        {/* Stats bar */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-5">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="text-center py-3">
              <Icon size={14} className={`mx-auto mb-1 ${color}`} />
              <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</p>
              <p className="text-[9px] tracking-wide text-text-muted mt-0.5">{label}</p>
            </Card>
          ))}
        </div>

        {/* Pipeline value + utilisation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card>
            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Active Pipeline Value</p>
            <p className="text-2xl font-bold text-blue">
              {loading ? '—' : formatMoney(pipelineValue, activeCurrency as 'MVR' | 'USD')}
            </p>
            <p className="text-[10px] text-text-muted mt-1">{activeWOs.length} work order(s) in flight</p>
          </Card>
          <Card>
            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Asset Utilisation</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-teal">{loading ? '—' : `${utilisationPct}%`}</p>
              <p className="text-xs text-text-muted mb-0.5">
                {deployedAssets.length} deployed / {operationalAssets.length} operational
              </p>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-bg-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-teal transition-all"
                style={{ width: `${utilisationPct}%` }}
              />
            </div>
          </Card>
        </div>

        {/* Active Work Orders */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Active Work Orders</p>
            <Link to="/wli/crm/work-orders" className="text-[10px] text-blue flex items-center gap-0.5">
              All WOs <ChevronRight size={11} />
            </Link>
          </div>
          <Card>
            {loading ? (
              <LoadingSpinner text="Loading…" />
            ) : activeWOs.length === 0 ? (
              <p className="text-xs text-text-muted p-2">No active work orders.</p>
            ) : (
              <div className="divide-y divide-border">
                {activeWOs.map(wo => (
                  <Link
                    key={wo.id}
                    to={`/wli/crm/work-orders/${wo.id}`}
                    className="flex items-center justify-between p-3 hover:bg-bg-surface transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-text-primary">{wo.displayId}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${WO_STATUS_STYLE[wo.status] ?? 'bg-border text-text-muted'}`}>
                          {WO_STATUS_LABELS[wo.status] ?? wo.status}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary truncate">{wo.customerName}</p>
                      <p className="text-[10px] text-text-muted">
                        From {formatDate(wo.startDate)}{wo.endDate ? ` → ${formatDate(wo.endDate)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <div className="text-right hidden md:block">
                        <p className="text-[9px] text-text-muted uppercase">Contract</p>
                        <p className="text-xs font-medium text-text-primary">
                          {formatMoney(wo.contractValue, wo.currency as 'MVR' | 'USD')}
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

        {/* Enquiry Pipeline */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Open Enquiries</p>
            <Link to="/wli/crm/enquiries" className="text-[10px] text-blue flex items-center gap-0.5">
              All enquiries <ChevronRight size={11} />
            </Link>
          </div>
          <Card>
            {loading ? (
              <LoadingSpinner text="Loading…" />
            ) : openEnquiries.length === 0 ? (
              <p className="text-xs text-text-muted p-2">No open enquiries.</p>
            ) : (
              <div className="divide-y divide-border">
                {openEnquiries.map(enq => (
                  <Link
                    key={enq.id}
                    to={`/wli/crm/enquiries/${enq.id}`}
                    className="flex items-center justify-between p-3 hover:bg-bg-surface transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-text-primary">{enq.displayId}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${PIPELINE_STYLE[enq.status] ?? 'bg-border text-text-muted'}`}>
                          {PIPELINE_LABELS[enq.status] ?? enq.status}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary truncate">{enq.customerName}</p>
                      <p className="text-[10px] text-text-muted">{enq.projectName}</p>
                    </div>
                    <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary flex-shrink-0 ml-3" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quotes Awaiting Response */}
        {quotationsSent.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">Quotations Awaiting Response</p>
            <Card>
              <div className="divide-y divide-border">
                {quotationsSent.map(q => (
                  <Link
                    key={q.id}
                    to={`/wli/crm/enquiries/${q.enquiryId}`}
                    className="flex items-center justify-between p-3 hover:bg-bg-surface transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary">{q.displayId}</p>
                      <p className="text-xs text-text-secondary">{q.customerName}</p>
                      {q.sentAt && (
                        <p className="text-[10px] text-text-muted">Sent {formatDate(q.sentAt)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <div className="text-right hidden md:block">
                        <p className="text-[9px] text-text-muted uppercase">Total</p>
                        <p className="text-xs font-medium text-text-primary">
                          {formatMoney(q.total, q.currency as 'MVR' | 'USD')}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Follow-ups */}
        {followUps.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">Follow-ups Required</p>
            <Card>
              <div className="divide-y divide-border">
                {followUps.map(enq => (
                  <Link
                    key={enq.id}
                    to={`/wli/crm/enquiries/${enq.id}`}
                    className="flex items-center justify-between p-3 hover:bg-bg-surface transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary">{enq.displayId}</p>
                      <p className="text-xs text-text-secondary">{enq.customerName} — {enq.projectName}</p>
                    </div>
                    <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary flex-shrink-0 ml-3" />
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        )}

      </PageContainer>
    </div>
  );
}
