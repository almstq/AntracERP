import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getDbInstance } from '../../../lib/firebase/client';
import { DOC_TYPE_LABELS, type DocType, type VaultDocument } from '../../../lib/firebase/storage';
import { Download, Eye, FileText, Image, FolderOpen, X, ShieldCheck } from 'lucide-react';
import { PageContainer } from '../../../components/shared/PageContainer';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-MV', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ENTITY_LABELS: Record<string, string> = {
  tickets:        'Ticket',
  purchaseOrders: 'Purchase Order',
  workOrders:     'Work Order',
  fuelRequests:   'Fuel Request',
};

const ENTITY_ROUTES: Record<string, string> = {
  tickets:        '/wli/tickets',
  purchaseOrders: '/wli/procurement/orders',
  workOrders:     '/wli/crm/work-orders',
  fuelRequests:   '/wli/fuel/requests',
};

function isViewable(mimeType: string) {
  return mimeType.startsWith('image/') || mimeType === 'application/pdf';
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <Image size={14} className="text-blue shrink-0" />;
  return <FileText size={14} className="text-text-muted shrink-0" />;
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({ doc, onClose }: { doc: VaultDocument; onClose: () => void }) {
  const isImage = doc.mimeType.startsWith('image/');
  const isPdf   = doc.mimeType === 'application/pdf';
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 bg-bg-overlay shrink-0" onClick={e => e.stopPropagation()}>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate max-w-xs">{doc.name}</p>
          <p className="text-[10px] text-text-muted">
            {doc.entityDisplayId} · {DOC_TYPE_LABELS[doc.docType]}
            {doc.uploadedByName && ` · ${doc.uploadedByName}`}
            {doc.uploadedAt && ` · ${formatDate(doc.uploadedAt)}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a href={doc.url} download={doc.name} className="flex items-center gap-1 text-xs text-blue hover:underline" onClick={e => e.stopPropagation()}>
            <Download size={13} /> Download
          </a>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {isImage && <img src={doc.url} alt={doc.name} className="max-w-full max-h-full rounded-lg object-contain shadow-2xl" />}
        {isPdf && <iframe src={doc.url} title={doc.name} className="w-full h-full rounded-lg bg-white" style={{ minHeight: '70vh' }} />}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ALL = '__all__';

export function DocumentVault() {
  const [docs, setDocs]       = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [preview, setPreview] = useState<VaultDocument | null>(null);

  // Filter state
  const [entityFilter, setEntityFilter] = useState<string>(ALL);
  const [typeFilter,   setTypeFilter]   = useState<string>(ALL);
  const [search,       setSearch]       = useState('');

  useEffect(() => {
    const db = getDbInstance();
    if (!db) { setError('Firebase not configured'); setLoading(false); return; }

    getDocs(query(collection(db, 'documents'), orderBy('uploadedAt', 'desc')))
      .then(snap => {
        setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() } as VaultDocument)));
        setError(null);
      })
      .catch(e => setError(e?.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = docs.filter(d => {
    if (entityFilter !== ALL && d.entityCollection !== entityFilter) return false;
    if (typeFilter   !== ALL && d.docType           !== typeFilter)   return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) &&
        !d.entityDisplayId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const entityCollections = [...new Set(docs.map(d => d.entityCollection))];
  const docTypes          = [...new Set(docs.map(d => d.docType))];

  const sel = 'text-xs p-1.5 rounded-lg bg-bg-surface border border-border text-text-primary';

  return (
    <>
      <PageContainer>

        {/* Header */}
        <div className="flex items-center gap-3">
          <FolderOpen size={20} className="text-text-muted shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-text-primary">Document Vault</h1>
            <p className="text-xs text-text-muted">All uploaded files across tickets, POs, work orders and fuel requests</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="search"
            placeholder="Search by name or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-xs p-1.5 rounded-lg bg-bg-surface border border-border text-text-primary w-52 placeholder:text-text-muted"
          />
          <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className={sel}>
            <option value={ALL}>All entity types</option>
            {entityCollections.map(c => (
              <option key={c} value={c}>{ENTITY_LABELS[c] ?? c}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={sel}>
            <option value={ALL}>All doc types</option>
            {docTypes.map(t => (
              <option key={t} value={t}>{DOC_TYPE_LABELS[t as DocType] ?? t}</option>
            ))}
          </select>
          <span className="text-[11px] text-text-muted ml-auto">{filtered.length} file{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Content */}
        {loading && <LoadingSpinner text="Loading…" />}
        {error   && <p className="text-xs text-red py-4 text-center">{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-12 text-center">
            <FolderOpen size={32} className="mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-muted">No documents yet.</p>
            <p className="text-xs text-text-muted mt-1">
              Upload files from any ticket, PO, work order or fuel request page.
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(doc => {
              const viewable  = isViewable(doc.mimeType);
              const entityRoute = `${ENTITY_ROUTES[doc.entityCollection] ?? '#'}/${doc.entityId}`;
              return (
                <div key={doc.id} className="flex items-center gap-4 p-5 rounded-xl bg-bg-card border border-border hover:border-border-hover transition-colors">
                  <FileIcon mimeType={doc.mimeType} />

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-medium truncate ${viewable ? 'text-blue cursor-pointer hover:underline' : 'text-text-primary'}`}
                      onClick={() => viewable && setPreview(doc)}
                    >
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg-surface text-text-muted">
                        {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
                      </span>
                      <Link to={entityRoute} className="text-[10px] text-blue hover:underline">
                        {ENTITY_LABELS[doc.entityCollection] ?? doc.entityCollection} · {doc.entityDisplayId}
                      </Link>
                      <span className="text-[10px] text-text-muted">{formatBytes(doc.size)}</span>
                      <span className="text-[10px] text-text-muted">
                        {doc.uploadedByName ?? doc.uploadedById}
                      </span>
                      <span className="text-[10px] text-text-muted">{formatDate(doc.uploadedAt)}</span>
                      {'sha256' in doc && (
                        <button
                          type="button"
                          title="File integrity checksum — proves document was not modified after upload. Click to copy."
                          onClick={() => (doc as VaultDocument).sha256 && navigator.clipboard.writeText((doc as VaultDocument).sha256!)}
                          className="flex items-center gap-1 text-[10px] font-mono text-text-muted hover:text-teal transition-colors"
                        >
                          <ShieldCheck size={10} className={(doc as VaultDocument).sha256 ? 'text-teal' : 'text-text-muted'} />
                          {(doc as VaultDocument).sha256
                            ? (doc as VaultDocument).sha256!.slice(0, 8) + '…'
                            : '—'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {viewable && (
                      <button
                        onClick={() => setPreview(doc)}
                        className="text-text-muted hover:text-blue"
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                    )}
                    <a
                      href={doc.url}
                      download={doc.name}
                      className="text-text-muted hover:text-text-primary"
                      title="Download"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>

      {preview && <PreviewModal doc={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
