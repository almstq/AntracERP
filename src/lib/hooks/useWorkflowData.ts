/**
 * Live data hooks for workflow entities (real Firestore reads via db.ts).
 * Simple fetch-on-mount + manual refresh() (called after a transition).
 */
import { useCallback, useEffect, useState } from 'react';
import { listAll, listWhere, getById, listSub } from '../firebase/db';
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
      .then((rows) => { setData(rows); setError(null); })
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
      .then((rows) => { setData(rows); setError(null); })
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
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load staff'))
      .finally(() => setLoading(false));
  }, [sbuId]);
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
      .then((rows) => { setData(rows); setError(null); })
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
