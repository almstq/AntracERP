/**
 * Ticket creation service. A ticket is created in `draft`, then immediately
 * transitioned to `submitted` via the engine so the Stage-1 timeline event and
 * the mechanic notification fire through the normal workflow path.
 */
import { createAuto, listAll, updateFields } from '../firebase/db';
import { Timestamp } from 'firebase/firestore';
import { executeTransition } from '../workflow/executor';
import type { WorkflowActor } from '../workflow/types';
import type { RequiredMaterial, RequiredService, Urgency } from '../../types/workflow-entities';

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
}

async function nextTicketDisplayId(reportedAt: Date): Promise<string> {
  const ym = `${reportedAt.getFullYear()}${String(reportedAt.getMonth() + 1).padStart(2, '0')}`;
  const all = await listAll('tickets');
  return `TKT-${ym}-${String(all.length + 1).padStart(3, '0')}`;
}

export async function updateTicketReportedAt(ticketId: string, reportedAt: Date): Promise<void> {
  await updateFields('tickets', ticketId, { reportedAt: Timestamp.fromDate(reportedAt) });
}

export async function createTicket(input: NewTicketInput, actor: WorkflowActor): Promise<string> {
  const reportedAt = input.reportedAt ?? new Date();
  const displayId = await nextTicketDisplayId(reportedAt);
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
    reportedAt: Timestamp.fromDate(reportedAt),
    status: 'draft',
    urgency: input.urgency,
    description: input.description,
    operatorRecommendation: input.operatorRecommendation ?? null,
    materialRequired: false,
    serviceRequired: false,
    materials: [] as RequiredMaterial[],
    services: [] as RequiredService[],
    documents: [],
  });

  await executeTransition({
    workflowId: 'ticket', entityId: ticketId, to: 'submitted', actor,
  });

  return ticketId;
}
