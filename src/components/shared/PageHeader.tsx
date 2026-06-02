import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  sticky?: boolean;
}

export function PageHeader({ title, subtitle, children, sticky = false }: Props) {
  return (
    <div className={`flex items-center justify-between px-8 md:px-14 lg:px-16 py-5 ${sticky ? 'border-b border-border bg-bg-panel sticky top-0 z-10' : ''}`}>
      <div>
        <h1 className="text-lg font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
