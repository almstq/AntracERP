import { useCallback, useEffect, useState } from 'react';
import { listAll, listWhere, getById } from '../firebase/db';
import type { Store, InventoryItem, StockBalance, StockMovement, StockTransfer } from '../../types/inventory';

interface Loadable<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useStores(): Loadable<(Store & { id: string })[]> {
  const [data, setData] = useState<(Store & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listAll<Store>('stores')
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useInventoryItems(): Loadable<(InventoryItem & { id: string })[]> {
  const [data, setData] = useState<(InventoryItem & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listAll<InventoryItem>('inventoryItems')
      .then((rows) => { setData(rows.filter((r) => r.active !== false)); setError(null); })
      .catch((e) => setError(e?.message ?? 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useInventoryItem(id: string | undefined): Loadable<(InventoryItem & { id: string }) | null> {
  const [data, setData] = useState<(InventoryItem & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) { setData(null); setLoading(false); return; }
    setLoading(true);
    getById<InventoryItem>('inventoryItems', id)
      .then((row) => { setData(row); setError(null); })
      .catch((e) => setError(e?.message ?? 'Load failed'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useStockBalancesForItem(itemId: string | undefined): Loadable<(StockBalance & { id: string })[]> {
  const [data, setData] = useState<(StockBalance & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!itemId) { setData([]); setLoading(false); return; }
    setLoading(true);
    listWhere<StockBalance>('stockBalances', 'itemId', '==', itemId)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Load failed'))
      .finally(() => setLoading(false));
  }, [itemId]);

  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useStockBalancesForStore(storeId: string | undefined): Loadable<(StockBalance & { id: string })[]> {
  const [data, setData] = useState<(StockBalance & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!storeId) { setData([]); setLoading(false); return; }
    setLoading(true);
    listWhere<StockBalance>('stockBalances', 'storeId', '==', storeId)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Load failed'))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useStockMovementsForItem(itemId: string | undefined): Loadable<(StockMovement & { id: string })[]> {
  const [data, setData] = useState<(StockMovement & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!itemId) { setData([]); setLoading(false); return; }
    setLoading(true);
    listWhere<StockMovement>('stockMovements', 'itemId', '==', itemId, 'createdAt')
      .then((rows) => { setData(rows.reverse()); setError(null); })
      .catch((e) => setError(e?.message ?? 'Load failed'))
      .finally(() => setLoading(false));
  }, [itemId]);

  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useAllStockMovements(): Loadable<(StockMovement & { id: string })[]> {
  const [data, setData] = useState<(StockMovement & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listAll<StockMovement>('stockMovements')
      .then((rows) => {
        const sorted = [...rows].sort((a, b) =>
          (b.createdAt instanceof Date ? b.createdAt.getTime() : 0) -
          (a.createdAt instanceof Date ? a.createdAt.getTime() : 0)
        );
        setData(sorted); setError(null);
      })
      .catch((e) => setError(e?.message ?? 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useStockTransfers(): Loadable<(StockTransfer & { id: string })[]> {
  const [data, setData] = useState<(StockTransfer & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listAll<StockTransfer>('stockTransfers')
      .then((rows) => {
        const sorted = [...rows].sort((a, b) =>
          (b.createdAt instanceof Date ? b.createdAt.getTime() : 0) -
          (a.createdAt instanceof Date ? a.createdAt.getTime() : 0)
        );
        setData(sorted); setError(null);
      })
      .catch((e) => setError(e?.message ?? 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

export function useStockTransfer(id: string | undefined): Loadable<(StockTransfer & { id: string }) | null> {
  const [data, setData] = useState<(StockTransfer & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) { setData(null); setLoading(false); return; }
    setLoading(true);
    getById<StockTransfer>('stockTransfers', id)
      .then((row) => { setData(row); setError(null); })
      .catch((e) => setError(e?.message ?? 'Load failed'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}

/** All stock balances across all items and stores. Used for the matrix view. */
export function useAllStockBalances(): Loadable<(StockBalance & { id: string })[]> {
  const [data, setData] = useState<(StockBalance & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listAll<StockBalance>('stockBalances')
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}
