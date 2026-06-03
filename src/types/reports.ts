/**
 * Deployment revenue — money WLI earns renting a machine / crew to a project.
 * Captured as lump figures (from Finance/CFO) per site & period so the
 * profitability report can compare it against repair spend, without requiring
 * the full CRM contract chain to be back-entered.
 */
export interface DeploymentRevenue {
  id: string;
  sbuId: string;            // 'sbu-wli'
  siteId: string;           // project the revenue came from
  period: string;           // 'YYYY-MM' (month the revenue relates to)
  amount: number;
  currency: 'MVR' | 'USD';
  assetId?: string;         // optional — specific machine, if known
  assetCode?: string;       // denormalised for display
  contractRef?: string;     // optional client / contract reference
  note?: string;
  recordedById: string;
  createdAt: Date;
  updatedAt: Date;
}

/** How a deployment is billed. */
export type RateBasis = 'monthly' | 'daily' | 'lump';

/**
 * A machine on hire to a project. Recording one is mandatory to mark a machine
 * deployed — it pins the agreed revenue terms to the asset so the profit report
 * has a real, enforced revenue figure per machine and per site.
 */
export interface Deployment {
  id: string;
  displayId?: string;        // DEP-YYYYMM-###
  sbuId: string;             // 'sbu-wli'
  assetId: string;
  assetCode: string;
  assetLabel?: string;
  siteId: string;
  customerName?: string;
  agreementRef?: string;
  rateBasis: RateBasis;
  rate: number;              // per-month / per-day amount, or the lump total
  currency: 'MVR' | 'USD';
  startDate: Date;           // backdatable
  endDate?: Date | null;     // null/absent = still on hire
  status: 'active' | 'ended';
  note?: string;
  recordedById: string;
  createdAt: Date;
  updatedAt: Date;
}

