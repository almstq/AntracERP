import { Button } from '../components/ui/Button';
import { ShieldX } from 'lucide-react';

export function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-base">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center mx-auto mb-4">
          <ShieldX size={24} className="text-red" />
        </div>
        <h1 className="text-lg font-bold text-text-primary mb-2">Unauthorized</h1>
        <p className="text-xs text-text-muted mb-6">You do not have permission to access this area.</p>
        <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
      </div>
    </div>
  );
}
