import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, AlertCircle, Truck, Boxes, CalendarDays, Pencil, Check, X, Camera, Download } from 'lucide-react';
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
import { buildTicketPrintHtml, downloadHtml, printHtml } from '../../../lib/services/rfq';

const URGENCY_COLOR: Record<string, string> = {
  critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--info)', low: 'var(--text-muted)',
};
function statusBadge(s: string): string {
  if (s === 'closed') return 'b-muted';
  if (s === 'rejected') return 'b-danger';
  if (s === 'gm_approved' || s === 'resolved' || s === 'items_delivered') return 'b-pos';
  if (s === 'awaiting_delivery') return 'b-accent';
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
        <div className="dhead-actions">
          <button className="btn btn-ghost" onClick={() => printHtml(buildTicketPrintHtml(ticket), ticket.displayId)}>
            <Camera size={14} /> Print PDF
          </button>
          <button className="btn btn-ghost" onClick={() => downloadHtml(`${ticket.displayId}.html`, buildTicketPrintHtml(ticket))}>
            <Download size={14} /> Download Ticket
          </button>
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
                <div><div className="k">Serial / Chassis No</div><div className="v"><span className="mono">{ticket.serialNumber || '—'}</span></div></div>
                <div><div className="k">Work Category</div><div className="v" style={{ textTransform: 'uppercase' }}>{ticket.workCategory || 'GENERAL'}</div></div>
                <div><div className="k">Meter Reading</div><div className="v">{ticket.meterReading != null ? `${ticket.meterReading.toLocaleString()} Hours/Km` : '—'}</div></div>
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

          {(ticket.resolutionNotes || ticket.status === 'resolved' || ticket.status === 'closed') && (
            <div className="dcard">
              <div className="dcard-h"><h3><Check /> Service Sheet Sign-off</h3></div>
              <div className="dcard-b">
                <div className="text-[10px] uppercase font-bold text-text-muted mb-2 tracking-wider">Checklist Status</div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14 }}>{ticket.resolutionChecklist?.clean ? '☑' : '☐'}</span>
                    <span>Visual Inspection Clean</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14 }}>{ticket.resolutionChecklist?.photos ? '☑' : '☐'}</span>
                    <span>Before/After Photos Captured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14 }}>{ticket.resolutionChecklist?.tools ? '☑' : '☐'}</span>
                    <span>Tools & Spares Cleared</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14 }}>{ticket.resolutionChecklist?.safety ? '☑' : '☐'}</span>
                    <span>Mechanical Safety Passed</span>
                  </div>
                </div>

                <div className="text-[10px] uppercase font-bold text-text-muted mb-2 tracking-wider" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12 }}>Sign-offs</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }} className="text-xs">
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Operator / Reporter</div>
                    <div className="font-semibold">{ticket.signatures?.operator?.name || '—'}</div>
                    <div className="text-[9px] text-text-muted mt-0.5">{fmtDate(ticket.signatures?.operator?.date)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Lead Mechanic</div>
                    <div className="font-semibold">{ticket.signatures?.mechanic?.name || '—'}</div>
                    <div className="text-[9px] text-text-muted mt-0.5">{fmtDate(ticket.signatures?.mechanic?.date)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Checked (Supervisor)</div>
                    <div className="font-semibold">{ticket.signatures?.supervisor?.name || '—'}</div>
                    <div className="text-[9px] text-text-muted mt-0.5">{fmtDate(ticket.signatures?.supervisor?.date)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Approved (GM)</div>
                    <div className="font-semibold">{ticket.signatures?.gm?.name || '—'}</div>
                    <div className="text-[9px] text-text-muted mt-0.5">{fmtDate(ticket.signatures?.gm?.date)}</div>
                  </div>
                </div>
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
          <TransitionPanel workflowId="ticket" entityId={ticket.id} status={ticket.status} onDone={onDone} signatures={ticket.signatures} />
          {effectiveRole === 'super_admin' && <TicketAdminEdit ticket={ticket} onSaved={onDone} />}
          <Timeline collection="tickets" entityId={ticket.id} />
        </div>
      </div>
    </div>
  );
}
