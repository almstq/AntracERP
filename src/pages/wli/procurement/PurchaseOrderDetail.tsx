import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Send, Check } from 'lucide-react';

const mockPO = {
  id: 'PO-2026-0002',
  vendor: 'Industrial Supplies Co',
  vendorAddress: 'Male, Maldives',
  status: 'in_progress',
  total: 2340,
  date: '2026-05-25',
  expectedDelivery: '2026-06-05',
  rfqId: 'RFQ-2026-0002',
  items: [
    { description: 'Generator oil change kit', quantity: 1, unitPrice: 120, total: 120 },
    { description: 'Filter replacement set', quantity: 2, unitPrice: 85, total: 170 },
    { description: 'Air filter', quantity: 3, unitPrice: 45, total: 135 },
    { description: 'Compressor oil 5L', quantity: 4, unitPrice: 65, total: 260 },
    { description: 'Battery 12V', quantity: 1, unitPrice: 220, total: 220 },
    { description: 'Misc hardware kit', quantity: 1, unitPrice: 350, total: 350 },
  ],
};

export function PurchaseOrderDetail() {
  const po = mockPO;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wli" className="text-text-muted hover:text-text-primary">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-text-primary">{po.vendor}</h1>
            <StatusBadge status={po.status} />
          </div>
          <p className="text-xs text-text-muted">{po.id} · {po.date}</p>
        </div>
        <Button variant="secondary" size="sm"><FileText size={14} /> Export PDF</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card header={<span className="text-sm font-medium">Order Info</span>}>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-text-muted">Vendor:</span> <span className="text-text-primary">{po.vendor}</span></div>
              <div><span className="text-text-muted">Address:</span> <span className="text-text-primary">{po.vendorAddress}</span></div>
              <div><span className="text-text-muted">Expected Delivery:</span> <span className="text-text-primary">{po.expectedDelivery}</span></div>
              <div><span className="text-text-muted">Linked RFQ:</span> <span className="text-blue">{po.rfqId}</span></div>
            </div>
          </Card>

          <Card header={<span className="text-sm font-medium">Line Items</span>}>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] text-text-muted font-semibold uppercase px-2">
                <span className="col-span-5">Item</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-2 text-right">Unit Price</span>
                <span className="col-span-3 text-right">Total</span>
              </div>
              {po.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 p-2 rounded-lg bg-bg-surface text-xs">
                  <span className="col-span-5 text-text-primary">{item.description}</span>
                  <span className="col-span-2 text-right text-text-secondary">{item.quantity}</span>
                  <span className="col-span-2 text-right text-text-secondary">${item.unitPrice}</span>
                  <span className="col-span-3 text-right text-text-primary font-medium">${item.total}</span>
                </div>
              ))}
              <div className="flex items-center justify-between p-2 border-t border-border-soft mt-2 pt-2">
                <p className="text-sm font-bold text-text-primary">Total</p>
                <p className="text-lg font-bold text-text-primary">{po.total.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card header={<span className="text-sm font-medium">Actions</span>}>
            <div className="space-y-2">
              <Button variant="primary" size="sm" className="w-full"><Check size={14} /> Confirm Receipt</Button>
              <Button variant="secondary" size="sm" className="w-full"><Send size={14} /> Track Shipment</Button>
              <Button variant="secondary" size="sm" className="w-full"><FileText size={14} /> View Invoice</Button>
              <Button variant="danger" size="sm" className="w-full">Report Issue</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
