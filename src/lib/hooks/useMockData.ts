import { useState } from 'react';

export function useMockData(): boolean {
  const [useMock] = useState(() => {
    const env = import.meta.env.VITE_USE_MOCK_DATA;
    if (env === undefined) return true;
    return env !== 'false';
  });
  return useMock;
}