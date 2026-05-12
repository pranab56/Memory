'use client';

import { useState } from 'react';
import type { MediaItem } from '@/modules/media/types';
import { formatBytes, formatDate } from '@/utils/format';
import { useDeleteMediaMutation } from '@/lib/redux/api/mediaApi';

interface MediaCardProps {
  item: MediaItem;
  onDelete: (id: string) => void;
  onView: () => void;
  baseURL: string;
  index: number;
}

export default function MediaCard({ item, onDelete, onView, baseURL, index }: MediaCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMedia, { isLoading: deleting }] = useDeleteMediaMutation();

  const filePath = item.image || item.video;
  const isExternal = filePath?.startsWith('http');
  const mediaUrl = filePath ? (isExternal ? filePath : `${baseURL}/api/files${filePath}`) : '';
  const isImage = item.type === 'image';

  const handleDelete = async () => {
    try {
      await deleteMedia(item._id).unwrap();
      onDelete(item._id);
    } catch {
      setShowDeleteConfirm(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div
      className="animate-fade-in-scale"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
        animationDelay: `${Math.min(index * 40, 300)}ms`,
        animationFillMode: 'both',
        opacity: 0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Media Preview */}
      <div 
        className="media-card-preview" 
        onClick={onView}
        style={{ cursor: 'pointer' }}
      >
        {isImage ? (
          imgError ? (
            <div style={{
              width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: '11px' }}>Preview unavailable</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt={item.originalName}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          )
        ) : (
          <video
            src={mediaUrl}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            preload="metadata"
            controls={false}
            muted
            playsInline
            onMouseEnter={e => (e.target as HTMLVideoElement).play()}
            onMouseLeave={e => {
              const v = e.target as HTMLVideoElement;
              v.pause();
              v.currentTime = 0;
            }}
            onTouchStart={e => {
              const v = e.currentTarget;
              v.play().catch(() => {});
            }}
            onTouchEnd={e => {
              const v = e.currentTarget;
              v.pause();
              v.currentTime = 0;
            }}
          />
        )}

        {/* Type Badge */}
        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700',
          letterSpacing: '0.5px', textTransform: 'uppercase',
          background: isImage ? 'rgba(6,182,212,0.9)' : 'rgba(168,85,247,0.9)',
          color: 'white', backdropFilter: 'blur(4px)',
        }}>
          {isImage ? '🖼 Image' : '🎬 Video'}
        </div>

        {/* Delete button overlay */}
        <div 
          style={{ position: 'absolute', top: '10px', right: '10px' }}
          onClick={e => e.stopPropagation()}
        >
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete"
              aria-label="Delete media"
              style={{
                minWidth: '44px', minHeight: '44px', width: '44px', height: '44px', borderRadius: '10px', border: 'none',
                background: 'rgba(0,0,0,0.6)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fca5a5', backdropFilter: 'blur(4px)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          ) : (
            <div style={{
              display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.8)',
              padding: '4px', borderRadius: '10px', backdropFilter: 'blur(4px)',
            }}>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '10px 14px', minHeight: '44px', borderRadius: '8px', border: 'none',
                  background: '#ef4444', color: 'white', fontSize: '12px', fontWeight: '600',
                  cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                {deleting ? '...' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '10px 12px', minHeight: '44px', borderRadius: '8px', border: 'none',
                  background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '12px',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: 'clamp(12px, 3vw, 14px)' }}>
        <p style={{
          fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: '8px',
        }} title={item.originalName}>
          {item.originalName}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {formatBytes(item.size)}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {formatDate(item.uploadedAt)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {/* Open full link */}
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open full size"
              aria-label="Open full size"
              onClick={e => e.stopPropagation()}
              style={{
                minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', borderRadius: '8px',
                color: 'var(--text-muted)', transition: 'color 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2"/>
                <polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2"/>
                <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </a>
            {/* Download button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              title="Download"
              aria-label="Download media"
              style={{
                minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', borderRadius: '8px', border: 'none', background: 'transparent',
                color: 'var(--text-muted)', transition: 'color 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
