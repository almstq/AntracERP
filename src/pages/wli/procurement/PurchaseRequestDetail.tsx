import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { useEntity, useSupplierList } from '../../../lib/hooks/useWorkflowData';
import { Timeline } from '../../../components/workflow/Timeline';
import { useAuth } from '../../../lib/hooks/useAuth';
import { executeTransition } from '../../../lib/workflow/executor';
import { purchaseRequestWorkflow as prWf } from '../../../lib/workflow/definitions';
import { getAvailableTransitions } from '../../../lib/workflow/engine';
import type { PurchaseRequest, PRStatus, PRLineItem, PRQuote } from '../../../types/workflow-entities';

export function PurchaseRequestDetail() {
  const { id } = useParams();
  const { user, effectiveRole } = useAuth();
  const { data: pr, loading, refresh } = useEntity<PurchaseRequest>('purchaseRequests', id);
  const { data: suppliers } = useSupplierList();

  const [selSuppliers, setSelSuppliers] = useState<string[]>([]);
  const [quoteDraft, setQuoteDraft] = useState<Record<string, Record<string, number>>>({}); // supplierId → ref → unitPrice
  const [lineSel, setLineSel] = useState<Record<string, string>>({}); // ref → supplierId
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (loading) return <div className="p-6 text-xs text-text-muted">Loading…</div>;
  if (!pr) return <div className="p-6 text-xs text-text-muted">PR not found.</div>;

  const role = effectiveRole;
  const status = pr.status as PRStatus;
  const can = (action: string) => getAvailableTransitions(prWf, status, role).some((t) => t.action === action);
  const supName = (sid: string) => suppliers.find((s) => s.id === sid)?.name ?? sid;

  async function run(to: PRStatus, fields?: Record<string, unknown>, notes?: string) {
    if (!user || !pr) return;
    setBusy(true); setErr(null);
    const res = await executeTransition({
      workflowId: 'purchase_request', entityId: pr.id, to,
      actor: { id: user.uid, role: effectiveRole, name: user.displayName }, fields, notes,
    });
    setBusy(false);
    if (!res.success) { setErr(res.message); return; }
    refresh();
  }

  // Stage: send RFQs — assign selected suppliers to all line items
  function sendRfqs() {
    const lineItems = pr!.lineItems.map((li) => ({ ...li, assignedSupplierIds: selSuppliers }));
    run('rfq_sent', { lineItems, assignedSuppliers: selSuppliers });
  }

  // Stage: build quotes from the per-supplier price grid, then open review
  function submitQuotes() {
    const quotes: PRQuote[] = Object.entries(quoteDraft).map(([sid, lines]) => {
      const linePrices = Object.entries(lines).map(([ref, unitPrice]) => ({ ref, unitPrice: Number(unitPrice) || 0 }));
      const total = pr!.lineItems.reduce((s, li) => s + (Number(lines[li.ref]) || 0) * li.quantity, 0);
      return { id: sid, supplierId: sid, supplierName: supName(sid), total, currency: 'MVR', receivedAt: new Date(), linePrices };
    });
    run('quotes_under_review', { quotes });
  }

  // Stage: GM selects a supplier per line item → set selectedSupplierId/price
  function approveSuppliers() {
    const lineItems: PRLineItem[] = pr!.lineItems.map((li) => {
      const sid = lineSel[li.ref];
      const quote = pr!.quotes?.find((q) => q.supplierId === sid);
      const unit = quote?.linePrices.find((lp) => lp.ref === li.ref)?.unitPrice;
      return { ...li, selectedSupplierId: sid, selectedUnitPrice: unit };
    });
    const selectedSuppliers = [...new Set(Object.values(lineSel).filter(Boolean))];
    if (selectedSuppliers.length === 0) { setErr('Select a supplier for at least one line.'); return; }
    run('gm_quote_approved', { lineItems, selectedSuppliers });
  }

  const assignedSuppliers = [...new Set(pr.lineItems.flatMap((li) => li.assignedSupplierIds ?? []))];
  const fieldCls = 'text-xs p-1.5 rounded bg-bg-surface border border-border text-text-primary';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wli/procurement/requests" className="text-text-muted hover:text-text-primary"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary">{pr.displayId}</h1>
            <span className="text-[10px] px-2 py-1 rounded-full bg-bg-surface text-text-secondary">{prWf.statusLabels[status]}</span>
          </div>
          <p className="text-xs text-text-muted">
            Ticket <Link to={`/wli/tickets/${pr.ticketId}`} className="text-blue">{pr.ticketId}</Link> · {pr.urgency}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          {/* Line items */}
          <Card header={<span className="text-sm font-medium">Line Items</span>}>
            <div className="space-y-2 text-xs">
              {pr.lineItems.map((li) => (
                <div key={li.ref} className="flex justify-between items-center p-2 rounded-lg bg-bg-surface">
                  <span className="text-text-primary">{li.ref}. {li.description}</span>
                  <span className="text-text-muted">
                    ×{li.quantity} {li.uom} · {li.kind}
                    {li.selectedSupplierId ? ` · ${supName(li.selectedSupplierId)} @ ${li.selectedUnitPrice ?? '—'}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Received quotes */}
          {pr.quotes?.length > 0 && (
            <Card header={<span className="text-sm font-medium">Quotes Received</span>}>
              <div className="space-y-1 text-xs">
                {pr.quotes.map((q) => (
                  <div key={q.id} className="flex justify-between p-2 rounded-lg bg-bg-surface">
                    <span className="text-text-primary">{q.supplierName}</span>
                    <span className="text-text-muted">{q.currency} {q.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Linked POs */}
          {pr.purchaseOrderIds?.length > 0 && (
            <Card header={<span className="text-sm font-medium">Purchase Orders</span>}>
              <div className="space-y-1 text-xs">
                {pr.purchaseOrderIds.map((poId) => (
                  <Link key={poId} to={`/wli/procurement/orders/${poId}`} className="block p-2 rounded-lg bg-bg-surface text-blue hover:bg-bg-base">
                    View PO →
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <Timeline collection="purchaseRequests" entityId={pr.id} />
        </div>

        {/* Stage actions */}
        <div className="space-y-4">
          <Card header={<span className="text-sm font-medium">Actions</span>}>
            {err && <p className="text-xs text-red mb-2">{err}</p>}

            {can('accept_pr') && (
              <Button variant="primary" size="sm" className="w-full" onClick={() => run('pr_accepted')} disabled={busy}>Accept PR</Button>
            )}

            {can('send_rfq') && (
              <div className="space-y-2">
                <p className="text-xs text-text-secondary">Assign suppliers to RFQ:</p>
                {suppliers.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-xs text-text-secondary">
                    <input type="checkbox" checked={selSuppliers.includes(s.id)}
                      onChange={(e) => setSelSuppliers((arr) => e.target.checked ? [...arr, s.id] : arr.filter((x) => x !== s.id))} />
                    {s.name}
                  </label>
                ))}
                <Button variant="primary" size="sm" className="w-full" onClick={sendRfqs} disabled={busy || selSuppliers.length === 0}>Send RFQs</Button>
              </div>
            )}

            {can('open_review') && (
              <div className="space-y-2">
                <p className="text-xs text-text-secondary">Enter quoted unit prices:</p>
                {assignedSuppliers.map((sid) => (
                  <div key={sid} className="border border-border rounded-lg p-2 space-y-1">
                    <p className="text-[11px] font-medium text-text-primary">{supName(sid)}</p>
                    {pr.lineItems.map((li) => (
                      <div key={li.ref} className="flex items-center gap-2">
                        <span className="text-[10px] text-text-muted flex-1 truncate">{li.ref}. {li.description}</span>
                        <input type="number" className={`${fieldCls} w-20`} placeholder="unit"
                          value={quoteDraft[sid]?.[li.ref] ?? ''}
                          onChange={(e) => setQuoteDraft((d) => ({ ...d, [sid]: { ...d[sid], [li.ref]: Number(e.target.value) } }))} />
                      </div>
                    ))}
                  </div>
                ))}
                <Button variant="primary" size="sm" className="w-full" onClick={submitQuotes} disabled={busy}>Review Quotes</Button>
              </div>
            )}

            {can('approve_supplier') && (
              <div className="space-y-2">
                <p className="text-xs text-text-secondary">Select supplier per line (split allowed):</p>
                {pr.lineItems.map((li) => (
                  <div key={li.ref}>
                    <p className="text-[10px] text-text-muted">{li.ref}. {li.description}</p>
                    <select className={`${fieldCls} w-full`} value={lineSel[li.ref] ?? ''}
                      onChange={(e) => setLineSel((m) => ({ ...m, [li.ref]: e.target.value }))}>
                      <option value="">Select supplier…</option>
                      {pr.quotes?.map((q) => {
                        const up = q.linePrices.find((lp) => lp.ref === li.ref)?.unitPrice;
                        return <option key={q.supplierId} value={q.supplierId}>{q.supplierName} @ {up ?? '—'}</option>;
                      })}
                    </select>
                  </div>
                ))}
                <Button variant="primary" size="sm" className="w-full" onClick={approveSuppliers} disabled={busy}>Approve Supplier(s)</Button>
                <Button variant="secondary" size="sm" className="w-full" onClick={() => run('rfq_sent', undefined, 'Need more quotes')} disabled={busy}>Need More Quotes</Button>
              </div>
            )}

            {can('raise_po') && (
              <Button variant="primary" size="sm" className="w-full" onClick={() => run('po_raised')} disabled={busy}>Raise PO(s)</Button>
            )}

            {can('close_pr') && (
              <Button variant="primary" size="sm" className="w-full" onClick={() => run('closed')} disabled={busy}>Close PR</Button>
            )}

            {getAvailableTransitions(prWf, status, role).length === 0 && (
              <p className="text-xs text-text-muted">No actions for your role at this stage.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
