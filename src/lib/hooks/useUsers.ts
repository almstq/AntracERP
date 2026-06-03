import { useCallback, useEffect, useState } from 'react';
import { listUsers, type AppUser } from '../services/users';

export function useUsers() {
  const [data, setData] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    listUsers()
      .then((rows) => { setData(rows); setError(null); })
      .catch((e) => setError(e?.message ?? 'Failed to load users'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  return { data, loading, error, refresh: load };
}
