import { MapPin } from 'lucide-react';
import { ModuleStaffRegister } from '../../components/registers/ModuleStaffRegister';
import { useSiteList } from '../../lib/hooks/useWorkflowData';
import { ROLES } from '../../lib/permissions/roles';

// Holding staff live under the Antrac org in their own SBU bucket so they never
// mix with an operating company's roster (e.g. the WLI 34-person list).
const HOLDING_SBU = 'antrac-hq';

// Roles a Holding person can hold — directors, CFO, group finance, HR, plus
// project managers (supervisor) who oversee operating-company sites.
const HQ_ROLES = [
  ROLES.DIRECTOR, ROLES.CFO, ROLES.ANTRAC_FINANCE, ROLES.HOLDING_HR, ROLES.SUPERVISOR,
];

export function HoldingStaffRegister() {
  const { data: sites } = useSiteList();

  return (
    <ModuleStaffRegister
      sbuId={HOLDING_SBU}
      idPrefix="ANT-EMP"
      title="Holding Staff"
      subtitle="Directors, finance, HR & project managers — Antrac Holding"
      roleOptions={HQ_ROLES}
      defaultRole={ROLES.DIRECTOR}
      defaultDesignation="Director"
      manageRoles={[ROLES.SUPER_ADMIN, ROLES.DIRECTOR, ROLES.HOLDING_HR]}
      hint={<>Project managers oversee specific sites from <b>WLI → Locations → a site → Site In-Charge</b>.</>}
      emptyNote="No Holding staff yet. Add directors, finance, HR or a project manager above."
      renderExtra={(p) => {
        // Which sites is this person in charge of?
        const inCharge = sites.filter((s) => s.inChargeStaffId === p.id);
        if (inCharge.length === 0) return null;
        return (
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {inCharge.map((s) => (
              <span key={s.id} className="badge b-accent" style={{ fontSize: 10 }}>
                <MapPin size={9} /> {s.name}
              </span>
            ))}
          </div>
        );
      }}
    />
  );
}
