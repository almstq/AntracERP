/**
 * CRM data hooks — Customers, Enquiries, Quotations, Work Orders, Invoices, Payments.
 * Follows the same Loadable pattern as useWorkflowData.ts.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  listCustomers, listEnquiries, listQuotations,
  listWorkOrders, listInvoices, listPaymentsByInvoice,
} from '../services/crm';
import { listAll } from '../firebase/db';
import { byName } from '../utils/sort';
import type { Customer, Enquiry, Quotation, WorkOrder, Invoice, Payment } from '../../types/crm';

interface Loadable<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const SBU = 'wli';

export function useCustomerList(): Loadable<Customer[]> {
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    listCustomers(SBU)
      .then((rows) => { setData(rows.sort(byName((c) => c.name))); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load customers'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useEnquiryList(): Loadable<Enquiry[]> {
  const [data, setData] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    listEnquiries(SBU)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load enquiries'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useQuotationList(): Loadable<Quotation[]> {
  const [data, setData] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    listQuotations(SBU)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load quotations'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useWorkOrderList(): Loadable<WorkOrder[]> {
  const [data, setData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    listWorkOrders(SBU)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load work orders'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useInvoiceList(): Loadable<Invoice[]> {
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    listInvoices(SBU)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load invoices'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useAllPayments(): Loadable<Payment[]> {
  const [data, setData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    listAll<Payment>('payments')
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load payments'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export { listPaymentsByInvoice };
