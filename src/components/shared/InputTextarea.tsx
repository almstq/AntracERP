import { type TextareaHTMLAttributes, forwardRef } from 'react';

const base = 'w-full text-xs p-2 rounded-lg bg-bg-surface border border-border text-text-primary';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const InputTextarea = forwardRef<HTMLTextAreaElement, Props>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={className ? `${base} ${className}` : base} {...props} />
));
InputTextarea.displayName = 'InputTextarea';
