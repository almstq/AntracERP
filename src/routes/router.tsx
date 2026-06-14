/* eslint-disable react-refresh/only-export-components */
import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, RoleRoute, DeskRedirect } from '../components/layout/AppShell';
import { Login } from '../pages/Login';
import { Signup } from '../pages/Signup';
import { PendingApproval } from '../pages/PendingApproval';
import { Unauthorized } from '../pages/Unauthorized';
import { Dashboard } from '../pages/Dashboard';
import { Settings } from '../pages/Settings';
import { HOLDING_ROLES, WLI_ROLES, MPL_ROLES, EMS_ROLES } from '../lib/permissions/roles';
import { RouteError } from '../components/shared/RouteError';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

// --- Lazy-loaded feature modules (grouped by SBU / sub-area) ---
// Auth pages, core shell, and Dashboard/Settings stay eager — they're on the critical first-load path.

// Holding
const HoldingDashboard    = lazy(() => import('../pages/holding/HoldingDashboard').then(m => ({ default: m.HoldingDashboard })));
const HoldingStaffRegister = lazy(() => import('../pages/holding/HoldingStaffRegister').then(m => ({ default: m.HoldingStaffRegister })));
const PaymentApprovals    = lazy(() => import('../pages/holding/PaymentApprovals').then(m => ({ default: m.PaymentApprovals })));

// WLI — core
const WLIHome  = lazy(() => import('../pages/wli/WLIHome').then(m => ({ default: m.WLIHome })));
const RoleInbox = lazy(() => import('../pages/wli/RoleInbox').then(m => ({ default: m.RoleInbox })));

// WLI — tickets
const TicketList   = lazy(() => import('../pages/wli/tickets/TicketList').then(m => ({ default: m.TicketList })));
const TicketDetail = lazy(() => import('../pages/wli/tickets/TicketDetail').then(m => ({ default: m.TicketDetail })));
const NewTicket    = lazy(() => import('../pages/wli/tickets/NewTicket').then(m => ({ default: m.NewTicket })));

// WLI — registers
const LocationRegister = lazy(() => import('../pages/wli/registers/LocationRegister').then(m => ({ default: m.LocationRegister })));
const SiteDetail       = lazy(() => import('../pages/wli/registers/SiteDetail').then(m => ({ default: m.SiteDetail })));
const AssetRegister    = lazy(() => import('../pages/wli/registers/AssetRegister').then(m => ({ default: m.AssetRegister })));
const AssetDetail      = lazy(() => import('../pages/wli/registers/AssetDetail').then(m => ({ default: m.AssetDetail })));
const StaffRegister    = lazy(() => import('../pages/wli/registers/StaffRegister').then(m => ({ default: m.StaffRegister })));
const StaffDetail      = lazy(() => import('../pages/wli/registers/StaffDetail').then(m => ({ default: m.StaffDetail })));
const SupplierRegister = lazy(() => import('../pages/wli/registers/SupplierRegister').then(m => ({ default: m.SupplierRegister })));
const SupplierDetail   = lazy(() => import('../pages/wli/registers/SupplierDetail').then(m => ({ default: m.SupplierDetail })));
const FleetMap         = lazy(() => import('../pages/wli/registers/FleetMap').then(m => ({ default: m.FleetMap })));

// WLI — procurement (shared with Holding)
const PurchaseRequestList   = lazy(() => import('../pages/wli/procurement/PurchaseRequestList').then(m => ({ default: m.PurchaseRequestList })));
const PurchaseRequestDetail = lazy(() => import('../pages/wli/procurement/PurchaseRequestDetail').then(m => ({ default: m.PurchaseRequestDetail })));
const NewPurchaseRequest    = lazy(() => import('../pages/wli/procurement/NewPurchaseRequest').then(m => ({ default: m.NewPurchaseRequest })));
const RFQList               = lazy(() => import('../pages/wli/procurement/RFQList').then(m => ({ default: m.RFQList })));
const PurchaseOrderList     = lazy(() => import('../pages/wli/procurement/PurchaseOrderList').then(m => ({ default: m.PurchaseOrderList })));
const PurchaseOrderDetail   = lazy(() => import('../pages/wli/procurement/PurchaseOrderDetail').then(m => ({ default: m.PurchaseOrderDetail })));

