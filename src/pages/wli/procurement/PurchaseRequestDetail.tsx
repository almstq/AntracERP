import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { Button } from '../../../components/ui/Button';
import { FileText, Send, Check, X, ArrowLeft } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

const mockPR = {
  id: 'PR-2026-0001',
  title: 'Crane hydraulic leak repair — Site A',
  description: 'Hydraulic fluid leaking from the main cylinder of Crane 3. Machine is currently down and requires immediate repair.',
  site: 'Site A — Hulhumalé',
  requestedBy: 'Ahmed (Site Manager)',
  status: 'pending',
  priority: 'high',
  items: [
    { description: 'Hydraulic cylinder seal kit', quantity: 1, estimatedPrice: 450 },
    { description: 'Hydraulic fluid 20L', quantity: 2, estimatedPrice: 85 },
    { description: 'Labor — cylinder replacement', quantity: 1, estimatedPrice: 300 },
  ],
  totalEstimated: 920,
  createdAt: '2026-05-27',
};

export function PurchaseRequestDetail() {
  const { id: _id } = useParams();
  void _id;
  const pr = mockPR;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wli" className="text-text-muted hover:text-text-primary">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-text-primary truncate">{pr.title}</h1>
            <StatusBadge status="pending" />
            <PriorityBadge priority={pr.priority} />
          </div>
          <p className="text-xs text-text-muted">{pr.id} · {pr.site}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card header={<span className="text-sm font-medium">Request Details</span>}>
            <p className="text-xs text-text-secondary mb-3">{pr.description}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-text-muted">Requested by:</span> <span className="text-text-primary">{pr.requestedBy}</span></div>
              <div><span className="text-text-muted">Created:</span> <span className="text-text-primary">{pr.createdAt}</span></div>
              <div><span className="text-text-muted">Site:</span> <span className="text-text-primary">{pr.site}</span></div>
              <div><span className="text-text-muted">Est. Total:</span> <span className="text-text-primary font-semibold">${pr.totalEstimated}</span></div>
            </div>
          </Card>

          <Card header={<span className="text-sm font-medium">Items Requested</span>}>
            <div className="space-y-2">
              {pr.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bg-surface">
                  <div>
                    <p className="text-xs text-text-primary">{item.description}</p>
                    <p className="text-[10px] text-text-muted">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-xs text-text-secondary font-medium">${item.estimatedPrice}</p>
                </div>
              ))}
              <div className="flex items-center justify-between p-2 border-t border-border-soft mt-2 pt-2">
                <p className="text-xs font-semibold text-text-primary">Estimated Total</p>
                <p className="text-sm font-bold text-text-primary">${pr.totalEstimated}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card header={<span className="text-sm font-medium">Actions</span>}>
            <div className="space-y-2">
              <Button variant="primary" size="sm" className="w-full"><Check size={14} /> Approve</Button>
              <Button variant="secondary" size="sm" className="w-full"><Send size={14} /> Send to GM</Button>
              <Button variant="secondary" size="sm" className="w-full"><FileText size={14} /> Create RFQ</Button>
              <Button variant="danger" size="sm" className="w-full"><X size={14} /> Reject</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
