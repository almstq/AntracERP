import { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/hooks/useAuth';
import { roleCanAccessModule, roleModules, hydrateFromFirestore } from '../../lib/permissions/roleRegistry';
import { seedBuiltinRoles } from '../../lib/permissions/seedRoles';
import { moduleForPath } from '../shell/navConfig';
import { HelixShell } from '../shell/HelixShell';

// Guarantee the built-in roles are seeded even if main.tsx wasn't re-run (HMR).
seedBuiltinRoles();

const MODULE_ROOT: Record<string, string> = {
  holding: '/holding', wli: '/wli', mpl: '/mpl', ems: '/ems',
};

export function ProtectedRoute() {
  const { user, loading, isMock } = useAuth();
  const location = useLocation();

  // Ensure roles are seeded, then pull custom roles + overrides from Firestore.
  useEffect(() => {
    seedBuiltinRoles();
    if (user && !isMock) void hydrateFromFirestore();
  }, [user, isMock]);

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

// `allowedRoles` is retained for route-config compatibility but every role —
// built-in and custom — is now gated uniformly by module access in the registry.
export function RoleRoute(props: { allowedRoles?: string[] }) {
  const { user, effectiveRole } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (props.allowedRoles?.length === 1 && props.allowedRoles[0] === 'super_admin') {
    return user.role === 'super_admin' ? <Outlet /> : <Navigate to="/unauthorized" replace />;
  }
  // super_admin (including a real SA whose effectiveRole stays super_admin) bypasses.
  if (effectiveRole === 'super_admin') return <Outlet />;

  const modKey = moduleForPath(location.pathname).key;
  return roleCanAccessModule(effectiveRole, modKey) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}

export function DeskRedirect() {
  const { user, effectiveRole } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (effectiveRole === 'super_admin') return <Navigate to="/holding" replace />;
  if (effectiveRole === 'pending') return <Navigate to="/pending" replace />;

  // Land on the role's first accessible module home.
  const first = roleModules(effectiveRole)[0];
  if (first === 'wli') return <Navigate to={`/wli/desk/${effectiveRole}`} replace />;
  const root = first ? MODULE_ROOT[first] : undefined;
  return <Navigate to={root ?? '/unauthorized'} replace />;
}