// WLI — CRM
const CustomerRegister = lazy(() => import('../pages/wli/crm/CustomerRegister').then(m => ({ default: m.CustomerRegister })));
const CustomerDetail   = lazy(() => import('../pages/wli/crm/CustomerDetail').then(m => ({ default: m.CustomerDetail })));
const EnquiryList      = lazy(() => import('../pages/wli/crm/EnquiryList').then(m => ({ default: m.EnquiryList })));
const NewEnquiry       = lazy(() => import('../pages/wli/crm/NewEnquiry').then(m => ({ default: m.NewEnquiry })));
const EnquiryDetail    = lazy(() => import('../pages/wli/crm/EnquiryDetail').then(m => ({ default: m.EnquiryDetail })));
const WorkOrderList    = lazy(() => import('../pages/wli/crm/WorkOrderList').then(m => ({ default: m.WorkOrderList })));
const WorkOrderDetail  = lazy(() => import('../pages/wli/crm/WorkOrderDetail').then(m => ({ default: m.WorkOrderDetail })));
const SalesDashboard   = lazy(() => import('../pages/wli/crm/SalesDashboard').then(m => ({ default: m.SalesDashboard })));
const FinanceDashboard = lazy(() => import('../pages/wli/crm/FinanceDashboard').then(m => ({ default: m.FinanceDashboard })));

// WLI — reports (shared with Holding)
const ReportsCenter = lazy(() => import('../pages/wli/reports/ReportsCenter').then(m => ({ default: m.ReportsCenter })));
const Profitability = lazy(() => import('../pages/wli/reports/Profitability').then(m => ({ default: m.Profitability })));
const FleetUptime   = lazy(() => import('../pages/wli/reports/FleetUptime').then(m => ({ default: m.FleetUptime })));

// WLI — deployments
const DeploymentRegister = lazy(() => import('../pages/wli/deployments/DeploymentRegister').then(m => ({ default: m.DeploymentRegister })));
const NewDeployment      = lazy(() => import('../pages/wli/deployments/NewDeployment').then(m => ({ default: m.NewDeployment })));

// WLI — fuel
const FuelRequestList   = lazy(() => import('../pages/wli/fuel/FuelRequestList').then(m => ({ default: m.FuelRequestList })));
const NewFuelRequest    = lazy(() => import('../pages/wli/fuel/NewFuelRequest').then(m => ({ default: m.NewFuelRequest })));
const FuelRequestDetail = lazy(() => import('../pages/wli/fuel/FuelRequestDetail').then(m => ({ default: m.FuelRequestDetail })));

// WLI — vault
const DocumentVault = lazy(() => import('../pages/wli/vault/DocumentVault').then(m => ({ default: m.DocumentVault })));

// WLI — warehouse
const StoresRegister   = lazy(() => import('../pages/wli/warehouse/StoresRegister').then(m => ({ default: m.StoresRegister })));
const ItemCatalog      = lazy(() => import('../pages/wli/warehouse/ItemCatalog').then(m => ({ default: m.ItemCatalog })));
const ItemDetail       = lazy(() => import('../pages/wli/warehouse/ItemDetail').then(m => ({ default: m.ItemDetail })));
const StockByStore     = lazy(() => import('../pages/wli/warehouse/StockByStore').then(m => ({ default: m.StockByStore })));
const MovementsLedger  = lazy(() => import('../pages/wli/warehouse/MovementsLedger').then(m => ({ default: m.MovementsLedger })));
const TransferList     = lazy(() => import('../pages/wli/warehouse/TransferList').then(m => ({ default: m.TransferList })));
const NewTransfer      = lazy(() => import('../pages/wli/warehouse/NewTransfer').then(m => ({ default: m.NewTransfer })));
const TransferDetail   = lazy(() => import('../pages/wli/warehouse/TransferDetail').then(m => ({ default: m.TransferDetail })));

// MPL
const MPLDashboard        = lazy(() => import('../pages/mpl/MPLDashboard').then(m => ({ default: m.MPLDashboard })));
const MplStaffRegister    = lazy(() => import('../pages/mpl/MplStaffRegister').then(m => ({ default: m.MplStaffRegister })));
const FuelDispatchList    = lazy(() => import('../pages/mpl/FuelDispatchList').then(m => ({ default: m.FuelDispatchList })));
const FuelDispatchDetail  = lazy(() => import('../pages/mpl/FuelDispatchDetail').then(m => ({ default: m.FuelDispatchDetail })));
const InterSBUTransferList = lazy(() => import('../pages/mpl/InterSBUTransferList').then(m => ({ default: m.InterSBUTransferList })));

// EMS
const EMSDashboard = lazy(() => import('../pages/ems/EMSDashboard').then(m => ({ default: m.EMSDashboard })));

// Admin
const UserList = lazy(() => import('../pages/admin/UserList').then(m => ({ default: m.UserList })));
const RoleBuilder = lazy(() => import('../pages/admin/RoleBuilder').then(m => ({ default: m.RoleBuilder })));
const SystemLog = lazy(() => import('../pages/SystemLog').then(m => ({ default: m.SystemLog })));

