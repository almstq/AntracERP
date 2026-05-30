import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.context';
import type { AuthContextType } from '../context/AuthContext.context';

export function useAuthContext(): AuthContextType {
  return useContext(AuthContext);
}

export const useAuth = useAuthContext;
