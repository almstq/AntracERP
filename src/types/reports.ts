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
