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
  type: 'project' | 'office' | 'yard' | 'vessel' | 'depot';
  orgId: string;
  sbuId: string;
  location?: { lat: number; lng: number };
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Staff {
  id: string;
  displayId: string;
  name: string;
  role: string;
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
