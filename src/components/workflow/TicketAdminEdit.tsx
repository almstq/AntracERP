import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../shared/Input';
import { InputSelect } from '../shared/InputSelect';
import { InputTextarea } from '../shared/InputTextarea';
import { ticketWorkflow } from '../../lib/workflow/definitions';
import { adminUpdateTicket } from '../../lib/services/tickets';
import { useToast } from '../../lib/context/ToastContext';
import type { Ticket, TicketStatus, Urgency } from '../../types/workflow-entities';

const URGENCIES: Urgency[] = ['critical', 'urgent', 'routine'];

/**
 * Super-admin override panel — adjust a ticket directly (incl. status + date)
 * to backfill historical machine events. Bypasses the workflow on purpose.
 */
export function TicketAdminEdit({ ticket, onSaved }: { ticket: Ticket & { id: string }; onSaved: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(ticket.description ?? '');
  const [urgency, setUrgency] = useState<Urgency>(ticket.urgency);
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [diagnosis, setDiagnosis] = useState(ticket.diagnosis ?? '');
  const [reportedAt, setReportedAt] = useState(
    new Date(ticket.reportedAt ?? ticket.createdAt ?? new Date()).toISOString().slice(0, 10),
  );
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await adminUpdateTicket(ticket.id, {
        description: description.trim() || ticket.description,
        urgency,
        status,
        diagnosis: diagnosis.trim() || undefined,
        reportedAt: new Date(reportedAt),
      });
      toast('success', 'Ticket updated (admin override)');
      setOpen(false);
      onSaved();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card header={<span className="text-sm font-medium flex items-center gap-1.5"><ShieldAlert size={14} className="text-amber" /> Admin Override</span>}>
      {!open ? (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">Super-admin only — edit fields and set the real status directly to backfill a past event.</p>
          <Button variant="secondary" size="sm" className="w-full" onClick={() => setOpen(true)}>Edit ticket</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-muted">Description</label>
            <InputTextarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted">Status</label>
              <InputSelect className="mt-1" value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)}>
                {ticketWorkflow.states.map((s) => (
                  <option key={s} value={s}>{ticketWorkflow.statusLabels[s as TicketStatus] ?? s}</option>
                ))}
              </InputSelect>
            </div>
            <div>
              <label className="text-xs text-text-muted">Urgency</label>
              <InputSelect className="mt-1" value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
                {URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
              </InputSelect>
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted">Date Reported (backdate)</label>
            <Input type="date" value={reportedAt} onChange={(e) => setReportedAt(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-text-muted">Diagnosis (optional)</label>
            <InputTextarea rows={2} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="mt-1" />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" className="flex-1" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save override'}</Button>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
