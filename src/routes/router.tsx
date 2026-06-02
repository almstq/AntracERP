import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, RoleRoute, DeskRedirect } from '../components/layout/AppShell';
import { Login } from '../pages/Login';
import { PendingApproval } from '../pages/PendingApproval';
import { Unauthorized } from '../pages/Unauthorized';
import { Dashboard } from '../pages/Dashboard';
import { HoldingDashboard } from '../pages/holding/HoldingDashboard';
import { HoldingStaffRegister } from '../pages/holding/HoldingStaffRegister';
import { WLIDashboard } from '../pages/wli/WLIDashboard';
import { TicketList } from '../pages/wli/tickets/TicketList';
import { TicketDetail } from '../pages/wli/tickets/TicketDetail';
import { NewTicket } from '../pages/wli/tickets/NewTicket';
import { LocationRegister } from '../pages/wli/registers/LocationRegister';
import { SiteDetail } from '../pages/wli/registers/SiteDetail';
import { AssetRegister } from '../pages/wli/registers/AssetRegister';
import { AssetDetail } from '../pages/wli/registers/AssetDetail';
import { StaffDetail } from '../pages/wli/registers/StaffDetail';
import { SupplierDetail } from '../pages/wli/registers/SupplierDetail';
import { StaffRegister } from '../pages/wli/registers/StaffRegister';
import { FleetMap } from '../pages/wli/registers/FleetMap';
import { SupplierRegister } from '../pages/wli/registers/SupplierRegister';
import { RoleInbox } from '../pages/wli/RoleInbox';
import { PurchaseRequestList } from '../pages/wli/procurement/PurchaseRequestList';
import { PurchaseRequestDetail } from '../pages/wli/procurement/PurchaseRequestDetail';
import { RFQList } from '../pages/wli/procurement/RFQList';
import { PurchaseOrderList } from '../pages/wli/procurement/PurchaseOrderList';
import { PurchaseOrderDetail } from '../pages/wli/procurement/PurchaseOrderDetail';
import { CustomerRegister } from '../pages/wli/crm/CustomerRegister';
import { CustomerDetail } from '../pages/wli/crm/CustomerDetail';
import { EnquiryList } from '../pages/wli/crm/EnquiryList';
import { NewEnquiry } from '../pages/wli/crm/NewEnquiry';
import { EnquiryDetail } from '../pages/wli/crm/EnquiryDetail';
import { WorkOrderList } from '../pages/wli/crm/WorkOrderList';
import { WorkOrderDetail } from '../pages/wli/crm/WorkOrderDetail';
import { SalesDashboard } from '../pages/wli/crm/SalesDashboard';
import { FinanceDashboard } from '../pages/wli/crm/FinanceDashboard';
import { FuelRequestList } from '../pages/wli/fuel/FuelRequestList';
import { NewFuelRequest } from '../pages/wli/fuel/NewFuelRequest';
import { FuelRequestDetail } from '../pages/wli/fuel/FuelRequestDetail';
import { DocumentVault } from '../pages/wli/vault/DocumentVault';
import { StoresRegister } from '../pages/wli/warehouse/StoresRegister';
import { ItemCatalog } from '../pages/wli/warehouse/ItemCatalog';
import { ItemDetail } from '../pages/wli/warehouse/ItemDetail';
import { StockByStore } from '../pages/wli/warehouse/StockByStore';
import { MovementsLedger } from '../pages/wli/warehouse/MovementsLedger';
import { TransferList } from '../pages/wli/warehouse/TransferList';
import { NewTransfer } from '../pages/wli/warehouse/NewTransfer';
import { TransferDetail } from '../pages/wli/warehouse/TransferDetail';
import { FuelDispatchList } from '../pages/mpl/FuelDispatchList';
import { FuelDispatchDetail } from '../pages/mpl/FuelDispatchDetail';
import { InterSBUTransferList } from '../pages/mpl/InterSBUTransferList';
import { MPLDashboard } from '../pages/mpl/MPLDashboard';
import { MplStaffRegister } from '../pages/mpl/MplStaffRegister';
import { EMSDashboard } from '../pages/ems/EMSDashboard';
import { UserList } from '../pages/admin/UserList';
import { HOLDING_ROLES, WLI_ROLES, MPL_ROLES, EMS_ROLES } from '../lib/permissions/roles';
import { RouteError } from '../components/shared/RouteError';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/pending', element: <PendingApproval /> },
  { path: '/unauthorized', element: <Unauthorized /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <DeskRedirect /> },
      { path: 'dashboard', element: <Dashboard /> },
      {
        path: 'holding',
        element: <RoleRoute allowedRoles={HOLDING_ROLES} />,
        children: [
          { index: true, element: <HoldingDashboard /> },
          { path: 'staff', element: <HoldingStaffRegister /> },
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
          { path: 'locations/:id', element: <SiteDetail /> },
          { path: 'assets', element: <AssetRegister /> },
          { path: 'assets/:id', element: <AssetDetail /> },
          { path: 'staff', element: <StaffRegister /> },
          { path: 'staff/:id', element: <StaffDetail /> },
          { path: 'suppliers', element: <SupplierRegister /> },
          { path: 'suppliers/:id', element: <SupplierDetail /> },
          { path: 'map', element: <FleetMap /> },
          { path: 'procurement/requests', element: <PurchaseRequestList /> },
          { path: 'procurement/requests/:id', element: <PurchaseRequestDetail /> },
          { path: 'procurement/rfqs', element: <RFQList /> },
          { path: 'procurement/orders', element: <PurchaseOrderList /> },
          { path: 'procurement/orders/:id', element: <PurchaseOrderDetail /> },
          // CRM & Sales
          { path: 'crm/customers', element: <CustomerRegister /> },
          { path: 'crm/customers/:id', element: <CustomerDetail /> },
          { path: 'crm/enquiries', element: <EnquiryList /> },
          { path: 'crm/enquiries/new', element: <NewEnquiry /> },
          { path: 'crm/enquiries/:id', element: <EnquiryDetail /> },
          { path: 'crm/work-orders', element: <WorkOrderList /> },
          { path: 'crm/work-orders/:id', element: <WorkOrderDetail /> },
          { path: 'crm/sales', element: <SalesDashboard /> },
          { path: 'crm/finance', element: <FinanceDashboard /> },
          // Fuel & Water
          { path: 'fuel/requests', element: <FuelRequestList /> },
          { path: 'fuel/requests/new', element: <NewFuelRequest /> },
          { path: 'fuel/requests/:id', element: <FuelRequestDetail /> },
          // Document Vault
          { path: 'documents', element: <DocumentVault /> },
          // Warehouse / Inventory
          { path: 'warehouse/stores', element: <StoresRegister /> },
          { path: 'warehouse/items', element: <ItemCatalog /> },
          { path: 'warehouse/items/:id', element: <ItemDetail /> },
          { path: 'warehouse/stock', element: <StockByStore /> },
          { path: 'warehouse/movements', element: <MovementsLedger /> },
          { path: 'warehouse/transfers', element: <TransferList /> },
          { path: 'warehouse/transfers/new', element: <NewTransfer /> },
          { path: 'warehouse/transfers/:id', element: <TransferDetail /> },
        ],
      },
      {
        path: 'mpl',
        element: <RoleRoute allowedRoles={MPL_ROLES} />,
        children: [
          { index: true, element: <MPLDashboard /> },
          { path: 'staff', element: <MplStaffRegister /> },
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
