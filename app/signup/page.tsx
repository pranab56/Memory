'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('media_auth_token');
    if (token) router.push('/dashboard');
  }, [router]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!username) newErrors.username = 'Username is required';
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Redirect to OTP verification
        router.push(`/verify-otp?email=${data.email}&type=signup`);
      } else {
        if (data.error?.toLowerCase().includes('username')) {
          setErrors({ username: data.error });
        } else if (data.error?.toLowerCase().includes('email')) {
          setErrors({ email: data.error });
        } else {
          setErrors({ general: data.error || 'Signup failed' });
        }
      }
    } catch {
      setErrors({ general: 'Connection failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="auth-shell">
      <div className="auth-inner">
        <div className="auth-card">
          <h2 className="auth-title">
            Create an account
          </h2>

          {errors.general && (
            <div style={{
              padding: '12px 16px', borderRadius: '10px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', fontSize: '13px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" stroke="#ef4444" strokeWidth="2" />
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="#ef4444" strokeWidth="2" />
              </svg>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: '500',
                color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="johndoe"
                autoComplete="username"
                style={{
                  width: '100%',
                  minHeight: '48px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: errors.username ? '1px solid #ef4444' : '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-sans)',
                }}
              />
              {errors.username && (
                <p style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{errors.username}</p>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: '500',
                color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="john@example.com"
                autoComplete="email"
                style={{
                  width: '100%',
                  minHeight: '48px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: errors.email ? '1px solid #ef4444' : '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-sans)',
                }}
              />
              {errors.email && (
                <p style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>
              )}
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: '500',
                color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    padding: '12px 52px 12px 16px',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    border: errors.password ? '1px solid #ef4444' : '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                minHeight: '52px',
                padding: '14px',
                borderRadius: '12px',
                background: loading ? 'var(--border)' : 'linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)',
                border: 'none',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 24px var(--accent-glow)',
                marginBottom: '16px',
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            
            <p style={{ textAlign: 'center', fontSize: 'clamp(13px, 3.2vw, 14px)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--accent)', fontWeight: '500', padding: '4px' }}>
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
