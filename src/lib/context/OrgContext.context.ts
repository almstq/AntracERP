import { createContext } from 'react';
import type { Org } from '../../types/org';

export interface OrgContextType {
  currentOrg: Org | null;
  setCurrentOrg: (org: Org) => void;
}

export const OrgContext = createContext<OrgContextType>({
  currentOrg: null,
  setCurrentOrg: () => {},
});
