/**
 * Live data hooks for workflow entities (real Firestore reads via db.ts).
 * Simple fetch-on-mount + manual refresh() (called after a transition).
 */
import { useCallback, useEffect, useState } from 'react';
import { listAll, listWhere, getById, listSub } from '../firebase/db';
import type { Ticket } from '../../types/workflow-entities';
import type { TimelineEvent } from '../workflow/types';

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
