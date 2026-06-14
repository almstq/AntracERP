/**
 * Ticket creation service. A ticket is created in `draft`, then immediately
 * transitioned to `submitted` via the engine so the Stage-1 timeline event and
 * the mechanic notification fire through the normal workflow path.
 */
import { createAuto, updateFields, deleteDocument } from '../firebase/db';
import { Timestamp } from 'firebase/firestore';
import { executeTransition } from '../workflow/executor';
import type { WorkflowActor } from '../workflow/types';
import type { RequiredMaterial, RequiredService, TicketStatus, Urgency } from '../../types/workflow-entities';

export interface NewTicketInput {
  description: string;
  siteId: string;
  assetId: string;
  assetCode: string;
  assetLabel: string;
  location?: string;
  urgency: Urgency;
  operatorRecommendation?: string;
  /** Actual date reported — may be backdated. Defaults to now if omitted. */
  reportedAt?: Date;
  /**
   * Supervisor path: role of the person raising the ticket.
   * When 'supervisor' + materials supplied, ticket transitions directly to
   * supervisor_checked (skipping mechanic diagnosis) and a PR is spawned on_hold.
   */
  raisedByRole?: string;
  /** Materials pre-specified by supervisor (supervisor path only). */
  materials?: RequiredMaterial[];
  serialNumber?: string;
  meterReading?: number;
  workCategory?: string;
}

import { generateSerial, indexDocument } from './registryIndex';

/**
 * Hard-delete a ticket. Super-admin only; only allowed while still in draft
 * (no workflow history, no linked PR/PO). The caller is responsible for the
 * status guard — this function deletes unconditionally.
 */
export async function deleteTicket(ticketId: string): Promise<void> {
  await deleteDocument('tickets', ticketId);
}

export async function updateTicketReportedAt(ticketId: string, reportedAt: Date): Promise<void> {
  await updateFields('tickets', ticketId, { reportedAt: Timestamp.fromDate(reportedAt) });
}

/** Fields a super_admin may override directly to correct/backfill historical records. */
export interface AdminTicketPatch {
  description?: string;
  urgency?: Urgency;
  /** Direct status override — bypasses the workflow to reflect an actual past state. */
  status?: TicketStatus;
  diagnosis?: string;
  reportedAt?: Date;
}

/**
 * Super-admin override of a ticket's core fields. Writes directly (no workflow
 * transition / side-effects) so historical events can be backfilled and set to
 * their real status. Use only for admin correction, not normal operation.
 */
export async function adminUpdateTicket(ticketId: string, patch: AdminTicketPatch): Promise<void> {
  const fields: Record<string, unknown> = { updatedAt: Timestamp.fromDate(new Date()) };
  if (patch.description !== undefined) fields.description = patch.description;
  if (patch.urgency !== undefined) fields.urgency = patch.urgency;
  if (patch.status !== undefined) fields.status = patch.status;
  if (patch.diagnosis !== undefined) fields.diagnosis = patch.diagnosis;
  if (patch.reportedAt !== undefined) fields.reportedAt = Timestamp.fromDate(patch.reportedAt);
  await updateFields('tickets', ticketId, fields);
}

export async function createTicket(input: NewTicketInput, actor: WorkflowActor): Promise<string> {
  const reportedAt = input.reportedAt ?? new Date();
  
  // Generate monotonic serial ID
  const { serialId: displayId, sequence, fiscalPeriod } = await generateSerial('TKT', 'sbu-wli', input.siteId);

  // Supervisor path: they know what's needed → skip mechanic, go straight to GM desk.
  const isSupervisorPath = input.raisedByRole === 'supervisor' && (input.materials?.length ?? 0) > 0;

  const ticketId = await createAuto('tickets', {
    displayId,
    orgId: 'antrac-holding',
    sbuId: 'sbu-wli',
    siteId: input.siteId,
    assetId: input.assetId,
    assetCode: input.assetCode,
    assetLabel: input.assetLabel,
    location: input.location ?? null,
    raisedById: actor.id,
    raisedByName: actor.name ?? null,
    raisedByRole: input.raisedByRole ?? null,
    reportedAt: Timestamp.fromDate(reportedAt),
    status: 'draft',
    urgency: input.urgency,
    description: input.description,
    operatorRecommendation: input.operatorRecommendation ?? null,
    materialRequired: isSupervisorPath,
    serviceRequired: false,
    materials: isSupervisorPath ? (input.materials ?? []) : ([] as RequiredMaterial[]),
    services: [] as RequiredService[],
    documents: [],
    serialNumber: input.serialNumber || null,
    meterReading: input.meterReading != null ? Number(input.meterReading) : null,
    workCategory: input.workCategory || null,
    signatures: isSupervisorPath || input.raisedByRole === 'supervisor' 
      ? { supervisor: { name: actor.name || 'Supervisor', date: new Date().toISOString() } }
      : { operator: { name: actor.name || 'Operator', date: new Date().toISOString() } },
  });

  // Index document in central registryIndex
  await indexDocument({
    id: displayId,
    prefix: 'TKT',
    sequence,
    fiscalPeriod,
    sbuId: 'sbu-wli',
    siteId: input.siteId,
    status: 'draft',
    createdBy: actor.id,
    targetCollection: 'tickets',
    targetId: ticketId,
    link: `/wli/tickets/${ticketId}`,
  });

  // Supervisor path → supervisor_checked (PR spawns on_hold, GM desk notified).
  // Operator path  → submitted (mechanic diagnoses next).
  await executeTransition({
    workflowId: 'ticket',
    entityId: ticketId,
    to: isSupervisorPath ? 'supervisor_checked' : 'submitted',
    actor,
  });

  return ticketId;
}
