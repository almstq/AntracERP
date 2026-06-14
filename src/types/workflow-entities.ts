/**
 * Entity interfaces for the WLI workflows (Phase 2 data model).
 * Status string-unions are kept in sync with the workflow definitions
 * in src/lib/workflow/definitions/.
 */

// ─── Shared ──────────────────────────────────────────────────────────────

export type Urgency = 'critical' | 'urgent' | 'routine';

export interface Money {
  amount: number;
  currency: 'MVR' | 'USD';
}

export interface UploadedDoc {
  name: string;
  url: string;
  kind: 'photo' | 'invoice' | 'quote' | 'po' | 'rfq' | 'receipt' | 'other';
  uploadedById: string;
  uploadedAt: Date;
}

// ─── Issue Ticket ────────────────────────────────────────────────────────

export type TicketStatus =
  | 'draft'
  | 'submitted'
  | 'diagnosed'
  | 'supervisor_checked'
  | 'gm_approved'
  | 'awaiting_delivery'
  | 'items_delivered'
  | 'resolved'
  | 'persists'
  | 'closed'
  | 'rejected';

export type RequiredItemKind = 'parts' | 'consumables' | 'tools' | 'other';

export interface RequiredMaterial {
  description: string;
  brand?: string;
  uom: string;
  quantity: number;
  category: RequiredItemKind;
  notes?: string;
}

export interface RequiredService {
  description: string;
  specialistType: 'mechanical' | 'electrical' | 'hydraulic' | 'fabrication' | 'other';
  estimatedDuration?: string;
  notes?: string;
}

export interface Ticket {
  id: string;
  displayId: string; // TKT-YYYYMM-###
  orgId: string;
  sbuId: string;
  assetId?: string;
  siteId: string;
  location?: string;
  raisedById: string;
  raisedByName?: string;   // display name stored at creation time
  raisedByRole?: string;   // role at creation time; drives workflow branching (supervisor vs operator)
  /** Actual date the issue was reported — may be backdated. Distinct from createdAt (system write time). */
  reportedAt?: Date;
  status: TicketStatus;
  urgency: Urgency;
  // denormalized asset display (resolved at creation)
  assetCode?: string;
  assetLabel?: string;
  // Stage 1 — issue
  description: string;
  operatorRecommendation?: string;
  // Stage 2 — diagnosis
  diagnosis?: string;
  revisedRecommendation?: string;
  materialRequired: boolean;
  serviceRequired: boolean;
  materials: RequiredMaterial[];
  services: RequiredService[];
  // Stage 3/4 — sign-offs
  supervisorNotes?: string;
  gmDecision?: 'approved' | 'rejected' | 'info_requested';
  // Stage 14 — resolution
  resolutionNotes?: string;
  parentTicketId?: string; // set if spawned from a "persists" ticket
  // links
  purchaseRequestId?: string;
  documents: UploadedDoc[];
  createdAt: Date;
  updatedAt: Date;

  // Curated Industry Fields:
  serialNumber?: string;
  meterReading?: number;
  workCategory?: string;
  resolutionChecklist?: {
    clean: boolean;
    photos: boolean;
    tools: boolean;
    safety: boolean;
  };
  signatures?: {
    operator?: { name: string; date: Date | string };
    mechanic?: { name: string; date: Date | string };
    supervisor?: { name: string; date: Date | string };
    gm?: { name: string; date: Date | string };
  };
  breakdownAt?: Date | string;
  repairedAt?: Date | string;
  downtimeHours?: number;
  partsStockIssued?: boolean;
}

// ─── Purchase Request ────────────────────────────────────────────────────

export type PRStatus =
  | 'on_hold'
  | 'approved'
  | 'pr_accepted'
  | 'rfq_sent'
  | 'quotes_under_review'
  | 'gm_quote_approved'
  | 'po_raised'
  | 'closed'
  | 'rejected';

export interface PRLineItem {
  ref: string; // links back to ticket material/service
  description: string;
  uom: string;
  quantity: number;
  kind: 'material' | 'service';
  /** Suppliers assigned for RFQ (Stage 6). */
  assignedSupplierIds: string[];
  /** GM-selected supplier + price (Stage 7). */
  selectedSupplierId?: string;
  selectedUnitPrice?: number;
  estimatedUnitPrice?: number;
}

export interface PRQuote {
  id: string;
  supplierId: string;
  supplierName: string;
  total: number;
  currency: 'MVR' | 'USD';
  receivedAt: Date;
  documentUrl?: string;
  linePrices: { ref: string; unitPrice: number }[];
}

