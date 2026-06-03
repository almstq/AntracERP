/**
 * Reports service — deployment-revenue capture for the profitability report.
 */
import { listWhere, createAuto } from '../firebase/db';
import type { DeploymentRevenue } from '../../types/reports';
import type { WorkflowActor } from '../workflow/types';

export async function listDeploymentRevenue(sbuId = 'sbu-wli'): Promise<(DeploymentRevenue & { id: string })[]> {
  return listWhere<DeploymentRevenue>('deploymentRevenue', 'sbuId', '==', sbuId);
}

export interface NewDeploymentRevenueInput {
  siteId: string;
  period: string;
  amount: number;
  currency: 'MVR' | 'USD';
  assetId?: string;
  assetCode?: string;
  contractRef?: string;
  note?: string;
}

export async function createDeploymentRevenue(
  input: NewDeploymentRevenueInput,
  actor: WorkflowActor,
): Promise<string> {
  return createAuto('deploymentRevenue', {
    sbuId: 'sbu-wli',
    siteId: input.siteId,
    period: input.period,
    amount: input.amount,
    currency: input.currency,
    assetId: input.assetId ?? null,
    assetCode: input.assetCode ?? null,
    contractRef: input.contractRef ?? null,
    note: input.note ?? null,
    recordedById: actor.id,
  } as Record<string, unknown>);
}
