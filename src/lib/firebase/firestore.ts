import { getDbInstance } from './client';

// Firestore collection refs — all return null-safe stubs when Firebase not configured

function safeDb() {
  const db = getDbInstance();
  if (!db) {
    console.warn('[firestore] Firebase not configured — using mock mode');
  }
  return db;
}

// Collection getter stubs
export const collections = {
  orgs: () => { safeDb(); return 'orgs' as const; },
  users: () => { safeDb(); return 'users' as const; },
  userRoles: () => { safeDb(); return 'userRoles' as const; },
  sites: () => { safeDb(); return 'sites' as const; },
  staff: () => { safeDb(); return 'staff' as const; },
  assets: () => { safeDb(); return 'assets' as const; },
  tickets: () => { safeDb(); return 'tickets' as const; },
  purchaseRequests: () => { safeDb(); return 'purchaseRequests' as const; },
  rfqs: () => { safeDb(); return 'rfqs' as const; },
  purchaseOrders: () => { safeDb(); return 'purchaseOrders' as const; },
  inventoryItems: () => { safeDb(); return 'inventoryItems' as const; },
  stockBalances: () => { safeDb(); return 'stockBalances' as const; },
  storageLocations: () => { safeDb(); return 'storageLocations' as const; },
  stockMovements: () => { safeDb(); return 'stockMovements' as const; },
  customers: () => { safeDb(); return 'customers' as const; },
  crmEnquiries: () => { safeDb(); return 'crmEnquiries' as const; },
  jobs: () => { safeDb(); return 'jobs' as const; },
  notifications: (userId: string) => { safeDb(); return `users/${userId}/notifications` as const; },
  auditEvents: () => { safeDb(); return 'auditEvents' as const; },
  fuelRequests: () => { safeDb(); return 'fuelRequests' as const; },
  aiTasks: () => { safeDb(); return 'aiTasks' as const; },
};

// CRUD operation stubs — Phase 2A draft, no real writes
export async function getDoc(collection: string, id: string): Promise<Record<string, unknown> | null> {
  console.log(`[firestore] getDoc(${collection}/${id}) — mock mode`);
  return null;
}

export async function getDocs(collection: string): Promise<Record<string, unknown>[]> {
  console.log(`[firestore] getDocs(${collection}) — mock mode`);
  return [];
}

export async function addDoc(collection: string): Promise<string> {
  console.log(`[firestore] addDoc(${collection}) — mock mode`);
  return `mock-${Date.now()}`;
}

export async function updateDoc(collection: string, id: string): Promise<void> {
  console.log(`[firestore] updateDoc(${collection}/${id}) — mock mode`);
}

export async function setDoc(collection: string, id: string): Promise<void> {
  console.log(`[firestore] setDoc(${collection}/${id}) — mock mode`);
}

export async function queryDocs(collection: string): Promise<Record<string, unknown>[]> {
  console.log(`[firestore] queryDocs(${collection}) — mock mode`);
  return [];
}

// Batch/transaction stubs
export async function runTransaction<T>(fn: () => Promise<T>): Promise<T | null> {
  console.log('[firestore] runTransaction — mock mode');
  try { return await fn(); } catch { return null; }
}

export async function runBatch(fn: () => void): Promise<void> {
  console.log('[firestore] runBatch — mock mode');
  fn();
}
