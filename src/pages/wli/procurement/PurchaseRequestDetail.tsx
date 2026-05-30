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
  const fieldCls = 'text-xs p-1.5 rounded bg-bg-surface border border-border text-text-primary';

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

          {pr.quotes?.length > 0 && (
            <Card header={<span className="text-sm font-medium">Quotes Received</span>}>
              <div className="space-y-1 text-xs">
                {pr.quotes.map((q) => (
                  <div key={q.id} className="flex justify-between p-2 rounded-lg bg-bg-surface">
                    <span className="text-text-primary">{q.supplierName} <span className="text-text-muted">({q.linePrices.length} item)</span></span>
                    <span className="text-text-muted">{q.currency} {q.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

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

            {/* Iterative sourcing: add suppliers, issue RFQs, record quotes */}
            {canEnterQuotes && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-text-primary">Sourcing</p>

                {/* Per item: assigned suppliers + add another (issues another RFQ) */}
                {pr.lineItems.map((li) => {
                  const assigned = li.assignedSupplierIds ?? [];
                  const addable = suppliers.filter((s) => !assigned.includes(s.id));
                  return (
                    <div key={li.ref} className="border border-border rounded-lg p-2 space-y-1">
                      <p className="text-[11px] font-medium text-text-primary">{li.ref}. {li.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {assigned.length === 0 && <span className="text-[10px] text-text-muted">no suppliers yet</span>}
                        {assigned.map((sid) => (
                          <span key={sid} className="text-[10px] px-2 py-0.5 rounded-full bg-bg-surface text-text-secondary">{supName(sid)}</span>
                        ))}
                      </div>
                      {addable.length > 0 && (
                        <select className={`${fieldCls} w-full`} value=""
                          onChange={(e) => { if (e.target.value) assignSupplier(li.ref, e.target.value); }} disabled={busy}>
                          <option value="">+ add supplier (issue RFQ)…</option>
                          {addable.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      )}
                    </div>
                  );
                })}

                {/* RFQ documents — one per solicited supplier */}
                {union.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[11px] text-text-secondary">RFQ documents — download & send:</p>
                    {union.map((sid) => (
                      <button key={sid} onClick={() => downloadRfq(sid)}
                        className="w-full flex items-center justify-between text-[11px] px-2 py-1.5 rounded bg-bg-surface border border-border hover:bg-bg-base text-text-primary">
                        <span>{rfqNumber(pr, sid)} · {supName(sid)}</span>
                        <span className="text-blue">Download ↓</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Record quotes — only from solicited suppliers */}
                {union.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-text-secondary">Record quotes received:</p>
                    {union.map((sid) => {
                      const itemsForSup = pr.lineItems.filter((li) => (li.assignedSupplierIds ?? []).includes(sid));
                      return (
                        <div key={sid} className="border border-border rounded-lg p-2 space-y-2">
                          <p className="text-[11px] font-medium text-text-primary">{supName(sid)}</p>
                          {itemsForSup.map((li) => {
                            const unit = Number(quoteDraft[sid]?.[li.ref]) || 0;
                            return (
                              <div key={li.ref} className="space-y-0.5">
                                <p className="text-[10px] text-text-primary">{li.ref}. {li.description}</p>
                                <p className="text-[10px] text-text-muted">Requested qty: <b>{li.quantity} {li.uom}</b> (from ticket — fixed)</p>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-text-muted whitespace-nowrap">Quoted unit price (MVR)</span>
                                  <input type="number" min="0" step="0.01" className={`${fieldCls} flex-1`} placeholder="as on quote"
                                    value={quoteDraft[sid]?.[li.ref] ?? ''}
                                    onChange={(e) => setQuoteDraft((d) => ({ ...d, [sid]: { ...d[sid], [li.ref]: Number(e.target.value) } }))} />
                                  <span className="text-[10px] text-text-secondary whitespace-nowrap">= {(unit * li.quantity).toLocaleString()}</span>
                                </div>
                              </div>
                            );
                          })}
                          <p className="text-[10px] text-text-secondary text-right pt-1 border-t border-border-soft">
                            Quote total: MVR {itemsForSup.reduce((s, li) => s + (Number(quoteDraft[sid]?.[li.ref]) || 0) * li.quantity, 0).toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                    <Button variant="secondary" size="sm" className="w-full" onClick={saveQuotes} disabled={busy}>Save Quotes</Button>
                  </div>
                )}

                {status === 'rfq_sent' && can('open_review') && union.length > 0 && (
                  <Button variant="primary" size="sm" className="w-full" onClick={forwardToGm} disabled={busy}>Forward to GM for Review</Button>
                )}
              </div>
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
