'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase-client';

export default function SettingsPage() {
  const [cartActive, setCartActive] = useState(false);
  const [storeDomain, setStoreDomain] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Load current user and settings
    const loadSettings = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.user) {
          console.error('No user logged in');
          return;
        }
        
        const user = session.user;
        setUserId(user.id);
        console.log('User loaded:', user.id);

        // Get user's store
        const { data: store, error: storeError } = await supabaseClient
          .from('stores')
          .select('*, settings(*)')
          .eq('user_id', user.id)
          .single();

        if (storeError) {
          console.log('No store found for user, will create on save');
          return;
        }

        if (store) {
          console.log('Store loaded:', store);
          setStoreDomain(store.shop_domain || '');
          setApiToken(store.api_token || '');
          setAccessToken(store.access_token || '');
          
          const settings = store.settings?.[0];
          if (settings) {
            setCartActive(settings.cart_active ?? true);
          }
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
    
    if (!userId) return;
    
    // Update settings in database directly
    try {
      const { data: store } = await supabaseClient
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (store) {
        await supabaseClient
          .from('settings')
          .update({ cart_active: newValue })
          .eq('store_id', store.id);
      }
    } catch (error) {
      console.error('Failed to save cart_active:', error);
      setCartActive(!newValue);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setSaveMessage('');
    
    if (!userId) {
      setSaveMessage('User not authenticated. Please refresh the page.');
      setLoading(false);
      return;
    }
    
    try {
      // Check if store exists
      const { data: existingStore } = await supabaseClient
        .from('stores')
        .select('id, access_token')
        .eq('user_id', userId)
        .single();

      let storeId = existingStore?.id;
      let token = existingStore?.access_token;

      if (!existingStore) {
        // Create new store for user
        const { data: newStore, error: createError } = await supabaseClient
          .from('stores')
          .insert({
            user_id: userId,
            shop_domain: storeDomain,
            api_token: apiToken,
            subscription_status: 'active'
          })
          .select('id, access_token')
          .single();

        if (createError) {
          console.error('Failed to create store:', createError);
          setSaveMessage('Failed to create store. Please try again.');
          setLoading(false);
          return;
        }

        storeId = newStore.id;
        token = newStore.access_token;

        // Create default settings
        await supabaseClient
          .from('settings')
          .insert({
            store_id: storeId,
            cart_active: true,
            enabled: true
          });
      } else {
        // Update existing store
        const updateData: any = {};
        if (storeDomain) updateData.shop_domain = storeDomain;
        if (apiToken) updateData.api_token = apiToken;

        if (Object.keys(updateData).length > 0) {
          await supabaseClient
            .from('stores')
            .update(updateData)
            .eq('id', storeId);
        }
      }
      
      // Set the access token to display installation instructions
      if (token) {
        setAccessToken(token);
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
    if (!userId || !confirm('Are you sure you want to regenerate the token? You will need to update your Shopify theme with the new script.')) {
      return;
    }

    try {
      const { data: store } = await supabaseClient
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (store) {
        // Delete and re-insert to trigger UUID generation (RPC not available on client)
        // Instead, we'll use a workaround by updating with null then letting DB regenerate
        const { data: updatedStore } = await supabaseClient
          .from('stores')
          .update({ access_token: crypto.randomUUID() })
          .eq('id', store.id)
          .select('access_token')
          .single();

        if (updatedStore) {
          setAccessToken(updatedStore.access_token);
          setSaveMessage('Token regenerated successfully!');
          setTimeout(() => setSaveMessage(''), 3000);
        }
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