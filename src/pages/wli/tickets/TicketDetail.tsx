import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, AlertCircle, Truck, Boxes, CalendarDays, Pencil, Check, X } from 'lucide-react';
import { FileUpload } from '../../../components/shared/FileUpload';
import { AiDiagnosisHint } from '../../../components/workflow/AiDiagnosisHint';
import { Timeline } from '../../../components/workflow/Timeline';
import { TransitionPanel } from '../../../components/workflow/TransitionPanel';
import { TicketAdminEdit } from '../../../components/workflow/TicketAdminEdit';
import { ticketWorkflow, purchaseRequestWorkflow } from '../../../lib/workflow/definitions';
import type { TicketStatus, PRStatus, PurchaseRequest } from '../../../types/workflow-entities';
import { useTicket, useEntity } from '../../../lib/hooks/useWorkflowData';
import { useAuth } from '../../../lib/hooks/useAuth';
import { updateTicketReportedAt } from '../../../lib/services/tickets';
import { useToast } from '../../../lib/context/ToastContext';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';

const URGENCY_COLOR: Record<string, string> = {
  critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--info)', low: 'var(--text-muted)',
};
function statusBadge(s: string): string {
  if (s === 'closed') return 'b-muted';
  if (s === 'rejected') return 'b-danger';
  if (s === 'gm_approved' || s === 'resolved' || s === 'items_delivered') return 'b-pos';
  if (s === 'supervisor_checked') return 'b-accent';
  if (s === 'submitted' || s === 'diagnosed') return 'b-warn';
  return 'b-info';
}

