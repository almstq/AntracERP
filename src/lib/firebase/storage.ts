import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getStorageInstance, getDbInstance } from './client';

export interface Attachment {
  name: string;
  url: string;
  storagePath: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedById: string;
}

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

/** Upload a file to Storage under `{collection}/{entityId}/` and save metadata to Firestore. */
export function uploadEntityFile(
  collection: string,
  entityId: string,
  file: File,
  uploadedById: string,
  onProgress?: (pct: number) => void,
): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const uuid = crypto.randomUUID();
    const storagePath = `${collection}/${entityId}/${uuid}_${file.name}`;
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
          const attachment: Attachment = {
            name: file.name,
            url,
            storagePath,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            uploadedById,
          };
          await updateDoc(doc(db(), collection, entityId), {
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

/** Delete a file from Storage and remove its metadata from Firestore. */
export async function deleteEntityFile(
  collection: string,
  entityId: string,
  attachment: Attachment,
): Promise<void> {
  const fileRef = ref(storage(), attachment.storagePath);
  await deleteObject(fileRef);
  await updateDoc(doc(db(), collection, entityId), {
    attachments: arrayRemove(attachment),
  });
}
