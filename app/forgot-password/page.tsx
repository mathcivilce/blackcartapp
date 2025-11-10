'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.logo}>Cartbase</h1>
        
        {success ? (
          <div style={styles.successContainer}>
            <div style={styles.successMessage}>
              <p style={styles.successTitle}>Check your email</p>
              <p style={styles.successText}>
                We've sent a password reset link to <strong>{email}</strong>.
                Please check your inbox and follow the instructions to reset your password.
              </p>
            </div>
            <button
              onClick={() => router.push('/login')}
              style={styles.button}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <div style={styles.header}>
              <h2 style={styles.title}>Reset your password</h2>
              <p style={styles.description}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleResetPassword} style={styles.form}>
              {error && (
                <div style={styles.error}>
                  {error}
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.button,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div style={styles.footer}>
              <p style={styles.footerText}>
                Remember your password?{' '}
                <a href="/login" style={styles.link}>Sign In</a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  box: {
    background: '#000',
    borderRadius: '12px',
    border: '1px solid #333',
    padding: '48px',
    width: '100%',
    maxWidth: '420px'
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff',
    margin: '0 0 32px 0',
    textAlign: 'center' as const
  },
  header: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#fff',
    margin: '0 0 8px 0',
    textAlign: 'center' as const
  },
  description: {
    fontSize: '14px',
    color: '#888',
    margin: 0,
    textAlign: 'center' as const,
    lineHeight: '1.5'
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff'
  },
  input: {
    padding: '12px 16px',
    fontSize: '16px',
    border: '1px solid #333',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    background: '#fff',
    color: '#000'
  },
  button: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    background: '#000',
    border: '2px solid #fff',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '8px'
  },
  error: {
    padding: '12px',
    background: '#2a0000',
    color: '#ff6b6b',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center' as const,
    border: '1px solid #ff6b6b'
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  },
  successMessage: {
    padding: '20px',
    background: '#002a00',
    color: '#6bff6b',
    borderRadius: '8px',
    border: '1px solid #6bff6b'
  },
  successTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 12px 0'
  },
  successText: {
    fontSize: '14px',
    margin: 0,
    lineHeight: '1.6',
    color: '#b8ffb8'
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '24px'
  },
  footerText: {
    fontSize: '14px',
    color: '#888',
    margin: 0
  },
  link: {
    color: '#fff',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'opacity 0.2s'
  }
};