export interface PurchaseRequest {
  id: string;
  displayId: string; // PR-YYYYMM-###
  /** 'ticket' = spawned from a mechanic diagnosis; 'direct' = raised standalone. */
  origin?: 'ticket' | 'direct';
  /** Set for ticket-origin PRs; absent for direct requests. */
  ticketId?: string;
  // Direct-request fields (mandatory on the raise form):
  title?: string;          // short subject of the request
  reason?: string;         // justification — why these items/services are needed
  raisedById?: string;     // who raised it
  orgId: string;
  sbuId: string;
  siteId: string;
  assetId?: string;
  status: PRStatus;
  urgency: Urgency;
  lineItems: PRLineItem[];
  quotes: PRQuote[];
  purchaseOrderIds: string[];
  createdAt: Date;
  updatedAt: Date;

  // Curated Industry Fields:
  costCenter?: string;
  requestedDeliveryDate?: Date;
  signatures?: {
    requester?: { name: string; date: Date | string };
    verifier?: { name: string; date: Date | string };
    gm?: { name: string; date: Date | string };
  };
  preferredSupplierId?: string;
  preferredSupplierName?: string;
  stockChecked?: boolean;
  stockCheckedBy?: string;
}

// ─── Purchase Order ──────────────────────────────────────────────────────

export type POStatus =
  | 'raised'
  | 'supplier_confirmed'
  | 'items_collected'
  | 'payment_request_sent'
  | 'antrac_finance_accepted'
  | 'cfo_verified'
  | 'director_approved'
  | 'payment_completed'
  | 'wli_finance_confirmed'
  | 'po_closed';

export interface POLineItem {
  description: string;
  uom: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  displayId: string; // PO-YYYYMM-###
  purchaseRequestId: string;
  ticketId: string;
  orgId: string;
  sbuId: string;
  supplierId: string;
  supplierName: string;
  deliveryAddress: string;
  paymentTerms?: string;
  status: POStatus;
  lineItems: POLineItem[];
  total: number;
  currency: 'MVR' | 'USD';
  documents: UploadedDoc[]; // PO PDF, tax invoice, payment receipt
  createdAt: Date;
  updatedAt: Date;

  // Curated Compliance Fields:
  buyerTin?: string;
  buyerAddress?: string;
  supplierTin?: string;
  supplierAddress?: string;
  supplierContact?: string;
  deliveryDeadline?: Date;
  deliveryMethod?: string;
  termsAndConditions?: string;
  signatures?: {
    prepared?: { name: string; date: Date | string };
    verified?: { name: string; date: Date | string };
    approved?: { name: string; date: Date | string };
  };
  incoterms?: string;
  delayPenaltyTerms?: string;
  matchedStatus?: 'pending' | 'matched' | 'variance_flagged';
  grnId?: string;
  supplierInvoiceId?: string;
}

// ─── Supplier ────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  categories: string[];
  active: boolean;
  createdAt: Date;
  tin?: string;
  address?: string;
}

// ─── Fuel / Water Request (WLI ↔ MPL) ────────────────────────────────────

export type FuelRequestStatus =
  | 'draft'
  | 'submitted'
  | 'inventory_checked'
  | 'gm_approved'
  | 'mpl_accepted'
  | 'director_approved'
  | 'ready_for_collection'
  | 'collected'
  | 'closed'
  | 'rejected';

export interface FuelRequest {
  id: string;
  displayId: string; // FUEL-YYYYMM-###
  orgId: string;
  sbuId: string;
  requestType: 'fuel' | 'water' | 'both';
  fuelType?: 'diesel' | 'petrol' | 'other';
  quantity: number;
  uom: 'litres' | 'drums' | 'tonnes';
  siteId: string;
  assetId?: string;
  urgency: Urgency;
  notes?: string;
  raisedById: string;
  status: FuelRequestStatus;
  // Stage 2 — inventory check
  wliBalanceAtCheck?: number;
  availableQty?: number;
  inventoryNotes?: string;
  // Stage 6 — collection notice
  collectionPoint?: string;
  validUntil?: Date;
  // Stage 7 — collection
  quantityCollected?: number;
  collectedAt?: Date;
  documents: UploadedDoc[];
  createdAt: Date;
  updatedAt: Date;
}

/** WLI inventory balance for fuel/water (auto-deducted on fuel request closure). */
export interface InventoryBalance {
  id: string; // e.g. 'diesel', 'water'
  item: string;
  currentQty: number;
  uom: string;
  lastUpdated: Date;
}
