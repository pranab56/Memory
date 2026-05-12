'use client';

import { useState, useRef, useCallback } from 'react';
import { formatBytes } from '@/utils/format';
import { MAX_UPLOAD_FILE_BYTES, MAX_UPLOAD_FILE_LABEL } from '@/lib/upload/limits';
import { useUploadMediaMutation } from '@/lib/redux/api/mediaApi';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  preview?: string;
}

interface UploadZoneProps {
  onUploadComplete: () => void;
}

function FileIcon({ type }: { type: string }) {
  const isVideo = type.startsWith('video/');
  return (
    <div style={{
      width: '40px', height: '40px', borderRadius: '10px',
      background: isVideo ? 'rgba(168,85,247,0.15)' : 'rgba(6,182,212,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {isVideo ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" fill="#a855f7"/>
          <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="#06b6d4"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="white"/>
          <polyline points="21 15 16 10 5 21" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
}

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploadMedia, { isLoading: isUploading }] = useUploadMediaMutation();
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: File[]) => {
    const entries: UploadFile[] = newFiles.map((file) => {
      const id = Math.random().toString(36).slice(2);
      if (file.size > MAX_UPLOAD_FILE_BYTES) {
        return {
          id,
          file,
          progress: 0,
          status: 'error' as const,
          error: `Max ${MAX_UPLOAD_FILE_LABEL} per file`,
        };
      }
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }
      return { id, file, progress: 0, status: 'pending', preview };
    });
    setFiles((prev) => [...prev, ...entries]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    addFiles(droppedFiles);
  }, [addFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadAll = async () => {
    const pending = files.filter(f => f.status === 'pending');
    if (!pending.length) return;

    // Upload in batches of 5
    const batchSize = 5;
    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize);
      const formData = new FormData();
      batch.forEach(f => formData.append('files', f.file));

      // Set uploading state
      setFiles(prev => prev.map(f =>
        batch.find(b => b.id === f.id) ? { ...f, status: 'uploading', progress: 10 } : f
      ));

      try {
        const data = await uploadMedia(formData).unwrap();

        if (data.success) {
          setFiles(prev => prev.map(f =>
            batch.find(b => b.id === f.id) ? { ...f, status: 'done', progress: 100 } : f
          ));
        } else {
          setFiles(prev => prev.map(f =>
            batch.find(b => b.id === f.id)
              ? { ...f, status: 'error', error: 'Upload failed' }
              : f
          ));
        }
      } catch (err) {
        const errorData = err as { data?: { error?: string } };
        setFiles(prev => prev.map(f =>
          batch.find(b => b.id === f.id)
            ? { ...f, status: 'error', error: errorData.data?.error || 'Network error' }
            : f
        ));
      }
    }

    onUploadComplete();
  };

  const clearCompleted = () => {
    setFiles(prev => {
      prev.filter(f => f.preview && f.status === 'done').forEach(f => URL.revokeObjectURL(f.preview!));
      return prev.filter(f => f.status !== 'done');
    });
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const doneCount = files.filter(f => f.status === 'done').length;

  return (
    <div>
      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`upload-zone-target ${isDragging ? 'drop-zone-active' : ''}`}
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          background: isDragging ? 'var(--accent-muted)' : 'var(--bg-secondary)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s',
            transform: isDragging ? 'scale(1.1)' : 'scale(1)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
              <polyline points="17 8 12 3 7 8" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="3" x2="12" y2="15" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '15px', marginBottom: '6px' }}>
              {isDragging ? 'Release to upload' : 'Drag & drop files here'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              or <span style={{ color: 'var(--accent)', fontWeight: '500' }}>browse files</span> · Images & Videos · Up to {MAX_UPLOAD_FILE_LABEL} each
            </p>
          </div>
          <div className="upload-format-row">
            {['JPG', 'PNG', 'GIF', 'WebP', 'MP4', 'WebM', 'MOV'].map(fmt => (
              <span key={fmt} style={{
                padding: '3px 8px', borderRadius: '6px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500'
              }}>{fmt}</span>
            ))}
          </div>
        </div>
      </div>

      {/* File Queue */}
      {files.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div
            className="upload-queue-toolbar"
            style={{ display: 'flex', marginBottom: '12px' }}
          >
            <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Queue · {files.length} file{files.length !== 1 ? 's' : ''}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
              {doneCount > 0 && (
                <button
                  type="button"
                  onClick={clearCompleted}
                  style={{
                    padding: '10px 14px',
                    minHeight: 'var(--touch-min, 44px)',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Clear done ({doneCount})
                </button>
              )}
              {pendingCount > 0 && (
                <button
                  type="button"
                  onClick={uploadAll}
                  disabled={isUploading}
                  style={{
                    padding: '10px 18px',
                    minHeight: 'var(--touch-min, 44px)',
                    borderRadius: '10px',
                    border: 'none',
                    background: isUploading ? 'var(--border)' : 'var(--accent)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-sans)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isUploading && <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />}
                  {isUploading ? 'Uploading...' : `Upload ${pendingCount} file${pendingCount !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
            {files.map(f => (
              <div key={f.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px', borderRadius: '12px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
              }}>
                {/* Preview or icon */}
                {f.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.preview} alt="" style={{
                    width: '40px', height: '40px', borderRadius: '8px',
                    objectFit: 'cover', flexShrink: 0,
                  }} />
                ) : (
                  <FileIcon type={f.file.type} />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: '4px'
                  }}>{f.file.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatBytes(f.file.size)}</p>
                    {f.status === 'uploading' && (
                      <div style={{
                        flex: 1, height: '3px', borderRadius: '2px',
                        background: 'var(--border)', overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: '2px',
                          background: 'linear-gradient(90deg, var(--accent), #a855f7)',
                          width: `${f.progress}%`, transition: 'width 0.3s ease',
                        }} />
                      </div>
                    )}
                    {f.status === 'done' && (
                      <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '500' }}>✓ Uploaded</span>
                    )}
                    {f.status === 'error' && (
                      <span style={{ fontSize: '11px', color: 'var(--error)' }}>{f.error}</span>
                    )}
                  </div>
                </div>

                {f.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    aria-label="Remove from queue"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'var(--bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
