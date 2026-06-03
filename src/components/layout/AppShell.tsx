import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/hooks/useAuth';
import { HOLDING_ROLES, WLI_ROLES, MPL_ROLES, EMS_ROLES } from '../../lib/permissions/roles';
import { HelixShell } from '../shell/HelixShell';

export function ProtectedRoute() {
  const { user, loading, isMock } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role === 'pending') return <Navigate to="/pending" replace />;

  const banner = isMock ? (
    <div className="bg-amber/15 border-b border-amber/30 text-amber px-4 py-1.5 text-[11px] text-center shrink-0">
      Developer Login (mock) — Firestore reads/writes are disabled. Sign in with Google to use live data.
    </div>
  ) : undefined;

  return <HelixShell banner={banner} />;
}

export function RoleRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { user, effectiveRole } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  // Gate on effectiveRole so a super_admin "acting as" a role gets a faithful
  // preview (a real super_admin's effectiveRole is super_admin → still bypasses).
  if (effectiveRole === 'super_admin') return <Outlet />;
  if (!allowedRoles.includes(effectiveRole)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}

export function DeskRedirect() {
  const { user, effectiveRole } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (effectiveRole === 'super_admin') return <Navigate to="/holding" replace />;

  const role = effectiveRole;
  if ((HOLDING_ROLES as readonly string[]).includes(role)) return <Navigate to="/holding" replace />;
  if ((WLI_ROLES as readonly string[]).includes(role)) return <Navigate to="/wli" replace />;
  if ((MPL_ROLES as readonly string[]).includes(role)) return <Navigate to="/mpl" replace />;
  if ((EMS_ROLES as readonly string[]).includes(role)) return <Navigate to="/ems" replace />;
  if (role === 'pending') return <Navigate to="/pending" replace />;

  return <Navigate to="/unauthorized" replace />;
}
