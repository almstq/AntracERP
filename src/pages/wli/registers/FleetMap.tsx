import { Card } from '../../../components/ui/Card';
import { FleetMapView } from '../../../components/workflow/FleetMapView';
import { useAssetList, useStaffList, useSiteList } from '../../../lib/hooks/useWorkflowData';

export function FleetMap() {
  const { data: sites } = useSiteList();
  const { data: assets } = useAssetList();
  const { data: staff } = useStaffList();

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-lg font-bold text-text-primary mb-4">Fleet & Staff Map</h1>
      <Card>
        <FleetMapView sites={sites} assets={assets} staff={staff} height="65vh" />
        <p className="text-[10px] text-text-muted mt-2">
          {assets.length} assets · {staff.length} staff across {sites.filter((s) => s.location).length} located sites
        </p>
      </Card>
    </div>
  );
}
