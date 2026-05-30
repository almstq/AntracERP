import React from 'react';

type BadgeColor = 'blue' | 'green' | 'teal' | 'amber' | 'red' | 'neutral' | 'purple';

const colorClasses: Record<BadgeColor, string> = {
  blue: 'bg-blue/10 text-blue border-blue/20',
  green: 'bg-green/10 text-green border-green/20',
  teal: 'bg-teal/10 text-teal border-teal/20',
  amber: 'bg-amber/10 text-amber border-amber/20',
  red: 'bg-red/10 text-red border-red/20',
  neutral: 'bg-neutral/10 text-neutral border-neutral/20',
  purple: 'bg-purple/10 text-purple border-purple/20',
};

interface BadgeProps {
  color?: BadgeColor;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ color = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  );
}
