import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { ArrowLeft, Download, MapPin, Calendar } from 'lucide-react';
import { getEnquiry, getCustomer, getQuotation } from '../../../lib/services/crm';
import { Timeline } from '../../../components/workflow/Timeline';
import { TransitionPanel } from '../../../components/workflow/TransitionPanel';
import { enquiryWorkflow as wf } from '../../../lib/workflow/definitions';
import { downloadQuotation } from '../../../lib/services/quotation';
import { formatDate } from '../../../lib/utils/format';
import { formatMoney } from '../../../lib/utils/money';
import type { Enquiry, Customer, Quotation } from '../../../types/crm';
import { PageContainer } from '../../../components/shared/PageContainer';

const STATUS_STYLE: Record<string, string> = {
  logged: 'bg-blue/10 text-blue',
  availability_checked: 'bg-cyan/10 text-cyan',
  gm_approved: 'bg-violet/10 text-violet',
  quotation_drafted: 'bg-amber/10 text-amber',
  quotation_approved: 'bg-teal/10 text-teal',
  quotation_sent: 'bg-teal/15 text-teal',
  quote_accepted: 'bg-teal/20 text-teal',
  quote_declined: 'bg-red/10 text-red',
  follow_up: 'bg-amber/15 text-amber',
  closed: 'bg-border text-text-muted',
};

export function EnquiryDetail() {
  const { id } = useParams();
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!id) return;
    const e = await getEnquiry(id);
    setEnquiry(e);
    if (e) {
      const [c, q] = await Promise.all([
        getCustomer(e.customerId),
        e.quotationId ? getQuotation(e.quotationId) : Promise.resolve(null),
      ]);
      setCustomer(c);
      setQuotation(q);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  function refresh() { load(); }

  if (loading) return <div className="p-6 text-xs text-text-muted">Loading…</div>;
  if (!enquiry) return <div className="p-6 text-xs text-text-muted">Enquiry not found.</div>;

  const statusLabel = wf.statusLabels[enquiry.status as keyof typeof wf.statusLabels] ?? enquiry.status;

  return (
    <PageContainer className="max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wli/crm/enquiries" className="text-text-muted hover:text-text-primary"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary">{enquiry.displayId}</h1>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[enquiry.status] ?? 'bg-border text-text-muted'}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-text-muted">{enquiry.projectName} · {enquiry.customerName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          {/* Project details */}
          <Card header={<span className="text-sm font-medium">Project Details</span>}>
            <div className="space-y-2 text-xs">
              {enquiry.projectLocation && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <MapPin size={12} className="text-text-muted" />
                  <span>{enquiry.projectLocation}</span>
                </div>
              )}
              {(enquiry.mobilisationDate || enquiry.demobilisationDate) && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Calendar size={12} className="text-text-muted" />
                  <span>
                    {enquiry.mobilisationDate ? formatDate(enquiry.mobilisationDate) : '?'}
                    {' — '}
                    {enquiry.demobilisationDate ? formatDate(enquiry.demobilisationDate) : 'TBC'}
                  </span>
                </div>
              )}
              {enquiry.notes && (
                <p className="text-text-secondary">{enquiry.notes}</p>
              )}
              {enquiry.availabilityNotes && (
                <div className="p-5 rounded-lg bg-bg-surface border border-border">
                  <p className="text-[9px] uppercase tracking-wide text-text-muted mb-1">Availability Check Notes</p>
                  <p className="text-text-secondary">{enquiry.availabilityNotes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Asset requests */}
          <Card header={<span className="text-sm font-medium">Asset Requirements</span>}>
            <div className="space-y-2">
              {enquiry.assetRequests.map((req, i) => (
                <div key={i} className="flex items-start justify-between p-2 rounded-lg bg-bg-surface text-xs">
                  <div>
                    <p className="font-medium text-text-primary">{req.assetType}</p>
                    {req.notes && <p className="text-text-muted text-[10px] mt-0.5">{req.notes}</p>}
                    {req.proposedAssetIds && req.proposedAssetIds.length > 0 && (
                      <p className="text-[10px] text-teal mt-0.5">{req.proposedAssetIds.length} asset(s) proposed</p>
                    )}
                  </div>
                  <span className="text-text-muted flex-shrink-0 ml-4">×{req.quantity}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quotation card (when linked) */}
          {quotation && (
            <Card header={
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-medium">Quotation — {quotation.displayId}</span>
                {customer && (
                  <button onClick={() => downloadQuotation(quotation, customer)}
                    className="flex items-center gap-1 text-[11px] text-blue hover:underline">
                    <Download size={12} /> Download
                  </button>
                )}
              </div>
            }>
              <div className="space-y-1.5 text-xs">
                {quotation.lineItems.map((li, i) => (
                  <div key={i} className="flex justify-between p-2 rounded-lg bg-bg-surface">
                    <span className="text-text-secondary">{li.assetType} ×{li.quantity} {li.unit}</span>
                    <span className="text-text-muted">{formatMoney(li.unitRate * li.quantity, quotation.currency)}</span>
                  </div>
                ))}
                <div className="space-y-0.5 pt-2 border-t border-border">
                  <div className="flex justify-between text-text-muted">
                    <span>Subtotal</span><span>{formatMoney(quotation.subtotal, quotation.currency)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>GST 8%</span><span>{formatMoney(quotation.gst, quotation.currency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-text-primary pt-0.5 border-t border-border">
                    <span>Grand Total</span><span>{formatMoney(quotation.total, quotation.currency)}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Timeline collection="enquiries" entityId={enquiry.id} />
        </div>

        <div className="space-y-4">
          <TransitionPanel workflowId="enquiry" entityId={enquiry.id} status={enquiry.status} onDone={refresh} />

          {customer && (
            <Card header={<span className="text-xs font-medium text-text-muted uppercase tracking-wide">Customer</span>}>
              <div className="text-xs space-y-1">
                <Link to={`/wli/crm/customers/${customer.id}`} className="font-medium text-blue hover:underline">
                  {customer.name}
                </Link>
                <p className="text-text-muted">{customer.contactPerson}</p>
                {customer.contactEmail && <p className="text-text-muted">{customer.contactEmail}</p>}
              </div>
            </Card>
          )}

          {enquiry.workOrderId && (
            <Card>
              <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Work Order</p>
              <Link to={`/wli/crm/work-orders/${enquiry.workOrderId}`}
                className="text-xs text-blue hover:underline">
                View Work Order →
              </Link>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
