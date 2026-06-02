import { FleetMapView } from '../../../components/workflow/FleetMapView';
import { useAssetList, useStaffList, useSiteList } from '../../../lib/hooks/useWorkflowData';
import { useFollowMeFleet, followMeStatusText } from '../../../lib/services/followme';
import { FollowMeBadge } from '../../../components/shared/FollowMeBadge';

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="minitag"><i style={{ background: color, width: 9, height: 9 }} /> {label}</span>
  );
}

export function FleetMap() {
  const { data: sites } = useSiteList();
  const { data: assets } = useAssetList();
  const { data: staff } = useStaffList();
  const { positions, meta } = useFollowMeFleet();
  const liveVessels = assets.filter((a) => a.assetClass === 'vessel' && a.trackingId && positions[a.trackingId]?.lat != null).length;
  const status = followMeStatusText(meta);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Map</h1>
          <p className="page-sub">
            <span className="live"><i /> Live</span>
            <span>{sites.length} sites · {assets.length} assets · {staff.length} staff{liveVessels > 0 ? ` · ${liveVessels} live vessel${liveVessels !== 1 ? 's' : ''}` : ''}</span>
          </p>
        </div>
        <div className="head-actions" style={{ gap: 14 }}>
          <Legend color="var(--accent)" label="Sites / Live vessel" />
          <Legend color="var(--info)" label="Assets" />
          <Legend color="var(--positive)" label="Staff" />
        </div>
      </div>

      <div className="card" style={{ padding: 6 }}>
        <FleetMapView sites={sites} assets={assets} staff={staff} height="66vh" vesselPositions={positions} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 2px', flexWrap: 'wrap' }}>
        <p className="empty-note" style={{ textAlign: 'left', padding: 0 }}>
          {status ?? `Sea vessels with a FollowMe ID show their live AIS position; other assets/staff sit at their site.`}
        </p>
        <FollowMeBadge />
      </div>
    </div>
  );
}
