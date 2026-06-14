import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/hooks/useAuth';
import { DashboardHome } from '../components/dashboard/DashboardHome';
import { roleModules } from '../lib/permissions/roleRegistry';

export function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  // Registry-based desk redirect.
  const role = user.role;
  if (role === 'pending') return <Navigate to="/pending" replace />;
  const first = roleModules(role)[0];
  if (first === 'holding') return <Navigate to="/holding" replace />;
  if (first === 'wli') return <Navigate to="/wli" replace />;
  if (first === 'mpl') return <Navigate to="/mpl" replace />;
  if (first === 'ems') return <Navigate to="/ems" replace />;

  return <DashboardHome />;
}
