/**
 * FollowMe vessel tracking — FRONTEND reads the server-side Firestore cache only.
 * The browser MUST NOT call the FollowMe API directly (Terms of Use). The
 * `syncFollowMe` Cloud Function refreshes `followmeCache` once a minute.
 * See docs/FOLLOWME_INTEGRATION.md.
 */
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getDbInstance } from '../firebase/client';

export interface FollowMePosition {
  followmeId: string;
  name: string | null;
  lat: number | null;
  lng: number | null;
  speed: number | null;
  heading: number | null;
  lastUpdate: string | null;
  online: boolean | null;
  cachedAt?: string;
}

export interface FollowMeMeta {
  ok: boolean;
  lastSync?: string;
  count?: number;
  error?: string | null;
}

export interface FollowMeFleet {
  /** Keyed by followme vessel id (== Asset.trackingId). */
  positions: Record<string, FollowMePosition>;
  meta: FollowMeMeta | null;
  loading: boolean;
}

/** Human-readable status from the cache meta (for the "temporarily unavailable" rule). */
export function followMeStatusText(meta: FollowMeMeta | null): string | null {
  if (!meta) return null;
  if (meta.ok) return null;
  if (meta.error === 'no_key') return 'FollowMe not yet connected — API key pending (request from info@followme.mv).';
  return 'FollowMe service temporarily unavailable.';
}

const EMPTY: Record<string, FollowMePosition> = {};

/** Reads the cached fleet from Firestore; re-polls every 60s (matches cache cadence). */
export function useFollowMeFleet(): FollowMeFleet {
  const [positions, setPositions] = useState<Record<string, FollowMePosition>>(EMPTY);
  const [meta, setMeta] = useState<FollowMeMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDbInstance();
    if (!db) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      try {
        const [snap, metaDoc] = await Promise.all([
          getDocs(collection(db!, 'followmeCache')),
          getDoc(doc(db!, 'followmeMeta', 'status')),
        ]);
        if (cancelled) return;
        const map: Record<string, FollowMePosition> = {};
        snap.forEach((d) => { map[d.id] = { followmeId: d.id, ...(d.data() as object) } as FollowMePosition; });
        setPositions(map);
        setMeta(metaDoc.exists() ? (metaDoc.data() as FollowMeMeta) : null);
      } catch {
        if (!cancelled) setMeta({ ok: false, error: 'read_failed' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const t = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return { positions, meta, loading };
}
