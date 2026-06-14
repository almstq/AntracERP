import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import type { UploadTaskSnapshot } from 'firebase/storage';
import { doc, updateDoc, addDoc, deleteDoc, arrayUnion, arrayRemove, collection } from 'firebase/firestore';
import { getStorageInstance, getDbInstance } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocType =
  | 'site_photo'
  | 'tax_invoice'
  | 'collection_receipt'
  | 'work_document'
  | 'weekly_snapshot'
  | 'other';

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  site_photo:         'Site Photo',
  tax_invoice:        'Tax Invoice / Receipt',
  collection_receipt: 'Collection Receipt',
  work_document:      'Work Document',
  weekly_snapshot:    'Weekly Snapshot',
  other:              'Other',
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
  /** @deprecated legacy field (pre-vault uploads stored MIME as `type`). Read via mimeOf(). */
  type?: string;
  docType: DocType;
  uploadedAt: string;        // ISO string
  uploadedById: string;
  uploadedByName: string;    // display name at time of upload
  sha256: string | null;     // hex SHA-256 of file bytes; null = legacy upload
  vaultDocId?: string;       // ref to /documents/{id} for vault + cleanup
}

/** MIME type of an attachment, tolerant of legacy records that used `type`. */
export function mimeOf(att: { mimeType?: string; type?: string }): string {
  return att.mimeType ?? att.type ?? '';
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
  uploadedByName: string;    // display name at time of upload
  sha256: string | null;     // hex SHA-256; null = legacy
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

/** SHA-256 of file bytes using SubtleCrypto (no external library). */
async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface Uploader {
  uid: string;
  displayName: string;
}

export function uploadEntityFile(
  col: string,
  entityId: string,
  entityDisplayId: string,
  file: File,
  uploader: Uploader,
  onProgress?: (pct: number) => void,
): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    // Kick off SHA-256 and storage upload in parallel; both must complete.
    const hashPromise = computeSha256(file);

    const uuid = crypto.randomUUID();
    const storagePath = `${col}/${entityId}/${uuid}_${file.name}`;
    const fileRef = ref(storage(), storagePath);
    const task = uploadBytesResumable(fileRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedById: uploader.uid,
        entityCollection: col,
        entityId,
      },
    });

    task.on(
      'state_changed',
      (snap: UploadTaskSnapshot) => {
        if (onProgress) onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      (err: Error) => reject(err),
      async () => {
        try {
          const [url, sha256] = await Promise.all([
            getDownloadURL(task.snapshot.ref),
            hashPromise,
          ]);

          const docType = inferDocType(col);
          const uploadedAt = new Date().toISOString();

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
            uploadedAt,
            uploadedById: uploader.uid,
            uploadedByName: uploader.displayName,
            sha256,
          } satisfies Omit<VaultDocument, 'id'>);

          // 2. Append to entity attachments array
          const attachment: Attachment = {
            name: file.name,
            url,
            storagePath,
            size: file.size,
            mimeType: file.type,
            docType,
            uploadedAt,
            uploadedById: uploader.uid,
            uploadedByName: uploader.displayName,
            sha256,
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
  // 1. Storage object
  await deleteObject(ref(storage(), attachment.storagePath));

  // 2. Vault document
  if (attachment.vaultDocId) {
    await deleteDoc(doc(db(), 'documents', attachment.vaultDocId));
  }

  // 3. Remove from entity array via exact-object arrayRemove.
  // Known limitation (QA M4): relies on byte-exact object match; storagePath-based
  // filter-and-write is the future hardening path.
  await updateDoc(doc(db(), col, entityId), {
    attachments: arrayRemove(attachment),
  });
}
