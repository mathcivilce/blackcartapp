'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabase-client';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error || !session) {
          setError('Invalid or expired reset link. Please request a new password reset.');
          setValidating(false);
          return;
        }

        setValidating(false);
      } catch (err) {
        setError('An error occurred. Please try again.');
        setValidating(false);
      }
    };

    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message || 'Failed to reset password');
      } else {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div style={styles.container}>
        <div style={styles.box}>
          <h1 style={styles.logo}>Cartbase</h1>
          <div style={styles.loadingContainer}>
            <p style={styles.loadingText}>Validating reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.logo}>Cartbase</h1>
        
        {success ? (
          <div style={styles.successContainer}>
            <div style={styles.successMessage}>
              <p style={styles.successTitle}>Password Reset Successful!</p>
              <p style={styles.successText}>
                Your password has been successfully reset. You will be redirected to the login page in a few seconds.
              </p>
            </div>
            <button
              onClick={() => router.push('/login')}
              style={styles.button}
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <>
            <div style={styles.header}>
              <h2 style={styles.title}>Set new password</h2>
              <p style={styles.description}>
                Please enter your new password below.
              </p>
            </div>

            <form onSubmit={handleResetPassword} style={styles.form}>
              {error && (
                <div style={styles.error}>
                  {error}
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={8}
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
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <div style={styles.footer}>
              <p style={styles.footerText}>
                Remember your password?{' '}
                <Link href="/login" style={styles.link}>Sign In</Link>
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
  loadingContainer: {
    padding: '40px 20px',
    textAlign: 'center' as const
  },
  loadingText: {
    fontSize: '16px',
    color: '#888',
    margin: 0
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
    transition: 'opacity 0.2s',
    cursor: 'pointer'
  }
};

