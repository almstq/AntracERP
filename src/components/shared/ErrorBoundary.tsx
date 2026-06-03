import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level application error boundary — the outermost safety net, mounted ABOVE
 * the providers and the router. It catches what React Router's route-level
 * `errorElement` (RouteError) cannot: errors thrown inside the providers, in the
 * top-level `/login` `/signup` `/pending` routes, or during RouterProvider init.
 * Without it, any such error white-screens the whole app for the user.
 *
 * Self-contained: logs to the console only — no external service, nothing leaves
 * the app. `reportError` is the single seam to wire remote monitoring later
 * (e.g. Sentry.captureException) without touching anything else.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.reportError(error, info);
  }

  reportError(error: Error, info: ErrorInfo): void {
    // Self-contained logging. To enable remote monitoring later, call your
    // reporter here (e.g. Sentry.captureException(error)) — no other change needed.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-bg-base">
        <div className="w-12 h-12 rounded-full bg-red/10 flex items-center justify-center mb-3">
          <AlertTriangle size={22} className="text-red" />
        </div>
        <h1 className="text-base font-bold text-text-primary mb-1">Something went wrong</h1>
        <p className="text-xs text-text-muted max-w-sm mb-4">
          The app hit an unexpected error. Reloading usually fixes it — if it keeps
          happening, let your administrator know.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
            <RotateCcw size={13} className="mr-1" /> Reload
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.location.assign('/')}>
            <Home size={13} className="mr-1" /> Home
          </Button>
        </div>
      </div>
    );
  }
}
