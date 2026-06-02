import { CheckCircle2 } from 'lucide-react';
import { ModuleStaffRegister } from '../../components/registers/ModuleStaffRegister';
import { ROLES } from '../../lib/permissions/roles';

// MPL (Maldives Petroleum Link) staff bucket.
const MPL_SBU = 'sbu-mpl';

const MPL_ROLE_OPTIONS = [ROLES.MPL_MANAGER];

export function MplStaffRegister() {
  return (
    <ModuleStaffRegister
      sbuId={MPL_SBU}
      idPrefix="MPL-EMP"
      title="MPL Staff"
      subtitle="Maldives Petroleum Link — fuel & water supply"
      roleOptions={MPL_ROLE_OPTIONS}
      defaultRole={ROLES.MPL_MANAGER}
      defaultDesignation="Terminal Manager"
      manageRoles={[ROLES.SUPER_ADMIN, ROLES.MPL_MANAGER]}
      emptyNote="No MPL staff yet. Add the Terminal Manager who approves fuel & water requests."
      renderExtra={(p) =>
        p.role === ROLES.MPL_MANAGER ? (
          <span className="badge b-pos" style={{ fontSize: 10 }}>
            <CheckCircle2 size={9} /> Approves fuel & water
          </span>
        ) : null
      }
    />
  );
}
