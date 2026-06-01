import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
}

export function Card({ children, className = '', header }: CardProps) {
  return (
    <div className={`rounded-xl border border-border bg-bg-card shadow-card ${className}`}>
      {header && <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft">{header}</div>}
      <div className="p-6">{children}</div>
    </div>
  );
}
