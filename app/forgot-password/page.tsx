'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (res.ok) {
        router.push(`/verify-otp?email=${email}&type=reset-password`);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-inner">
        <div className="auth-card">
        <h2 className="auth-title" style={{ fontSize: 'clamp(20px, 5vw, 24px)', marginBottom: '12px' }}>
          Forgot password?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(14px, 3.5vw, 15px)', marginBottom: '28px', lineHeight: 1.5 }}>
          No worries, we&apos;ll send you reset instructions.
        </p>

        {error && (
          <div style={{
            padding: '12px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#fca5a5', fontSize: '14px', marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block', fontSize: '12px', fontWeight: '600',
              color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase'
            }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              style={{
                width: '100%',
                minHeight: '48px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '52px',
              padding: '14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-sans)',
              boxShadow: '0 4px 20px var(--accent-glow)',
              marginBottom: '24px',
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <Link href="/login" style={{
            fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            minHeight: '44px', padding: '8px 12px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to login
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
