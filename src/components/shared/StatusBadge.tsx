import { Badge } from '../ui/Badge';

const statusColorMap: Record<string, 'blue' | 'green' | 'teal' | 'amber' | 'red' | 'neutral' | 'purple'> = {
  open: 'blue',
  mechanic_review: 'amber',
  supervisor_review: 'amber',
  gm_approved: 'green',
  approved: 'green',
  rejected: 'red',
  closed: 'neutral',
  pending: 'amber',
  active: 'teal',
  inactive: 'neutral',
  error: 'red',
  in_progress: 'blue',
  review: 'amber',
  delivered: 'teal',
};

const statusLabelMap: Record<string, string> = {
  open: 'Open',
  mechanic_review: 'Mechanic Review',
  supervisor_review: 'Supervisor Review',
  gm_approved: 'GM Approved',
  approved: 'Approved',
  rejected: 'Rejected',
  closed: 'Closed',
  pending: 'Pending',
  active: 'Active',
  inactive: 'Inactive',
  error: 'Error',
  in_progress: 'In Progress',
  review: 'In Review',
  delivered: 'Delivered',
};

export function StatusBadge({ status }: { status: string }) {
  const color = statusColorMap[status] || 'neutral';
  const label = statusLabelMap[status] || status;
  return <Badge color={color}>{label}</Badge>;
}
