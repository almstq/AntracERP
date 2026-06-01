import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageContainer } from '../../components/shared/PageContainer';

const mockUsers = [
  { name: 'Ali Mustarq', email: 'ali@antrac.com', role: 'Super Admin', org: 'Antrac Holding', status: 'active' },
  { name: 'Ibrahim', email: 'ibrahim@antrac.com', role: 'GM', org: 'WLI', status: 'active' },
  { name: 'Ahmed', email: 'ahmed@antrac.com', role: 'Site Manager', org: 'WLI', status: 'active' },
  { name: 'Hassan', email: 'hassan@antrac.com', role: 'Mechanic', org: 'WLI', status: 'pending' },
];

export function UserList() {
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text-primary">User Management</h1>
          <p className="text-xs text-text-muted">{mockUsers.length} users</p>
        </div>
      </div>
      <Card>
        <div className="space-y-2">
          {mockUsers.map((user, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-surface transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue/10 flex items-center justify-center text-xs font-bold text-blue">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-medium text-text-primary">{user.name}</p>
                  <p className="text-[10px] text-text-muted">{user.email} · {user.org}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge color="blue">{user.role}</Badge>
                <Badge color={user.status === 'active' ? 'teal' : 'amber'}>{user.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}
