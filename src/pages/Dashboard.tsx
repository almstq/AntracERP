import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/hooks/useAuth';
import { DashboardHome } from '../components/dashboard/DashboardHome';
import { HOLDING_ROLES, WLI_ROLES, MPL_ROLES, EMS_ROLES } from '../lib/permissions/roles';

export function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  // Role-based desk redirect
  const role = user.role;
  if ((HOLDING_ROLES as readonly string[]).includes(role)) return <Navigate to="/holding" replace />;
  if ((WLI_ROLES as readonly string[]).includes(role)) return <Navigate to="/wli" replace />;
  if ((MPL_ROLES as readonly string[]).includes(role)) return <Navigate to="/mpl" replace />;
  if ((EMS_ROLES as readonly string[]).includes(role)) return <Navigate to="/ems" replace />;
  if (role === 'pending') return <Navigate to="/pending" replace />;

  // Super admin (and everyone else): show the unified dashboard
  return <DashboardHome />;
}
