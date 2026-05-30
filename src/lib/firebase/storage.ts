/**
 * Firebase Storage stubs — Phase 2A draft only
 * No delete function. Upload and list only.
 */

export async function uploadFile(path: string): Promise<string> {
  // TODO: Implement Firebase Storage upload
  console.log('[storage] uploadFile — Firebase not configured', path);
  return `https://storage.mock/${path}`;
}

export async function getDownloadUrl(path: string): Promise<string> {
  // TODO: Implement Firebase Storage getDownloadURL
  console.log('[storage] getDownloadUrl — Firebase not configured', path);
  return `https://storage.mock/${path}`;
}

export async function listFiles(path: string): Promise<string[]> {
  // TODO: Implement Firebase Storage listAll
  console.log('[storage] listFiles — Firebase not configured', path);
  return [];
}
