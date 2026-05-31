import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, addDoc, deleteDoc, arrayUnion, arrayRemove, collection } from 'firebase/firestore';
import { getStorageInstance, getDbInstance } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocType =
  | 'site_photo'
  | 'tax_invoice'
  | 'collection_receipt'
  | 'work_document'
  | 'other';

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  site_photo:          'Site Photo',
  tax_invoice:         'Tax Invoice / Receipt',
  collection_receipt:  'Collection Receipt',
  work_document:       'Work Document',
  other:               'Other',
};

/** Infer docType from the Firestore collection name. */
export function inferDocType(col: string): DocType {
  switch (col) {
    case 'tickets':         return 'site_photo';
    case 'purchaseOrders':  return 'tax_invoice';
    case 'fuelRequests':    return 'collection_receipt';
    case 'workOrders':      return 'work_document';
    default:                return 'other';
  }
}

export interface Attachment {
  name: string;
  url: string;
  storagePath: string;
  size: number;
  mimeType: string;
  docType: DocType;
  uploadedAt: string;   // ISO string
  uploadedById: string;
  vaultDocId?: string;  // ref to /documents/{id} for vault + cleanup
}

/** Shape stored in top-level `documents` collection (the vault). */
export interface VaultDocument {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  size: number;
  mimeType: string;
  docType: DocType;
  entityCollection: string;
  entityId: string;
  entityDisplayId: string;
  uploadedAt: string;
  uploadedById: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function storage() {
  const s = getStorageInstance();
  if (!s) throw new Error('[storage] Firebase Storage not configured');
  return s;
}

function db() {
  const d = getDbInstance();
  if (!d) throw new Error('[storage] Firestore not configured');
  return d;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export function uploadEntityFile(
  col: string,
  entityId: string,
  entityDisplayId: string,
  file: File,
  uploadedById: string,
  onProgress?: (pct: number) => void,
): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const uuid = crypto.randomUUID();
    const storagePath = `${col}/${entityId}/${uuid}_${file.name}`;
    const fileRef = ref(storage(), storagePath);
    const task = uploadBytesResumable(fileRef, file, { contentType: file.type });

    task.on(
      'state_changed',
      (snap) => {
        if (onProgress) onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      (err) => reject(err),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          const docType = inferDocType(col);

          // 1. Write to vault (documents collection)
          const vaultRef = await addDoc(collection(db(), 'documents'), {
            name: file.name,
            url,
            storagePath,
            size: file.size,
            mimeType: file.type,
            docType,
            entityCollection: col,
            entityId,
            entityDisplayId,
            uploadedAt: new Date().toISOString(),
            uploadedById,
          } satisfies Omit<VaultDocument, 'id'>);

          // 2. Write to entity attachments array
          const attachment: Attachment = {
            name: file.name,
            url,
            storagePath,
            size: file.size,
            mimeType: file.type,
            docType,
            uploadedAt: new Date().toISOString(),
            uploadedById,
            vaultDocId: vaultRef.id,
          };

          await updateDoc(doc(db(), col, entityId), {
            attachments: arrayUnion(attachment),
          });

          resolve(attachment);
        } catch (e) {
          reject(e);
        }
      },
    );
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteEntityFile(
  col: string,
  entityId: string,
  attachment: Attachment,
): Promise<void> {
  // 1. Storage
  await deleteObject(ref(storage(), attachment.storagePath));

  // 2. Vault
  if (attachment.vaultDocId) {
    await deleteDoc(doc(db(), 'documents', attachment.vaultDocId));
  }

  // 3. Entity array
  await updateDoc(doc(db(), col, entityId), {
    attachments: arrayRemove(attachment),
  });
}
