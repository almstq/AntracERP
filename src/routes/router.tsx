import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, RoleRoute, DeskRedirect } from '../components/layout/AppShell';
import { Login } from '../pages/Login';
import { PendingApproval } from '../pages/PendingApproval';
import { Unauthorized } from '../pages/Unauthorized';
import { Dashboard } from '../pages/Dashboard';
import { HoldingDashboard } from '../pages/holding/HoldingDashboard';
import { WLIDashboard } from '../pages/wli/WLIDashboard';
import { TicketList } from '../pages/wli/tickets/TicketList';
import { TicketDetail } from '../pages/wli/tickets/TicketDetail';
import { NewTicket } from '../pages/wli/tickets/NewTicket';
import { LocationRegister } from '../pages/wli/registers/LocationRegister';
import { AssetRegister } from '../pages/wli/registers/AssetRegister';
import { StaffRegister } from '../pages/wli/registers/StaffRegister';
import { FleetMap } from '../pages/wli/registers/FleetMap';
import { SupplierRegister } from '../pages/wli/registers/SupplierRegister';
import { RoleInbox } from '../pages/wli/RoleInbox';
import { PurchaseRequestList } from '../pages/wli/procurement/PurchaseRequestList';
import { PurchaseRequestDetail } from '../pages/wli/procurement/PurchaseRequestDetail';
import { RFQList } from '../pages/wli/procurement/RFQList';
import { PurchaseOrderList } from '../pages/wli/procurement/PurchaseOrderList';
import { PurchaseOrderDetail } from '../pages/wli/procurement/PurchaseOrderDetail';
import { FuelDispatchList } from '../pages/mpl/FuelDispatchList';
import { FuelDispatchDetail } from '../pages/mpl/FuelDispatchDetail';
import { InterSBUTransferList } from '../pages/mpl/InterSBUTransferList';
import { MPLDashboard } from '../pages/mpl/MPLDashboard';
import { EMSDashboard } from '../pages/ems/EMSDashboard';
import { UserList } from '../pages/admin/UserList';
import { HOLDING_ROLES, WLI_ROLES, MPL_ROLES, EMS_ROLES } from '../lib/permissions/roles';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/pending', element: <PendingApproval /> },
  { path: '/unauthorized', element: <Unauthorized /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <DeskRedirect /> },
      { path: 'dashboard', element: <Dashboard /> },
      {
        path: 'holding',
        element: <RoleRoute allowedRoles={HOLDING_ROLES} />,
        children: [
          { index: true, element: <HoldingDashboard /> },
        ],
      },
      {
        path: 'wli',
        element: <RoleRoute allowedRoles={WLI_ROLES} />,
        children: [
          { index: true, element: <WLIDashboard /> },
          { path: 'desk/:role', element: <RoleInbox /> },
          { path: 'tickets', element: <TicketList /> },
          { path: 'tickets/new', element: <NewTicket /> },
          { path: 'tickets/:id', element: <TicketDetail /> },
          { path: 'locations', element: <LocationRegister /> },
          { path: 'assets', element: <AssetRegister /> },
          { path: 'staff', element: <StaffRegister /> },
          { path: 'suppliers', element: <SupplierRegister /> },
          { path: 'map', element: <FleetMap /> },
          { path: 'procurement/requests', element: <PurchaseRequestList /> },
          { path: 'procurement/requests/:id', element: <PurchaseRequestDetail /> },
          { path: 'procurement/rfqs', element: <RFQList /> },
          { path: 'procurement/orders', element: <PurchaseOrderList /> },
          { path: 'procurement/orders/:id', element: <PurchaseOrderDetail /> },
        ],
      },
      {
        path: 'mpl',
        element: <RoleRoute allowedRoles={MPL_ROLES} />,
        children: [
          { index: true, element: <MPLDashboard /> },
          { path: 'dispatches', element: <FuelDispatchList /> },
          { path: 'dispatches/:id', element: <FuelDispatchDetail /> },
          { path: 'transfers', element: <InterSBUTransferList /> },
        ],
      },
      {
        path: 'ems',
        element: <RoleRoute allowedRoles={EMS_ROLES} />,
        children: [
          { index: true, element: <EMSDashboard /> },
        ],
      },
      {
        path: 'admin',
        element: <RoleRoute allowedRoles={['super_admin']} />,
        children: [
          { path: 'users', element: <UserList /> },
        ],
      },
    ],
  },
]);
