'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGetMediaQuery } from '@/lib/redux/api/mediaApi';
import UploadZone from '@/components/upload/UploadZone';
import MediaCard from '@/components/media/MediaCard';
import MediaCarousel from '@/components/media/MediaCarousel';
import Toast from '@/components/ui/Toast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useToasts } from '@/hooks/useToasts';
import { formatBytes } from '@/utils/format';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';
const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const YEARS = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

const DASHBOARD_TAB_STORAGE_KEY = 'memory_dashboard_active_tab';

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);
  const search = useDebouncedValue(searchInput, 400);
  const { toasts, addToast, removeToast } = useToasts();

  // Fetch current filtered media
  const { data, isLoading, refetch } = useGetMediaQuery({
    type: filter === 'all' ? undefined : filter,
    search: search || undefined,
    month: selectedMonth ? parseInt(selectedMonth) : undefined,
    year: selectedYear ? parseInt(selectedYear) : undefined,
    limit: 100
  });

  // Fetch all media for stats
  const { data: allData } = useGetMediaQuery({ limit: 1000 });

  const media = data?.media || [];
  const stats = {
    total: allData?.media.length || 0,
    images: allData?.media.filter(i => i.type === 'image').length || 0,
    videos: allData?.media.filter(i => i.type === 'video').length || 0,
    size: allData?.media.reduce((acc, i) => acc + (i.size || 0), 0) || 0,
  };

  useEffect(() => {
    const t = localStorage.getItem('media_auth_token');
    if (!t) {
      router.push('/login');
      return;
    }
    setToken(t);
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem(DASHBOARD_TAB_STORAGE_KEY);
    if (saved === 'gallery' || saved === 'upload') setActiveTab(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(DASHBOARD_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  const handleDelete = useCallback(
    () => {
      // The mutation in MediaCard will handle the actual deletion and tag invalidation
      addToast('Media deleted successfully', 'success');
    },
    [addToast],
  );

  const handleUploadComplete = useCallback(() => {
    addToast('Upload complete!', 'success');
    setActiveTab('gallery');
    // RTK Query will automatically refetch because the upload mutation invalidates the 'Media' tag
  }, [addToast]);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    localStorage.removeItem('media_auth_token');
    router.push('/login');
  };

  const statItems = [
    { label: 'Total Media', value: stats.total, icon: '📦', color: 'var(--accent)' },
    { label: 'Images', value: stats.images, icon: '🖼', color: 'var(--image-color)' },
    { label: 'Videos', value: stats.videos, icon: '🎬', color: 'var(--video-color)' },
    { label: 'Storage Used', value: formatBytes(stats.size), icon: '💾', color: 'var(--warning)' },
  ] as const;

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="dashboard-brand">
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <p className="dashboard-brand-title">Memory</p>
          </div>

          <div className="dashboard-nav-tabs" role="tablist" aria-label="Main">
            {(['gallery', 'upload'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={`dashboard-nav-tab ${activeTab === tab ? 'dashboard-nav-tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'gallery' ? '🗂 Gallery' : '⬆ Upload'}
              </button>
            ))}
          </div>

          <button type="button" className="dashboard-signout" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" />
              <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" />
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="dashboard-signout-label">Sign out</span>
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="stats-grid">
          {statItems.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="stat-card-icon" style={{ background: `${stat.color}18` }}>
                {stat.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <p className="stat-card-value" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="stat-card-label">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {activeTab === 'gallery' && (
          <div className="animate-fade-in">
            <div className="filter-bar">
              <div className="filter-search-wrap">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="8" stroke="var(--text-muted)" strokeWidth="2" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="var(--text-muted)" strokeWidth="2" />
                </svg>
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by filename..."
                  aria-label="Search media"
                  style={{
                    width: '100%',
                    minHeight: 'var(--touch-min)',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                  }}
                />
              </div>

              <div className="filter-chips" role="group" aria-label="Filter by type">
                {(['all', 'image', 'video'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`filter-chip ${filter === f ? 'filter-chip--active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === 'all'
                      ? `All · ${stats.total}`
                      : f === 'image'
                        ? `🖼 Images · ${stats.images}`
                        : `🎬 Videos · ${stats.videos}`}
                  </button>
                ))}
              </div>

              <div className="filter-controls-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Timeline</span>
                </div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="filter-select"
                  aria-label="Filter by month"
                >
                  <option value="">All Months</option>
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="filter-select"
                  aria-label="Filter by year"
                >
                  <option value="">All Years</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-meta">
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {media.length} result{media.length !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  className="filter-refresh"
                  onClick={() => refetch()}
                  title="Refresh"
                  aria-label="Refresh gallery"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <polyline points="23 4 23 10 17 10" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="media-grid">
                {Array(12)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '16px' }} />
                  ))}
              </div>
            ) : media.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 'clamp(40px, 12vw, 48px)', marginBottom: '16px' }}>
                  {filter === 'image' ? '🖼' : filter === 'video' ? '🎬' : '📭'}
                </div>
                <h3
                  style={{
                    fontSize: 'clamp(16px, 4vw, 18px)',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '8px',
                  }}
                >
                  No {filter === 'all' ? 'media' : `${filter}s`} found
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  {search ? `No results for "${search}"` : 'Upload some files to get started'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  style={{
                    minHeight: 'var(--touch-min)',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
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
                    onView={() => setCarouselIndex(i)}
                    baseURL={BASE_URL}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
            <div style={{ marginBottom: 'clamp(18px, 4vw, 24px)' }}>
              <h2 className="upload-hero-title">Upload Media</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(13px, 3.2vw, 14px)', lineHeight: 1.5 }}>
                Upload images and videos to your media vault. Files are stored securely on the server.
              </p>
            </div>

            <div className="upload-card-shell">
              <UploadZone onUploadComplete={handleUploadComplete} />
            </div>

            <div className="upload-tips-grid">
              {[
                { icon: '⚡', title: 'Fast Upload', desc: 'Files upload in the background without page freeze' },
                { icon: '📦', title: 'Batch Upload', desc: 'Upload up to 20 files at once, up to 1 GB each' },
                { icon: '🖼', title: 'Images', desc: 'JPEG, PNG, GIF, WebP, SVG supported' },
                { icon: '🎬', title: 'Videos', desc: 'MP4, WebM, MOV, AVI, OGG supported' },
              ].map((tip, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '14px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{tip.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        marginBottom: '3px',
                      }}
                    >
                      {tip.title}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.45 }}>{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="dashboard-tabbar" role="tablist" aria-label="Mobile navigation">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'gallery'}
          className={`dashboard-tabbar-btn ${activeTab === 'gallery' ? 'dashboard-tabbar-btn--active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          <span className="dashboard-tabbar-icon" aria-hidden>
            🗂
          </span>
          Gallery
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'upload'}
          className={`dashboard-tabbar-btn ${activeTab === 'upload' ? 'dashboard-tabbar-btn--active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <span className="dashboard-tabbar-icon" aria-hidden>
            ⬆
          </span>
          Upload
        </button>
      </nav>

      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
      {carouselIndex !== null && (
        <MediaCarousel
          items={media}
          currentIndex={carouselIndex}
          onClose={() => setCarouselIndex(null)}
          onNavigate={setCarouselIndex}
          baseURL={BASE_URL}
        />
      )}
    </div>
  );
}
