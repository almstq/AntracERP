/**
 * CRM data-access service — Customers, Enquiries, Quotations, Work Orders,
 * Invoices, Payments. Thin wrappers over db.ts.
 */
import { listAll, listWhere, getById, createAuto, updateFields } from '../firebase/db';
import { getNextId } from '../utils/id';
import type { Customer, Enquiry, Quotation, WorkOrder, Invoice, Payment } from '../../types/crm';

// ─── Customers ────────────────────────────────────────────────────────────────

export async function listCustomers(sbuId: string): Promise<Customer[]> {
  return listWhere<Customer>('customers', 'sbuId', '==', sbuId, 'name');
}

export async function getCustomer(id: string): Promise<Customer | null> {
  return getById<Customer>('customers', id);
}

export async function createCustomer(
  data: Omit<Customer, 'id' | 'displayId' | 'createdAt' | 'updatedAt' | 'lifetimeRevenue' | 'outstandingBalance' | 'activeWorkOrders'>,
): Promise<string> {
  const existing = await listAll<Customer>('customers');
  const displayId = getNextId(existing.map(c => c.displayId), 'customer');
  return createAuto('customers', {
    ...data,
    displayId,
    lifetimeRevenue: 0,
    outstandingBalance: 0,
    activeWorkOrders: 0,
  } as Record<string, unknown>);
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
  return updateFields('customers', id, data as Record<string, unknown>);
}

// ─── Enquiries ────────────────────────────────────────────────────────────────

export async function listEnquiries(sbuId: string): Promise<Enquiry[]> {
  return listWhere<Enquiry>('enquiries', 'sbuId', '==', sbuId, 'createdAt');
}

export async function getEnquiry(id: string): Promise<Enquiry | null> {
  return getById<Enquiry>('enquiries', id);
}

export async function createEnquiry(
  data: Omit<Enquiry, 'id' | 'displayId' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const existing = await listAll<Enquiry>('enquiries');
  const displayId = getNextId(existing.map(e => e.displayId), 'enquiry');
  return createAuto('enquiries', { ...data, displayId } as Record<string, unknown>);
}

export async function updateEnquiry(id: string, data: Partial<Enquiry>): Promise<void> {
  return updateFields('enquiries', id, data as Record<string, unknown>);
}

// ─── Quotations ───────────────────────────────────────────────────────────────

export async function listQuotations(sbuId: string): Promise<Quotation[]> {
  return listWhere<Quotation>('quotations', 'sbuId', '==', sbuId, 'createdAt');
}

export async function getQuotation(id: string): Promise<Quotation | null> {
  return getById<Quotation>('quotations', id);
}

export async function createQuotation(
  data: Omit<Quotation, 'id' | 'displayId' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const existing = await listAll<Quotation>('quotations');
  const displayId = getNextId(existing.map(q => q.displayId), 'quotation');
  return createAuto('quotations', { ...data, displayId } as Record<string, unknown>);
}

export async function updateQuotation(id: string, data: Partial<Quotation>): Promise<void> {
  return updateFields('quotations', id, data as Record<string, unknown>);
}

// ─── Work Orders ──────────────────────────────────────────────────────────────

export async function listWorkOrders(sbuId: string): Promise<WorkOrder[]> {
  return listWhere<WorkOrder>('workOrders', 'sbuId', '==', sbuId, 'createdAt');
}

export async function getWorkOrder(id: string): Promise<WorkOrder | null> {
  return getById<WorkOrder>('workOrders', id);
}

export async function createWorkOrder(
  data: Omit<WorkOrder, 'id' | 'displayId' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const existing = await listAll<WorkOrder>('workOrders');
  const displayId = getNextId(existing.map(w => w.displayId), 'workOrder');
  return createAuto('workOrders', { ...data, displayId } as Record<string, unknown>);
}

export async function updateWorkOrder(id: string, data: Partial<WorkOrder>): Promise<void> {
  return updateFields('workOrders', id, data as Record<string, unknown>);
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function listInvoices(sbuId: string): Promise<Invoice[]> {
  return listWhere<Invoice>('invoices', 'sbuId', '==', sbuId, 'createdAt');
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  return getById<Invoice>('invoices', id);
}

export async function createInvoice(
  data: Omit<Invoice, 'id' | 'displayId' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const existing = await listAll<Invoice>('invoices');
  const displayId = getNextId(existing.map(i => i.displayId), 'invoice');
  return createAuto('invoices', { ...data, displayId } as Record<string, unknown>);
}

export async function updateInvoice(id: string, data: Partial<Invoice>): Promise<void> {
  return updateFields('invoices', id, data as Record<string, unknown>);
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function listPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
  return listWhere<Payment>('payments', 'invoiceId', '==', invoiceId, 'receivedAt');
}

export async function createPayment(
  data: Omit<Payment, 'id' | 'displayId' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const existing = await listAll<Payment>('payments');
  const displayId = getNextId(existing.map(p => p.displayId), 'payment');
  return createAuto('payments', { ...data, displayId } as Record<string, unknown>);
}
