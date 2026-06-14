/**
 * Ambient module declarations for packages that ship JS without built-in types.
 * Phase Zero Recovery — ERP-M011.
 *
 * lucide-react, firebase v12, and @tanstack/react-query v5 all ship as pure ESM
 * with no .d.ts files in the installed distributable. moduleResolution: bundler
 * can't resolve them for type-checking purposes, so we declare them here.
 *
 * TODO: When these packages add proper types, remove the relevant sections.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── lucide-react ────────────────────────────────────────────────────────────
// v1.16.0 — ships dist/cjs/lucide-react.js with no type declarations.
declare module 'lucide-react' {
  import type { ComponentType, SVGProps } from 'react';
  export type LucideProps = SVGProps<SVGSVGElement> & {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
  };
  export type LucideIcon = ComponentType<LucideProps>;

  export const Activity: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Anchor: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowLeftRight: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowRightLeft: LucideIcon;
  export const Banknote: LucideIcon;
  export const BarChart2: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Bell: LucideIcon;
  export const Boxes: LucideIcon;
  export const Briefcase: LucideIcon;
  export const Building2: LucideIcon;
  export const Calendar: LucideIcon;
  export const CalendarDays: LucideIcon;
  export const Camera: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCheck: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronsUpDown: LucideIcon;
  export const ClipboardCheck: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const Clock: LucideIcon;
  export const CloudSun: LucideIcon;
  export const Contact: LucideIcon;
  export const CreditCard: LucideIcon;
  export const Database: LucideIcon;
  export const DollarSign: LucideIcon;
  export const Download: LucideIcon;
  export const Droplets: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Eye: LucideIcon;
  export const Factory: LucideIcon;
  export const FileSearch: LucideIcon;
  export const FileText: LucideIcon;
  export const Filter: LucideIcon;
  export const FolderOpen: LucideIcon;
  export const Fuel: LucideIcon;
  export const Gauge: LucideIcon;
  export const HardHat: LucideIcon;
  export const Home: LucideIcon;
  export const Image: LucideIcon;
  export const Inbox: LucideIcon;
  export const Info: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const LayoutGrid: LucideIcon;
  export const LogOut: LucideIcon;
  export const Map: LucideIcon;
  export const MapPin: LucideIcon;
  export const Menu: LucideIcon;
  export const Minus: LucideIcon;
  export const Moon: LucideIcon;
  export const Navigation: LucideIcon;
  export const Package: LucideIcon;
  export const PackageCheck: LucideIcon;
  export const Paperclip: LucideIcon;
  export const Pencil: LucideIcon;
  export const Plus: LucideIcon;
  export const Radio: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Search: LucideIcon;
  export const Send: LucideIcon;
  export const Settings: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const ShieldX: LucideIcon;
  export const Ship: LucideIcon;
  export const ShoppingCart: LucideIcon;
  export const SlidersHorizontal: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Stethoscope: LucideIcon;
  export const Store: LucideIcon;
  export const Sun: LucideIcon;
  export const Ticket: LucideIcon;
  export const Timer: LucideIcon;
  export const Trash2: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Truck: LucideIcon;
  export const Upload: LucideIcon;
  export const User: LucideIcon;
  export const UserCheck: LucideIcon;
  export const UserCog: LucideIcon;
  export const UserPlus: LucideIcon;
  export const Users: LucideIcon;
  export const Warehouse: LucideIcon;
  export const Wind: LucideIcon;
  export const Wrench: LucideIcon;
  export const X: LucideIcon;
  export const XCircle: LucideIcon;
}

// ── firebase/app ─────────────────────────────────────────────────────────────
declare module 'firebase/app' {
  export interface FirebaseOptions {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    databaseURL?: string;
    measurementId?: string;
  }
  export interface FirebaseApp {
    name: string;
    options: FirebaseOptions;
    automaticDataCollectionEnabled: boolean;
  }
  export function initializeApp(options?: FirebaseOptions, name?: string): FirebaseApp;
  export function getApp(name?: string): FirebaseApp;
  export function getApps(): FirebaseApp[];
}

// ── firebase/auth ────────────────────────────────────────────────────────────
declare module 'firebase/auth' {
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    emailVerified: boolean;
    isAnonymous: boolean;
    phoneNumber: string | null;
    photoURL: string | null;
    providerData: any[];
    refreshToken: string;
    tenantId: string | null;
    delete(): Promise<void>;
    getIdToken(forceRefresh?: boolean): Promise<string>;
    reload(): Promise<void>;
  }
  export interface Auth {
    currentUser: User | null;
    onAuthStateChanged(
      nextOrObserver: (user: User | null) => void,
      error?: (error: Error) => void,
      completed?: () => void,
    ): () => void;
  }
  export function getAuth(app?: any): Auth;
  export class GoogleAuthProvider {
    constructor();
    addScope(scope: string): GoogleAuthProvider;
    setCustomParameters(params: Record<string, string>): GoogleAuthProvider;
  }
  export function signInWithPopup(auth: Auth, provider: GoogleAuthProvider): Promise<{ user: User }>;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<{ user: User }>;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<{ user: User }>;
  export function signOut(auth: Auth): Promise<void>;
  export function onAuthStateChanged(auth: Auth, nextOrObserver: (user: User | null) => void): () => void;
}

// ── firebase/firestore ───────────────────────────────────────────────────────
declare module 'firebase/firestore' {
  export interface DocumentData {
    [field: string]: any;
  }
  export interface QueryDocumentSnapshot<T = DocumentData> {
    id: string;
    exists(): boolean;
    data(options?: { serverTimestamps?: 'estimate' | 'previous' | 'none' }): T | undefined;
    get(fieldPath: string | any): any;
    ref: DocumentReference<T>;
  }
  export interface QuerySnapshot<T = DocumentData> {
    docs: QueryDocumentSnapshot<T>[];
    empty: boolean;
    size: number;
    forEach(callback: (result: QueryDocumentSnapshot<T>) => void): void;
    docChanges(): any[];
  }
  export interface DocumentReference<T = DocumentData> {
    id: string;
    path: string;
    parent: CollectionReference<T>;
    firestore: any;
    collection(collectionPath: string): CollectionReference<DocumentData>;
    get(): Promise<QueryDocumentSnapshot<T>>;
    set(data: T, options?: { merge?: boolean; mergeFields?: string[] }): Promise<void>;
    update(data: Partial<T> | any, ...moreFieldsAndValues: any[]): Promise<void>;
    delete(): Promise<void>;
    onSnapshot(
      onNext: (snapshot: QueryDocumentSnapshot<T>) => void,
      onError?: (error: Error) => void,
    ): () => void;
  }
  export interface CollectionReference<T = DocumentData> extends Query<T> {
    id: string;
    path: string;
    parent: DocumentReference | null;
    doc(documentPath?: string): DocumentReference<T>;
    add(data: Omit<T, 'id'>): Promise<DocumentReference<T>>;
  }
  export interface Query<T = DocumentData> {
    where(fieldPath: string | any, opStr: WhereFilterOp, value: any): Query<T>;
    orderBy(fieldPath: string | any, directionStr?: 'asc' | 'desc'): Query<T>;
    limit(limit: number): Query<T>;
    startAfter(snapshot: QueryDocumentSnapshot<T>): Query<T>;
    get(): Promise<QuerySnapshot<T>>;
    onSnapshot(
      onNext: (snapshot: QuerySnapshot<T>) => void,
      onError?: (error: Error) => void,
    ): () => void;
  }
  export type WhereFilterOp = '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'in' | 'array-contains-any' | 'not-in';
  export interface Firestore {
    collection(collectionPath: string): CollectionReference;
    doc(documentPath: string): DocumentReference;
    runTransaction<R>(updateFunction: (transaction: Transaction) => Promise<R>): Promise<R>;
    batch(): WriteBatch;
  }
  export interface Transaction {
    get<T>(ref: DocumentReference<T>): Promise<QueryDocumentSnapshot<T>>;
    set<T>(ref: DocumentReference<T>, data: T, options?: any): Transaction;
    update<T>(ref: DocumentReference<T>, data: Partial<T> | any, ...rest: any[]): Transaction;
    delete(ref: DocumentReference): Transaction;
  }
  export interface WriteBatch {
    set<T>(ref: DocumentReference<T>, data: T, options?: any): WriteBatch;
    update<T>(ref: DocumentReference<T>, data: Partial<T> | any, ...rest: any[]): WriteBatch;
    delete(ref: DocumentReference): WriteBatch;
    commit(): Promise<void>;
  }
  export class Timestamp {
    readonly seconds: number;
    readonly nanoseconds: number;
    constructor(seconds: number, nanoseconds: number);
    toDate(): Date;
    toMillis(): number;
    isEqual(other: Timestamp): boolean;
    valueOf(): string;
    static now(): Timestamp;
    static fromDate(date: Date): Timestamp;
    static fromMillis(milliseconds: number): Timestamp;
  }

  // Functions
  export function getFirestore(app?: any): Firestore;
  export function initializeFirestore(app: any, settings?: any): Firestore;
  export function persistentLocalCache(settings?: { tabManager?: any }): any;
  export function persistentMultipleTabManager(): any;
  export function collection(firestore: Firestore | any, path: string, ...pathSegments: string[]): CollectionReference;
  export function doc(firestoreOrRef: Firestore | DocumentReference | CollectionReference, path?: string, ...pathSegments: string[]): DocumentReference;
  export function getDoc<T = DocumentData>(reference: DocumentReference<T>): Promise<QueryDocumentSnapshot<T>>;
  export function getDocs<T = DocumentData>(query: Query<T> | CollectionReference<T>): Promise<QuerySnapshot<T>>;
  export function setDoc(reference: DocumentReference, data: any, options?: any): Promise<void>;
  export function updateDoc(reference: DocumentReference, data: any, ...rest: any[]): Promise<void>;
  export function deleteDoc(reference: DocumentReference): Promise<void>;
  export function addDoc(reference: CollectionReference, data: any): Promise<DocumentReference>;
  export function query(q: Query | CollectionReference, ...constraints: any[]): Query;
  export function where(fieldPath: string | any, opStr: WhereFilterOp, value: any): any;
  export function orderBy(fieldPath: string | any, directionStr?: 'asc' | 'desc'): any;
  export function limit(limit: number): any;
  export function serverTimestamp(): any;
  export function arrayUnion(...elements: any[]): any;
  export function arrayRemove(...elements: any[]): any;
  export function writeBatch(firestore: Firestore): WriteBatch;
  export function documentId(): any;
  export function runTransaction<R>(firestore: Firestore, updateFunction: (transaction: Transaction) => Promise<R>): Promise<R>;
  export function onSnapshot<T = DocumentData>(
    reference: DocumentReference<T> | Query<T> | CollectionReference<T>,
    onNext: (snapshot: QueryDocumentSnapshot<T> | QuerySnapshot<T>) => void,
    onError?: (error: Error) => void,
  ): () => void;
}

// ── firebase/storage ────────────────────────────────────────────────────────
declare module 'firebase/storage' {
  export interface FirebaseStorage {
    ref(path?: string): StorageReference;
    refFromURL(url: string): StorageReference;
  }
  export interface StorageReference {
    bucket: string;
    fullPath: string;
    name: string;
    parent: StorageReference | null;
    root: StorageReference;
    storage: FirebaseStorage;
    put(data: Blob | Uint8Array | ArrayBuffer, metadata?: any): UploadTask;
    getDownloadURL(): Promise<string>;
    delete(): Promise<void>;
    getMetadata(): Promise<any>;
    list(options?: any): Promise<ListResult>;
    listAll(): Promise<ListResult>;
  }
  export interface UploadTask {
    snapshot: UploadTaskSnapshot;
    cancel(): boolean;
    on(event: any, nextOrObserver?: any, error?: any, complete?: any): () => void;
    pause(): boolean;
    resume(): boolean;
    then(
      onFulfilled?: (snapshot: UploadTaskSnapshot) => any,
      onRejected?: (error: any) => any,
    ): Promise<any>;
    catch(onRejected: (error: any) => any): Promise<any>;
  }
  export interface UploadTaskSnapshot {
    bytesTransferred: number;
    metadata: any;
    ref: StorageReference;
    state: any;
    task: UploadTask;
    totalBytes: number;
  }
  export interface ListResult {
    items: StorageReference[];
    nextPageToken: string | null;
    prefixes: StorageReference[];
  }
  export function getStorage(app?: any): FirebaseStorage;
  export function ref(storage: FirebaseStorage, path?: string): StorageReference;
  export function uploadBytes(ref: StorageReference, data: Blob | Uint8Array | ArrayBuffer, metadata?: any): Promise<UploadTaskSnapshot>;
  export function uploadBytesResumable(ref: StorageReference, data: Blob | Uint8Array | ArrayBuffer, metadata?: any): UploadTask;
  export function getDownloadURL(ref: StorageReference): Promise<string>;
  export function deleteObject(ref: StorageReference): Promise<void>;
  export function getMetadata(ref: StorageReference): Promise<any>;
  export function listAll(ref: StorageReference): Promise<ListResult>;
}

// ── @tanstack/react-query ────────────────────────────────────────────────────
declare module '@tanstack/react-query' {
  export class QueryClient {
    constructor(options?: {
      defaultOptions?: {
        queries?: {
          retry?: number | false;
          refetchOnWindowFocus?: boolean;
          staleTime?: number;
          gcTime?: number;
          refetchOnMount?: boolean | 'always';
          refetchOnReconnect?: boolean | 'always';
        };
      };
      queryCache?: any;
      mutationCache?: any;
    });
    defaultOptions: {
      queries?: Record<string, any>;
    };
    getQueryData<T>(queryKey: readonly unknown[]): T | undefined;
    setQueryData<T>(queryKey: readonly unknown[], data: T | ((old: T | undefined) => T)): void;
    invalidateQueries(filters?: { queryKey?: readonly unknown[]; exact?: boolean }): Promise<void>;
    resetQueries(filters?: { queryKey?: readonly unknown[] }): Promise<void>;
    removeQueries(filters?: { queryKey?: readonly unknown[] }): void;
    fetchQuery<T>(options: any): Promise<T>;
    prefetchQuery<T>(options: any): Promise<void>;
    getQueryCache(): any;
    getMutationCache(): any;
    clear(): void;
    mount(): void;
    unmount(): void;
  }

  export function QueryClientProvider(props: { client: QueryClient; children: any }): any;

  export function useQuery<TData = unknown, TError = Error>(options: {
    queryKey: readonly unknown[];
    queryFn: (context: any) => TData | Promise<TData>;
    enabled?: boolean;
    retry?: number | false;
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
    refetchOnReconnect?: boolean;
    select?: (data: any) => any;
    placeholderData?: any;
    initialData?: any;
  }): {
    data: TData | undefined;
    error: TError | null;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    isFetching: boolean;
    refetch: () => Promise<void>;
    status: 'pending' | 'error' | 'success';
  };

  export function useMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(options: {
    mutationFn: (variables: TVariables) => TData | Promise<TData>;
    onMutate?: (variables: TVariables) => Promise<TContext | undefined> | TContext | undefined;
    onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => Promise<void> | void;
    onError?: (error: TError, variables: TVariables, context: TContext | undefined) => Promise<void> | void;
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => Promise<void> | void;
  }): {
    mutate: (variables: TVariables, options?: any) => void;
    mutateAsync: (variables: TVariables, options?: any) => Promise<TData>;
    data: TData | undefined;
    error: TError | null;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    isIdle: boolean;
    reset: () => void;
    status: 'idle' | 'pending' | 'error' | 'success';
  };

  export function useQueryClient(): QueryClient;
  export function useInfiniteQuery(options: any): any;
  export function useQueries(options: any): any;
  export function useIsFetching(filters?: any): number;
  export function useIsMutating(filters?: any): number;
  export function queryOptions(options: any): any;
}
