import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { FileUpload } from '../../../components/shared/FileUpload';
import { ArrowLeft, Download, Plus, CreditCard, Calendar, DollarSign } from 'lucide-react';
import {
  getWorkOrder, getCustomer, getInvoice, createInvoice, createPayment,
  updateInvoice, updateWorkOrder, listPaymentsByInvoice,
} from '../../../lib/services/crm';
import { Timeline } from '../../../components/workflow/Timeline';
import { TransitionPanel } from '../../../components/workflow/TransitionPanel';
import { workOrderWorkflow as wf } from '../../../lib/workflow/definitions';
import { downloadInvoice } from '../../../lib/services/invoice';
import { formatMoney } from '../../../lib/utils/money';
import { formatDate } from '../../../lib/utils/format';
import { useAuth } from '../../../lib/hooks/useAuth';
import { GST_RATE } from '../../../lib/utils/money';
import type { WorkOrder, Customer, Invoice, Payment, InvoiceLineItem, PaymentMethod } from '../../../types/crm';

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-blue/10 text-blue', in_progress: 'bg-violet/10 text-violet',
  completed: 'bg-amber/10 text-amber', invoiced: 'bg-amber/15 text-amber',
  partially_paid: 'bg-teal/10 text-teal', fully_paid: 'bg-teal/20 text-teal',
  closed: 'bg-border text-text-muted',
};

const INV_STATUS_STYLE: Record<string, string> = {
  draft: 'bg-border text-text-muted', sent: 'bg-blue/10 text-blue',
  partially_paid: 'bg-teal/10 text-teal', fully_paid: 'bg-teal/20 text-teal',
  overdue: 'bg-red/10 text-red', void: 'bg-border text-text-muted',
};

// ─── Invoice creation form ────────────────────────────────────────────────────

interface InvoiceFormProps {
  wo: WorkOrder;
  customer: Customer;
  onCreated: (invId: string) => void;
  onCancel: () => void;
}

