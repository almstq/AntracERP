import { useParams, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { FileUpload } from '../../../components/shared/FileUpload';
import { AiDiagnosisHint } from '../../../components/workflow/AiDiagnosisHint';
import { ArrowLeft, Package } from 'lucide-react';
import { useTicket, useEntity } from '../../../lib/hooks/useWorkflowData';
import { Timeline } from '../../../components/workflow/Timeline';
import { TransitionPanel } from '../../../components/workflow/TransitionPanel';
import { ticketWorkflow, purchaseRequestWorkflow } from '../../../lib/workflow/definitions';
import type { TicketStatus, PRStatus, PurchaseRequest } from '../../../types/workflow-entities';

export function TicketDetail() {
  const { id } = useParams();
  const { data: ticket, loading, error, refresh } = useTicket(id);
  const { data: pr, refresh: refreshPR } = useEntity<PurchaseRequest>('purchaseRequests', ticket?.purchaseRequestId);

  if (loading) return <div className="p-6 text-xs text-text-muted">Loading…</div>;
  if (error) return <div className="p-6 text-xs text-red">{error}</div>;
  if (!ticket) return <div className="p-6 text-xs text-text-muted">Ticket not found.</div>;

  const onDone = () => { refresh(); refreshPR(); };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wli/tickets" className="text-text-muted hover:text-text-primary"><ArrowLeft size={18} /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-text-primary truncate">{ticket.description || ticket.displayId}</h1>
            <span className="text-[10px] px-2 py-1 rounded-full bg-bg-surface text-text-secondary">
              {ticketWorkflow.statusLabels[ticket.status as TicketStatus] ?? ticket.status}
            </span>
          </div>
          <p className="text-xs text-text-muted">{ticket.displayId} · {ticket.siteId} · {ticket.urgency}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card header={<span className="text-sm font-medium">Details</span>}>
            <p className="text-xs text-text-secondary mb-3">{ticket.description}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-text-muted">Asset:</span> <span className="text-text-primary">{ticket.assetLabel || ticket.assetCode || '—'}</span></div>
              <div><span className="text-text-muted">Site:</span> <span className="text-text-primary">{ticket.siteId}</span></div>
              <div><span className="text-text-muted">Urgency:</span> <span className="text-text-primary">{ticket.urgency}</span></div>
              <div><span className="text-text-muted">Raised by:</span> <span className="text-text-primary">{ticket.raisedById}</span></div>
            </div>
            {ticket.diagnosis && (
              <div className="mt-3 pt-3 border-t border-border text-xs">
                <p className="text-text-muted mb-1">Mechanic diagnosis:</p>
                <p className="text-text-secondary">{ticket.diagnosis}</p>
              </div>
            )}
          </Card>

          {/* AI diagnosis assist — mechanic only, while awaiting diagnosis */}
          {ticket.status === 'submitted' && (
            <AiDiagnosisHint description={ticket.description} assetLabel={ticket.assetLabel} />
          )}

          {((ticket.materials?.length ?? 0) > 0 || (ticket.services?.length ?? 0) > 0) && (
            <Card header={<span className="text-sm font-medium">Required Items</span>}>
              <div className="space-y-2 text-xs">
                {ticket.materials?.map((m, i) => (
                  <div key={`m${i}`} className="flex justify-between p-2 rounded-lg bg-bg-surface">
                    <span className="text-text-primary">{m.description}</span>
                    <span className="text-text-muted">×{m.quantity} {m.uom} · material</span>
                  </div>
                ))}
                {ticket.services?.map((s, i) => (
                  <div key={`s${i}`} className="flex justify-between p-2 rounded-lg bg-bg-surface">
                    <span className="text-text-primary">{s.description}</span>
                    <span className="text-text-muted">{s.specialistType} · service</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {pr && (
            <Card header={<span className="text-sm font-medium flex items-center gap-2"><Package size={14} /> Linked Purchase Request</span>}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-primary">{pr.displayId}</span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-bg-surface text-text-secondary">
                  {purchaseRequestWorkflow.statusLabels[pr.status as PRStatus] ?? pr.status}
                </span>
              </div>
              <p className="text-[10px] text-text-muted mt-1">{pr.lineItems?.length ?? 0} line item(s)</p>
            </Card>
          )}

          <FileUpload
            collection="tickets"
            entityId={ticket.id}
            entityDisplayId={ticket.displayId}
            attachments={(ticket as any).attachments ?? []}
            onUpdate={refresh}
            label="Site Photos & Attachments"
          />

          <Timeline collection="tickets" entityId={ticket.id} />
        </div>

        <div className="space-y-4">
          <TransitionPanel workflowId="ticket" entityId={ticket.id} status={ticket.status} onDone={onDone} />
        </div>
      </div>
    </div>
  );
}
