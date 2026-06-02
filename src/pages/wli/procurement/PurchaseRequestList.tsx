import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Search, ShoppingCart } from 'lucide-react';
import { usePRList } from '../../../lib/hooks/useWorkflowData';
import { purchaseRequestWorkflow } from '../../../lib/workflow/definitions';
import type { PRStatus } from '../../../types/workflow-entities';
import { PageContainer } from '../../../components/shared/PageContainer';

export function PurchaseRequestList() {
  const { data: prs, loading } = usePRList();
  const [search, setSearch] = useState('');
  // Hide on_hold PRs — not yet activated, invisible to procurement per spec.
  const visible = prs.filter((p) => p.status !== 'on_hold');
  const filtered = !search
    ? visible
    : visible.filter(p => p.displayId.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageContainer>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-text-primary">Purchase Requests</h1>
        <p className="text-xs text-text-muted">{loading ? 'Loading…' : `${visible.length} active`}</p>
      </div>
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-bg-surface border border-border text-text-primary"
          placeholder="Search…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>
      <Card>
        {!loading && filtered.length === 0 ? (
          <p className="text-xs text-text-muted p-2">{search ? 'No results match your search.' : 'No active purchase requests. PRs appear here once a GM approves the issue ticket.'}</p>
        ) : (
          <div className="space-y-1">
            {filtered.map((p) => (
              <Link key={p.id} to={`/wli/procurement/requests/${p.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface">
                <div className="flex items-center gap-3 min-w-0">
                  <ShoppingCart size={16} className="text-text-muted flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{p.displayId}</p>
                    <p className="text-[10px] text-text-muted">{p.lineItems?.length ?? 0} item(s) · {p.urgency}</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-bg-surface text-text-secondary flex-shrink-0 ml-2">
                  {purchaseRequestWorkflow.statusLabels[p.status as PRStatus] ?? p.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
