/** Fleet / Vessel / Equipment register entry. A ticket is always about one asset. */
export type AssetClass = 'vehicle' | 'vessel' | 'equipment';

export type AssetOperationalStatus = 'operational' | 'down' | 'maintenance' | 'idle';

/** Commercial / rental status — set by the CRM/sales flow. */
export type AssetCommercialStatus = 'available' | 'soft_reserved' | 'deployed';

export interface Asset {
  id: string;
  code: string;        // e.g. WL-HV-0002
  make: string;        // e.g. VOLVO
  model: string;       // e.g. A40G
  type: string;        // e.g. Hauler Dump Truck
  assetClass: AssetClass;
  orgId: string;
  sbuId: string;
  currentSiteId: string; // current deployment location
  operationalStatus: AssetOperationalStatus;
  commercialStatus: AssetCommercialStatus;  // defaults to 'available' on create
  createdAt?: Date;
}

/** Display label, e.g. "WL-HV-0002 — VOLVO A40G (Hauler Dump Truck)". */
export function assetLabel(a: Pick<Asset, 'code' | 'make' | 'model' | 'type'>): string {
  return `${a.code} — ${a.make} ${a.model} (${a.type})`;
}
