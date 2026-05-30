import { Badge } from '../ui/Badge';

const priorityColorMap: Record<string, 'blue' | 'amber' | 'red' | 'neutral'> = {
  low: 'neutral',
  medium: 'blue',
  high: 'amber',
  critical: 'red',
};

const priorityLabelMap: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export function PriorityBadge({ priority }: { priority: string }) {
  const color = priorityColorMap[priority] || 'neutral';
  const label = priorityLabelMap[priority] || priority;
  return <Badge color={color}>{label}</Badge>;
}
