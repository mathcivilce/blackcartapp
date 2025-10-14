'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated by checking for session cookie
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          // User is authenticated, redirect to dashboard
          router.push('/dashboard');
        } else {
          // User is not authenticated, redirect to pricing
          router.push('/pricing');
        }
      } catch (error) {
        // On error, redirect to pricing
        router.push('/pricing');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>BlackCart</h1>
        <p style={styles.subtitle}>Loading...</p>
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  content: {
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '48px',
    fontWeight: '800',
    color: '#fff',
    margin: '0 0 16px 0',
    letterSpacing: '-2px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#888',
    margin: 0
  }
};

