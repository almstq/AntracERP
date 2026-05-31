import type { WorkflowDefinition, WorkflowId } from '../types';
import { ticketWorkflow } from './ticket';
import { purchaseRequestWorkflow } from './purchase-request';
import { purchaseOrderWorkflow } from './purchase-order';
import { fuelRequestWorkflow } from './fuel-request';
import { enquiryWorkflow } from './enquiry';
import { workOrderWorkflow } from './work-order';

export {
  ticketWorkflow, purchaseRequestWorkflow, purchaseOrderWorkflow,
  fuelRequestWorkflow, enquiryWorkflow, workOrderWorkflow,
};

/** Registry: look up any workflow definition by its id. */
export const WORKFLOWS: Record<WorkflowId, WorkflowDefinition> = {
  ticket: ticketWorkflow as WorkflowDefinition,
  purchase_request: purchaseRequestWorkflow as WorkflowDefinition,
  purchase_order: purchaseOrderWorkflow as WorkflowDefinition,
  fuel_request: fuelRequestWorkflow as WorkflowDefinition,
  enquiry: enquiryWorkflow as WorkflowDefinition,
  work_order: workOrderWorkflow as WorkflowDefinition,
};

export function getWorkflow(id: WorkflowId): WorkflowDefinition {
  return WORKFLOWS[id];
}
