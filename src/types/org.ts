export interface Org {
  id: string;
  name: string;
  type: 'holding' | 'sbu';
  sbuType?: 'wli' | 'mpl' | 'ems';
  parentId?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}


export interface UserRole {
  id: string;
  userId: string;
  orgId: string;
  sbuId?: string;
  role: string;
  status: 'active' | 'pending' | 'suspended';
  siteAssignments: string[];
  grantedBy: string;
  grantedAt: Date;
}

export interface UserRoles {
  userId: string;
  roles: UserRole[];
  primaryOrgId: string;
}

export interface Site {
  id: string;
  name: string;
  type: 'project' | 'office' | 'yard' | 'vessel' | 'depot' | 'hq';
  orgId: string;
  sbuId: string;
  location?: { lat: number; lng: number };
  status: 'active' | 'inactive';
  createdAt: Date;
}

/** Workforce job classification — distinct from the permission `role`. */
export type StaffType =
  | 'supervisor'
  | 'support_staff'
  | 'terminal_staff'
  | 'captain'
  | 'vessel_crew'
  | 'operator'
  | 'mechanic'
  | 'driver';

export const STAFF_TYPES: StaffType[] = [
  'supervisor', 'support_staff', 'terminal_staff', 'captain',
  'vessel_crew', 'operator', 'mechanic', 'driver',
];

export const STAFF_TYPE_LABEL: Record<StaffType, string> = {
  supervisor: 'Supervisor',
  support_staff: 'Support Staff',
  terminal_staff: 'Terminal Staff',
  captain: 'Captain',
  vessel_crew: 'Vessel Crew',
  operator: 'Operator',
  mechanic: 'Mechanic',
  driver: 'Driver',
};

export interface Staff {
  id: string;
  displayId: string;
  name: string;
  role: string;
  staffType?: StaffType;   // workforce job classification
  designation: string;
  orgId: string;
  sbuId: string;
  siteId?: string;
  userId?: string;
  status: 'active' | 'inactive';
  documents: { name: string; url: string; uploadedAt?: Date }[];
  createdAt: Date;
  updatedAt: Date;
}
