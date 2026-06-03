import { Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/hooks/useAuth';
import { ROLES } from '../../lib/permissions/roles';
import { WLIDashboard } from './WLIDashboard';
import { OperatorHome } from './home/OperatorHome';
import { MechanicHome } from './home/MechanicHome';
import { ProcurementDesk } from './home/ProcurementDesk';
import { WarehouseDesk } from './home/WarehouseDesk';

/**
 * Role-aware landing for /wli. Each touchpoint role gets the view that matches
 * their job; finance/sales reuse their purpose-built CRM dashboards. Driven by
 * effectiveRole so a super_admin "acting as" a role previews it faithfully.
 */
export function WLIHome() {
  const { effectiveRole, user } = useAuth();

  switch (effectiveRole) {
    case ROLES.OPERATOR:
      return <OperatorHome />;
    case ROLES.MECHANIC:
      return <MechanicHome />;
    case ROLES.PROC_STAFF:
      return <ProcurementDesk />;
    case ROLES.INVENTORY_STAFF:
      return <WarehouseDesk />;
    case ROLES.FINANCE_WLI:
      return <Navigate to="/wli/crm/finance" replace />;
    case ROLES.SALES_STAFF:
      return <Navigate to="/wli/crm/sales" replace />;
    case ROLES.SUPERVISOR:
      // Scoped Command Center — only the supervisor's sites.
      return <WLIDashboard scopeSiteIds={user?.siteIds ?? []} />;
    default:
      // gm, ops_staff, super_admin → full Command Center.
      return <WLIDashboard />;
  }
}
