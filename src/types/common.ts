export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type StatusBadgeVariant =
  | 'open' | 'in_progress' | 'review' | 'approved' | 'rejected'
  | 'closed' | 'pending' | 'active' | 'inactive' | 'error';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
