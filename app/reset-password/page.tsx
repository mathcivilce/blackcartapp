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
  const [hasValidSession, setHasValidSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      try {
        // Check the URL for hash fragments (Supabase puts session data there)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        console.log('🔍 Checking URL hash:', { 
          hasAccessToken: !!access_token, 
          hasRefreshToken: !!refresh_token,
          type,
          fullHash: window.location.hash
        });
        
        // If we have tokens in the URL from Supabase redirect
        if (access_token && refresh_token && type === 'recovery') {
          console.log('✅ Found recovery tokens in URL, setting session');
          
          // Set the session in Supabase client
          const { data, error } = await supabaseClient.auth.setSession({
            access_token,
            refresh_token
          });
          
          if (error) {
            console.error('❌ Error setting session:', error);
            setError('Invalid or expired reset link. Please request a new password reset.');
            setValidating(false);
            return;
          }
          
          if (data.session) {
            console.log('✅ Session set successfully for user:', data.user?.email);
            setHasValidSession(true);
            setValidating(false);
            // Clear the hash from URL for security
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
        }

        // Otherwise check for existing session
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        console.log('📋 Session check:', { hasSession: !!session, error: error?.message });
        
        if (error || !session) {
          setError('Invalid or expired reset link. Please request a new password reset.');
          setValidating(false);
          return;
        }

        setHasValidSession(true);
        setValidating(false);
      } catch (err) {
        console.error('❌ Session check error:', err);
        setError('An error occurred. Please try again.');
        setValidating(false);
      }
    };

    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if we have a valid session
    if (!hasValidSession) {
      setError('Auth session missing! Please use the link from your email.');
      return;
    }

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
      console.log('🔄 Attempting to update password...');
      const { error } = await supabaseClient.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('❌ Password update error:', error);
        setError(error.message || 'Failed to reset password');
      } else {
        console.log('✅ Password updated successfully');
        setSuccess(true);
        
        // Sign out the user to clear the recovery session
        await supabaseClient.auth.signOut();
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('❌ Reset password error:', err);
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
                Your password has been successfully reset. Redirecting to login page...
              </p>
            </div>
          </div>
        ) : !hasValidSession && !validating ? (
          <div style={styles.errorContainer}>
            <div style={styles.errorMessage}>
              <p style={styles.errorTitle}>Invalid Reset Link</p>
              <p style={styles.errorText}>
                This password reset link is invalid or has expired. Please request a new one.
              </p>
            </div>
            <button
              onClick={() => router.push('/forgot-password')}
              style={styles.button}
            >
              Request New Reset Link
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
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  },
  errorMessage: {
    padding: '20px',
    background: '#2a0000',
    color: '#ff6b6b',
    borderRadius: '8px',
    border: '1px solid #ff6b6b'
  },
  errorTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 12px 0'
  },
  errorText: {
    fontSize: '14px',
    margin: 0,
    lineHeight: '1.6',
    color: '#ffb8b8'
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

