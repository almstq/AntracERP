import type { ReactNode } from 'react';
import { useState } from 'react';
import { OrgContext } from './OrgContext.context';
import type { Org } from '../../types/org';

export function OrgProvider({ children }: { children: ReactNode }) {
  const [currentOrg, setCurrentOrg] = useState<Org | null>({
    id: 'antrac-holding',
    name: 'Antrac Holding',
    type: 'holding',
    status: 'active',
    createdAt: new Date(),
  });

  return (
    <OrgContext.Provider value={{ currentOrg, setCurrentOrg }}>
      {children}
    </OrgContext.Provider>
  );
}
