import { useState, useEffect } from 'react';
import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Fuel, Plus, Droplets, Search } from 'lucide-react';
import { listFuelRequests } from '../../../lib/services/fuel';
import { listInventoryBalances } from '../../../lib/services/fuel';
import { formatDate } from '../../../lib/utils/format';
import type { FuelRequest, InventoryBalance } from '../../../types/workflow-entities';
import { PageContainer } from '../../../components/shared/PageContainer';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';

const STATUS_STYLE: Record<string, string> = {
  draft:                  'bg-border text-text-muted',
  submitted:              'bg-blue/10 text-blue',
  inventory_checked:      'bg-violet/10 text-violet',
  gm_approved:            'bg-teal/10 text-teal',
  mpl_accepted:           'bg-amber/10 text-amber',
  director_approved:      'bg-amber/15 text-amber',
  ready_for_collection:   'bg-orange/10 text-orange',
  collected:              'bg-teal/15 text-teal',
  closed:                 'bg-border text-text-muted',
  rejected:               'bg-red/10 text-red',
};
const STATUS_LABELS: Record<string, string> = {
  draft:                  'Draft',
  submitted:              'Submitted',
  inventory_checked:      'Inventory Checked',
  gm_approved:            'GM Approved',
  mpl_accepted:           'MPL Accepted',
  director_approved:      'Director Approved',
  ready_for_collection:   'Ready for Collection',
  collected:              'Collected',
  closed:                 'Closed',
  rejected:               'Rejected',
};

const TYPE_ICON: Record<string, React.ReactElement> = {
  fuel:   <Fuel size={14} className="text-amber flex-shrink-0" />,
  water:  <Droplets size={14} className="text-blue flex-shrink-0" />,
  both:   <Droplets size={14} className="text-teal flex-shrink-0" />,
};

const URGENCY_COLOR: Record<string, string> = {
  critical: 'text-red',
  urgent:   'text-amber',
  routine:  'text-text-muted',
};

export function FuelRequestList() {
  const [requests, setRequests] = useState<(FuelRequest & { id: string })[]>([]);
  const [balances, setBalances] = useState<(InventoryBalance & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([listFuelRequests(), listInventoryBalances()])
      .then(([reqs, bals]) => { setRequests(reqs); setBalances(bals); })
      .finally(() => setLoading(false));
  }, []);

  const searched = !search
    ? requests
    : requests.filter(r =>
        r.displayId.toLowerCase().includes(search.toLowerCase()) ||
        r.siteId.toLowerCase().includes(search.toLowerCase()) ||
        (r.fuelType && r.fuelType.toLowerCase().includes(search.toLowerCase()))
      );

  const open   = searched.filter(r => !['closed'].includes(r.status));
  const closed = searched.filter(r => r.status === 'closed');

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Fuel & Water Requests</h1>
          <p className="text-xs text-text-muted">
            {loading ? 'Loading…' : `${open.length} open · ${closed.length} closed`}
          </p>
        </div>
        <Link to="/wli/fuel/requests/new">
          <Button variant="primary" size="sm"><Plus size={14} /> New Request</Button>
        </Link>
      </div>

      {/* Inventory balances */}
      {!loading && balances.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">WLI Inventory Balances</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {balances.map(b => (
              <Card key={b.id} className="text-center py-3">
                <p className="text-xl font-bold text-teal">{b.currentQty.toLocaleString()}</p>
                <p className="text-[10px] text-text-muted mt-0.5 capitalize">{b.item} ({b.uom})</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-bg-surface border border-border text-text-primary"
          placeholder="Search…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Open requests */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">Open Requests</p>
        <Card>
          {loading ? (
            <LoadingSpinner text="Loading…" />
          ) : open.length === 0 ? (
            <div className="py-10 text-center">
              <Fuel size={28} className="mx-auto text-text-muted mb-2" />
              <p className="text-xs text-text-muted">{search ? 'No results match your search.' : 'No open fuel or water requests.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {open.map(r => (
                <Link
                  key={r.id}
                  to={`/wli/fuel/requests/${r.id}`}
                  className="flex items-center justify-between p-3 hover:bg-bg-surface transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {TYPE_ICON[r.requestType]}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-text-primary">{r.displayId}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status] ?? ''}`}>
                          {STATUS_LABELS[r.status] ?? r.status}
                        </span>
                        <span className={`text-[10px] font-medium ${URGENCY_COLOR[r.urgency]}`}>{r.urgency}</span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {r.quantity} {r.uom}
                        {r.fuelType ? ` · ${r.fuelType}` : ''}
                        {' · '}{r.siteId}
                      </p>
                      <p className="text-[10px] text-text-muted">{formatDate(r.createdAt)}</p>
                    </div>
                  </div>
                  <span className="text-text-muted group-hover:text-text-primary text-sm flex-shrink-0 ml-2">→</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Closed requests */}
      {closed.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">Closed</p>
          <Card>
            <div className="divide-y divide-border">
              {closed.map(r => (
                <Link
                  key={r.id}
                  to={`/wli/fuel/requests/${r.id}`}
                  className="flex items-center justify-between p-3 hover:bg-bg-surface transition-colors group opacity-60"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {TYPE_ICON[r.requestType]}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary">{r.displayId}</p>
                      <p className="text-xs text-text-secondary">
                        {r.quantityCollected ?? r.quantity} {r.uom} · {r.siteId}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-text-muted">{r.collectedAt ? formatDate(r.collectedAt) : '—'}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
