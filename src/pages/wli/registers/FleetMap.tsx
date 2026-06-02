import { FleetMapView } from '../../../components/workflow/FleetMapView';
import { useAssetList, useStaffList, useSiteList } from '../../../lib/hooks/useWorkflowData';

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="minitag"><i style={{ background: color, width: 9, height: 9 }} /> {label}</span>
  );
}

export function FleetMap() {
  const { data: sites } = useSiteList();
  const { data: assets } = useAssetList();
  const { data: staff } = useStaffList();
  const located = sites.filter((s) => s.location).length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Map</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{sites.length} sites · {assets.length} assets · {staff.length} staff</span>
          </p>
        </div>
        <div className="head-actions" style={{ gap: 14 }}>
          <Legend color="var(--accent)" label="Sites" />
          <Legend color="var(--info)" label="Assets" />
          <Legend color="var(--positive)" label="Staff" />
        </div>
      </div>

      <div className="card" style={{ padding: 6 }}>
        <FleetMapView sites={sites} assets={assets} staff={staff} height="68vh" />
      </div>
      <p className="empty-note" style={{ textAlign: 'left', padding: '10px 2px' }}>
        Showing all assets and staff across {located} located sites. Staff posted to an asset appear at that asset’s site.
      </p>
    </div>
  );
}
