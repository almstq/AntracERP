import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
}

export function Card({ children, className = '', header }: CardProps) {
  return (
    <div className={`rounded-lg border border-border bg-bg-panel ${className}`}>
      {header && <div className="flex items-center justify-between px-4 py-3 border-b border-border-soft">{header}</div>}
      <div className="p-4">{children}</div>
    </div>
  );
}
