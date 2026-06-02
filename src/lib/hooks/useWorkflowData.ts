/**
 * Live data hooks for workflow entities (real Firestore reads via db.ts).
 * Simple fetch-on-mount + manual refresh() (called after a transition).
 */
import { useCallback, useEffect, useState } from 'react';
import { listAll, listWhere, getById, listSub } from '../firebase/db';
import { byName, byCode } from '../utils/sort';
import { ticketWorkflow, purchaseRequestWorkflow, purchaseOrderWorkflow } from '../workflow/definitions';
import { getAvailableTransitions } from '../workflow/engine';
import type { Ticket, PurchaseRequest, PurchaseOrder, Supplier } from '../../types/workflow-entities';
import type { Asset } from '../../types/asset';
import type { Site, Staff } from '../../types/org';
import type { TimelineEvent, WorkflowNotification } from '../workflow/types';

interface Loadable<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useTicketList(sbuId = 'sbu-wli'): Loadable<(Ticket & { id: string })[]> {
  const [data, setData] = useState<(Ticket & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listWhere<Ticket>('tickets', 'sbuId', '==', sbuId)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load tickets'))
      .finally(() => setLoading(false));
  }, [sbuId]);

  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useTicket(id: string | undefined): Loadable<(Ticket & { id: string }) | null> {
  const [data, setData] = useState<(Ticket & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) { setData(null); setLoading(false); return; }
    setLoading(true);
    getById<Ticket>('tickets', id)
      .then((row) => { setData(row); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load ticket'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useAssetList(sbuId = 'sbu-wli'): Loadable<(Asset & { id: string })[]> {
  const [data, setData] = useState<(Asset & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listWhere<Asset>('assets', 'sbuId', '==', sbuId)
      .then((rows) => { setData(rows.sort(byCode((a) => a.code))); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load assets'))
      .finally(() => setLoading(false));
  }, [sbuId]);

  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useSiteList(sbuId = 'sbu-wli'): Loadable<(Site & { id: string })[]> {
  const [data, setData] = useState<(Site & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    listWhere<Site>('sites', 'sbuId', '==', sbuId)
      .then((rows) => { setData(rows.sort(byName((s) => s.name))); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load sites'))
      .finally(() => setLoading(false));
  }, [sbuId]);
  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useStaffList(sbuId = 'sbu-wli'): Loadable<(Staff & { id: string })[]> {
  const [data, setData] = useState<(Staff & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    listWhere<Staff>('staff', 'sbuId', '==', sbuId)
      .then((rows) => { setData(rows.sort(byName((s) => s.name))); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load staff'))
      .finally(() => setLoading(false));
  }, [sbuId]);
  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

/**
 * All staff across the org (not just one SBU) — used for the site in-charge
 * picker, which must include Holding (Antrac) managers like project managers,
 * not only WLI line crew. Sorted A→Z by name.
 */
export function useAllStaff(): Loadable<(Staff & { id: string })[]> {
  const [data, setData] = useState<(Staff & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    listAll<Staff>('staff')
      .then((rows) => { setData(rows.sort(byName((s) => s.name))); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load staff'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useSupplierList(): Loadable<(Supplier & { id: string })[]> {
  const [data, setData] = useState<(Supplier & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    listAll<Supplier>('suppliers')
      .then((rows) => { setData(rows.sort(byName((s) => s.name))); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load suppliers'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function usePRList(): Loadable<(PurchaseRequest & { id: string })[]> {
  const [data, setData] = useState<(PurchaseRequest & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    listAll<PurchaseRequest>('purchaseRequests')
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load PRs'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function usePOList(): Loadable<(PurchaseOrder & { id: string })[]> {
  const [data, setData] = useState<(PurchaseOrder & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    listAll<PurchaseOrder>('purchaseOrders')
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load POs'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export interface InboxItem {
  kind: 'ticket' | 'pr' | 'po';
  id: string;
  displayId: string;
  subtitle: string;
  to: string;
  actions: string[];
  urgency?: string;
}

/** Aggregates everything awaiting `role` across tickets, PRs and POs. */
export function useActionInbox(role: string): { items: InboxItem[]; loading: boolean } {
  const t = useTicketList();
  const pr = usePRList();
  const po = usePOList();
  const loading = t.loading || pr.loading || po.loading;

  const items: InboxItem[] = [];
  for (const x of t.data) {
    const av = getAvailableTransitions(ticketWorkflow, x.status, role);
    if (av.length) items.push({ kind: 'ticket', id: x.id, displayId: x.displayId, subtitle: `${x.assetCode || '—'} · ${x.siteId}`, to: `/wli/tickets/${x.id}`, actions: av.map((a) => a.label), urgency: x.urgency });
  }
  for (const x of pr.data) {
    const av = getAvailableTransitions(purchaseRequestWorkflow, x.status, role);
    if (av.length) items.push({ kind: 'pr', id: x.id, displayId: x.displayId, subtitle: `${x.lineItems?.length ?? 0} item(s)`, to: `/wli/procurement/requests/${x.id}`, actions: av.map((a) => a.label), urgency: x.urgency });
  }
  for (const x of po.data) {
    const av = getAvailableTransitions(purchaseOrderWorkflow, x.status, role);
    if (av.length) items.push({ kind: 'po', id: x.id, displayId: x.displayId, subtitle: `${x.supplierName} · ${x.currency} ${x.total?.toLocaleString?.() ?? x.total}`, to: `/wli/procurement/orders/${x.id}`, actions: av.map((a) => a.label) });
  }
  return { items, loading };
}

export function useNotifications(role: string | undefined): Loadable<(WorkflowNotification & { id: string })[]> {
  const [data, setData] = useState<(WorkflowNotification & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    if (!role) { setData([]); setLoading(false); return; }
    setLoading(true);
    listWhere<WorkflowNotification>('notifications', 'recipientRole', '==', role)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load notifications'))
      .finally(() => setLoading(false));
  }, [role]);
  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useTimeline(collection: string, id: string | undefined): Loadable<(TimelineEvent & { id: string })[]> {
  const [data, setData] = useState<(TimelineEvent & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) { setData([]); setLoading(false); return; }
    setLoading(true);
    listSub<TimelineEvent>(collection, id, 'timeline', 'timestamp')
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load timeline'))
      .finally(() => setLoading(false));
  }, [collection, id]);

  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

/** Generic single-doc loader for any collection (used for linked PR/PO display). */
export function useEntity<T = Record<string, unknown>>(collection: string, id: string | undefined): Loadable<(T & { id: string }) | null> {
  const [data, setData] = useState<(T & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) { setData(null); setLoading(false); return; }
    setLoading(true);
    getById<T>(collection, id)
      .then((row) => { setData(row); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, [collection, id]);

  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export { listAll };
