import { useMemo, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle, Banknote, Boxes, Briefcase, ChevronRight, Clock, CreditCard,
  Download, FileText, Gauge, Package, ShieldAlert, Store, TrendingDown,
  TrendingUp, Truck, type LucideIcon,
} from 'lucide-react';
import { useAssetList, usePOList, usePRList, useSiteList, useTicketList } from '../../../lib/hooks/useWorkflowData';
import { useCustomerList, useEnquiryList, useInvoiceList, useQuotationList, useWorkOrderList, useAllPayments } from '../../../lib/hooks/useCrmData';
import { useAllStockBalances, useInventoryItems } from '../../../lib/hooks/useInventory';
import { useDeployments } from '../../../lib/hooks/useReports';
import { deploymentEarned } from '../../../lib/services/deployments';
import { formatMoney } from '../../../lib/utils/money';
import { exportCsv } from '../../../lib/utils/export';

const DAY = 86_400_000;
const MVR = 'MVR';

function asDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const t = v as { toDate?: () => Date; seconds?: number };
  if (typeof t.toDate === 'function') return t.toDate();
  if (typeof t.seconds === 'number') return new Date(t.seconds * 1000);
  return null;
}

function daysSince(v: unknown, now = new Date()): number {
  const d = asDate(v);
  if (!d) return 0;
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / DAY));
}

function daysUntil(v: unknown, now = new Date()): number {
  const d = asDate(v);
  if (!d) return 0;
  return Math.floor((d.getTime() - now.getTime()) / DAY);
}

