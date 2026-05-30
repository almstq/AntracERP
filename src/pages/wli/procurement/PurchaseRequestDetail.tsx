import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { updateFields } from '../../../lib/firebase/db';
import { useEntity, useSupplierList } from '../../../lib/hooks/useWorkflowData';
import { Timeline } from '../../../components/workflow/Timeline';
import { useAuth } from '../../../lib/hooks/useAuth';
import { executeTransition } from '../../../lib/workflow/executor';
import { purchaseRequestWorkflow as prWf } from '../../../lib/workflow/definitions';
import { getAvailableTransitions } from '../../../lib/workflow/engine';
import { buildRfqHtml, rfqNumber, downloadHtml } from '../../../lib/services/rfq';
import type { PurchaseRequest, PRStatus, PRLineItem, PRQuote } from '../../../types/workflow-entities';

export function PurchaseRequestDetail() {
  const { id } = useParams();
  const { user, effectiveRole } = useAuth();
  const { data: pr, loading, refresh } = useEntity<PurchaseRequest>('purchaseRequests', id);
  const { data: suppliers } = useSupplierList();

  // Quote entry: { supplierId -> { ref -> unitPrice } }
  const [quoteDraft, setQuoteDraft] = useState<Record<string, Record<string, number>>>({});
  // Stage 7 GM selection: { ref -> supplierId }
  const [lineSel, setLineSel] = useState<Record<string, string>>({});
  // Supplier columns staged for sourcing (added but not yet assigned to an item)
  const [extraCols, setExtraCols] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Seed the quote-entry grid from any quotes already saved on the PR.
  useEffect(() => {
    if (!pr?.quotes?.length) return;
    setQuoteDraft((cur) => {
      if (Object.keys(cur).length) return cur;
      const seed: Record<string, Record<string, number>> = {};
      for (const q of pr.quotes) { seed[q.supplierId] = {}; for (const lp of q.linePrices) seed[q.supplierId][lp.ref] = lp.unitPrice; }
      return seed;
    });
  }, [pr]);

  if (loading) return <div className="p-6 text-xs text-text-muted">Loading…</div>;
  if (!pr) return <div className="p-6 text-xs text-text-muted">PR not found.</div>;

  const role = effectiveRole;
  const status = pr.status as PRStatus;
  const can = (action: string) => getAvailableTransitions(prWf, status, role).some((t) => t.action === action);
  const canEnterQuotes = ['proc_staff', 'super_admin'].includes(role) && (status === 'rfq_sent' || status === 'quotes_under_review');
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

  // Iteratively assign a supplier to a line item (issue another RFQ) — persists, no transition.
  async function assignSupplier(ref: string, sid: string) {
    if (!pr || !sid) return;
    const lineItems = pr.lineItems.map((li) =>
      li.ref === ref && !(li.assignedSupplierIds ?? []).includes(sid)
        ? { ...li, assignedSupplierIds: [...(li.assignedSupplierIds ?? []), sid] }
        : li);
    setBusy(true); setErr(null);
    try { await updateFields('purchaseRequests', pr.id, { lineItems }); refresh(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Failed to assign supplier'); }
    finally { setBusy(false); }
  }

  // Build PRQuote[] from the entry grid (each supplier prices only its assigned items)
  function buildQuotes(): PRQuote[] {
    const union = [...new Set(pr!.lineItems.flatMap((li) => li.assignedSupplierIds ?? []))];
    return union.map((sid) => {
      const itemsForSup = pr!.lineItems.filter((li) => (li.assignedSupplierIds ?? []).includes(sid));
      const linePrices = itemsForSup.map((li) => ({ ref: li.ref, unitPrice: Number(quoteDraft[sid]?.[li.ref]) || 0 }));
      const total = itemsForSup.reduce((s, li) => s + (Number(quoteDraft[sid]?.[li.ref]) || 0) * li.quantity, 0);
      return { id: sid, supplierId: sid, supplierName: supName(sid), total, currency: 'MVR' as const, receivedAt: new Date(), linePrices };
    });
  }

  // Proc populates quotes WITHOUT leaving their desk (no transition).
  async function saveQuotes() {
    if (!pr) return;
    setBusy(true); setErr(null);
    try { await updateFields('purchaseRequests', pr.id, { quotes: buildQuotes() }); refresh(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Failed to save quotes'); }
    finally { setBusy(false); }
  }

  // Proc hands off to GM once quotes are gathered.
  function forwardToGm() { run('quotes_under_review', { quotes: buildQuotes() }); }

  // Stage 7 → GM picks a supplier per line (split allowed)
  function approveSuppliers() {
    const lineItems: PRLineItem[] = pr!.lineItems.map((li) => {
      const sid = lineSel[li.ref];
      const quote = pr!.quotes?.find((q) => q.supplierId === sid);
      const unit = quote?.linePrices.find((lp) => lp.ref === li.ref)?.unitPrice;
      return { ...li, selectedSupplierId: sid, selectedUnitPrice: unit };
    });
    const selectedSuppliers = [...new Set(Object.values(lineSel).filter(Boolean))];
    if (lineItems.some((li) => !li.selectedSupplierId)) { setErr('Select a supplier for every line.'); return; }
    run('gm_quote_approved', { lineItems, selectedSuppliers });
  }

  const union = [...new Set(pr.lineItems.flatMap((li) => li.assignedSupplierIds ?? []))];

  function downloadRfq(sid: string) {
    const items = pr!.lineItems.filter((li) => (li.assignedSupplierIds ?? []).includes(sid));
    const sup = { id: sid, name: supName(sid) };
    downloadHtml(`${rfqNumber(pr!, sid)}.html`, buildRfqHtml(pr!, sup, items));
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wli/procurement/requests" className="text-text-muted hover:text-text-primary"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary">{pr.displayId}</h1>
            <span className="text-[10px] px-2 py-1 rounded-full bg-bg-surface text-text-secondary">{prWf.statusLabels[status]}</span>
          </div>
          <p className="text-xs text-text-muted">Ticket <Link to={`/wli/tickets/${pr.ticketId}`} className="text-blue">{pr.ticketId}</Link> · {pr.urgency}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card header={<span className="text-sm font-medium">Line Items</span>}>
            <div className="space-y-2 text-xs">
              {pr.lineItems.map((li) => (
                <div key={li.ref} className="flex justify-between items-center p-2 rounded-lg bg-bg-surface">
                  <span className="text-text-primary">{li.ref}. {li.description}</span>
                  <span className="text-text-muted">
                    ×{li.quantity} {li.uom} · {li.kind}
                    {li.assignedSupplierIds?.length ? ` · RFQ: ${li.assignedSupplierIds.map(supName).join(', ')}` : ''}
                    {li.selectedSupplierId ? ` · ✓ ${supName(li.selectedSupplierId)} @ ${li.selectedUnitPrice ?? '—'}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Sourcing matrix — suppliers (columns) × items (rows); cell = quoted unit price */}
          {canEnterQuotes && (() => {
            const cols = [...new Set([...union, ...extraCols])];
            const addable = suppliers.filter((s) => !cols.includes(s.id));
            return (
              <Card header={
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-medium">Sourcing — suppliers × items</span>
                  {addable.length > 0 && (
                    <select className="text-[11px] p-1 rounded bg-bg-surface border border-border text-text-primary" value=""
                      onChange={(e) => { if (e.target.value) setExtraCols((c) => [...c, e.target.value]); }}>
                      <option value="">+ add supplier…</option>
                      {addable.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}
                </div>
              }>
                {cols.length === 0 ? (
                  <p className="text-xs text-text-muted">Add a supplier to start issuing RFQs for these items.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="text-text-muted">
                          <th className="text-left p-1.5">Item</th>
                          <th className="p-1.5 whitespace-nowrap">Req. qty</th>
                          {cols.map((sid) => (
                            <th key={sid} className="p-1.5 text-center min-w-[100px]">
                              <div className="text-text-primary">{supName(sid)}</div>
                              {union.includes(sid)
                                ? <button onClick={() => downloadRfq(sid)} className="text-blue text-[10px]">RFQ ↓</button>
                                : <span className="text-[9px] text-text-muted">not solicited</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pr.lineItems.map((li) => (
                          <tr key={li.ref} className="border-t border-border">
                            <td className="p-1.5 text-text-primary">{li.ref}. {li.description}</td>
                            <td className="p-1.5 text-center text-text-secondary whitespace-nowrap">{li.quantity} {li.uom}</td>
                            {cols.map((sid) => {
                              const assigned = (li.assignedSupplierIds ?? []).includes(sid);
                              if (!assigned) return (
                                <td key={sid} className="p-1 text-center">
                                  <button onClick={() => assignSupplier(li.ref, sid)} disabled={busy}
                                    className="text-[10px] px-2 py-1 rounded border border-dashed border-border text-text-muted hover:text-blue hover:border-blue">+ RFQ</button>
                                </td>
                              );
                              return (
                                <td key={sid} className="p-1">
                                  <input type="number" min="0" step="0.01" placeholder="price"
                                    className="w-full text-[11px] p-1 rounded bg-bg-surface border border-border text-text-primary text-right"
                                    value={quoteDraft[sid]?.[li.ref] ?? ''}
                                    onChange={(e) => setQuoteDraft((d) => ({ ...d, [sid]: { ...d[sid], [li.ref]: Number(e.target.value) } }))} />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        <tr className="border-t border-border font-medium">
                          <td className="p-1.5 text-text-muted" colSpan={2}>Quote total (MVR)</td>
                          {cols.map((sid) => {
                            const total = pr.lineItems.filter((li) => (li.assignedSupplierIds ?? []).includes(sid))
                              .reduce((s, li) => s + (Number(quoteDraft[sid]?.[li.ref]) || 0) * li.quantity, 0);
                            return <td key={sid} className="p-1.5 text-center text-text-secondary">{total ? total.toLocaleString() : '—'}</td>;
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="text-[10px] text-text-muted mt-2">Each column is a supplier. <b>+ RFQ</b> issues an RFQ for that item; enter the quoted unit price when received. Qty is fixed from the request.</p>
                {err && <p className="text-xs text-red mt-2">{err}</p>}
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="secondary" size="sm" onClick={saveQuotes} disabled={busy}>Save Quotes</Button>
                  {status === 'rfq_sent' && can('open_review') && union.length > 0 && (
                    <Button variant="primary" size="sm" onClick={forwardToGm} disabled={busy}>Forward to GM</Button>
                  )}
                </div>
              </Card>
            );
          })()}

          {/* GM price comparison — item × supplier grid, lowest flagged */}
          {status === 'quotes_under_review' && can('approve_supplier') && (pr.quotes?.length ?? 0) > 0 && (() => {
            const cols = [...new Set(pr.quotes.map((q) => q.supplierId))];
            const priceFor = (sid: string, ref: string) => pr.quotes.find((q) => q.supplierId === sid)?.linePrices.find((lp) => lp.ref === ref)?.unitPrice;
            const autoLowest = () => {
              const next: Record<string, string> = {};
              for (const li of pr.lineItems) {
                let best: string | undefined; let bestP = Infinity;
                for (const c of cols) { const p = priceFor(c, li.ref); if (p != null && p < bestP) { bestP = p; best = c; } }
                if (best) next[li.ref] = best;
              }
              setLineSel(next);
            };
            return (
              <Card header={<span className="text-sm font-medium">Price Comparison</span>}>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] border-collapse">
                    <thead><tr>
                      <th className="text-left p-1.5 text-text-muted font-medium">Item</th>
                      {cols.map((c) => <th key={c} className="p-1.5 text-text-muted font-medium">{supName(c)}</th>)}
                    </tr></thead>
                    <tbody>
                      {pr.lineItems.map((li) => {
                        const prices = cols.map((c) => priceFor(c, li.ref));
                        const lowest = Math.min(...prices.filter((p): p is number => p != null));
                        return (
                          <tr key={li.ref} className="border-t border-border">
                            <td className="p-1.5 text-text-primary">{li.ref}. {li.description}</td>
                            {cols.map((c, i) => {
                              const p = prices[i];
                              if (p == null) return <td key={c} className="p-1.5 text-center text-text-muted">—</td>;
                              const sel = lineSel[li.ref] === c;
                              const low = p === lowest;
                              return (
                                <td key={c} className="p-1 text-center">
                                  <button onClick={() => setLineSel((m) => ({ ...m, [li.ref]: c }))}
                                    className={`px-2 py-1 rounded w-full ${sel ? 'bg-blue text-white' : low ? 'bg-teal/15 text-teal' : 'bg-bg-surface text-text-secondary'} hover:opacity-80`}>
                                    {p.toLocaleString()}{low ? ' ★' : ''}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-text-muted mt-2">★ = lowest quote · click a price to select that supplier for the item (split allowed)</p>
                {err && <p className="text-xs text-red mt-2">{err}</p>}
                <div className="flex gap-2 mt-3">
                  <Button variant="secondary" size="sm" onClick={autoLowest} disabled={busy}>Auto-pick lowest</Button>
                  <Button variant="primary" size="sm" className="flex-1" onClick={approveSuppliers} disabled={busy}>Approve Supplier(s)</Button>
                  <Button variant="secondary" size="sm" onClick={() => run('rfq_sent', undefined, 'Need more quotes')} disabled={busy}>More Quotes</Button>
                </div>
              </Card>
            );
          })()}

          {pr.purchaseOrderIds?.length > 0 && (
            <Card header={<span className="text-sm font-medium">Purchase Orders</span>}>
              <div className="space-y-1 text-xs">
                {pr.purchaseOrderIds.map((poId) => (
                  <Link key={poId} to={`/wli/procurement/orders/${poId}`} className="block p-2 rounded-lg bg-bg-surface text-blue hover:bg-bg-base">View PO →</Link>
                ))}
              </div>
            </Card>
          )}

          <Timeline collection="purchaseRequests" entityId={pr.id} />
        </div>

        <div className="space-y-4">
          <Card header={<span className="text-sm font-medium">Actions</span>}>
            {err && <p className="text-xs text-red mb-2">{err}</p>}

            {can('accept_pr') && (
              <Button variant="primary" size="sm" className="w-full" onClick={() => run('pr_accepted')} disabled={busy}>Accept PR</Button>
            )}

            {/* Stage 6 — begin sourcing */}
            {can('send_rfq') && (
              <Button variant="primary" size="sm" className="w-full" onClick={() => run('rfq_sent')} disabled={busy}>Start Sourcing</Button>
            )}

            {canEnterQuotes && (
              <p className="text-xs text-text-muted">Use the <b>Sourcing</b> matrix on the left to add suppliers, issue RFQs and record quotes.</p>
            )}

            {can('approve_supplier') && (
              <p className="text-xs text-text-muted">Review the <b>Price Comparison</b> on the left to select suppliers and approve.</p>
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
