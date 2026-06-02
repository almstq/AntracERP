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
  /** followme.mv vessel tracking ID (sea vessels only) — live AIS position. */
  trackingId?: string;
  createdAt?: Date;

  // ── Extended registry fields (optional; from the WL Ops registry ingestion) ──
  regNo?: string;
  chassisNo?: string;
  engineNo?: string;
  /** Physical condition grading from source data. */
  condition?: string;           // "Good" | "Minor Issue" | "Issue" | "Unknown"
  /** Whether the asset is eligible for external rental. */
  rentalEligible?: boolean;
  /** Current known fault/issue narrative (e.g. grounded-machine notes). */
  knownIssue?: string;
  /** Full issue history narrative (multi-fault log). */
  issueHistory?: string;
  /** Project the asset is deployed to, if any (free text from the registry). */
  assignedProject?: string;
  /** Last-maintenance date as raw text (source formats are mixed). */
  lastMaintenanceText?: string;
  /** Next maintenance due (raw text). */
  nextMaintDue?: string;
  /** Original source ID (e.g. WL-HV-0007) for provenance / dedupe. */
  sourceId?: string;

  // ── Marine-vessel–specific fields ──
  hullImo?: string;
  engine1Serial?: string;
  engine2Serial?: string;
  capacityNotes?: string;
  vesselPermitNo?: string;
  vesselPermitExpiry?: string;  // raw text
  insuranceExpiry?: string;     // raw text
  lastInspection?: string;      // raw text
  drydockStart?: string;        // raw text
  drydockEstEnd?: string;       // raw text
}

/** Live tracking page URL for a followme.mv vessel ID. */
export function followMeUrl(trackingId: string): string {
  return `https://m.followme.mv/public/?id=${encodeURIComponent(trackingId.trim())}`;
}

/** The three main asset categories, in display order. */
export const ASSET_CLASSES: AssetClass[] = ['vessel', 'vehicle', 'equipment'];

export const ASSET_CLASS_LABEL: Record<AssetClass, string> = {
  vessel: 'Vessel',
  vehicle: 'Vehicle',
  equipment: 'Support Equipment',
};

export const ASSET_CLASS_PLURAL: Record<AssetClass, string> = {
  vessel: 'Vessels',
  vehicle: 'Vehicles',
  equipment: 'Support Equipment',
};

/** Display label, e.g. "WL-HV-0002 — VOLVO A40G (Hauler Dump Truck)". */
export function assetLabel(a: Pick<Asset, 'code' | 'make' | 'model' | 'type'>): string {
  return `${a.code} — ${a.make} ${a.model} (${a.type})`;
}
