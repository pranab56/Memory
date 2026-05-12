'use client';

import { useEffect, useCallback } from 'react';
import type { MediaItem } from '@/modules/media/types';

interface MediaCarouselProps {
  items: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  baseURL: string;
}

export default function MediaCarousel({
  items,
  currentIndex,
  onClose,
  onNavigate,
  baseURL,
}: MediaCarouselProps) {
  const item = items[currentIndex];
  const isImage = item?.type === 'image';
  const filePath = item?.image || item?.video;
  const isExternal = filePath?.startsWith('http');
  const mediaUrl = filePath ? (isExternal ? filePath : `${baseURL}/api/files${filePath}`) : '';

  const handleNext = useCallback(() => {
    onNavigate((currentIndex + 1) % items.length);
  }, [currentIndex, items.length, onNavigate]);

  const handlePrev = useCallback(() => {
    onNavigate((currentIndex - 1 + items.length) % items.length);
  }, [currentIndex, items.length, onNavigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  if (!item) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        padding: '20px',
      }}
      onClick={onClose}
    >
      {/* Top Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: '20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
      }}>
        <div style={{ color: 'white' }}>
          <p style={{ fontSize: '14px', fontWeight: '600' }}>{item.originalName}</p>
          <p style={{ fontSize: '12px', opacity: 0.7 }}>{currentIndex + 1} of {items.length}</p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: 'white', cursor: 'pointer',
            padding: '10px', fontSize: '24px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Media Content */}
      <div
        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={e => e.stopPropagation()}
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt={item.originalName}
            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
          />
        ) : (
          <video
            src={mediaUrl}
            controls
            autoPlay
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px' }}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
        style={{
          position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
          width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', backdropFilter: 'blur(4px)',
        }}
      >
        ‹
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); handleNext(); }}
        style={{
          position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
          width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', backdropFilter: 'blur(4px)',
        }}
      >
        ›
      </button>
    </div>
  );
}
