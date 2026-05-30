import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">{label}</label>}
      <input
        id={inputId}
        className={`w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue/50 focus:border-blue transition-all ${error ? 'border-red focus:ring-red/50' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red">{error}</span>}
      {helperText && !error && <span className="text-xs text-text-muted">{helperText}</span>}
    </div>
  );
}
