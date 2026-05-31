import { useRef, useState } from 'react';
import { Paperclip, Download, Trash2, Upload, FileText, Image, Eye, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { uploadEntityFile, deleteEntityFile, type Attachment } from '../../lib/firebase/storage';
import { useAuth } from '../../lib/hooks/useAuth';

interface Props {
  collection: string;
  entityId: string;
  entityDisplayId?: string;
  attachments?: Attachment[];
  onUpdate: () => void;
  label?: string;
  accept?: string;
  readonly?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isViewable(mimeType: string) {
  return mimeType.startsWith('image/') || mimeType === 'application/pdf';
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <Image size={14} className="text-blue shrink-0" />;
  return <FileText size={14} className="text-text-muted shrink-0" />;
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({ att, onClose }: { att: Attachment; onClose: () => void }) {
  const isImage = att.mimeType.startsWith('image/');
  const isPdf   = att.mimeType === 'application/pdf';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-bg-overlay shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-sm font-medium text-text-primary truncate max-w-xs">{att.name}</span>
        <div className="flex items-center gap-3">
          <a
            href={att.url}
            download={att.name}
            className="flex items-center gap-1 text-xs text-blue hover:underline"
            onClick={e => e.stopPropagation()}
          >
            <Download size={13} /> Download
          </a>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 flex items-center justify-center p-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {isImage && (
          <img
            src={att.url}
            alt={att.name}
            className="max-w-full max-h-full rounded-lg object-contain shadow-2xl"
          />
        )}
        {isPdf && (
          <iframe
            src={att.url}
            title={att.name}
            className="w-full h-full rounded-lg bg-white"
            style={{ minHeight: '70vh' }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FileUpload({
  collection,
  entityId,
  entityDisplayId = entityId,
  attachments = [],
  onUpdate,
  label = 'Attachments',
  accept = 'image/*,.pdf,.doc,.docx,.xlsx,.xls',
  readonly = false,
}: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [preview, setPreview] = useState<Attachment | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !user) return;
    setErr(null);
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) { setErr(`${file.name} exceeds 20 MB limit`); continue; }
      try {
        setProgress(0);
        await uploadEntityFile(collection, entityId, entityDisplayId, file, user.uid, setProgress);
        setProgress(null);
        onUpdate();
      } catch (e) {
        setProgress(null);
        setErr(e instanceof Error ? e.message : 'Upload failed');
      }
    }
  }

  async function handleDelete(att: Attachment) {
    if (!confirm(`Delete "${att.name}"?`)) return;
    setDeleting(att.storagePath);
    try {
      await deleteEntityFile(collection, entityId, att);
      onUpdate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <Card header={
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-medium flex items-center gap-2">
            <Paperclip size={14} />
            {label}
            {attachments.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg-surface text-text-muted">
                {attachments.length}
              </span>
            )}
          </span>
          {!readonly && (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={progress !== null}
              className="flex items-center gap-1 text-[11px] text-blue hover:underline disabled:opacity-50"
            >
              <Upload size={12} />
              {progress !== null ? `${progress}%` : 'Upload'}
            </button>
          )}
        </div>
      }>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
          onClick={e => { (e.target as HTMLInputElement).value = ''; }}
        />

        {progress !== null && (
          <div className="w-full bg-bg-surface rounded-full h-1 mb-2 overflow-hidden">
            <div
              className="h-1 bg-blue rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {err && <p className="text-[11px] text-red mb-2">{err}</p>}

        {attachments.length === 0 ? (
          <p className="text-xs text-text-muted py-2 text-center">
            {readonly ? 'No attachments.' : 'No attachments — click Upload to add files.'}
          </p>
        ) : (
          <div className="space-y-1.5">
            {attachments.map((att) => {
              const viewable = isViewable(att.mimeType);
              return (
                <div
                  key={att.storagePath}
                  className="flex items-center gap-2 p-2 rounded-lg bg-bg-surface text-xs group"
                >
                  <FileIcon mimeType={att.mimeType} />

                  {/* Name + meta */}
                  <div
                    className={`flex-1 min-w-0 ${viewable ? 'cursor-pointer' : ''}`}
                    onClick={() => viewable && setPreview(att)}
                  >
                    <p className={`truncate ${viewable ? 'text-blue hover:underline' : 'text-text-primary'}`}>
                      {att.name}
                    </p>
                    <p className="text-[10px] text-text-muted">{formatBytes(att.size)}</p>
                  </div>

                  {/* View — images + PDFs only */}
                  {viewable && (
                    <button
                      onClick={() => setPreview(att)}
                      className="text-text-muted hover:text-blue shrink-0"
                      title="View"
                    >
                      <Eye size={13} />
                    </button>
                  )}

                  {/* Download — always */}
                  <a
                    href={att.url}
                    download={att.name}
                    className="text-text-muted hover:text-text-primary shrink-0"
                    title="Download"
                    onClick={e => e.stopPropagation()}
                  >
                    <Download size={13} />
                  </a>

                  {/* Delete */}
                  {!readonly && (
                    <button
                      onClick={() => handleDelete(att)}
                      disabled={deleting === att.storagePath}
                      className="text-text-muted hover:text-red shrink-0 disabled:opacity-40"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {preview && <PreviewModal att={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
