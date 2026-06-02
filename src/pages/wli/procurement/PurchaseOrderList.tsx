import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Search, Package } from 'lucide-react';
import { usePOList } from '../../../lib/hooks/useWorkflowData';
import { purchaseOrderWorkflow } from '../../../lib/workflow/definitions';
import type { POStatus } from '../../../types/workflow-entities';
import { PageContainer } from '../../../components/shared/PageContainer';

export function PurchaseOrderList() {
  const { data: pos, loading } = usePOList();
  const [search, setSearch] = useState('');

  const filtered = !search
    ? pos
    : pos.filter(po => po.displayId.toLowerCase().includes(search.toLowerCase()) || po.supplierName.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageContainer>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-text-primary">Purchase Orders</h1>
        <p className="text-xs text-text-muted">{loading ? 'Loading…' : `${pos.length} orders`}</p>
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
          <p className="text-xs text-text-muted p-2">{search ? 'No results match your search.' : 'No purchase orders yet. POs are raised from an approved PR.'}</p>
        ) : (
          <div className="space-y-1">
            {filtered.map((po) => (
              <Link key={po.id} to={`/wli/procurement/orders/${po.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface">
                <div className="flex items-center gap-3 min-w-0">
                  <Package size={16} className="text-text-muted flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{po.displayId} · {po.supplierName}</p>
                    <p className="text-[10px] text-text-muted">{po.currency} {po.total?.toLocaleString()} · {po.lineItems?.length ?? 0} item(s)</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-bg-surface text-text-secondary flex-shrink-0 ml-2">
                  {purchaseOrderWorkflow.statusLabels[po.status as POStatus] ?? po.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
