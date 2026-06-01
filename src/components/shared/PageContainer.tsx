import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Standard page wrapper — generous, consistent breathing room on all sides,
 * centered with a comfortable max width, and a roomy vertical rhythm between
 * sections. Every page should wrap its content in this so spacing is uniform.
 */
export function PageContainer({ children, className = '' }: Props) {
  return (
    <div className={`px-8 py-12 md:px-14 lg:px-16 max-w-6xl mx-auto space-y-10 ${className}`}>
      {children}
    </div>
  );
}
