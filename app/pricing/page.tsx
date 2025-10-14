'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start checkout');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.logo}>BlackCart</h1>
          <p style={styles.tagline}>Transform Your Shopify Cart Experience</p>
        </div>

        {/* Hero Section */}
        <div style={styles.hero}>
          <h2 style={styles.heroTitle}>
            Customize Your Cart.<br />Boost Your Sales.
          </h2>
          <p style={styles.heroSubtitle}>
            Beautiful, customizable cart drawer for your Shopify store.<br />
            Add shipping protection, upsells, and more.
          </p>
        </div>

        {/* Pricing Card */}
        <div style={styles.pricingCard}>
          <div style={styles.priceTag}>
            <span style={styles.currency}>$</span>
            <span style={styles.amount}>1</span>
            <span style={styles.period}>/month</span>
          </div>
          
          <p style={styles.priceDescription}>
            Simple, transparent pricing. Cancel anytime.
          </p>

          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.checkmark}>✓</span>
              <span>Fully Customizable Cart Design</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.checkmark}>✓</span>
              <span>Shipping Protection Add-on</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.checkmark}>✓</span>
              <span>Revenue Tracking Dashboard</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.checkmark}>✓</span>
              <span>Real-time Sales Analytics</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.checkmark}>✓</span>
              <span>Shopify Integration</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.checkmark}>✓</span>
              <span>24/7 Support</span>
            </div>
          </div>

          <form onSubmit={handleSubscribe} style={styles.form}>
            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={styles.input}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Processing...' : 'Start Your Subscription'}
            </button>
          </form>

          <p style={styles.note}>
            No trial period. Billed monthly. Cancel anytime.
          </p>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Already have an account?{' '}
            <a href="/login" style={styles.link}>Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  content: {
    maxWidth: '600px',
    margin: '0 auto',
    paddingTop: '40px',
    paddingBottom: '40px'
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '60px'
  },
  logo: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#fff',
    margin: '0 0 8px 0',
    letterSpacing: '-1px'
  },
  tagline: {
    fontSize: '16px',
    color: '#888',
    margin: 0
  },
  hero: {
    textAlign: 'center' as const,
    marginBottom: '60px'
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '800',
    color: '#fff',
    margin: '0 0 20px 0',
    lineHeight: '1.2',
    letterSpacing: '-2px'
  },
  heroSubtitle: {
    fontSize: '18px',
    color: '#aaa',
    margin: 0,
    lineHeight: '1.6'
  },
  pricingCard: {
    background: '#000',
    border: '2px solid #fff',
    borderRadius: '16px',
    padding: '48px',
    marginBottom: '40px'
  },
  priceTag: {
    textAlign: 'center' as const,
    marginBottom: '16px'
  },
  currency: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#fff',
    verticalAlign: 'super'
  },
  amount: {
    fontSize: '72px',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-3px'
  },
  period: {
    fontSize: '24px',
    color: '#888',
    marginLeft: '8px'
  },
  priceDescription: {
    textAlign: 'center' as const,
    fontSize: '16px',
    color: '#aaa',
    marginBottom: '40px'
  },
  features: {
    marginBottom: '40px'
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 0',
    fontSize: '16px',
    color: '#fff'
  },
  checkmark: {
    fontSize: '20px',
    color: '#4CAF50',
    marginRight: '12px',
    fontWeight: '700'
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    marginBottom: '24px'
  },
  input: {
    padding: '16px',
    fontSize: '16px',
    border: '2px solid #333',
    borderRadius: '8px',
    outline: 'none',
    background: '#fff',
    color: '#000',
    fontFamily: 'inherit'
  },
  button: {
    padding: '18px',
    fontSize: '18px',
    fontWeight: '700',
    color: '#000',
    background: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)'
  },
  note: {
    textAlign: 'center' as const,
    fontSize: '14px',
    color: '#666',
    margin: 0
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
  footer: {
    textAlign: 'center' as const
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

