import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  icon?: LucideIcon;
  hint?: string;          // small muted subtitle
  action?: ReactNode;     // right-aligned slot (e.g. a "View all" link)
}

/**
 * Consistent zone heading for dashboards/pages — gives the eye a clear anchor
 * and visual rhythm between sections. Use above a group of cards.
 */
export function SectionHeading({ title, icon: Icon, hint, action }: Props) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon size={16} className="text-text-muted shrink-0" />}
        <h2 className="text-sm font-semibold tracking-tight text-text-primary truncate">{title}</h2>
        {hint && <span className="text-xs text-text-muted truncate">· {hint}</span>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
