import os

PAGES = {
  "src/pages/admin/UserList.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../components/shared/PageContainer"),
  "src/pages/ems/EMSDashboard.tsx": ("p-4 md:p-6 max-w-7xl mx-auto", None, "../../components/shared/PageContainer"),
  "src/pages/holding/HoldingDashboard.tsx": ("p-4 md:p-6 space-y-4 max-w-7xl mx-auto", "space-y-4", "../../components/shared/PageContainer"),
  "src/pages/mpl/FuelDispatchDetail.tsx": ("p-4 md:p-6 max-w-3xl mx-auto", None, "../../components/shared/PageContainer"),
  "src/pages/mpl/FuelDispatchList.tsx": ("p-4 md:p-6 max-w-7xl mx-auto", None, "../../components/shared/PageContainer"),
  "src/pages/mpl/InterSBUTransferList.tsx": ("p-4 md:p-6 max-w-7xl mx-auto", None, "../../components/shared/PageContainer"),
  "src/pages/mpl/MPLDashboard.tsx": ("p-4 md:p-6 space-y-4 max-w-7xl mx-auto", "space-y-4", "../../components/shared/PageContainer"),
  "src/pages/wli/RoleInbox.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../components/shared/PageContainer"),
  "src/pages/wli/crm/CustomerDetail.tsx": ("p-4 md:p-6 max-w-4xl mx-auto space-y-4", "max-w-4xl space-y-4", "../../../components/shared/PageContainer"),
  "src/pages/wli/crm/CustomerRegister.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/crm/EnquiryDetail.tsx": ("p-4 md:p-6 max-w-4xl mx-auto space-y-4", "max-w-4xl space-y-4", "../../../components/shared/PageContainer"),
  "src/pages/wli/crm/EnquiryList.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/crm/FinanceDashboard.tsx": ("p-4 md:p-6 space-y-5 max-w-6xl mx-auto", "space-y-5", "../../../components/shared/PageContainer"),
  "src/pages/wli/crm/NewEnquiry.tsx": ("p-4 md:p-6 max-w-2xl mx-auto space-y-4", "max-w-2xl space-y-4", "../../../components/shared/PageContainer"),
  "src/pages/wli/crm/SalesDashboard.tsx": ("p-4 md:p-6 space-y-5 max-w-6xl mx-auto", "space-y-5", "../../../components/shared/PageContainer"),
  "src/pages/wli/crm/WorkOrderList.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/fuel/FuelRequestDetail.tsx": ("p-4 md:p-6 max-w-4xl mx-auto space-y-4", "max-w-4xl space-y-4", "../../../components/shared/PageContainer"),
  "src/pages/wli/fuel/FuelRequestList.tsx": ("p-4 md:p-6 max-w-5xl mx-auto space-y-5", "space-y-5", "../../../components/shared/PageContainer"),
  "src/pages/wli/fuel/NewFuelRequest.tsx": ("p-4 md:p-6 max-w-2xl mx-auto space-y-4", "max-w-2xl space-y-4", "../../../components/shared/PageContainer"),
  "src/pages/wli/procurement/PurchaseOrderDetail.tsx": ("p-4 md:p-6 max-w-4xl mx-auto space-y-4", "max-w-4xl space-y-4", "../../../components/shared/PageContainer"),
  "src/pages/wli/procurement/PurchaseOrderList.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/procurement/PurchaseRequestList.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/procurement/RFQList.tsx": ("p-4 md:p-6 max-w-7xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/registers/AssetRegister.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/registers/FleetMap.tsx": ("p-4 md:p-6 max-w-6xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/registers/LocationRegister.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/registers/StaffRegister.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/registers/SupplierRegister.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/tickets/NewTicket.tsx": ("p-4 md:p-6 max-w-2xl mx-auto space-y-4", "max-w-2xl space-y-4", "../../../components/shared/PageContainer"),
  "src/pages/wli/tickets/TicketDetail.tsx": ("p-4 md:p-6 max-w-4xl mx-auto space-y-4", "max-w-4xl space-y-4", "../../../components/shared/PageContainer"),
  "src/pages/wli/tickets/TicketList.tsx": ("p-4 md:p-6 max-w-7xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/vault/DocumentVault.tsx": ("p-4 md:p-6 max-w-5xl mx-auto space-y-4", "space-y-4", "../../../components/shared/PageContainer"),
  "src/pages/wli/warehouse/StoresRegister.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/warehouse/ItemCatalog.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/warehouse/StockByStore.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/warehouse/MovementsLedger.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/warehouse/TransferList.tsx": ("p-4 md:p-6 max-w-5xl mx-auto", None, "../../../components/shared/PageContainer"),
  "src/pages/wli/warehouse/NewTransfer.tsx": ("p-4 md:p-6 max-w-3xl mx-auto space-y-4", "max-w-3xl space-y-4", "../../../components/shared/PageContainer"),
  "src/pages/wli/warehouse/TransferDetail.tsx": ("p-4 md:p-6 max-w-3xl mx-auto space-y-4", "max-w-3xl space-y-4", "../../../components/shared/PageContainer"),
}

changed = []
errors = []

for path, (old_class, new_class, import_path) in PAGES.items():
  if not os.path.exists(path):
    errors.append(f"NOT FOUND: {path}")
    continue

  with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

  original = content

  # 1. Add import if not already present
  import_line = "import { PageContainer } from '" + import_path + "';"
  if 'PageContainer' not in content:
    lines = content.split('\n')
    last_import_idx = -1
    for i, line in enumerate(lines):
      if line.startswith('import '):
        last_import_idx = i
    if last_import_idx >= 0:
      lines.insert(last_import_idx + 1, import_line)
      content = '\n'.join(lines)

  # 2. Replace outer div opening
  pc_open = '<PageContainer' + (' className="' + new_class + '"' if new_class else '') + '>'
  old_open = '<div className="' + old_class + '">'
  if old_open not in content:
    errors.append(f"OPEN NOT FOUND in {path}: {repr(old_open)}")
    continue
  content = content.replace(old_open, pc_open, 1)

  # 3. Replace the LAST outer closing </div> in the file.
  # Most pages: outer div is last in return. Find last </div> at 2 or 4 space indent.
  for indent in ['  ', '    ']:
    close_old = '\n' + indent + '</div>\n'
    close_new = '\n' + indent + '</PageContainer>\n'
    idx = content.rfind(close_old)
    if idx != -1:
      content = content[:idx] + close_new + content[idx + len(close_old):]
      break
  else:
    errors.append(f"CLOSE NOT FOUND in {path}")
    content = original
    continue

  if content != original:
    with open(path, 'w', encoding='utf-8') as f:
      f.write(content)
    changed.append(path)
  else:
    errors.append(f"NO CHANGE in {path}")

print(f"Changed {len(changed)} files:")
for p in changed:
  print(f"  OK {p}")
if errors:
  print(f"\nErrors ({len(errors)}):")
  for e in errors:
    print(f"  ERR {e}")
