export interface MockUser {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  orgId: string;
  siteIds: string[];
}

export interface MockSite {
  id: string;
  name: string;
  type: string;
}

export interface MockTicket {
  id: string;
  displayId: string;
  title: string;
  description: string;
  type: 'issue' | 'service' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: MockTicketStatus;
  siteId: string;
  assetId?: string;
  raisedById: string;
  items: MockTicketItem[];
  createdAt: string;
  updatedAt: string;
}

export type MockTicketStatus =
  | 'open'
  | 'mechanic_review'
  | 'supervisor_review'
  | 'gm_approved'
  | 'rejected'
  | 'closed';

export interface MockTicketItem {
  description: string;
  quantity: number;
  type: 'part' | 'labor' | 'service';
}

export interface MockTimelineEntry {
  from: MockTicketStatus;
  to: MockTicketStatus;
  actorId: string;
  notes: string;
  timestamp: string;
}

export interface MockFuelDispatch {
  id: string;
  type: 'fuel_dispatch';
  assetTag: string;
  assetType: string;
  siteId: string;
  siteName: string;
  fuelType: 'diesel' | 'petrol';
  requestedLiters: number;
  dispensedLiters: number;
  status: 'requested' | 'approved' | 'dispensed' | 'rejected';
  requestedBy: string;
  approvedBy?: string;
  dispatchedBy?: string;
  createdAt: string;
  completedAt?: string;
  cost: number;
  notes?: string;
}

export interface MockFuelTank {
  id: string;
  name: string;
  fuelType: 'diesel' | 'petrol';
  capacity: number;
  current: number;
  siteId: string;
}

export interface MockInterSBUTransfer {
  id: string;
  fromSBU: string;
  toSBU: string;
  assetId: string;
  assetName: string;
  reason: string;
  status: 'requested' | 'approved' | 'in_transit' | 'completed' | 'rejected';
  requestedBy: string;
  approvedBy?: string;
  fromSite: string;
  toSite: string;
  createdAt: string;
  completedAt?: string;
}