/**
 * CRM & Sales module entity types.
 * Revenue engine: Enquiry → Quotation → Work Order → Invoice → Payment.
 */
import type { BaseEntity } from './common';

// ─── Customer ────────────────────────────────────────────────────────────────

export type CreditTerms = 'cod' | 'net_15' | 'net_30' | 'net_60';

export interface Customer extends BaseEntity {
  displayId: string;         // CUST-YYYYMM-###
  orgId: string;
  sbuId: string;
  name: string;
  tradeName?: string;
  contactPerson: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  gstNumber?: string;        // customer's own GST reg number (if any)
  creditTerms: CreditTerms;
  creditLimit: number;       // MVR
  currency: 'MVR' | 'USD';
  active: boolean;
  // rollups (updated on WO close / payment)
  lifetimeRevenue: number;
  outstandingBalance: number;
  activeWorkOrders: number;
}

// ─── Rate Sheet ──────────────────────────────────────────────────────────────

export interface RateSheetItem {
  assetType: string;   // e.g. "Hauler Dump Truck"
  ratePerHour?: number;
  ratePerDay?: number;
  currency: 'MVR' | 'USD';
}

export interface RateSheet extends BaseEntity {
  orgId: string;
  sbuId: string;
  version: string;
  effectiveDate: Date;
  items: RateSheetItem[];
}

// ─── Enquiry ─────────────────────────────────────────────────────────────────

export type EnquiryStatus =
  | 'logged'
  | 'availability_checked'
  | 'gm_approved'
  | 'quotation_drafted'
  | 'quotation_approved'
  | 'quotation_sent'
  | 'quote_accepted'
  | 'quote_declined'
  | 'follow_up'
  | 'closed';

export interface EnquiryAssetRequest {
  assetType: string;
  quantity: number;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  // filled by ops during availability check
  proposedAssetIds?: string[];
}

export interface Enquiry extends BaseEntity {
  displayId: string;         // ENQ-YYYYMM-###
  orgId: string;
  sbuId: string;
  customerId: string;
  customerName: string;      // denormalized
  status: EnquiryStatus;
  // Stage 1 — log (Sales)
  projectName: string;
  projectLocation?: string;
  mobilisationDate?: Date;
  demobilisationDate?: Date;
  assetRequests: EnquiryAssetRequest[];
  notes?: string;
  raisedById: string;
  // Stage 2 — availability check (Ops)
  availabilityNotes?: string;
  opsStaffId?: string;
  // Stage 3 — GM approval
  gmNotes?: string;
  gmApprovedAt?: Date;
  // links
  quotationId?: string;
  workOrderId?: string;
}

// ─── Quotation ───────────────────────────────────────────────────────────────

export type QuotationStatus =
  | 'draft'
  | 'gm_approved'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'expired';

export interface QuotationLineItem {
  assetType: string;
  assetId?: string;          // soft-reserved asset
  quantity: number;
  unit: 'hour' | 'day' | 'month' | 'lump_sum';
  unitRate: number;
  currency: 'MVR' | 'USD';
  description?: string;
}

export interface Quotation extends BaseEntity {
  displayId: string;         // QTN-YYYYMM-###
  orgId: string;
  sbuId: string;
  enquiryId: string;
  customerId: string;
  customerName: string;
  status: QuotationStatus;
  validityDays: number;
  mobilisationFee?: number;
  demobilisationFee?: number;
  advancePercent?: number;    // e.g. 30 → 30% advance
  retentionPercent?: number;  // e.g. 10 → 10% retention
  currency: 'MVR' | 'USD';
  lineItems: QuotationLineItem[];
  // computed (stored for doc generation)
  subtotal: number;
  gst: number;
  total: number;
  // sign-off
  draftedById: string;
  gmSignedAt?: Date;
  sentAt?: Date;
  respondedAt?: Date;
  workOrderId?: string;
}

// ─── Work Order ───────────────────────────────────────────────────────────────

export type WorkOrderStatus =
  | 'active'
  | 'in_progress'
  | 'completed'
  | 'invoiced'
  | 'partially_paid'
  | 'fully_paid'
  | 'closed';

export interface WorkOrderAsset {
  assetId: string;
  assetCode: string;
  assetLabel: string;
  startDate: Date;
  endDate?: Date;
  actualHours?: number;
  actualDays?: number;
}

export interface WorkOrder extends BaseEntity {
  displayId: string;         // WO-YYYYMM-###
  orgId: string;
  sbuId: string;
  enquiryId: string;
  quotationId: string;
  customerId: string;
  customerName: string;
  status: WorkOrderStatus;
  contractValue: number;
  advancePaid: number;
  retentionHeld: number;
  currency: 'MVR' | 'USD';
  assets: WorkOrderAsset[];
  startDate: Date;
  endDate?: Date;
  completedAt?: Date;
  notes?: string;
  invoiceIds: string[];
  raisedById: string;
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'fully_paid' | 'overdue' | 'void';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitRate: number;
  amount: number;
}

export interface Invoice extends BaseEntity {
  displayId: string;         // INV-YYYYMM-###
  orgId: string;
  sbuId: string;
  workOrderId: string;
  customerId: string;
  customerName: string;
  status: InvoiceStatus;
  dueDate: Date;
  currency: 'MVR' | 'USD';
  lineItems: InvoiceLineItem[];
  subtotal: number;
  lessAdvance: number;
  lessRetention: number;
  gst: number;
  total: number;
  amountPaid: number;
  balance: number;
  issuedById: string;
  sentAt?: Date;
  paymentIds: string[];
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export type PaymentMethod = 'bank_transfer' | 'cheque' | 'cash' | 'other';

export interface Payment extends BaseEntity {
  displayId: string;         // PMT-YYYYMM-###
  orgId: string;
  sbuId: string;
  invoiceId: string;
  workOrderId: string;
  customerId: string;
  amount: number;
  currency: 'MVR' | 'USD';
  method: PaymentMethod;
  reference?: string;
  receivedAt: Date;
  recordedById: string;
  notes?: string;
}
