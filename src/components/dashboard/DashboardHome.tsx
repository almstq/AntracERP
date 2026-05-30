import { useAuth } from '../../lib/hooks/useAuth';
import { StatsBar } from './StatsBar';
import { QueueCard } from './QueueCard';

interface AuthUser {
  displayName?: string;
}

export function DashboardHome() {
  const { user } = useAuth() as { user: AuthUser | null };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div>
        <h1 className="text-lg font-bold text-text-primary">Dashboard</h1>
        <p className="text-xs text-text-muted">Welcome back, {user?.displayName || 'User'}</p>
      </div>
      <StatsBar />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QueueCard title="Pending Approvals" count={5} color="amber" />
        <QueueCard title="Open Tickets" count={12} color="blue" />
        <QueueCard title="Critical" count={2} color="red" />
      </div>
    </div>
  );
}
