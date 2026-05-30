import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/hooks/useAuth';
import { HOLDING_ROLES, WLI_ROLES, MPL_ROLES, EMS_ROLES } from '../../lib/permissions/roles';
import { Navbar } from './Sidebar';

export function ProtectedRoute() {
  const { user, loading, isMock } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex items-center justify-center h-screen text-text-secondary">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role === 'pending') return <Navigate to="/pending" replace />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto bg-bg-base">
        {isMock && (
          <div className="bg-amber/15 border-b border-amber/30 text-amber px-4 py-1.5 text-[11px] text-center">
            Developer Login (mock) — Firestore reads/writes are disabled. Sign in with Google to use live data.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}

export function RoleRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  // Super admin bypasses all role gates
  if (user.role === 'super_admin') return <Outlet />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}

export function DeskRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'super_admin') return <Navigate to="/wli" replace />;

  const role = user.role as string;
  if ((HOLDING_ROLES as readonly string[]).includes(role)) return <Navigate to="/holding" replace />;
  if ((WLI_ROLES as readonly string[]).includes(role)) return <Navigate to="/wli" replace />;
  if ((MPL_ROLES as readonly string[]).includes(role)) return <Navigate to="/mpl" replace />;
  if ((EMS_ROLES as readonly string[]).includes(role)) return <Navigate to="/ems" replace />;
  if (role === 'pending') return <Navigate to="/pending" replace />;

  return <Navigate to="/unauthorized" replace />;
}
