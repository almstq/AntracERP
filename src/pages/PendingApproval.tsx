import { Button } from '../components/ui/Button';

export function PendingApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-base">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-amber/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-xl">⏳</span>
        </div>
        <h1 className="text-lg font-bold text-text-primary mb-2">Account Pending Approval</h1>
        <p className="text-xs text-text-muted mb-6">Your account is awaiting approval from an administrator. You will be notified once approved.</p>
        <Button variant="secondary" onClick={() => window.location.href = '/login'}>Back to Login</Button>
      </div>
    </div>
  );
}