function InvoiceForm({ wo, onCreated, onCancel }: InvoiceFormProps) {
  const { user } = useAuth();
  const cur = wo.currency as 'MVR' | 'USD';
  const [lines, setLines] = useState<InvoiceLineItem[]>([
    { description: '', quantity: 1, unit: 'day', unitRate: 0, amount: 0 },
  ]);
  const [lessAdvance, setLessAdvance] = useState(wo.advancePaid);
  const [lessRetention, setLessRetention] = useState(wo.retentionHeld);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10);
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const field = 'text-xs p-1.5 rounded bg-bg-surface border border-border text-text-primary';

  function updateLine<K extends keyof InvoiceLineItem>(i: number, k: K, v: InvoiceLineItem[K]) {
    setLines(ls => ls.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, [k]: v };
      updated.amount = updated.quantity * updated.unitRate;
      return updated;
    }));
  }

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const netAfterDeductions = subtotal - lessAdvance - lessRetention;
  const gst = Math.round(Math.max(0, netAfterDeductions) * GST_RATE * 100) / 100;
  const total = Math.max(0, netAfterDeductions) + gst;

  async function submit() {
    if (lines.some(l => !l.description.trim())) { setErr('All lines need a description'); return; }
    setBusy(true); setErr(null);
    try {
      const invId = await createInvoice({
        orgId: wo.orgId, sbuId: wo.sbuId, workOrderId: wo.id,
        customerId: wo.customerId, customerName: wo.customerName,
        status: 'sent',
        dueDate: new Date(dueDate),
        currency: cur,
        lineItems: lines,
        subtotal, lessAdvance, lessRetention, gst, total,
        amountPaid: 0, balance: total,
        issuedById: user?.uid ?? 'unknown',
        sentAt: new Date(),
        paymentIds: [],
      });
      await updateWorkOrder(wo.id, {
        invoiceIds: [...(wo.invoiceIds ?? []), invId],
      });
      onCreated(invId);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-1.5 items-start">
            <input className={`${field} col-span-5`} placeholder="Description" value={l.description}
              onChange={e => updateLine(i, 'description', e.target.value)} />
            <input type="number" className={`${field} col-span-1`} placeholder="Qty" value={l.quantity}
              onChange={e => updateLine(i, 'quantity', parseFloat(e.target.value) || 0)} />
            <input className={`${field} col-span-2`} placeholder="Unit" value={l.unit}
              onChange={e => updateLine(i, 'unit', e.target.value)} />
            <input type="number" className={`${field} col-span-2`} placeholder="Rate" value={l.unitRate || ''}
              onChange={e => updateLine(i, 'unitRate', parseFloat(e.target.value) || 0)} />
            <div className={`${field} col-span-2 text-text-muted`}>{formatMoney(l.amount, cur)}</div>
          </div>
        ))}
        <button onClick={() => setLines(ls => [...ls, { description: '', quantity: 1, unit: 'day', unitRate: 0, amount: 0 }])}
          className="text-[11px] text-blue hover:underline flex items-center gap-1">
          <Plus size={11} /> Add line
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <label className="text-[10px] text-text-muted block mb-1">Less Advance</label>
          <input type="number" className={`${field} w-full`} value={lessAdvance || ''}
            onChange={e => setLessAdvance(parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className="text-[10px] text-text-muted block mb-1">Less Retention</label>
          <input type="number" className={`${field} w-full`} value={lessRetention || ''}
            onChange={e => setLessRetention(parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className="text-[10px] text-text-muted block mb-1">Due Date</label>
          <input type="date" className={`${field} w-full`} value={dueDate}
            onChange={e => setDueDate(e.target.value)} />
        </div>
      </div>

      <div className="bg-bg-surface rounded-lg p-3 space-y-1 text-xs border border-border">
        <div className="flex justify-between text-text-muted"><span>Subtotal</span><span>{formatMoney(subtotal, cur)}</span></div>
        {lessAdvance > 0 && <div className="flex justify-between text-text-muted"><span>Less Advance</span><span>({formatMoney(lessAdvance, cur)})</span></div>}
        {lessRetention > 0 && <div className="flex justify-between text-text-muted"><span>Less Retention</span><span>({formatMoney(lessRetention, cur)})</span></div>}
        <div className="flex justify-between text-text-muted"><span>GST 8%</span><span>{formatMoney(gst, cur)}</span></div>
        <div className="flex justify-between font-semibold text-text-primary border-t border-border pt-1"><span>Total Due</span><span>{formatMoney(total, cur)}</span></div>
      </div>

      {err && <p className="text-xs text-red">{err}</p>}
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Issue Invoice'}</Button>
        <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Payment form ─────────────────────────────────────────────────────────────

interface PaymentFormProps {
  inv: Invoice;
  wo: WorkOrder;
  onRecorded: () => void;
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];

function PaymentForm({ inv, wo, onRecorded }: PaymentFormProps) {
  const { user } = useAuth();
  const cur = inv.currency as 'MVR' | 'USD';
  const [amount, setAmount] = useState(inv.balance);
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState('');
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const field = 'text-xs p-1.5 rounded bg-bg-surface border border-border text-text-primary';

  async function record() {
    if (!amount || amount <= 0) { setErr('Enter a valid amount'); return; }
    if (amount > inv.balance) { setErr(`Amount exceeds balance (${formatMoney(inv.balance, cur)})`); return; }
    setBusy(true); setErr(null);
    try {
      const pmtId = await createPayment({
        orgId: wo.orgId, sbuId: wo.sbuId,
        invoiceId: inv.id, workOrderId: wo.id, customerId: inv.customerId,
        amount, currency: cur, method, reference: reference || undefined,
        receivedAt: new Date(receivedAt),
        recordedById: user?.uid ?? 'unknown',
      });
      const newPaid = inv.amountPaid + amount;
      const newBalance = inv.total - newPaid;
      const newStatus = newBalance <= 0 ? 'fully_paid' : 'partially_paid';
      await updateInvoice(inv.id, {
        amountPaid: newPaid,
        balance: Math.max(0, newBalance),
        status: newStatus,
        paymentIds: [...(inv.paymentIds ?? []), pmtId],
      });
      onRecorded();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-2 p-3 bg-bg-surface rounded-lg border border-border">
      <p className="text-xs font-medium text-text-primary">Record Payment</p>
      <p className="text-[10px] text-text-muted">Balance outstanding: {formatMoney(inv.balance, cur)}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-text-muted block mb-1">Amount ({cur})</label>
          <input type="number" className={`${field} w-full`} value={amount || ''}
            onChange={e => setAmount(parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className="text-[10px] text-text-muted block mb-1">Method</label>
          <select className={`${field} w-full`} value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}>
            {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-text-muted block mb-1">Reference</label>
          <input className={`${field} w-full`} placeholder="Txn / cheque no." value={reference}
            onChange={e => setReference(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] text-text-muted block mb-1">Date Received</label>
          <input type="date" className={`${field} w-full`} value={receivedAt}
            onChange={e => setReceivedAt(e.target.value)} />
        </div>
      </div>
      {err && <p className="text-xs text-red">{err}</p>}
      <Button variant="primary" size="sm" onClick={record} disabled={busy}>{busy ? 'Saving…' : 'Record Payment'}</Button>
    </div>
  );
}

// ─── Invoice card ─────────────────────────────────────────────────────────────

interface InvoiceCardProps { invId: string; wo: WorkOrder; customer: Customer; onUpdate: () => void }

function InvoiceCard({ invId, wo, customer, onUpdate }: InvoiceCardProps) {
  const [inv, setInv] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paying, setPaying] = useState(false);

  async function load() {
    const i = await getInvoice(invId);
    setInv(i);
    if (i) setPayments(await listPaymentsByInvoice(invId));
  }

  useEffect(() => { load(); }, [invId]);

  if (!inv) return null;
  const cur = inv.currency as 'MVR' | 'USD';
  const canPay = !['fully_paid', 'void'].includes(inv.status) && inv.balance > 0;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-bg-surface">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-primary">{inv.displayId}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${INV_STATUS_STYLE[inv.status] ?? 'bg-border text-text-muted'}`}>
              {inv.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-[10px] text-text-muted mt-0.5">
            Due {formatDate(inv.dueDate)} · Balance {formatMoney(inv.balance, cur)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canPay && (
            <button onClick={() => setPaying(v => !v)}
              className="flex items-center gap-1 text-[11px] text-teal hover:underline">
              <CreditCard size={12} /> Record Payment
            </button>
          )}
          <button onClick={() => downloadInvoice(inv, customer, wo)}
            className="flex items-center gap-1 text-[11px] text-blue hover:underline">
            <Download size={12} /> PDF
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="px-3 py-2 space-y-0.5 text-xs border-t border-border">
        <div className="flex justify-between text-text-muted"><span>Total</span><span>{formatMoney(inv.total, cur)}</span></div>
        {inv.amountPaid > 0 && <div className="flex justify-between text-teal"><span>Paid</span><span>{formatMoney(inv.amountPaid, cur)}</span></div>}
        {inv.balance > 0 && <div className="flex justify-between font-medium text-text-primary"><span>Balance</span><span>{formatMoney(inv.balance, cur)}</span></div>}
      </div>

      {/* Payments */}
      {payments.length > 0 && (
        <div className="px-3 pb-2 space-y-1 border-t border-border">
          {payments.map(p => (
            <div key={p.id} className="flex justify-between text-[10px] text-text-muted pt-1">
              <span>{formatDate(p.receivedAt)} · {p.method.replace('_', ' ')}{p.reference ? ` · ${p.reference}` : ''}</span>
              <span className="text-teal">{formatMoney(p.amount, cur)}</span>
            </div>
          ))}
        </div>
      )}

      {paying && (
        <div className="p-3 border-t border-border">
          <PaymentForm inv={inv} wo={wo} onRecorded={() => { setPaying(false); load(); onUpdate(); }} />
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function WorkOrderDetail() {
  const { id } = useParams();
  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [raisingInvoice, setRaisingInvoice] = useState(false);

  async function load() {
    if (!id) return;
    const w = await getWorkOrder(id);
    setWo(w);
    if (w) setCustomer(await getCustomer(w.customerId));
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="p-6 text-xs text-text-muted">Loading…</div>;
  if (!wo || !customer) return <div className="p-6 text-xs text-text-muted">Work order not found.</div>;

  const cur = wo.currency as 'MVR' | 'USD';
  const statusLabel = wf.statusLabels[wo.status as keyof typeof wf.statusLabels] ?? wo.status;
  const canRaiseInvoice = wo.status === 'completed' && !raisingInvoice;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/wli/crm/work-orders" className="text-text-muted hover:text-text-primary">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary">{wo.displayId}</h1>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[wo.status] ?? 'bg-border text-text-muted'}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-text-muted">{wo.customerName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="md:col-span-2 space-y-4">

          {/* Contract summary */}
          <Card header={<span className="text-sm font-medium">Contract</span>}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-[9px] text-text-muted uppercase tracking-wide mb-0.5">Contract Value</p>
                <p className="font-semibold text-text-primary">{formatMoney(wo.contractValue, cur)}</p>
              </div>
              <div>
                <p className="text-[9px] text-text-muted uppercase tracking-wide mb-0.5">Advance Paid</p>
                <p className="font-medium text-teal">{formatMoney(wo.advancePaid, cur)}</p>
              </div>
              <div>
                <p className="text-[9px] text-text-muted uppercase tracking-wide mb-0.5">Retention Held</p>
                <p className="font-medium text-amber">{formatMoney(wo.retentionHeld, cur)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-text-muted" />
                <span className="text-text-secondary">
                  {formatDate(wo.startDate)}{wo.endDate ? ` → ${formatDate(wo.endDate)}` : ''}
                </span>
              </div>
              {wo.completedAt && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-text-muted uppercase tracking-wide">Completed</span>
                  <span className="text-text-secondary">{formatDate(wo.completedAt)}</span>
                </div>
              )}
            </div>
            {wo.notes && <p className="text-xs text-text-muted mt-3 pt-3 border-t border-border">{wo.notes}</p>}
          </Card>

          {/* Assets */}
          {wo.assets && wo.assets.length > 0 && (
            <Card header={<span className="text-sm font-medium">Deployed Assets</span>}>
              <div className="space-y-1.5">
                {wo.assets.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-bg-surface text-xs">
                    <span className="font-medium text-text-primary">{a.assetLabel}</span>
                    <span className="text-text-muted">
                      {a.startDate ? formatDate(a.startDate) : '—'}
                      {a.endDate ? ` → ${formatDate(a.endDate)}` : ''}
                      {a.actualDays ? ` · ${a.actualDays}d` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Invoices */}
          <Card header={
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium">Invoices</span>
              {canRaiseInvoice && (
                <button onClick={() => setRaisingInvoice(true)}
                  className="flex items-center gap-1 text-[11px] text-blue hover:underline">
                  <Plus size={12} /> Raise Invoice
                </button>
              )}
            </div>
          }>
            {raisingInvoice && (
              <div className="mb-3 pb-3 border-b border-border">
                <InvoiceForm wo={wo} customer={customer}
                  onCreated={invId => {
                    setRaisingInvoice(false);
                    setWo(prev => prev ? { ...prev, invoiceIds: [...(prev.invoiceIds ?? []), invId] } : prev);
                  }}
                  onCancel={() => setRaisingInvoice(false)} />
              </div>
            )}

            {wo.invoiceIds && wo.invoiceIds.length > 0 ? (
              <div className="space-y-2">
                {wo.invoiceIds.map(invId => (
                  <InvoiceCard key={invId} invId={invId} wo={wo} customer={customer} onUpdate={load} />
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <DollarSign size={20} className="mx-auto text-text-muted mb-1" />
                <p className="text-xs text-text-muted">
                  {wo.status === 'completed' ? 'Ready to invoice. Click "Raise Invoice" above.' : 'No invoices yet.'}
                </p>
              </div>
            )}
          </Card>

          <FileUpload
            collection="workOrders"
            entityId={wo.id}
            attachments={(wo as any).attachments ?? []}
            onUpdate={load}
            label="Site Photos & Documents"
          />

          <Timeline collection="workOrders" entityId={wo.id} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <TransitionPanel workflowId="work_order" entityId={wo.id} status={wo.status} onDone={load} />

          {/* Customer */}
          <Card header={<span className="text-xs font-medium text-text-muted uppercase tracking-wide">Customer</span>}>
            <div className="text-xs space-y-1">
              <Link to={`/wli/crm/customers/${customer.id}`} className="font-medium text-blue hover:underline block">
                {customer.name}
              </Link>
              <p className="text-text-muted">{customer.contactPerson}</p>
              {customer.contactEmail && <p className="text-text-muted">{customer.contactEmail}</p>}
            </div>
          </Card>

          {/* Enquiry link */}
          {wo.enquiryId && (
            <Card>
              <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Enquiry</p>
              <Link to={`/wli/crm/enquiries/${wo.enquiryId}`} className="text-xs text-blue hover:underline">
                View Enquiry →
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
