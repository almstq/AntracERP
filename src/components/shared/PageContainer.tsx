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
    <div className={`px-5 py-6 md:px-8 md:py-8 lg:px-10 max-w-6xl mx-auto space-y-7 ${className}`}>
      {children}
    </div>
  );
}
