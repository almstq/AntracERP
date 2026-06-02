/**
 * Master-data registry services — GM-managed locations, assets, staff.
 * Thin wrappers over db.ts. IDs are slugified from a code/name for readability.
 */
import { createWithId, updateFields, deleteDocument } from '../firebase/db';
import type { Site } from '../../types/org';
import type { Asset } from '../../types/asset';

function slug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// ─── Locations (sites) ─────────────────────────────────────────────────────

export interface LocationInput {
  name: string;
  type: Site['type'];
  lat?: number;
  lng?: number;
}

export async function createLocation(input: LocationInput): Promise<string> {
  const id = slug(input.name);
  await createWithId('sites', id, {
    name: input.name, type: input.type, orgId: 'antrac-holding', sbuId: 'sbu-wli',
    status: 'active',
    location: input.lat != null && input.lng != null ? { lat: input.lat, lng: input.lng } : null,
  });
  return id;
}

export async function updateLocation(id: string, patch: Partial<LocationInput>): Promise<void> {
  const data: Record<string, unknown> = {};
  if (patch.name != null) data.name = patch.name;
  if (patch.type != null) data.type = patch.type;
  if (patch.lat != null && patch.lng != null) data.location = { lat: patch.lat, lng: patch.lng };
  await updateFields('sites', id, data);
}

// ─── Assets ────────────────────────────────────────────────────────────────

export type AssetInput = Omit<Asset, 'id' | 'orgId' | 'sbuId' | 'createdAt' | 'commercialStatus'> & {
  commercialStatus?: Asset['commercialStatus'];
};

export async function createAsset(input: AssetInput): Promise<string> {
  const id = slug(input.code);
  await createWithId('assets', id, {
    ...input,
    commercialStatus: input.commercialStatus ?? 'available',
    orgId: 'antrac-holding', sbuId: 'sbu-wli',
  });
  return id;
}

export async function updateAsset(id: string, patch: Partial<AssetInput>): Promise<void> {
  // Firestore rejects undefined values — strip them before writing
  const clean = Object.fromEntries(
    Object.entries(patch as Record<string, unknown>).filter(([, v]) => v !== undefined),
  );
  await updateFields('assets', id, clean);
}

export async function deleteAsset(id: string): Promise<void> {
  await deleteDocument('assets', id);
}

/** GM assigns an asset to a location. */
export async function assignAssetLocation(assetId: string, siteId: string): Promise<void> {
  await updateFields('assets', assetId, { currentSiteId: siteId });
}

// ─── Staff ─────────────────────────────────────────────────────────────────

export type StaffInput = {
  name: string;
  role: string;
  staffType?: import('../../types/org').StaffType;
  designation: string;
  siteId?: string;
  assignedAssetId?: string;
};

export async function createStaff(input: StaffInput, displayId: string): Promise<string> {
  const id = slug(displayId);
  await createWithId('staff', id, {
    ...input, displayId, orgId: 'antrac-holding', sbuId: 'sbu-wli',
    status: 'active', documents: [],
  });
  return id;
}

export async function updateStaff(id: string, patch: Partial<StaffInput>): Promise<void> {
  await updateFields('staff', id, patch as Record<string, unknown>);
}

export async function deleteStaff(id: string): Promise<void> {
  await deleteDocument('staff', id);
}

/** GM assigns staff to a site. */
export async function assignStaffSite(staffId: string, siteId: string): Promise<void> {
  await updateFields('staff', staffId, { siteId });
}

/** GM posts staff to an asset (their map location then follows the asset's site). */
export async function assignStaffAsset(staffId: string, assetId: string | null): Promise<void> {
  await updateFields('staff', staffId, { assignedAssetId: assetId ?? '' });
}

// ─── Suppliers ───────────────────────────────────────────────────────────

export interface SupplierInput {
  name: string;
  country?: string;
  contactEmail?: string;
  categories: string[];
}

export async function createSupplier(input: SupplierInput): Promise<string> {
  const id = slug(input.name);
  await createWithId('suppliers', id, { ...input, active: true });
  return id;
}

export async function updateSupplier(
  id: string,
  patch: Partial<SupplierInput & { contactPhone: string; active: boolean }>,
): Promise<void> {
  await updateFields('suppliers', id, patch as Record<string, unknown>);
}
