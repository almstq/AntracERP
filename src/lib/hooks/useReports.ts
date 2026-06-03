import { useCallback, useEffect, useState } from 'react';
import { listDeploymentRevenue } from '../services/reports';
import type { DeploymentRevenue } from '../../types/reports';

interface Loadable<T> { data: T; loading: boolean; error: string | null; refresh: () => void }

export function useDeploymentRevenue(sbuId = 'sbu-wli'): Loadable<(DeploymentRevenue & { id: string })[]> {
  const [data, setData] = useState<(DeploymentRevenue & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    listDeploymentRevenue(sbuId)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load revenue'))
      .finally(() => setLoading(false));
  }, [sbuId]);
  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}
