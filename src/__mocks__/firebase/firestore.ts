export const collection = () => ({});
export const doc = () => ({});
export const getDoc = async () => ({ exists: () => false, data: () => undefined, id: '' });
export const getDocs = async () => ({ docs: [], forEach: () => {} });
export const setDoc = async () => {};
export const updateDoc = async () => {};
export const addDoc = async () => ({ id: 'mock-id' });
export const deleteDoc = async () => {};
export const query = (..._args: unknown[]) => ({});
export const where = (..._args: unknown[]) => ({});
export const orderBy = (..._args: unknown[]) => ({});
export const limit = (..._args: unknown[]) => ({});
export const writeBatch = () => ({ set: () => {}, update: () => {}, delete: () => {}, commit: async () => {} });
export const serverTimestamp = () => new Date();
export const Timestamp = { fromDate: (d: Date) => d, now: () => new Date() };
export const documentId = () => '__name__';
export const runTransaction = async (_db: unknown, fn: (tx: unknown) => Promise<unknown>) => fn({ get: async () => ({ data: () => undefined, exists: () => false }), set: () => {} });
// Additional stubs used by client.ts initialisation
export const getFirestore = (_app?: unknown) => ({});
export const initializeFirestore = (_app: unknown, _settings?: unknown) => ({});
export const persistentLocalCache = (_opts?: unknown) => ({});
export const persistentMultipleTabManager = () => ({});
export type CollectionReference = object;
export type DocumentReference = object;
export type Firestore = object;
export type DocumentData = Record<string, unknown>;
export type QueryConstraint = object;
export type WriteBatch = ReturnType<typeof writeBatch>;

