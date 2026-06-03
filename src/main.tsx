import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './lib/context/AuthContext';
import { OrgProvider } from './lib/context/OrgContext';
import { ToastProvider } from './lib/context/ToastContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { router } from './routes/router';
import './index.css';
import './styles/shell.css';

// Apply saved theme before first paint (no flash). Default = dark.
// Tailwind pages key off `html.light`; the Helix shell keys off `data-theme`.
try {
  if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.add('light');
    document.documentElement.setAttribute('data-theme', 'light');
  }
  const density = localStorage.getItem('density');
  if (density === 'compact' || density === 'comfortable') {
    document.documentElement.setAttribute('data-density', density);
  }
} catch { /* ignore */ }

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OrgProvider>
            <ToastProvider>
              <RouterProvider router={router} />
            </ToastProvider>
          </OrgProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);