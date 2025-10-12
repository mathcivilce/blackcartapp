'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    protectionProductId: '',
    price: '4.90',
    toggleColor: '#2196F3',
    toggleText: 'Shipping Protection',
    description: 'Protect your order from damage, loss, or theft during shipping.',
  });

  const [shopDomain, setShopDomain] = useState('example-store.myshopify.com');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const priceInCents = Math.round(parseFloat(settings.price) * 100);
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop: shopDomain,
          protectionProductId: settings.protectionProductId || 99999999,
          price: priceInCents,
          toggleColor: settings.toggleColor,
          toggleText: settings.toggleText,
          description: settings.description,
        })
      });

      if (response.ok) {
        setSaveMessage('✅ Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('❌ Failed to save settings');
      }
    } catch (error) {
      setSaveMessage('❌ Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}>Protection Settings</h1>
        <p style={styles.subtitle}>
          Customize your shipping protection product
        </p>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Store Information</h2>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Store Domain</label>
            <input
              type="text"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              style={styles.input}
              placeholder="example-store.myshopify.com"
            />
            <p style={styles.hint}>Your Shopify store URL</p>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Protection Product</h2>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Product Variant ID</label>
            <input
              type="text"
              name="protectionProductId"
              value={settings.protectionProductId}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Enter variant ID (e.g., 12345678901234)"
            />
            <p style={styles.hint}>
              The variant ID of your protection product in Shopify. 
              <br />For testing, leave blank to use mock ID.
            </p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Price</label>
            <input
              type="number"
              name="price"
              value={settings.price}
              onChange={handleInputChange}
              style={styles.input}
              step="0.01"
              min="0"
              placeholder="2.99"
            />
            <p style={styles.hint}>Price in dollars (e.g., 2.99 for $2.99)</p>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Customization</h2>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Toggle Color</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="color"
                name="toggleColor"
                value={settings.toggleColor}
                onChange={handleInputChange}
                style={styles.colorPicker}
              />
              <input
                type="text"
                name="toggleColor"
                value={settings.toggleColor}
                onChange={handleInputChange}
                style={{ ...styles.input, flex: 1 }}
                placeholder="#000000"
              />
            </div>
            <p style={styles.hint}>Color for checkbox and price text</p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Toggle Text</label>
            <input
              type="text"
              name="toggleText"
              value={settings.toggleText}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Protect my order"
            />
            <p style={styles.hint}>Main heading for the protection option</p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={settings.description}
              onChange={handleInputChange}
              style={styles.textarea}
              rows={2}
              placeholder="Coverage for loss, damage, and theft"
            />
            <p style={styles.hint}>Brief description of what's covered</p>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Preview</h2>
          <p style={styles.subtitle}>How it will look in the cart</p>
          
          <div style={styles.preview}>
            <div style={styles.previewToggle}>
              <input 
                type="checkbox" 
                id="preview-checkbox"
                style={{
                  width: '20px',
                  height: '20px',
                  accentColor: settings.toggleColor,
                  cursor: 'pointer'
                }}
              />
              <div style={{ flex: 1 }}>
                <label 
                  htmlFor="preview-checkbox"
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'block',
                    marginBottom: '4px'
                  }}
                >
                  {settings.toggleText}
                </label>
                <p style={{
                  fontSize: '13px',
                  color: '#666',
                  margin: '0 0 4px 0'
                }}>
                  {settings.description}
                </p>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: settings.toggleColor,
                  margin: 0
                }}>
                  +${settings.price}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{
              ...styles.saveButton,
              opacity: isSaving ? 0.6 : 1,
              cursor: isSaving ? 'not-allowed' : 'pointer'
            }}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          
          {saveMessage && (
            <p style={{
              ...styles.hint,
              color: saveMessage.includes('✅') ? '#22c55e' : '#ef4444',
              fontWeight: '600'
            }}>
              {saveMessage}
            </p>
          )}
        </div>

        <div style={styles.infoCard}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>📝 Quick Guide</h3>
          <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Create a protection product in your Shopify store</li>
            <li>Copy the variant ID from Shopify Admin</li>
            <li>Paste it in the "Product Variant ID" field above</li>
            <li>Set your desired price and customize colors/text</li>
            <li>Click "Save Settings"</li>
            <li>Test by opening your store and adding items to cart</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#000'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '32px'
  },
  card: {
    background: '#fff',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#000'
  },
  formGroup: {
    marginBottom: '24px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#000'
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const
  },
  colorPicker: {
    width: '60px',
    height: '44px',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '6px',
    lineHeight: '1.5'
  },
  preview: {
    background: '#fafafa',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '16px'
  },
  previewToggle: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start'
  },
  actions: {
    marginBottom: '20px'
  },
  saveButton: {
    width: '100%',
    background: '#000',
    color: '#fff',
    border: 'none',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  infoCard: {
    background: '#e3f2fd',
    borderRadius: '8px',
    padding: '20px',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#1e40af'
  }
};

