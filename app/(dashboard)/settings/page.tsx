'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [cartActive, setCartActive] = useState(false);
  const [storeDomain, setStoreDomain] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    shopName?: string;
    corrected?: boolean;
  } | null>(null);

  useEffect(() => {
    // Load current user and settings
    const loadSettings = async () => {
      try {
        // Get current user from API (uses httpOnly cookies)
        const userResponse = await fetch('/api/auth/me');
        if (!userResponse.ok) {
          console.error('No user logged in');
          return;
        }
        
        const { user } = await userResponse.json();
        setUserId(user.id);
        console.log('User loaded:', user.id);

        // Get user's store using server-side API
        const storeResponse = await fetch(`/api/user/store?userId=${user.id}`);
        if (!storeResponse.ok) {
          console.log('No store found for user, will create on save');
          return;
        }

        const { store } = await storeResponse.json();
        if (store) {
          console.log('Store loaded:', store);
          console.log('Settings loaded:', store.settings);
          setStoreDomain(store.shop_domain || '');
          setApiToken(store.api_token || '');
          setAccessToken(store.access_token || '');
          
          // Set cart_active from settings, default to true if not set
          const cartActiveValue = store.settings?.cart_active ?? true;
          console.log('Cart active value:', cartActiveValue);
          setCartActive(cartActiveValue);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleToggleCart = async (newValue: boolean) => {
    console.log('🔘 Button clicked. Changing cart_active to:', newValue);
    console.log('🔘 Current cartActive state:', cartActive);
    
    // If same value, do nothing
    if (newValue === cartActive) {
      console.log('⚠️ Same value, skipping');
      return;
    }
    
    setCartActive(newValue);
    console.log('✅ State updated to:', newValue);
    
    try {
      const response = await fetch('/api/user/settings/toggle-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_active: newValue })
      });

      console.log('📡 API Response:', response.status, response.ok);

      if (!response.ok) {
        console.error('❌ Failed to save cart_active, reverting');
        const errorData = await response.json();
        console.error('Error details:', errorData);
        setCartActive(!newValue); // Revert on error
        setSaveMessage(`Failed to ${newValue ? 'activate' : 'deactivate'} cart. Please try again.`);
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        const data = await response.json();
        console.log('✅ API Success:', data);
        setSaveMessage(`✓ Cart ${newValue ? 'activated' : 'deactivated'} successfully!`);
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('❌ Error saving cart_active:', error);
      setCartActive(!newValue); // Revert on error
      setSaveMessage(`Error: Failed to ${newValue ? 'activate' : 'deactivate'} cart.`);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleValidateToken = async () => {
    setValidating(true);
    setValidationResult(null);
    setSaveMessage('');

    if (!storeDomain || !apiToken) {
      setValidationResult({
        success: false,
        message: 'Please enter both store domain and API token'
      });
      setValidating(false);
      return;
    }

    try {
      const response = await fetch('/api/shopify/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_domain: storeDomain,
          api_token: apiToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setValidationResult({
          success: false,
          message: data.error || 'Validation failed'
        });
        setValidating(false);
        return;
      }

      // Success! Update UI with validated data
      setValidationResult({
        success: true,
        message: `✓ Connected to ${data.store.shop_name}`,
        shopName: data.store.shop_name,
        corrected: data.store.domain_corrected
      });

      // Update store domain with canonical domain from Shopify
      setStoreDomain(data.store.shop_domain);
      setAccessToken(data.store.access_token);

      // Show success message
      setSaveMessage('Store connected and validated successfully!');
      setTimeout(() => setSaveMessage(''), 5000);

    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        success: false,
        message: 'Network error. Please try again.'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setSaveMessage('');
    
    try {
      const response = await fetch('/api/user/store/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_domain: storeDomain,
          api_token: apiToken
        })
      });

      if (!response.ok) {
        const error = await response.json();
        setSaveMessage(error.error || 'Failed to save settings');
        setLoading(false);
        return;
      }

      const { store } = await response.json();
      
      // Set the access token to display installation instructions
      if (store?.access_token) {
        setAccessToken(store.access_token);
      }

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyScript = () => {
    const scriptTag = `<script src="https://blackcartapp.netlify.app/cart.js?token=${accessToken}"></script>`;
    navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateToken = async () => {
    if (!confirm('Are you sure you want to regenerate the token? You will need to update your Shopify theme with the new script.')) {
      return;
    }

    try {
      const response = await fetch('/api/user/store/regenerate-token', {
        method: 'POST'
      });

      if (!response.ok) {
        setSaveMessage('Failed to regenerate token');
        return;
      }

      const { access_token } = await response.json();
      
      if (access_token) {
        setAccessToken(access_token);
        setSaveMessage('Token regenerated successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to regenerate token:', error);
      setSaveMessage('Failed to regenerate token');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Settings</h1>
      <p style={styles.subtitle}>Configure your store and cart settings</p>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Cart Activation</h2>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Cart Status</label>
          <p style={styles.hint}>
            Enable or disable the cart app on your Shopify store. When disabled, customers will see the default Shopify cart.
          </p>
          
          <div style={styles.buttonGroup}>
            <button
              onClick={() => handleToggleCart(true)}
              style={{
                ...styles.activateButton,
                ...(cartActive ? styles.activateButtonActive : styles.activateButtonInactive)
              }}
            >
              {cartActive ? '✓ ' : ''}Activate
            </button>
            <button
              onClick={() => handleToggleCart(false)}
              style={{
                ...styles.deactivateButton,
                ...(!cartActive ? styles.deactivateButtonActive : styles.deactivateButtonInactive)
              }}
            >
              {!cartActive ? '✓ ' : ''}Deactivate
            </button>
          </div>
          
          <p style={{ ...styles.hint, marginTop: '12px', fontWeight: '600' }}>
            Current Status: <span style={{ color: cartActive ? '#4CAF50' : '#f44336' }}>
              {cartActive ? 'Active' : 'Inactive'}
            </span>
          </p>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Shopify Connection</h2>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Store Domain</label>
          <input
            type="text"
            value={storeDomain}
            onChange={(e) => {
              setStoreDomain(e.target.value);
              setValidationResult(null);
            }}
            style={styles.input}
            placeholder="your-store.myshopify.com"
          />
          <p style={styles.hint}>Your Shopify store's .myshopify.com domain</p>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Shopify Admin API Token</label>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => {
              setApiToken(e.target.value);
              setValidationResult(null);
            }}
            style={styles.input}
            placeholder="shpat_••••••••••••••••"
          />
          <p style={styles.hint}>
            Admin API access token with <strong>read_orders</strong> permission
          </p>
        </div>

        <button
          onClick={handleValidateToken}
          disabled={validating || !storeDomain || !apiToken}
          style={{
            ...styles.button,
            backgroundColor: validating ? '#ccc' : '#1976d2',
            cursor: validating || !storeDomain || !apiToken ? 'not-allowed' : 'pointer',
            marginBottom: '16px'
          }}
        >
          {validating ? 'Validating...' : '🔗 Validate & Connect Store'}
        </button>

        {validationResult && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            backgroundColor: validationResult.success ? '#e8f5e9' : '#ffebee',
            border: `1px solid ${validationResult.success ? '#4caf50' : '#f44336'}`,
            color: validationResult.success ? '#2e7d32' : '#c62828'
          }}>
            <p style={{ margin: 0, fontWeight: '600' }}>
              {validationResult.message}
            </p>
            {validationResult.corrected && (
              <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
                ℹ️ Domain was auto-corrected to the canonical Shopify domain
              </p>
            )}
          </div>
        )}

        <div style={{
          padding: '12px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #2196f3',
          marginTop: '16px'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#1565c0' }}>
            <strong>📚 How to get your API token:</strong>
          </p>
          <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px', color: '#1976d2' }}>
            <li>Go to your Shopify Admin → Settings → Apps and sales channels</li>
            <li>Click "Develop apps" → "Create an app"</li>
            <li>Name it "XCart Revenue Tracking"</li>
            <li>Configure Admin API scopes: Enable <strong>read_orders</strong></li>
            <li>Install the app and copy the Admin API access token</li>
          </ol>
        </div>
      </div>

      {/* Installation Instructions - show after first save */}
      {accessToken ? (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Installation</h2>
          
          <p style={styles.hint}>
            Copy the script below and paste it in your Shopify theme's <code>theme.liquid</code> file, just before the closing <code>&lt;/body&gt;</code> tag.
          </p>
          
          <div style={styles.scriptBox}>
            <code style={styles.scriptCode}>
              {`<script src="https://blackcartapp.netlify.app/cart.js?token=${accessToken}"></script>`}
            </code>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button onClick={handleCopyScript} style={styles.copyButton}>
              {copied ? '✓ Copied!' : '📋 Copy Script'}
            </button>
            <button onClick={handleRegenerateToken} style={styles.regenerateButton}>
              🔄 Regenerate Token
            </button>
          </div>
          
          <p style={{ ...styles.hint, marginTop: '16px' }}>
            ⚠️ Keep this token secure. If compromised, use the regenerate button to create a new one.
          </p>
        </div>
      ) : (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Installation</h2>
          <p style={styles.hint}>
            Save your settings above to generate your installation script.
          </p>
        </div>
      )}

      {saveMessage && (
        <div style={{
          ...styles.message,
          ...(saveMessage.includes('✓') || saveMessage.toLowerCase().includes('success') 
            ? styles.messageSuccess 
            : styles.messageError)
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
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
  },
  activateButton: {
    flex: 1,
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  },
  activateButtonActive: {
    background: '#4CAF50',
    color: '#fff',
  },
  activateButtonInactive: {
    background: '#1a1a1a',
    color: '#666',
    border: '1px solid #333',
  },
  deactivateButton: {
    flex: 1,
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  },
  deactivateButtonActive: {
    background: '#f44336',
    color: '#fff',
  },
  deactivateButtonInactive: {
    background: '#1a1a1a',
    color: '#666',
    border: '1px solid #333',
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
  scriptBox: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '12px',
    overflow: 'auto',
  },
  scriptCode: {
    color: '#4CAF50',
    fontSize: '14px',
    fontFamily: 'monospace',
    wordBreak: 'break-all' as const,
  },
  copyButton: {
    padding: '10px 20px',
    background: '#fff',
    color: '#000',
    border: '1px solid #333',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  regenerateButton: {
    padding: '10px 20px',
    background: 'transparent',
    color: '#fff',
    border: '1px solid #666',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
};