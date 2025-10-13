'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to dashboard after successful registration
        router.push('/');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.registerBox}>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Sign up to get started with BlackCart</p>
        
        <form onSubmit={handleRegister} style={styles.form}>
          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
              placeholder="John Doe"
              autoComplete="name"
            />
          </div>

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

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
              autoComplete="new-password"
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
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
  registerBox: {
    background: '#000',
    borderRadius: '12px',
    border: '1px solid #333',
    padding: '48px',
    width: '100%',
    maxWidth: '420px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#fff',
    margin: '0 0 8px 0',
    textAlign: 'center' as const
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 32px 0',
    textAlign: 'center' as const
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
  }
};

