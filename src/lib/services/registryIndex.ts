import { doc, runTransaction, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getDbInstance } from '../firebase/client';

export interface RegistryRecord {
  id: string; // The serial number (e.g., WLI-TKT-202606-0001)
  prefix: string; // TKT, PR, PO, etc.
  sequence: number;
  fiscalPeriod: string; // YYYYMM or YYYY
  sbuId: string;
  siteId: string;
  status: string;
  ownerId?: string;
  createdBy: string;
  targetCollection: string;
  targetId: string;
  link: string;
}

function getDb() {
  const inst = getDbInstance();
  if (!inst) throw new Error('[registryIndex] Firebase not configured');
  return inst;
}

/** Atomically increments and returns the next sequence number for a given key. */
export async function nextRegistrySeq(key: string): Promise<number> {
  const db = getDb();
  const ref = doc(db, '_sequences', key);
  let n = 0;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as { n?: number } | undefined;
    n = ((data?.n ?? 0) + 1);
    tx.set(ref, { n });
  });
  return n;
}

/** Generates a unique, monotonic serial ID based on prefix, SBU, and site. */
export async function generateSerial(
  prefix: string,
  sbuId: string,
  _siteId?: string
): Promise<{ serialId: string; sequence: number; fiscalPeriod: string }> {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const fiscalPeriod = `${year}${month}`;

  // Unique sequence key for this SBU, prefix, and year
  const seqKey = `${sbuId || 'antrac'}_${prefix.toLowerCase()}_${year}`;
  const sequence = await nextRegistrySeq(seqKey);

  // Derive human-readable SBU prefix
  let sbuPrefix = 'ANT';
  if (sbuId === 'sbu-wli') sbuPrefix = 'WLI';
  else if (sbuId === 'sbu-mpl') sbuPrefix = 'MPL';
  else if (sbuId === 'sbu-ems') sbuPrefix = 'EMS';

  // Format: WLI-TKT-202606-0001
  const serialId = `${sbuPrefix}-${prefix}-${fiscalPeriod}-${String(sequence).padStart(4, '0')}`;
  return { serialId, sequence, fiscalPeriod };
}

/** Registers a new document in the central registryIndex collection. */
export async function indexDocument(record: RegistryRecord): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, 'registryIndex', record.id), {
    ...record,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Updates the status of an existing indexed document in the central registry. */
export async function updateRegistryStatus(serialId: string, status: string): Promise<void> {
  const db = getDb();
  try {
    await updateDoc(doc(db, 'registryIndex', serialId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.error(`[registryIndex] Failed to update status for ${serialId}`, e);
  }
}
