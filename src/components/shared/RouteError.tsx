import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router-dom';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * Route-level error boundary. Replaces React Router's raw dev error screen with a
 * branded, recoverable message when a page component throws during render.
 */
export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  let message = 'Something went wrong rendering this page.';
  if (isRouteErrorResponse(error)) message = `${error.status} — ${error.statusText}`;
  else if (error instanceof Error) message = error.message;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-red/10 flex items-center justify-center mb-3">
        <AlertTriangle size={22} className="text-red" />
      </div>
      <h1 className="text-base font-bold text-text-primary mb-1">Unexpected error</h1>
      <p className="text-xs text-text-muted max-w-sm mb-4">{message}</p>
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
          <RotateCcw size={13} className="mr-1" /> Reload
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate('/wli')}>
          <Home size={13} className="mr-1" /> Command Center
        </Button>
      </div>
    </div>
  );
}
