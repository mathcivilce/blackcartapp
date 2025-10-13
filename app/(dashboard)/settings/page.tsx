'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [cartActive, setCartActive] = useState(false);
  const [storeDomain, setStoreDomain] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    // Load current settings
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setCartActive(data.cart_active || false);
          setStoreDomain(data.store_domain || '');
          setApiToken(data.api_token || '');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleToggleCart = async () => {
    const newValue = !cartActive;
    setCartActive(newValue);
    
    // Save to backend
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_active: newValue })
      });
    } catch (error) {
      console.error('Failed to save cart_active:', error);
      // Revert on error
      setCartActive(!newValue);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setSaveMessage('');
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_domain: storeDomain,
          api_token: apiToken
        })
      });

      if (response.ok) {
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Settings</h1>
      <p style={styles.subtitle}>Configure your store and cart settings</p>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Cart Activation</h2>
        
        <div style={styles.toggleContainer}>
          <div>
            <label style={styles.label}>Activate Cart</label>
            <p style={styles.hint}>
              Enable or disable the cart app on your Shopify store. When disabled, customers will see the default Shopify cart.
            </p>
          </div>
          <button
            onClick={handleToggleCart}
            style={{
              ...styles.toggle,
              ...(cartActive ? styles.toggleActive : {})
            }}
          >
            <span style={{
              ...styles.toggleThumb,
              ...(cartActive ? styles.toggleThumbActive : {})
            }} />
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Store Information</h2>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Store Domain</label>
          <input
            type="text"
            value={storeDomain}
            onChange={(e) => setStoreDomain(e.target.value)}
            style={styles.input}
            placeholder="example-store.myshopify.com"
          />
          <p style={styles.hint}>Your Shopify store URL</p>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>API Configuration</h2>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Shopify API Token</label>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            style={styles.input}
            placeholder="shpat_••••••••••••••••"
          />
          <p style={styles.hint}>Admin API access token for your Shopify store</p>
        </div>
      </div>

      {saveMessage && (
        <div style={{
          ...styles.message,
          ...(saveMessage.includes('success') ? styles.messageSuccess : styles.messageError)
        }}>
          {saveMessage}
        </div>
      )}

      <button 
        onClick={handleSaveSettings}
        disabled={loading}
        style={{
          ...styles.saveButton,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#888',
    marginBottom: '32px',
  },
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #333',
    borderRadius: '6px',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    background: '#000',
    color: '#fff',
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '6px',
    lineHeight: '1.5',
  },
  saveButton: {
    width: '100%',
    background: '#000',
    color: '#fff',
    border: '2px solid #fff',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  toggleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '24px',
  },
  toggle: {
    position: 'relative' as const,
    width: '60px',
    height: '32px',
    background: '#333',
    border: '2px solid #444',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    padding: 0,
    flexShrink: 0,
  },
  toggleActive: {
    background: '#fff',
    border: '2px solid #fff',
  },
  toggleThumb: {
    position: 'absolute' as const,
    top: '2px',
    left: '2px',
    width: '24px',
    height: '24px',
    background: '#666',
    borderRadius: '50%',
    transition: 'all 0.3s',
    display: 'block',
  },
  toggleThumbActive: {
    transform: 'translateX(28px)',
    background: '#000',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '16px',
    textAlign: 'center' as const,
  },
  messageSuccess: {
    background: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
  },
  messageError: {
    background: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
  },
};