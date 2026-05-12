'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/components/UploadZone';
import MediaCard from '@/components/MediaCard';
import Toast from '@/components/Toast';

interface MediaItem {
  _id: string;
  type: 'image' | 'video';
  image?: string;
  video?: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [stats, setStats] = useState({ total: 0, images: 0, videos: 0, size: 0 });
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const t = localStorage.getItem('media_auth_token');
    if (!t) { router.push('/login'); return; }
    setToken(t);
  }, [router]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const fetchMedia = useCallback(async (t?: string | null) => {
    const authToken = t ?? token;
    if (!authToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('type', filter);
      if (search) params.set('search', search);
      params.set('limit', '100');

      const res = await fetch(`/api/media?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      if (data.success) {
        setMedia(data.media);
        // Compute stats
        const allRes = await fetch('/api/media?limit=1000', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const allData = await allRes.json();
        if (allData.success) {
          const items: MediaItem[] = allData.media;
          setStats({
            total: items.length,
            images: items.filter(i => i.type === 'image').length,
            videos: items.filter(i => i.type === 'video').length,
            size: items.reduce((acc, i) => acc + (i.size || 0), 0),
          });
        }
      }
    } catch {
      addToast('Failed to load media', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, filter, search, router, addToast]);

  useEffect(() => {
    const t = localStorage.getItem('media_auth_token');
    if (t) fetchMedia(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setSearch(val), 400);
  };

  const handleDelete = useCallback((id: string) => {
    setMedia(prev => prev.filter(m => m._id !== id));
    addToast('Media deleted successfully', 'success');
  }, [addToast]);

  const handleUploadComplete = useCallback(() => {
    addToast('Upload complete!', 'success');
    setActiveTab('gallery');
    setTimeout(() => fetchMedia(), 500);
  }, [addToast, fetchMedia]);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    localStorage.removeItem('media_auth_token');
    router.push('/login');
  };

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '64px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Memory
              </p>
            </div>
          </div>

          {/* Nav tabs */}
          <div style={{
            display: 'flex', gap: '4px',
            background: 'var(--bg-card)', padding: '4px', borderRadius: '12px',
            border: '1px solid var(--border)',
          }}>
            {(['gallery', 'upload'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '7px 18px', borderRadius: '8px', border: 'none',
                  background: activeTab === tab ? 'var(--accent)' : 'transparent',
                  color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                  fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'gallery' ? '🗂 Gallery' : '⬆ Upload'}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            <button
              onClick={handleLogout}
              style={{
                padding: '7px 14px', borderRadius: '8px',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
              onMouseEnter={e => {
                (e.currentTarget.style.color = 'var(--error)');
                (e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)');
              }}
              onMouseLeave={e => {
                (e.currentTarget.style.color = 'var(--text-muted)');
                (e.currentTarget.style.borderColor = 'var(--border)');
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" />
                <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" />
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '32px 24px' }}>
        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px',
        }}>
          {[
            { label: 'Total Media', value: stats.total, icon: '📦', color: 'var(--accent)' },
            { label: 'Images', value: stats.images, icon: '🖼', color: 'var(--image-color)' },
            { label: 'Videos', value: stats.videos, icon: '🎬', color: 'var(--video-color)' },
            { label: 'Storage Used', value: formatBytes(stats.size), icon: '💾', color: 'var(--warning)' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '20px',
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: `${stat.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px',
              }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ fontSize: '22px', fontWeight: '700', color: stat.color, lineHeight: 1.2 }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="animate-fade-in">
            {/* Filters bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '24px', flexWrap: 'wrap',
            }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '360px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}>
                  <circle cx="11" cy="11" r="8" stroke="var(--text-muted)" strokeWidth="2" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="var(--text-muted)" strokeWidth="2" />
                </svg>
                <input
                  value={searchInput}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search by filename..."
                  style={{
                    width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                    fontFamily: 'var(--font-sans)', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              {/* Filter buttons */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['all', 'image', 'video'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: '9px 16px', borderRadius: '10px',
                      border: '1px solid',
                      borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
                      background: filter === f ? 'var(--accent-muted)' : 'var(--bg-card)',
                      color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                      transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {f === 'all' ? `All · ${stats.total}` : f === 'image' ? `🖼 Images · ${stats.images}` : `🎬 Videos · ${stats.videos}`}
                  </button>
                ))}
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {media.length} result{media.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => fetchMedia()}
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    border: '1px solid var(--border)', background: 'var(--bg-card)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-secondary)',
                  }}
                  title="Refresh"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <polyline points="23 4 23 10 17 10" stroke="currentColor" strokeWidth="2" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Media grid */}
            {loading ? (
              <div className="media-grid">
                {Array(12).fill(0).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '240px', borderRadius: '16px' }} />
                ))}
              </div>
            ) : media.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '80px 32px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '20px',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  {filter === 'image' ? '🖼' : filter === 'video' ? '🎬' : '📭'}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  No {filter === 'all' ? 'media' : filter + 's'} found
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  {search ? `No results for "${search}"` : 'Upload some files to get started'}
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  style={{
                    padding: '10px 24px', borderRadius: '10px', border: 'none',
                    background: 'var(--accent)', color: 'white', fontSize: '13px',
                    fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                >
                  Upload media
                </button>
              </div>
            ) : (
              <div className="media-grid">
                {media.map((item, i) => (
                  <MediaCard
                    key={item._id}
                    item={item}
                    onDelete={handleDelete}
                    baseURL={BASE_URL}
                    token={token}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: '400',
                color: 'var(--text-primary)', marginBottom: '8px',
              }}>
                Upload Media
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Upload images and videos to your media vault. Files are stored securely on the server.
              </p>
            </div>

            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '20px', padding: '32px',
            }}>
              <UploadZone onUploadComplete={handleUploadComplete} token={token} />
            </div>

            {/* Tips */}
            <div style={{
              marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
            }}>
              {[
                { icon: '⚡', title: 'Fast Upload', desc: 'Files upload in the background without page freeze' },
                { icon: '📦', title: 'Batch Upload', desc: 'Upload up to 20 files at once, up to 500MB each' },
                { icon: '🖼', title: 'Images', desc: 'JPEG, PNG, GIF, WebP, SVG supported' },
                { icon: '🎬', title: 'Videos', desc: 'MP4, WebM, MOV, AVI, OGG supported' },
              ].map((tip, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '12px', padding: '14px',
                  background: 'var(--bg-secondary)', borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <span style={{ fontSize: '20px' }}>{tip.icon}</span>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      {tip.title}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 9999 }}>
        {toasts.map(t => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
          />
        ))}
      </div>
    </div>
  );
}
