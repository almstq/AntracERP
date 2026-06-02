import { type InputHTMLAttributes, forwardRef } from 'react';

const base = 'w-full text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary';

interface Props extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, Props>(({ className, ...props }, ref) => (
  <input ref={ref} className={className ? `${base} ${className}` : base} {...props} />
));
Input.displayName = 'Input';
