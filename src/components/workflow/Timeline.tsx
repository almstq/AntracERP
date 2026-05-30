import { Card } from '../ui/Card';
import { useTimeline } from '../../lib/hooks/useWorkflowData';

function fmt(ts: unknown): string {
  if (ts instanceof Date) return ts.toLocaleString();
  return '';
}

export function Timeline({ collection, entityId }: { collection: string; entityId: string }) {
  const { data: events, loading } = useTimeline(collection, entityId);

  return (
    <Card header={<span className="text-sm font-medium">Timeline</span>}>
      {loading ? (
        <p className="text-xs text-text-muted">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-xs text-text-muted">No activity yet.</p>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.id} className="flex gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue mt-1.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-text-primary font-medium">{e.from} → {e.to}</p>
                <p className="text-text-muted">
                  {e.actorName || e.actorRole} · {e.actorRole}{fmt(e.timestamp) ? ` · ${fmt(e.timestamp)}` : ''}
                </p>
                {e.notes ? <p className="text-text-secondary mt-0.5">{e.notes}</p> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
