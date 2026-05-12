'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', text: '#86efac' },
    error: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5' },
    info: { bg: 'rgba(108,99,255,0.15)', border: 'rgba(108,99,255,0.3)', text: '#a5b4fc' },
  };

  const icons = {
    success: <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2"/>,
    error: <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/>,
    info: <circle cx="12" cy="12" r="10" stroke="#6c63ff" strokeWidth="2"/>,
  };

  const c = colors[type];

  return (
    <div
      className="toast-slide"
      style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
        padding: '14px 18px', borderRadius: '12px',
        background: c.bg, border: `1px solid ${c.border}`,
        color: c.text, fontSize: '13px', fontWeight: '500',
        display: 'flex', alignItems: 'center', gap: '10px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        maxWidth: '360px',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">{icons[type]}</svg>
      {message}
      <button
        onClick={onClose}
        style={{
          marginLeft: '8px', background: 'none', border: 'none',
          cursor: 'pointer', color: 'inherit', padding: '0', opacity: 0.6,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
          <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </button>
    </div>
  );
}
