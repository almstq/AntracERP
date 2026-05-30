/**
 * Ticket creation service. A ticket is created in `draft`, then immediately
 * transitioned to `submitted` via the engine so the Stage-1 timeline event and
 * the mechanic notification fire through the normal workflow path.
 */
import { createAuto, listAll } from '../firebase/db';
import { executeTransition } from '../workflow/executor';
import type { WorkflowActor } from '../workflow/types';
import type { RequiredMaterial, RequiredService, Urgency } from '../../types/workflow-entities';

export interface NewTicketInput {
  description: string;
  siteId: string;
  assetId?: string;
  location?: string;
  urgency: Urgency;
  operatorRecommendation?: string;
}

async function nextTicketDisplayId(): Promise<string> {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const all = await listAll('tickets');
  return `TKT-${ym}-${String(all.length + 1).padStart(3, '0')}`;
}

export async function createTicket(input: NewTicketInput, actor: WorkflowActor): Promise<string> {
  const displayId = await nextTicketDisplayId();
  const ticketId = await createAuto('tickets', {
    displayId,
    orgId: 'antrac-holding',
    sbuId: 'sbu-wli',
    siteId: input.siteId,
    assetId: input.assetId ?? null,
    location: input.location ?? null,
    raisedById: actor.id,
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