// Wraps a lazy component in a route-level Suspense boundary.
function s(C: React.ComponentType) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>}>
      <C />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/pending', element: <PendingApproval /> },
  { path: '/unauthorized', element: <Unauthorized /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <DeskRedirect /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'settings', element: <Settings /> },
      { path: 'activity', element: s(SystemLog) },
      {
        path: 'holding',
        element: <RoleRoute allowedRoles={HOLDING_ROLES} />,
        children: [
          { index: true, element: s(HoldingDashboard) },
          { path: 'staff', element: s(HoldingStaffRegister) },
          { path: 'approvals', element: s(PaymentApprovals) },
          { path: 'approvals/:id', element: s(PurchaseOrderDetail) },
          { path: 'procurement/requests', element: s(PurchaseRequestList) },
          { path: 'procurement/requests/new', element: s(NewPurchaseRequest) },
          { path: 'procurement/requests/:id', element: s(PurchaseRequestDetail) },
          { path: 'reports', element: s(ReportsCenter) },
          { path: 'reports/profitability', element: s(Profitability) },
          { path: 'reports/uptime', element: s(FleetUptime) },
        ],
      },
      {
        path: 'wli',
        element: <RoleRoute allowedRoles={WLI_ROLES} />,
        children: [
          { index: true, element: s(WLIHome) },
          { path: 'desk/:role', element: s(RoleInbox) },
          { path: 'tickets', element: s(TicketList) },
          { path: 'tickets/new', element: s(NewTicket) },
          { path: 'tickets/:id', element: s(TicketDetail) },
          { path: 'locations', element: s(LocationRegister) },
          { path: 'locations/:id', element: s(SiteDetail) },
          { path: 'assets', element: s(AssetRegister) },
          { path: 'assets/:id', element: s(AssetDetail) },
          { path: 'staff', element: s(StaffRegister) },
          { path: 'staff/:id', element: s(StaffDetail) },
          { path: 'suppliers', element: s(SupplierRegister) },
          { path: 'suppliers/:id', element: s(SupplierDetail) },
          { path: 'map', element: s(FleetMap) },
          { path: 'procurement/requests', element: s(PurchaseRequestList) },
          { path: 'procurement/requests/new', element: s(NewPurchaseRequest) },
          { path: 'procurement/requests/:id', element: s(PurchaseRequestDetail) },
          { path: 'procurement/rfqs', element: s(RFQList) },
          { path: 'procurement/orders', element: s(PurchaseOrderList) },
          { path: 'procurement/orders/:id', element: s(PurchaseOrderDetail) },
          { path: 'crm/customers', element: s(CustomerRegister) },
          { path: 'crm/customers/:id', element: s(CustomerDetail) },
          { path: 'crm/enquiries', element: s(EnquiryList) },
          { path: 'crm/enquiries/new', element: s(NewEnquiry) },
          { path: 'crm/enquiries/:id', element: s(EnquiryDetail) },
          { path: 'crm/work-orders', element: s(WorkOrderList) },
          { path: 'crm/work-orders/:id', element: s(WorkOrderDetail) },
          { path: 'crm/sales', element: s(SalesDashboard) },
          { path: 'crm/finance', element: s(FinanceDashboard) },
          { path: 'reports', element: s(ReportsCenter) },
          { path: 'reports/profitability', element: s(Profitability) },
          { path: 'reports/uptime', element: s(FleetUptime) },
          { path: 'deployments', element: s(DeploymentRegister) },
          { path: 'deployments/new', element: s(NewDeployment) },
          { path: 'fuel/requests', element: s(FuelRequestList) },
          { path: 'fuel/requests/new', element: s(NewFuelRequest) },
          { path: 'fuel/requests/:id', element: s(FuelRequestDetail) },
          { path: 'documents', element: s(DocumentVault) },
          { path: 'warehouse/stores', element: s(StoresRegister) },
          { path: 'warehouse/items', element: s(ItemCatalog) },
          { path: 'warehouse/items/:id', element: s(ItemDetail) },
          { path: 'warehouse/stock', element: s(StockByStore) },
          { path: 'warehouse/movements', element: s(MovementsLedger) },
          { path: 'warehouse/transfers', element: s(TransferList) },
          { path: 'warehouse/transfers/new', element: s(NewTransfer) },
          { path: 'warehouse/transfers/:id', element: s(TransferDetail) },
        ],
      },
      {
        path: 'mpl',
        element: <RoleRoute allowedRoles={MPL_ROLES} />,
        children: [
          { index: true, element: s(MPLDashboard) },
          { path: 'staff', element: s(MplStaffRegister) },
          { path: 'dispatches', element: s(FuelDispatchList) },
          { path: 'dispatches/:id', element: s(FuelDispatchDetail) },
          { path: 'transfers', element: s(InterSBUTransferList) },
        ],
      },
      {
        path: 'ems',
        element: <RoleRoute allowedRoles={EMS_ROLES} />,
        children: [
          { index: true, element: s(EMSDashboard) },
        ],
      },
      {
        path: 'admin',
        element: <RoleRoute allowedRoles={['super_admin']} />,
        children: [
          { path: 'users', element: s(UserList) },
          { path: 'roles', element: s(RoleBuilder) },
        ],
      },
    ],
  },
]);
