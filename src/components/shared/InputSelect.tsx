import { type SelectHTMLAttributes, forwardRef } from 'react';

const base = 'w-full text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {}

export const InputSelect = forwardRef<HTMLSelectElement, Props>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={className ? `${base} ${className}` : base} {...props}>
    {children}
  </select>
));
InputSelect.displayName = 'InputSelect';
