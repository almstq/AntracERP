/**
 * Mandatory FollowMe attribution — required by the FollowMe API Terms of Use
 * on every page that displays FollowMe data (vessel positions, ETA, tracking).
 * See docs/FOLLOWME_INTEGRATION.md. Do not remove.
 */
export function FollowMeBadge({ className = '' }: { className?: string }) {
  return (
    <a
      href="https://followme.mv"
      target="_blank"
      rel="noreferrer"
      className={`followme-badge ${className}`}
      title="Powered by FollowMe Tracking Service"
    >
      <img src="https://followme.mv/api/images/icon_50.png" alt="FollowMe" width={16} height={16} />
      <span>Powered by FollowMe Tracking Service</span>
    </a>
  );
}
