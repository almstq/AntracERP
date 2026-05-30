import { useContext } from 'react';
import { OrgContext } from '../context/OrgContext.context';
import type { Org } from '../../types/org';

interface OrgContextValue {
  currentOrg: Org | null;
  setCurrentOrg: (org: Org) => void;
}

export function useOrgContextValue(): OrgContextValue {
  return useContext(OrgContext) as OrgContextValue;
}

export const useOrgContext = useOrgContextValue;
