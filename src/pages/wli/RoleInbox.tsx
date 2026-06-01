import { useParams, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Ticket as TicketIcon, ShoppingCart, Package } from 'lucide-react';
import { useActionInbox } from '../../lib/hooks/useWorkflowData';
import { ROLE_LABELS } from '../../lib/permissions/roles';
import { PageContainer } from '../../components/shared/PageContainer';

const ICON = { ticket: TicketIcon, pr: ShoppingCart, po: Package };

/** Generic actor desk: everything awaiting the role in the URL across all workflows. */
export function RoleInbox() {
  const { role = '' } = useParams();
  const { items, loading } = useActionInbox(role);
  const label = ROLE_LABELS[role] ?? role;

  return (
    <PageContainer>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-text-primary">{label} Desk</h1>
        <p className="text-xs text-text-muted">{loading ? 'Loading…' : `${items.length} item(s) awaiting your action`}</p>
      </div>

      <Card>
        {!loading && items.length === 0 ? (
          <p className="text-xs text-text-muted p-2">Nothing awaiting the {label.toLowerCase()} right now.</p>
        ) : (
          <div className="space-y-1">
            {items.map((it) => {
              const Icon = ICON[it.kind];
              return (
                <Link key={`${it.kind}-${it.id}`} to={it.to} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Icon size={16} className="text-text-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{it.displayId} <span className="text-text-muted">· {it.subtitle}</span></p>
                      <p className="text-[10px] text-text-muted uppercase">{it.kind === 'pr' ? 'Purchase Request' : it.kind === 'po' ? 'Purchase Order' : 'Issue Ticket'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2 flex-wrap justify-end">
                    {it.actions.slice(0, 3).map((a) => (
                      <span key={a} className="text-[9px] px-2 py-1 rounded-full bg-blue/10 text-blue">{a}</span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
