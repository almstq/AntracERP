/**
 * Deployments — machine-on-hire records. Creating one is the canonical way to
 * mark a machine deployed: it sets the asset's commercial status + site AND
 * pins the agreed revenue terms, so the profit report always has a real
 * per-machine revenue figure (no deployed machine without money on file).
 */
import { listWhere, createAuto, updateFields, listAll } from '../firebase/db';
import { Timestamp } from 'firebase/firestore';
import { getNextId } from '../utils/id';
import type { Deployment, RateBasis } from '../../types/reports';
import type { WorkflowActor } from '../workflow/types';

export async function listDeployments(sbuId = 'sbu-wli'): Promise<(Deployment & { id: string })[]> {
  return listWhere<Deployment>('deployments', 'sbuId', '==', sbuId);
}

export interface NewDeploymentInput {
  assetId: string;
  assetCode: string;
  assetLabel?: string;
  siteId: string;
  customerName?: string;
  agreementRef?: string;
  rateBasis: RateBasis;
  rate: number;
  currency: 'MVR' | 'USD';
  startDate: Date;
  note?: string;
}

export async function createDeployment(input: NewDeploymentInput, actor: WorkflowActor): Promise<string> {
  const existing = await listAll<Deployment>('deployments');
  const displayId = getNextId(existing.map((d) => d.displayId ?? ''), 'dep');

  const id = await createAuto('deployments', {
    displayId,
    sbuId: 'sbu-wli',
    assetId: input.assetId,
    assetCode: input.assetCode,
    assetLabel: input.assetLabel ?? null,
    siteId: input.siteId,
    customerName: input.customerName ?? null,
    agreementRef: input.agreementRef ?? null,
    rateBasis: input.rateBasis,
    rate: input.rate,
    currency: input.currency,
    startDate: Timestamp.fromDate(input.startDate),
    endDate: null,
    status: 'active',
    note: input.note ?? null,
    recordedById: actor.id,
  } as Record<string, unknown>);

  // Enforce the link: marking a machine deployed = revenue terms on file.
  await updateFields('assets', input.assetId, { commercialStatus: 'deployed', currentSiteId: input.siteId });

  return id;
}

export async function endDeployment(deploymentId: string, assetId: string, endDate: Date): Promise<void> {
  await updateFields('deployments', deploymentId, {
    status: 'ended', endDate: Timestamp.fromDate(endDate),
  });
  await updateFields('assets', assetId, { commercialStatus: 'available' });
}

/** Coerce a Date | string | Firestore Timestamp into a Date. */
function asDate(v: unknown, fallback: Date): Date {
  if (!v) return fallback;
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
  const t = v as { toDate?: () => Date; seconds?: number };
  if (typeof t.toDate === 'function') return t.toDate();
  if (typeof t.seconds === 'number') return new Date(t.seconds * 1000);
  return fallback;
}

/** Revenue earned to date for a deployment, by its billing basis. */
export function deploymentEarned(d: Pick<Deployment, 'rateBasis' | 'rate' | 'startDate' | 'endDate'>, asOf: Date = new Date()): number {
  const rate = Number(d.rate) || 0;
  if (d.rateBasis === 'lump') return rate;
  const start = asDate(d.startDate, asOf);
  const end = asDate(d.endDate, asOf);
  const days = Math.max(0, (end.getTime() - start.getTime()) / 86_400_000);
  if (d.rateBasis === 'daily') return rate * days;
  return rate * (days / 30.44); // monthly, prorated by days
}

export const RATE_BASIS_LABEL: Record<RateBasis, string> = {
  monthly: 'per month',
  daily: 'per day',
  lump: 'lump sum',
};
