import { Card } from '../../components/ui/Card';
import { Factory, Fuel, Settings } from 'lucide-react';
import { PageContainer } from '../../components/shared/PageContainer';

const sbuCards = [
  { name: 'WLI', desc: 'Well Land Investment', icon: Factory, bgClass: 'bg-blue/10', iconClass: 'text-blue', stats: { tickets: 12, pending: 5 } },
  { name: 'MPL', desc: 'Maldives Petroleum Link', icon: Fuel, bgClass: 'bg-amber/10', iconClass: 'text-amber', stats: { tickets: 0, pending: 0 } },
  { name: 'EMS', desc: 'Expert Motor Service', icon: Settings, bgClass: 'bg-purple/10', iconClass: 'text-purple', stats: { tickets: 0, pending: 0 } },
];

export function HoldingDashboard() {
  return (
    <PageContainer>
      <div>
        <h1 className="text-lg font-bold text-text-primary">Antrac Holding</h1>
        <p className="text-xs text-text-muted">Group overview</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {sbuCards.map(sbu => {
          const Icon = sbu.icon;
          return (
            <Card key={sbu.name}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${sbu.bgClass} flex items-center justify-center`}>
                  <Icon size={20} className={sbu.iconClass} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{sbu.name}</p>
                  <p className="text-[10px] text-text-muted">{sbu.desc}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="text-center p-3 rounded-lg bg-bg-surface">
                  <p className="font-bold text-text-primary">{sbu.stats.tickets}</p>
                  <p className="text-text-muted">Open Tickets</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-bg-surface">
                  <p className="font-bold text-amber">{sbu.stats.pending}</p>
                  <p className="text-text-muted">Pending</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
