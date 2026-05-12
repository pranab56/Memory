'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyOtpContent() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const type = searchParams.get('type') || 'signup';

  useEffect(() => {
    if (!email) {
      router.push('/login');
    }
  }, [email, router]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode, type }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        if (type === 'reset-password') {
          router.push(`/reset-password?email=${email}`);
        } else {
          router.push('/login?message=Account verified successfully');
        }
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'signup' ? '/api/auth/signup' : '/api/auth/forgot-password';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resend: true }),
      });
      if (res.ok) {
        setError('New code sent!');
        setTimeout(() => setError(''), 3000);
      } else {
        setError('Failed to resend code');
      }
    } catch {
      setError('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px', height: '64px', background: 'var(--accent-muted)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', color: 'var(--accent)'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
          </svg>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
          Verify your email
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px' }}>
          We've sent a 6-digit code to <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{email}</span>
        </p>

        {error && (
          <div style={{
            padding: '12px', borderRadius: '10px',
            background: error.includes('sent') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: error.includes('sent') ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)',
            color: error.includes('sent') ? '#86efac' : '#fca5a5',
            fontSize: '14px', marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px' }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                style={{
                  width: '48px', height: '56px', borderRadius: '12px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: '20px', fontWeight: '700',
                  textAlign: 'center', outline: 'none', transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)',
              border: 'none', color: 'white', fontSize: '16px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 20px var(--accent-glow)', marginBottom: '24px'
            }}
          >
            {loading ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Didn't receive the code?{' '}
          <button
            onClick={resendOtp}
            disabled={loading}
            style={{
              background: 'none', border: 'none', color: 'var(--accent)',
              fontWeight: '600', cursor: 'pointer', padding: '0'
            }}
          >
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
