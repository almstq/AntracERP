export type TicketStatus =
  | 'open'
  | 'mechanic_review'
  | 'supervisor_review'
  | 'gm_approved'
  | 'rejected'
  | 'closed';

export type TicketSeverity = 'low' | 'medium' | 'high' | 'critical';

export type TicketType = 'issue' | 'service' | 'maintenance';

export interface TicketItem {
  description: string;
  quantity: number;
  type: 'material' | 'service';
  estimatedUnitPrice?: number;
  notes?: string;
}

export interface TicketTimelineEvent {
  from: TicketStatus;
  to: TicketStatus;
  actorId: string;
  actorRole: string;
  notes?: string;
  timestamp: Date;
}

export interface TicketDocument {
  name: string;
  url: string;
  type: 'photo' | 'invoice' | 'receipt' | 'other';
  uploadedAt: Date;
}

export interface TicketAIRecommendation {
  diagnosis: string;
  urgency: string;
  steps: string[];
  confirmed: boolean;
}

export interface Ticket {
  id: string;
  displayId: string;
  title: string;
  description: string;
  symptoms?: string;
  type: TicketType;
  severity: TicketSeverity;
  orgId: string;
  sbuId: string;
  assetId?: string;
  siteId: string;
  raisedById: string;
  status: TicketStatus;
  items: TicketItem[];
  reviewedById?: string;
  approvedById?: string;
  aiRecommendation?: TicketAIRecommendation;
  documents: TicketDocument[];
  timeline: TicketTimelineEvent[];
  createdAt: Date;
  updatedAt: Date;
}