function fmtDate(d: Date | string | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function toInputDate(d: Date | string | undefined): string {
  if (!d) return new Date().toISOString().slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}

export function TicketDetail() {
  const { id } = useParams();
  const { data: ticket, loading, error, refresh } = useTicket(id);
  const { data: pr, refresh: refreshPR } = useEntity<PurchaseRequest>('purchaseRequests', ticket?.purchaseRequestId);
  const { effectiveRole } = useAuth();
  const { toast } = useToast();
  const canEdit = effectiveRole === 'super_admin' || effectiveRole === 'gm';

  const [editingDate, setEditingDate] = useState(false);
  const [dateVal, setDateVal] = useState('');
  const [dateBusy, setDateBusy] = useState(false);

  if (loading) return <div className="page"><LoadingSpinner text="Loading…" /></div>;
  if (error) return <div className="page"><p className="empty-note" style={{ color: 'var(--danger)' }}>{error}</p></div>;
  if (!ticket) return <div className="page"><p className="empty-note">Ticket not found.</p></div>;

  const onDone = () => { refresh(); refreshPR(); };

  async function saveDate() {
    if (!id) return;
    setDateBusy(true);
    try {
      await updateTicketReportedAt(id, new Date(dateVal));
      toast('success', 'Date reported updated');
      setEditingDate(false);
      refresh();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed');
    } finally { setDateBusy(false); }
  }
  const hasItems = (ticket.materials?.length ?? 0) > 0 || (ticket.services?.length ?? 0) > 0;

  return (
    <div className="page">
      <Link to="/wli/tickets" className="dback"><ArrowLeft /> Tickets</Link>

      <div className="dhead">
        <div>
          <span className="eyebrow">{ticket.displayId}</span>
          <h1 className="dtitle">{ticket.description || ticket.displayId}</h1>
          <div className="dhead-badges">
            <span className={`badge ${statusBadge(ticket.status)}`}>
              <span className="bdot" />{ticketWorkflow.statusLabels[ticket.status as TicketStatus] ?? ticket.status}
            </span>
            <span className="urg" style={{ color: URGENCY_COLOR[ticket.urgency] ?? 'var(--text-muted)' }}>
              <i style={{ background: 'currentColor' }} />{ticket.urgency} urgency
            </span>
          </div>
        </div>
      </div>

      <div className="detail">
        {/* Left column */}
        <div className="dcol">
          <div className="dcard">
            <div className="dcard-h"><h3><AlertCircle /> Issue</h3></div>
            <div className="dcard-b">
              <p className="lede">{ticket.description}</p>
              {ticket.diagnosis && (
                <div className="kv" style={{ marginTop: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div className="k">Mechanic diagnosis</div>
                    <div className="v" style={{ display: 'block' }}>{ticket.diagnosis}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="dcard">
            <div className="dcard-h"><h3><Truck /> Asset &amp; Location</h3><Link className="h-link" to="/wli/assets">Asset register</Link></div>
            <div className="dcard-b">
              <div className="kv">
                <div><div className="k">Asset</div><div className="v"><span className="mono">{ticket.assetLabel || ticket.assetCode || '—'}</span></div></div>
                <div><div className="k">Site</div><div className="v">{ticket.siteId || '—'}</div></div>
                <div><div className="k">Urgency</div><div className="v">{ticket.urgency}</div></div>
                <div><div className="k">Raised by</div><div className="v">{(ticket as { raisedByName?: string }).raisedByName || ticket.raisedById || '—'}</div></div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="k" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CalendarDays size={11} /> Date Reported
                    {canEdit && !editingDate && (
                      <button
                        onClick={() => { setDateVal(toInputDate(ticket.reportedAt ?? ticket.createdAt)); setEditingDate(true); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}
                        title="Edit date reported"
                      ><Pencil size={10} /></button>
                    )}
                  </div>
                  {editingDate ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <input
                        type="date"
                        value={dateVal}
                        onChange={(e) => setDateVal(e.target.value)}
                        style={{ padding: '4px 8px', background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                      />
                      <button onClick={saveDate} disabled={dateBusy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)' }}><Check size={14} /></button>
                      <button onClick={() => setEditingDate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="v">{fmtDate(ticket.reportedAt ?? ticket.createdAt)}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {ticket.status === 'submitted' && (
            <AiDiagnosisHint description={ticket.description} assetLabel={ticket.assetLabel} />
          )}

          {hasItems && (
            <div className="dcard">
              <div className="dcard-h"><h3><Boxes /> Required Items</h3></div>
              <div className="dcard-b">
                {ticket.materials?.map((m, i) => (
                  <div className="lineitem" key={`m${i}`}>
                    <div><div className="li-t">{m.description}</div><div className="li-s">Material</div></div>
                    <div className="li-v">×{m.quantity} {m.uom}</div>
                  </div>
                ))}
                {ticket.services?.map((s, i) => (
                  <div className="lineitem" key={`s${i}`}>
                    <div><div className="li-t">{s.description}</div><div className="li-s">Service</div></div>
                    <div className="li-v">{s.specialistType}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pr && (
            <div className="dcard">
              <div className="dcard-h"><h3><Package /> Linked Purchase Request</h3></div>
              <div className="dcard-b">
                <Link className="linkrow" to={`/wli/procurement/requests/${pr.id}`}>
                  <span className="lr-ic tint-warn"><Package /></span>
                  <div style={{ minWidth: 0 }}>
                    <div className="lr-id">{pr.displayId}</div>
                    <div className="lr-sub">{pr.lineItems?.length ?? 0} line item(s)</div>
                  </div>
                  <span className={`badge ${pr.status === 'closed' ? 'b-pos' : 'b-warn'}`} style={{ marginLeft: 'auto' }}>
                    <span className="bdot" />{purchaseRequestWorkflow.statusLabels[pr.status as PRStatus] ?? pr.status}
                  </span>
                </Link>
              </div>
            </div>
          )}

          <FileUpload
            collection="tickets"
            entityId={ticket.id}
            entityDisplayId={ticket.displayId}
            attachments={(ticket as { attachments?: [] }).attachments ?? []}
            onUpdate={refresh}
            label="Site Photos & Attachments"
          />
        </div>

        {/* Right column — these components carry their own card + header */}
        <div className="dcol">
          <TransitionPanel workflowId="ticket" entityId={ticket.id} status={ticket.status} onDone={onDone} />
          {effectiveRole === 'super_admin' && <TicketAdminEdit ticket={ticket} onSaved={onDone} />}
          <Timeline collection="tickets" entityId={ticket.id} />
        </div>
      </div>
    </div>
  );
}
