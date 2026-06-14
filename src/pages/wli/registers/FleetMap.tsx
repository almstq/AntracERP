import { FleetMapView } from '../../../components/workflow/FleetMapView';
import { useAssetList, useStaffList, useSiteList } from '../../../lib/hooks/useWorkflowData';
import { useAuth } from '../../../lib/hooks/useAuth';

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="minitag"><i style={{ background: color, width: 9, height: 9 }} /> {label}</span>
  );
}

export function FleetMap() {
  const { user } = useAuth();
  const { data: sites } = useSiteList();
  const { data: assets } = useAssetList();
  const { data: staff } = useStaffList();
  const focusSiteIds = user?.siteIds ?? [];
  const territoryLabel = focusSiteIds.length > 0 ? 'My Territory' : 'All Sites';

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Fleet Map</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{territoryLabel}</span>
            <span>·</span>
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
        <FleetMapView sites={sites} assets={assets} staff={staff} height="66vh" focusSiteIds={focusSiteIds} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 2px', flexWrap: 'wrap' }}>
        <p className="empty-note" style={{ textAlign: 'left', padding: 0 }}>
          {assets.length === 0
            ? 'No assets registered. Add assets in the Asset Register to see fleet data here.'
            : focusSiteIds.length > 0
              ? 'Map is zoomed to your assigned territory. Assets and staff on the ground are spread around each site marker.'
              : 'Assets and staff are plotted at their site coordinates. Operational status is shown in the info window.'}
        </p>
      </div>
    </div>
  );
}
