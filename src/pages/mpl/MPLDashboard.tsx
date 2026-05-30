import { Fuel, Truck, ArrowRightLeft, Droplets, AlertTriangle, CheckCircle, Clock, XCircle, Plus, Filter, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/shared/EmptyState';
import { MOCK_FUEL_DISPATCHES, MOCK_FUEL_TANKS, MOCK_INTER_SBU_TRANSFERS } from '../../lib/mock-data/mpl-data';

const fuelTankIcon = (current: number, capacity: number) => {
  const pct = (current / capacity) * 100;
  if (pct < 20) return <AlertTriangle size={16} className="text-red" />;
  if (pct < 40) return <Droplets size={16} className="text-amber" />;
  return <Droplets size={16} className="text-teal" />;
};

const fuelTankPct = (current: number, capacity: number) => {
  const pct = Math.round((current / capacity) * 100);
  if (pct < 20) return 'text-red';
  if (pct < 40) return 'text-amber';
  return 'text-teal';
};

const statusIcon = (status: string) => {
  switch (status) {
    case 'requested': return <Clock size={12} className="text-amber" />;
    case 'approved': return <CheckCircle size={12} className="text-blue" />;
    case 'dispensed': case 'transferred': case 'completed': return <CheckCircle size={12} className="text-teal" />;
    case 'in_transit': return <Truck size={12} className="text-blue" />;
    case 'rejected': return <XCircle size={12} className="text-red" />;
    default: return null;
  }
};

const statusColorMap: Record<string, 'amber' | 'blue' | 'teal' | 'red' | 'neutral'> = {
  requested: 'amber',
  approved: 'blue',
  dispensed: 'teal',
  transferred: 'teal',
  in_transit: 'blue',
  completed: 'teal',
  rejected: 'red',
};

const statusLabelMap: Record<string, string> = {
  requested: 'Requested',
  approved: 'Approved',
  dispensed: 'Dispensed',
  transferred: 'Transferred',
  in_transit: 'In Transit',
  completed: 'Completed',
  rejected: 'Rejected',
};

const assetTypeLabel: Record<string, string> = {
  crane: 'Crane',
  excavator: 'Excavator',
  dozer: 'Dozer',
  generator: 'Generator',
  roller: 'Roller',
  forklift: 'Forklift',
  truck: 'Truck',
  vessel: 'Vessel',
};

export function MPLDashboard() {
  const dispatches = MOCK_FUEL_DISPATCHES;
  const tanks = MOCK_FUEL_TANKS;
  const transfers = MOCK_INTER_SBU_TRANSFERS;

  const pendingDispatches = dispatches.filter(d => d.status === 'requested').length;
  const pendingTransfers = transfers.filter(t => t.status === 'requested').length;
  const totalLitersToday = dispatches
    .filter(d => d.status === 'dispensed' && d.createdAt.startsWith('2026-05-28'))
    .reduce((sum, d) => sum + d.dispensedLiters, 0);
  const totalCostToday = dispatches
    .filter(d => d.status === 'dispensed' && d.createdAt.startsWith('2026-05-28'))
    .reduce((sum, d) => sum + d.cost, 0);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary">MPL Dashboard</h1>
          <p className="text-xs text-text-muted">Maldives Petroleum Link — Fuel & Asset Transfers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Filter size={14} /> Filter</Button>
          <Button variant="primary" size="sm"><Plus size={14} /> New Dispatch</Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center py-3">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Clock size={14} className="text-amber" />
            <p className="text-xl font-bold text-amber">{pendingDispatches}</p>
          </div>
          <p className="text-[10px] text-text-muted">Pending Dispatches</p>
        </Card>
        <Card className="text-center py-3">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ArrowRightLeft size={14} className="text-blue" />
            <p className="text-xl font-bold text-blue">{pendingTransfers}</p>
          </div>
          <p className="text-[10px] text-text-muted">Pending Transfers</p>
        </Card>
        <Card className="text-center py-3">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Droplets size={14} className="text-teal" />
            <p className="text-xl font-bold text-teal">{totalLitersToday.toLocaleString()}L</p>
          </div>
          <p className="text-[10px] text-text-muted">Dispensed Today</p>
        </Card>
        <Card className="text-center py-3">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Fuel size={14} className="text-purple" />
            <p className="text-xl font-bold text-purple">${totalCostToday.toLocaleString()}</p>
          </div>
          <p className="text-[10px] text-text-muted">Cost Today</p>
        </Card>
      </div>

      {/* Fuel Tank Levels */}
      <Card header={<span className="text-sm font-medium">Fuel Tank Levels</span>}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tanks.map(tank => (
            <div key={tank.id} className="p-3 rounded-lg bg-bg-surface border border-border-soft">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-text-primary">{tank.name}</p>
                {fuelTankIcon(tank.current, tank.capacity)}
              </div>
              <div className="w-full h-2 rounded-full bg-bg-base overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full ${tank.current / tank.capacity < 0.2 ? 'bg-red' : tank.current / tank.capacity < 0.4 ? 'bg-amber' : 'bg-teal'}`}
                  style={{ width: `${Math.min(100, (tank.current / tank.capacity) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className={fuelTankPct(tank.current, tank.capacity)}>
                  {Math.round((tank.current / tank.capacity) * 100)}%
                </span>
                <span className="text-text-muted">{tank.current.toLocaleString()} / {tank.capacity.toLocaleString()} L</span>
              </div>
              <p className="text-[9px] text-text-muted mt-0.5">{tank.fuelType}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Fuel Dispatches */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-medium">Recent Fuel Dispatches</span>
            <Button variant="ghost" size="sm" className="text-[10px]">View All</Button>
          </div>
        }
      >
        <div className="space-y-1">
          {dispatches.slice(0, 5).map(d => (
            <div key={d.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface transition-colors cursor-pointer">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Fuel size={16} className="text-text-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{d.assetTag} — {assetTypeLabel[d.assetType]}</p>
                  <p className="text-[10px] text-text-muted">
                    {d.id} · {d.fuelType} · {d.requestedLiters}L requested · {d.siteName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {statusIcon(d.status)}
                <Badge color={statusColorMap[d.status] || 'neutral'}>{statusLabelMap[d.status] || d.status}</Badge>
                <Button variant="ghost" size="sm"><Eye size={14} /></Button>
              </div>
            </div>
          ))}
          {dispatches.length === 0 && (
            <EmptyState icon={<Fuel size={24} />} title="No fuel dispatches" description="Create a new fuel dispatch to get started" />
          )}
        </div>
      </Card>

      {/* Inter-SBU Transfers */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-medium">Inter-SBU Transfers</span>
            <Button variant="ghost" size="sm" className="text-[10px]">View All</Button>
          </div>
        }
      >
        <div className="space-y-1">
          {transfers.map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface transition-colors cursor-pointer">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <ArrowRightLeft size={16} className="text-text-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{t.assetName} ({t.assetId})</p>
                  <p className="text-[10px] text-text-muted">
                    {t.id} · {t.fromSBU} → {t.toSBU} · {t.fromSite} → {t.toSite}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {statusIcon(t.status)}
                <Badge color={statusColorMap[t.status] || 'neutral'}>{statusLabelMap[t.status] || t.status}</Badge>
                <Button variant="ghost" size="sm"><Eye size={14} /></Button>
              </div>
            </div>
          ))}
          {transfers.length === 0 && (
            <EmptyState icon={<ArrowRightLeft size={24} />} title="No inter-SBU transfers" description="Assets transfers between SBUs will appear here" />
          )}
        </div>
      </Card>
    </div>
  );
}