function inThisMonth(v: unknown, now = new Date()): boolean {
  const d = asDate(v);
  return !!d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function fm(n: number): string {
  return formatMoney(Math.round(Number.isFinite(n) ? n : 0), MVR);
}

function pct(n: number, d: number): string {
  return d > 0 ? `${Math.round((n / d) * 100)}%` : '—';
}

function statusText(v: string): string {
  return v.replaceAll('_', ' ');
}

type MetricTone = 'pos' | 'warn' | 'danger' | 'info' | 'accent';

function MetricCard({ label, value, sub, icon: Icon, tone = 'info' }: {
  label: string; value: string; sub?: string; icon: LucideIcon; tone?: MetricTone;
}) {
  const tint = tone === 'pos' ? 'tint-pos'
    : tone === 'warn' ? 'tint-warn'
      : tone === 'danger' ? 'tint-danger'
        : tone === 'accent' ? 'tint-accent'
          : 'tint-info';
  return (
    <div className="metric">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className={`metric-ic ${tint}`}><Icon /></span>
      </div>
      <div className="metric-val num">{value}</div>
      {sub && <div className="text-xs text-text-muted" style={{ marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, hint, children, action }: {
  title: string; hint?: string; children: ReactNode; action?: ReactNode;
}) {
  return (
    <div className="section">
      <div className="section-head">
        <h2>{title}{hint && <span className="hint"> {hint}</span>}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function ReportsCenter() {
  const location = useLocation();
  const base = location.pathname.startsWith('/holding') ? '/holding/reports' : '/wli/reports';
  const now = useMemo(() => new Date(), []);

  const { data: invoices } = useInvoiceList();
  const { data: payments } = useAllPayments();
  const { data: customers } = useCustomerList();
  const { data: quotations } = useQuotationList();
  const { data: workOrders } = useWorkOrderList();
  const { data: enquiries } = useEnquiryList();
  const { data: tickets } = useTicketList();
  const { data: prs } = usePRList();
  const { data: pos } = usePOList();
  const { data: deployments } = useDeployments();
  const { data: sites } = useSiteList();
  const { data: assets } = useAssetList();
  const { data: items } = useInventoryItems();
  const { data: balances } = useAllStockBalances();

  const siteById = useMemo(() => new Map(sites.map((s) => [s.id, s.name])), [sites]);
  const assetById = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);
  const prById = useMemo(() => new Map(prs.map((p) => [p.id, p])), [prs]);
  const ticketById = useMemo(() => new Map(tickets.map((t) => [t.id, t])), [tickets]);
  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const finance = useMemo(() => {
    const invoicedMonth = invoices.filter((i) => inThisMonth(i.createdAt, now)).reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    const collectedMonth = payments.filter((p) => inThisMonth(p.receivedAt ?? p.createdAt, now)).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    const outstanding = invoices.reduce((sum, i) => sum + Math.max(0, Number(i.balance) || 0), 0);
    const overdue = invoices
      .filter((i) => (Number(i.balance) || 0) > 0 && daysUntil(i.dueDate, now) < 0 && i.status !== 'void')
      .reduce((sum, i) => sum + (Number(i.balance) || 0), 0);
    const payablesPending = pos
      .filter((po) => !['payment_completed', 'wli_finance_confirmed', 'items_collected', 'po_closed'].includes(po.status))
      .reduce((sum, po) => sum + (Number(po.total) || 0), 0);
    const paidSupplier = pos
      .filter((po) => ['payment_completed', 'wli_finance_confirmed', 'items_collected', 'po_closed'].includes(po.status))
      .reduce((sum, po) => sum + (Number(po.total) || 0), 0);
    const advancesHeld = workOrders.filter((wo) => !['closed', 'fully_paid'].includes(wo.status)).reduce((sum, wo) => sum + (Number(wo.advancePaid) || 0), 0);
    const retentionHeld = workOrders.filter((wo) => !['closed'].includes(wo.status)).reduce((sum, wo) => sum + (Number(wo.retentionHeld) || 0), 0);
    return {
      invoicedMonth, collectedMonth, totalInvoiced, outstanding, overdue,
      payablesPending, paidSupplier, advancesHeld, retentionHeld,
      collectionRate: pct(payments.reduce((s, p) => s + (Number(p.amount) || 0), 0), totalInvoiced),
      cashGap: collectedMonth - payablesPending,
    };
  }, [invoices, payments, pos, workOrders, now]);

  const ageing = useMemo(() => {
    const buckets = [
      { label: 'Current', min: -Infinity, max: 0, amount: 0 },
      { label: '1-15', min: 1, max: 15, amount: 0 },
      { label: '16-30', min: 16, max: 30, amount: 0 },
      { label: '31-60', min: 31, max: 60, amount: 0 },
      { label: '60+', min: 61, max: Infinity, amount: 0 },
    ];
    for (const inv of invoices) {
      const bal = Math.max(0, Number(inv.balance) || 0);
      if (bal <= 0 || inv.status === 'void') continue;
      const overdueDays = Math.max(0, -daysUntil(inv.dueDate, now));
      const bucket = buckets.find((b) => overdueDays >= b.min && overdueDays <= b.max);
      if (bucket) bucket.amount += bal;
    }
    return buckets;
  }, [invoices, now]);

  const overdueCustomers = useMemo(() => {
    const rows = new Map<string, { customer: string; amount: number; oldest: number; count: number }>();
    for (const inv of invoices) {
      const bal = Math.max(0, Number(inv.balance) || 0);
      const overdueDays = -daysUntil(inv.dueDate, now);
      if (bal <= 0 || overdueDays <= 0 || inv.status === 'void') continue;
      const cur = rows.get(inv.customerId) ?? { customer: inv.customerName, amount: 0, oldest: 0, count: 0 };
      cur.amount += bal;
      cur.oldest = Math.max(cur.oldest, overdueDays);
      cur.count += 1;
      rows.set(inv.customerId, cur);
    }
    return [...rows.values()].sort((a, b) => b.amount - a.amount).slice(0, 6);
  }, [invoices, now]);

  const creditBreaches = useMemo(() => customers
    .filter((c) => (Number(c.creditLimit) || 0) > 0 && (Number(c.outstandingBalance) || 0) > (Number(c.creditLimit) || 0))
    .map((c) => ({
      id: c.id,
      customer: c.name,
      outstanding: Number(c.outstandingBalance) || 0,
      limit: Number(c.creditLimit) || 0,
      over: (Number(c.outstandingBalance) || 0) - (Number(c.creditLimit) || 0),
    }))
    .sort((a, b) => b.over - a.over)
    .slice(0, 6), [customers]);

  const payableStages = useMemo(() => {
    const labels: Record<string, string> = {
      raised: 'Supplier confirm',
      supplier_confirmed: 'WLI Finance',
      payment_request_sent: 'Antrac Finance',
      antrac_finance_accepted: 'CFO',
      cfo_verified: 'Director',
      director_approved: 'Payment execution',
      payment_completed: 'WLI settlement',
      wli_finance_confirmed: 'Inventory collection',
      items_collected: 'PO close',
      po_closed: 'Closed',
    };
    return Object.entries(labels).map(([status, label]) => {
      const rows = pos.filter((po) => po.status === status);
      return {
        status, label, count: rows.length,
        amount: rows.reduce((sum, po) => sum + (Number(po.total) || 0), 0),
        oldest: rows.reduce((max, po) => Math.max(max, daysSince(po.createdAt, now)), 0),
      };
    }).filter((r) => r.count > 0);
  }, [pos, now]);

  const pnlBySite = useMemo(() => {
    const revenue = new Map<string, number>();
    for (const dep of deployments) {
      revenue.set(dep.siteId, (revenue.get(dep.siteId) ?? 0) + deploymentEarned(dep, now));
    }

    const cost = new Map<string, number>();
    for (const po of pos) {
      const pr = po.purchaseRequestId ? prById.get(po.purchaseRequestId) : undefined;
      const ticket = po.ticketId ? ticketById.get(po.ticketId) : undefined;
      const siteId = pr?.siteId ?? ticket?.siteId;
      if (!siteId) continue;
      cost.set(siteId, (cost.get(siteId) ?? 0) + (Number(po.total) || 0));
    }

    const ids = new Set([...revenue.keys(), ...cost.keys(), ...sites.filter((s) => s.type !== 'hq').map((s) => s.id)]);
    return [...ids].map((id) => {
      const rev = revenue.get(id) ?? 0;
      const directCost = cost.get(id) ?? 0;
      return {
        id,
        site: siteById.get(id) ?? id,
        revenue: rev,
        cost: directCost,
        margin: rev - directCost,
      };
    }).sort((a, b) => a.margin - b.margin).slice(0, 8);
  }, [deployments, pos, prById, ticketById, sites, siteById, now]);

  const assetProfit = useMemo(() => {
    const revenue = new Map<string, number>();
    for (const dep of deployments) revenue.set(dep.assetId, (revenue.get(dep.assetId) ?? 0) + deploymentEarned(dep, now));
    const cost = new Map<string, number>();
    for (const po of pos) {
      const pr = po.purchaseRequestId ? prById.get(po.purchaseRequestId) : undefined;
      const ticket = po.ticketId ? ticketById.get(po.ticketId) : undefined;
      const assetId = pr?.assetId ?? ticket?.assetId;
      if (!assetId) continue;
      cost.set(assetId, (cost.get(assetId) ?? 0) + (Number(po.total) || 0));
    }
    return [...new Set([...revenue.keys(), ...cost.keys()])].map((id) => {
      const a = assetById.get(id);
      const rev = revenue.get(id) ?? 0;
      const repair = cost.get(id) ?? 0;
      return {
        id,
        asset: a ? `${a.code} · ${a.make} ${a.model}` : id,
        site: a?.currentSiteId ? siteById.get(a.currentSiteId) ?? a.currentSiteId : '—',
        revenue: rev,
        repair,
        net: rev - repair,
      };
    }).sort((a, b) => a.net - b.net).slice(0, 6);
  }, [deployments, pos, prById, ticketById, assetById, siteById, now]);

  const procurement = useMemo(() => {
    const supplier = new Map<string, { supplier: string; amount: number; count: number; open: number }>();
    let urgentSpend = 0;
    let directSpend = 0;
    let ticketLinkedSpend = 0;
    let quoteSavings = 0;
    let singleQuotePrs = 0;
    for (const po of pos) {
      const amount = Number(po.total) || 0;
      const cur = supplier.get(po.supplierId) ?? { supplier: po.supplierName, amount: 0, count: 0, open: 0 };
      cur.amount += amount;
      cur.count += 1;
      if (po.status !== 'po_closed') cur.open += amount;
      supplier.set(po.supplierId, cur);

      const pr = po.purchaseRequestId ? prById.get(po.purchaseRequestId) : undefined;
      if (pr?.urgency === 'urgent' || pr?.urgency === 'critical') urgentSpend += amount;
      if (pr?.origin === 'direct') directSpend += amount;
      if (pr?.origin === 'ticket' || po.ticketId) ticketLinkedSpend += amount;
    }
    for (const pr of prs) {
      if ((pr.quotes?.length ?? 0) === 1) singleQuotePrs += 1;
      for (const line of pr.lineItems ?? []) {
        const selected = line.selectedUnitPrice;
        if (selected == null) continue;
        const prices = (pr.quotes ?? [])
          .map((q) => q.linePrices.find((lp) => lp.ref === line.ref)?.unitPrice)
          .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
        if (prices.length > 1) quoteSavings += Math.max(...prices) - selected;
      }
    }
    return {
      totalPo: pos.reduce((sum, po) => sum + (Number(po.total) || 0), 0),
      urgentSpend,
      directSpend,
      ticketLinkedSpend,
      quoteSavings,
      singleQuotePrs,
      supplierRows: [...supplier.values()].sort((a, b) => b.amount - a.amount).slice(0, 6),
    };
  }, [pos, prs, prById]);

  const bottlenecks = useMemo(() => {
    const rows: { kind: string; id: string; status: string; owner: string; age: number; to: string; amount?: number }[] = [];
    const ticketOwner: Record<string, string> = {
      submitted: 'Mechanic', diagnosed: 'Supervisor', supervisor_checked: 'GM',
      gm_approved: 'Procurement', awaiting_delivery: 'Inventory / Procurement',
      items_delivered: 'Requestee', persists: 'Mechanic', resolved: 'GM / Supervisor',
    };
    for (const t of tickets.filter((t) => !['closed', 'rejected'].includes(t.status))) {
      rows.push({ kind: 'Ticket', id: t.displayId, status: t.status, owner: ticketOwner[t.status] ?? 'Operations', age: daysSince(t.createdAt, now), to: `/wli/tickets/${t.id}` });
    }
    const prOwner: Record<string, string> = {
      on_hold: 'GM', approved: 'Procurement', pr_accepted: 'Procurement',
      rfq_sent: 'Suppliers / Procurement', quotes_under_review: 'GM',
      gm_quote_approved: 'Procurement', po_raised: 'PO chain',
    };
    for (const pr of prs.filter((pr) => !['closed', 'rejected'].includes(pr.status))) {
      rows.push({ kind: 'PR', id: pr.displayId, status: pr.status, owner: prOwner[pr.status] ?? 'Procurement', age: daysSince(pr.createdAt, now), to: `/wli/procurement/requests/${pr.id}` });
    }
    const poOwner: Record<string, string> = {
      raised: 'Procurement / Finance', supplier_confirmed: 'WLI Finance',
      payment_request_sent: 'Antrac Finance', antrac_finance_accepted: 'CFO',
      cfo_verified: 'Director', director_approved: 'Antrac Finance',
      payment_completed: 'WLI Finance', wli_finance_confirmed: 'Inventory',
      items_collected: 'Procurement',
    };
    for (const po of pos.filter((po) => po.status !== 'po_closed')) {
      rows.push({ kind: 'PO', id: po.displayId, status: po.status, owner: poOwner[po.status] ?? 'Finance', age: daysSince(po.createdAt, now), to: `/wli/procurement/orders/${po.id}`, amount: Number(po.total) || 0 });
    }
    for (const e of enquiries.filter((e) => !['closed', 'quote_declined'].includes(e.status))) {
      const owner = e.status === 'logged' ? 'Ops' : e.status === 'availability_checked' ? 'GM' : e.status.includes('quotation') ? 'Finance / GM' : 'Sales';
      rows.push({ kind: 'Enquiry', id: e.displayId, status: e.status, owner, age: daysSince(e.createdAt, now), to: `/wli/crm/enquiries/${e.id}` });
    }
    for (const wo of workOrders.filter((wo) => wo.status !== 'closed')) {
      const owner = wo.status === 'completed' ? 'Finance' : ['invoiced', 'partially_paid'].includes(wo.status) ? 'Finance / Customer' : 'Operations';
      rows.push({ kind: 'WO', id: wo.displayId, status: wo.status, owner, age: daysSince(wo.createdAt, now), to: `/wli/crm/work-orders/${wo.id}`, amount: Number(wo.contractValue) || 0 });
    }
    return rows.sort((a, b) => b.age - a.age).slice(0, 10);
  }, [tickets, prs, pos, enquiries, workOrders, now]);

  const pipeline = useMemo(() => {
    const openQuotes = quotations.filter((q) => !['accepted', 'declined', 'expired'].includes(q.status));
    const sentQuotes = quotations.filter((q) => ['sent', 'accepted', 'declined'].includes(q.status)).length;
    const acceptedQuotes = quotations.filter((q) => q.status === 'accepted').length;
    const activeWork = workOrders.filter((wo) => !['closed', 'fully_paid'].includes(wo.status));
    return {
      enquiries: enquiries.filter((e) => !['closed', 'quote_declined'].includes(e.status)).length,
      workOrders: activeWork.length,
      value: activeWork.reduce((sum, wo) => sum + (Number(wo.contractValue) || 0), 0)
        + openQuotes.reduce((sum, q) => sum + (Number(q.total) || 0), 0),
      completedNotInvoiced: workOrders.filter((wo) => wo.status === 'completed').length,
      sentQuotes,
      acceptedQuotes,
      quoteConversion: pct(acceptedQuotes, sentQuotes),
    };
  }, [enquiries, quotations, workOrders]);

  const workExecution = useMemo(() => ({
    active: workOrders.filter((wo) => ['active', 'in_progress'].includes(wo.status)).length,
    completedNotInvoiced: workOrders.filter((wo) => wo.status === 'completed').length,
    invoicedUnpaid: workOrders.filter((wo) => ['invoiced', 'partially_paid'].includes(wo.status)).length,
    deployedPastEnd: workOrders.filter((wo) => {
      const end = asDate(wo.endDate);
      return end && end < now && !['closed', 'fully_paid'].includes(wo.status);
    }).length,
  }), [workOrders, now]);

  const stockValue = useMemo(() => balances.reduce((sum, bal) => {
    const item = itemById.get(bal.itemId);
    return sum + (Number(bal.qtyOnHand) || 0) * (Number(item?.avgCost) || 0);
  }, 0), [balances, itemById]);

  const inventoryExceptions = useMemo(() => {
    const zeroCost = items.filter((i) => i.active !== false && (Number(i.avgCost) || 0) <= 0).length;
    const zeroStock = balances.filter((b) => (Number(b.qtyOnHand) || 0) <= 0).length;
    const topStock = balances.map((b) => {
      const item = itemById.get(b.itemId);
      const value = (Number(b.qtyOnHand) || 0) * (Number(item?.avgCost) || 0);
      return { item: item?.name ?? b.itemId, storeId: b.storeId, qty: Number(b.qtyOnHand) || 0, value };
    }).sort((a, b) => b.value - a.value).slice(0, 5);
    return { zeroCost, zeroStock, topStock };
  }, [items, balances, itemById]);

  const availability = useMemo(() => {
    const activeAssets = assets.filter((a) => !a.pendingDelivery);
    const up = activeAssets.filter((a) => ['operational', 'idle'].includes(a.operationalStatus)).length;
    return { active: activeAssets.length, up, pct: activeAssets.length ? Math.round((up / activeAssets.length) * 100) : 0 };
  }, [assets]);

  const reportRows = useMemo(() => [
    { report: 'Cash & Receivables', kpi: 'Outstanding', value: Math.round(finance.outstanding) },
    { report: 'Cash & Receivables', kpi: 'Overdue', value: Math.round(finance.overdue) },
    { report: 'Payables', kpi: 'Pending supplier exposure', value: Math.round(finance.payablesPending) },
    { report: 'P&L', kpi: 'Monthly cash gap', value: Math.round(finance.cashGap) },
    { report: 'Inventory', kpi: 'Stock value', value: Math.round(stockValue) },
    { report: 'Procurement', kpi: 'Quote savings', value: Math.round(procurement.quoteSavings) },
  ], [finance, stockValue, procurement.quoteSavings]);

  const today = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Management Reports</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>Owner & CFO KPI pack</span>
            <span>·</span>
            <span className="num">{today}</span>
          </p>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={() => exportCsv('management-kpis', reportRows)}><Download /> Export KPIs</button>
          <Link className="btn btn-ghost" to={`${base}/profitability`}><TrendingUp /> Revenue vs Repair</Link>
          <Link className="btn btn-ghost" to={`${base}/uptime`}><Gauge /> Fleet Uptime</Link>
        </div>
      </div>

      <div className="card" style={{ padding: '16px 18px', marginBottom: 18, borderLeft: '3px solid var(--accent)' }}>
        <strong style={{ fontSize: 15 }}>Minimum viable owner/CFO pack is now on one screen.</strong>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
          Figures are operational management KPIs from live app records. CFO-grade financial statements still need FX rates, payroll allocation, depreciation, bank reconciliation, and cost-center hardening.
        </p>
      </div>

      <div className="metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <MetricCard label="Invoiced This Month" value={fm(finance.invoicedMonth)} sub={`${finance.collectionRate} collected overall`} icon={FileText} tone="info" />
        <MetricCard label="Cash Collected" value={fm(finance.collectedMonth)} sub="received this month" icon={Banknote} tone="pos" />
        <MetricCard label="Outstanding AR" value={fm(finance.outstanding)} sub={`${fm(finance.overdue)} overdue`} icon={CreditCard} tone={finance.overdue > 0 ? 'warn' : 'pos'} />
        <MetricCard label="Pending Payables" value={fm(finance.payablesPending)} sub="supplier chain exposure" icon={Banknote} tone={finance.payablesPending > 0 ? 'danger' : 'pos'} />
        <MetricCard label="Cash Gap" value={fm(finance.cashGap)} sub="month cash minus pending payables" icon={finance.cashGap >= 0 ? TrendingUp : TrendingDown} tone={finance.cashGap >= 0 ? 'pos' : 'danger'} />
        <MetricCard label="Fleet Availability" value={`${availability.pct}%`} sub={`${availability.up}/${availability.active} active fleet up`} icon={Truck} tone={availability.pct >= 70 ? 'pos' : 'warn'} />
        <MetricCard label="Pipeline / Active Work" value={fm(pipeline.value)} sub={`${pipeline.enquiries} enquiries · ${pipeline.workOrders} work orders`} icon={Briefcase} tone="accent" />
        <MetricCard label="Inventory Value" value={fm(stockValue)} sub={`${balances.length} stock balances`} icon={Boxes} tone="info" />
        <MetricCard label="Advances / Retention" value={fm(finance.advancesHeld + finance.retentionHeld)} sub={`${fm(finance.advancesHeld)} adv · ${fm(finance.retentionHeld)} ret`} icon={CreditCard} tone="warn" />
        <MetricCard label="Quote Conversion" value={pipeline.quoteConversion} sub={`${pipeline.acceptedQuotes}/${pipeline.sentQuotes} sent quotes accepted`} icon={TrendingUp} tone="accent" />
        <MetricCard label="Quote Savings" value={fm(procurement.quoteSavings)} sub={`${procurement.singleQuotePrs} single-quote PRs`} icon={Package} tone="pos" />
        <MetricCard label="Inventory Exceptions" value={`${inventoryExceptions.zeroCost + inventoryExceptions.zeroStock}`} sub={`${inventoryExceptions.zeroCost} no cost · ${inventoryExceptions.zeroStock} zero stock`} icon={AlertTriangle} tone={inventoryExceptions.zeroCost + inventoryExceptions.zeroStock > 0 ? 'warn' : 'pos'} />
      </div>

      <Section title="CFO Cash & Receivables" hint="ageing and collection risk" action={<Link className="btn btn-sm btn-ghost" to="/wli/crm/finance">Finance dashboard <ChevronRight size={12} /></Link>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="tbl">
            <div className="tbl-head" style={{ gridTemplateColumns: '1fr 1fr' }}><span>Age Bucket</span><span>Outstanding</span></div>
            {ageing.map((b) => (
              <div className="tbl-row" style={{ gridTemplateColumns: '1fr 1fr', cursor: 'default' }} key={b.label}>
                <div className="tc-id">{b.label}</div>
                <div className="tc-txt">{fm(b.amount)}</div>
              </div>
            ))}
          </div>
          <div className="tbl">
            <div className="tbl-head" style={{ gridTemplateColumns: '1.3fr 0.8fr 0.7fr' }}><span>Customer</span><span>Overdue</span><span>Oldest</span></div>
            {overdueCustomers.length === 0 ? <div className="tbl-empty">No overdue receivables.</div> : overdueCustomers.map((c) => (
              <div className="tbl-row" style={{ gridTemplateColumns: '1.3fr 0.8fr 0.7fr', cursor: 'default' }} key={c.customer}>
                <div className="tc-id">{c.customer}<span className="tc-desc">{c.count} invoice(s)</span></div>
                <div className="tc-txt" style={{ color: 'var(--danger)', fontWeight: 600 }}>{fm(c.amount)}</div>
                <div className="tc-txt">{c.oldest} d</div>
              </div>
            ))}
          </div>
          <div className="tbl" style={{ gridColumn: '1 / -1' }}>
            <div className="tbl-head" style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr' }}><span>Credit Breach</span><span>Outstanding</span><span>Limit</span><span>Over Limit</span></div>
            {creditBreaches.length === 0 ? <div className="tbl-empty">No customer credit-limit breaches.</div> : creditBreaches.map((c) => (
              <Link className="tbl-row" style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr', textDecoration: 'none' }} key={c.id} to={`/wli/crm/customers/${c.id}`}>
                <div className="tc-id">{c.customer}</div>
                <div className="tc-txt">{fm(c.outstanding)}</div>
                <div className="tc-txt">{fm(c.limit)}</div>
                <div className="tc-txt" style={{ color: 'var(--danger)', fontWeight: 600 }}>{fm(c.over)}</div>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Payables & Approval Liability" hint="who is holding money now" action={<Link className="btn btn-sm btn-ghost" to="/holding/approvals">Approval queue <ChevronRight size={12} /></Link>}>
        <div className="tbl">
          <div className="tbl-head" style={{ gridTemplateColumns: '1.3fr 0.6fr 1fr 0.8fr' }}><span>Stage</span><span>Count</span><span>Amount</span><span>Oldest</span></div>
          {payableStages.length === 0 ? <div className="tbl-empty">No purchase orders yet.</div> : payableStages.map((s) => (
            <div className="tbl-row" style={{ gridTemplateColumns: '1.3fr 0.6fr 1fr 0.8fr', cursor: 'default' }} key={s.status}>
              <div className="tc-id">{s.label}<span className="tc-desc">{statusText(s.status)}</span></div>
              <div className="tc-txt">{s.count}</div>
              <div className="tc-txt">{fm(s.amount)}</div>
              <div className="tc-txt">{s.oldest ? `${s.oldest} d` : '—'}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Management P&L by Site" hint="deployment revenue minus traceable PO cost">
        <div className="tbl">
          <div className="tbl-head" style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr 0.8fr' }}><span>Site</span><span>Revenue</span><span>Direct Cost</span><span>Contribution</span><span>Margin</span></div>
          {pnlBySite.map((s) => (
            <div className="tbl-row" style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr 0.8fr', cursor: 'default' }} key={s.id}>
              <div className="tc-id">{s.site}</div>
              <div className="tc-txt">{s.revenue ? fm(s.revenue) : '—'}</div>
              <div className="tc-txt">{s.cost ? fm(s.cost) : '—'}</div>
              <div className="tc-txt" style={{ color: s.margin >= 0 ? 'var(--positive)' : 'var(--danger)', fontWeight: 600 }}>{fm(s.margin)}</div>
              <div className="tc-txt">{pct(s.margin, s.revenue)}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Procurement Spend & Savings" hint="supplier exposure and quote discipline" action={<Link className="btn btn-sm btn-ghost" to="/wli/procurement/requests">PR register <ChevronRight size={12} /></Link>}>
        <div className="metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 14 }}>
          <MetricCard label="PO Spend" value={fm(procurement.totalPo)} sub="all recorded POs" icon={Package} tone="info" />
          <MetricCard label="Urgent Spend" value={fm(procurement.urgentSpend)} sub={pct(procurement.urgentSpend, procurement.totalPo)} icon={AlertTriangle} tone={procurement.urgentSpend > 0 ? 'warn' : 'pos'} />
          <MetricCard label="Direct PR Spend" value={fm(procurement.directSpend)} sub={`${fm(procurement.ticketLinkedSpend)} ticket-linked`} icon={FileText} tone="accent" />
          <MetricCard label="Quote Savings" value={fm(procurement.quoteSavings)} sub="highest quote vs selected" icon={TrendingDown} tone="pos" />
        </div>
        <div className="tbl">
          <div className="tbl-head" style={{ gridTemplateColumns: '1.5fr 0.7fr 1fr 1fr' }}><span>Supplier</span><span>POs</span><span>Total Spend</span><span>Open Exposure</span></div>
          {procurement.supplierRows.length === 0 ? <div className="tbl-empty">No supplier spend yet.</div> : procurement.supplierRows.map((s) => (
            <div className="tbl-row" style={{ gridTemplateColumns: '1.5fr 0.7fr 1fr 1fr', cursor: 'default' }} key={s.supplier}>
              <div className="tc-id"><Store size={13} style={{ color: 'var(--text-muted)', marginRight: 6 }} />{s.supplier}</div>
              <div className="tc-txt">{s.count}</div>
              <div className="tc-txt">{fm(s.amount)}</div>
              <div className="tc-txt">{s.open ? fm(s.open) : '—'}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Asset Profitability & Utilisation" hint="machines earning or bleeding">
        <div className="tbl">
          <div className="tbl-head" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr' }}><span>Asset</span><span>Site</span><span>Revenue</span><span>Repair</span><span>Net</span></div>
          {assetProfit.length === 0 ? <div className="tbl-empty">No deployment or repair cost data yet.</div> : assetProfit.map((a) => (
            <div className="tbl-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', cursor: 'default' }} key={a.id}>
              <div className="tc-id">{a.asset}</div>
              <div className="tc-txt">{a.site}</div>
              <div className="tc-txt">{a.revenue ? fm(a.revenue) : '—'}</div>
              <div className="tc-txt">{a.repair ? fm(a.repair) : '—'}</div>
              <div className="tc-txt" style={{ color: a.net >= 0 ? 'var(--positive)' : 'var(--danger)', fontWeight: 600 }}>{fm(a.net)}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Workflow SLA & Bottlenecks" hint="oldest items needing action">
        <div className="tbl">
          <div className="tbl-head" style={{ gridTemplateColumns: '0.7fr 1fr 1fr 1fr 0.6fr 0.8fr' }}><span>Type</span><span>ID</span><span>Status</span><span>Owner</span><span>Age</span><span>Amount</span></div>
          {bottlenecks.length === 0 ? <div className="tbl-empty">No open workflow bottlenecks.</div> : bottlenecks.map((b) => (
            <Link className="tbl-row" style={{ gridTemplateColumns: '0.7fr 1fr 1fr 1fr 0.6fr 0.8fr', textDecoration: 'none' }} key={`${b.kind}-${b.id}`} to={b.to}>
              <div className="tc-txt">{b.kind}</div>
              <div className="tc-id">{b.id}</div>
              <div><span className={`badge ${b.age > 7 ? 'b-danger' : b.age > 3 ? 'b-warn' : 'b-info'}`}><Clock size={10} /> {statusText(b.status)}</span></div>
              <div className="tc-txt">{b.owner}</div>
              <div className="tc-txt">{b.age} d</div>
              <div className="tc-txt">{b.amount ? fm(b.amount) : '—'}</div>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Work Order Execution & Billing" hint="revenue leakage before collection">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <MetricCard label="Active / In Progress" value={String(workExecution.active)} sub="jobs running now" icon={Briefcase} tone="info" />
          <MetricCard label="Completed Not Invoiced" value={String(workExecution.completedNotInvoiced)} sub="billing leakage" icon={AlertTriangle} tone={workExecution.completedNotInvoiced > 0 ? 'warn' : 'pos'} />
          <MetricCard label="Invoiced Unpaid" value={String(workExecution.invoicedUnpaid)} sub="customer collection queue" icon={CreditCard} tone={workExecution.invoicedUnpaid > 0 ? 'warn' : 'pos'} />
          <MetricCard label="Past End Date" value={String(workExecution.deployedPastEnd)} sub="contract/date exception" icon={Clock} tone={workExecution.deployedPastEnd > 0 ? 'danger' : 'pos'} />
        </div>
      </Section>

      <Section title="Inventory Valuation & Stock Control" hint="cash on shelves">
        <div className="tbl">
          <div className="tbl-head" style={{ gridTemplateColumns: '1.6fr 0.8fr 0.8fr 1fr' }}><span>Top Stock Value</span><span>Store</span><span>Qty</span><span>Value</span></div>
          {inventoryExceptions.topStock.length === 0 ? <div className="tbl-empty">No stock balances yet.</div> : inventoryExceptions.topStock.map((s) => (
            <div className="tbl-row" style={{ gridTemplateColumns: '1.6fr 0.8fr 0.8fr 1fr', cursor: 'default' }} key={`${s.item}-${s.storeId}`}>
              <div className="tc-id">{s.item}</div>
              <div className="tc-txt">{s.storeId}</div>
              <div className="tc-txt">{s.qty}</div>
              <div className="tc-txt">{fm(s.value)}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Exception Watchlist" hint="what management should ask about today">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="tc-id" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldAlert size={15} style={{ color: 'var(--danger)' }} /> Overdue AR</div>
            <p className="text-xs text-text-muted" style={{ marginTop: 6 }}>{finance.overdue > 0 ? `${fm(finance.overdue)} overdue across ${overdueCustomers.length} customer(s).` : 'No overdue customer balances recorded.'}</p>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div className="tc-id" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={15} style={{ color: 'var(--warning)' }} /> Billing Leakage</div>
            <p className="text-xs text-text-muted" style={{ marginTop: 6 }}>{pipeline.completedNotInvoiced} completed work order(s) not yet invoiced. {creditBreaches.length} customer(s) over credit limit.</p>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div className="tc-id" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={15} style={{ color: 'var(--info)' }} /> Data Quality</div>
            <p className="text-xs text-text-muted" style={{ marginTop: 6 }}>CFO-grade reports still need FX rates, cost centers, bank reconciliation, and payroll allocation.</p>
          </div>
        </div>
      </Section>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 14 }}>
        Reports are live operational KPIs. They are suitable for management control; statutory accounting still requires finance reconciliation and source-document review.
      </p>
    </div>
  );
}
