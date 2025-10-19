'use client';

import { useState, useEffect } from 'react';
import CartPreview from '../components/CartPreview';

export default function UpsellPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  
  const [upsell, setUpsell] = useState({
    enabled: false,
    buttonColor: '#1a3a52',
    buttonCornerRadius: 6,
    item1: {
      enabled: false,
      productHandle: '',
      variantId: '',
    },
    item2: {
      enabled: false,
      productHandle: '',
      variantId: '',
    },
    item3: {
      enabled: false,
      productHandle: '',
      variantId: '',
    },
  });

  const [design, setDesign] = useState({
    backgroundColor: '#FFFFFF',
    cartAccentColor: '#000000',
    cartTextColor: '#000000',
    savingsTextColor: '#4CAF50',
    cornerRadius: '8',
    buttonText: 'Checkout',
    buttonColor: '#000000',
    buttonTextColor: '#FFFFFF',
    buttonTextHoverColor: '#FFFFFF',
    showSavings: true,
    showContinueShopping: true,
    showTotalOnButton: true,
    cartTitle: 'Cart',
    cartTitleAlignment: 'center',
    emptyCartText: 'Your cart is empty',
    savingsText: "You're saving",
    displayCompareAtPrice: true,
    closeButtonSize: 'medium',
    closeButtonColor: '#000000',
    closeButtonBorder: 'none',
    closeButtonBorderColor: '#000000',
    useCartImage: false,
    cartImageUrl: '',
    cartImageMobileSize: '100',
    cartImageDesktopSize: '150',
    cartImagePosition: 'center',
  });

  const [announcement, setAnnouncement] = useState({
    enabled: false,
    text: '',
    textColor: '#000000',
    backgroundColor: '#FFF3CD',
    position: 'top',
    countdownEnabled: false,
    countdownType: 'fixed',
    countdownEnd: '',
    countdownDuration: 5,
    fontSize: 14,
    showBorder: true,
  });

  const [addons, setAddons] = useState({
    enabled: true,
    title: 'Shipping Protection',
    description: 'Protect your order from damage, loss, or theft during shipping.',
    price: '4.90',
    acceptByDefault: false,
  });

  useEffect(() => {
    loadUserAndSettings();
  }, []);

  const loadUserAndSettings = async () => {
    try {
      // Get authenticated user
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) {
        console.error('No user logged in');
        setLoading(false);
        return;
      }
      
      const { user } = await userResponse.json();
      setUserId(user.id);
      
      // Get user's store
      const storeResponse = await fetch(`/api/user/store?userId=${user.id}`);
      if (!storeResponse.ok) {
        console.log('No store found for user');
        setLoading(false);
        return;
      }
      
      const { store } = await storeResponse.json();
      setStoreId(store.id);
      
      // Fetch settings for this store
      await fetchUpsell(store.id);
      await fetchDesign(store.id);
      await fetchAnnouncement(store.id);
    } catch (error) {
      console.error('Error loading user and settings:', error);
      setLoading(false);
    }
  };

  const fetchUpsell = async (storeIdParam: string) => {
    try {
      const response = await fetch(`/api/upsell?storeId=${storeIdParam}`);
      if (response.ok) {
        const data = await response.json();
        setUpsell(data);
      }
    } catch (error) {
      console.error('Error fetching upsell settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesign = async (storeIdParam: string) => {
    try {
      const response = await fetch(`/api/design?storeId=${storeIdParam}`);
      if (response.ok) {
        const data = await response.json();
        setDesign(data);
      }
    } catch (error) {
      console.error('Error fetching design settings:', error);
    }
  };

  const fetchAnnouncement = async (storeIdParam: string) => {
    try {
      const response = await fetch(`/api/announcement?storeId=${storeIdParam}`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncement(data);
      }
    } catch (error) {
      console.error('Error fetching announcement settings:', error);
    }
  };

  const handleItemChange = (itemKey: 'item1' | 'item2' | 'item3', field: string, value: any) => {
    setUpsell({
      ...upsell,
      [itemKey]: {
        ...upsell[itemKey],
        [field]: value
      }
    });
  };

  const handleSave = async () => {
    if (!storeId) {
      alert('No store ID found');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/upsell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          ...upsell,
        }),
      });

      if (response.ok) {
        alert('Upsell settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.settingsPanel}>
        <h1 style={styles.title}>Upsell Products</h1>
        <p style={styles.subtitle}>Display product recommendations in your cart to increase order value</p>

        <div style={styles.section}>
          <div style={styles.toggleContainer}>
            <button
              onClick={() => setUpsell({ ...upsell, enabled: !upsell.enabled })}
              style={{
                ...styles.toggleButton,
                ...(upsell.enabled ? styles.toggleButtonActive : styles.toggleButtonInactive)
              }}
            >
              {upsell.enabled ? 'Enabled' : 'Disabled'}
            </button>
            <label style={styles.toggleLabel}>Enable Upsell Products</label>
          </div>
          <p style={styles.helpText}>
            Show product recommendations in your cart
          </p>
        </div>

        {upsell.enabled && (
          <>
            {/* Button Customization */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Button Customization</h2>
              
              <label style={styles.label}>Button Color</label>
              <input
                type="color"
                style={styles.colorInput}
                value={upsell.buttonColor}
                onChange={(e) => setUpsell({ ...upsell, buttonColor: e.target.value })}
              />
              <p style={styles.helpText}>
                Choose the color for all "Add to Cart" buttons
              </p>

              <label style={styles.label}>Button Corner Radius (px)</label>
              <input
                type="number"
                min="1"
                max="40"
                style={styles.input}
                value={upsell.buttonCornerRadius}
                onChange={(e) => {
                  const value = Math.min(40, Math.max(1, parseInt(e.target.value) || 1));
                  setUpsell({ ...upsell, buttonCornerRadius: value });
                }}
              />
              <p style={styles.helpText}>
                Set corner radius from 1px to 40px
              </p>
            </div>

            {/* Upsell Item 1 */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Upsell Product 1</h2>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={upsell.item1.enabled}
                  onChange={(e) => handleItemChange('item1', 'enabled', e.target.checked)}
                />
                <span>Enable Upsell Product 1</span>
              </label>

              {upsell.item1.enabled && (
                <>
                  <label style={styles.label}>Product Handle</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={upsell.item1.productHandle}
                    onChange={(e) => handleItemChange('item1', 'productHandle', e.target.value)}
                    placeholder="e.g., blue-bracelet"
                  />
                  <p style={styles.helpText}>
                    Find this in your Shopify product URL: /products/[handle]
                  </p>

                  <label style={styles.label}>Variant ID (Optional)</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={upsell.item1.variantId}
                    onChange={(e) => handleItemChange('item1', 'variantId', e.target.value)}
                    placeholder="e.g., 12345678901234"
                  />
                  <p style={styles.helpText}>
                    Leave empty to use the default variant
                  </p>
                </>
              )}
            </div>

            {/* Upsell Item 2 */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Upsell Product 2</h2>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={upsell.item2.enabled}
                  onChange={(e) => handleItemChange('item2', 'enabled', e.target.checked)}
                />
                <span>Enable Upsell Product 2</span>
              </label>

              {upsell.item2.enabled && (
                <>
                  <label style={styles.label}>Product Handle</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={upsell.item2.productHandle}
                    onChange={(e) => handleItemChange('item2', 'productHandle', e.target.value)}
                    placeholder="e.g., turtle-necklace"
                  />
                  <p style={styles.helpText}>
                    Find this in your Shopify product URL: /products/[handle]
                  </p>

                  <label style={styles.label}>Variant ID (Optional)</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={upsell.item2.variantId}
                    onChange={(e) => handleItemChange('item2', 'variantId', e.target.value)}
                    placeholder="e.g., 12345678901234"
                  />
                  <p style={styles.helpText}>
                    Leave empty to use the default variant
                  </p>
                </>
              )}
            </div>

            {/* Upsell Item 3 */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Upsell Product 3</h2>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={upsell.item3.enabled}
                  onChange={(e) => handleItemChange('item3', 'enabled', e.target.checked)}
                />
                <span>Enable Upsell Product 3</span>
              </label>

              {upsell.item3.enabled && (
                <>
                  <label style={styles.label}>Product Handle</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={upsell.item3.productHandle}
                    onChange={(e) => handleItemChange('item3', 'productHandle', e.target.value)}
                    placeholder="e.g., marine-jewelry-case"
                  />
                  <p style={styles.helpText}>
                    Find this in your Shopify product URL: /products/[handle]
                  </p>

                  <label style={styles.label}>Variant ID (Optional)</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={upsell.item3.variantId}
                    onChange={(e) => handleItemChange('item3', 'variantId', e.target.value)}
                    placeholder="e.g., 12345678901234"
                  />
                  <p style={styles.helpText}>
                    Leave empty to use the default variant
                  </p>
                </>
              )}
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...styles.saveButton,
            opacity: saving ? 0.6 : 1,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div style={styles.previewPanel}>
        <h2 style={styles.previewTitle}>Live Preview</h2>
        <CartPreview
          design={design}
          addons={addons}
          announcement={announcement}
          upsell={upsell}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '32px',
    maxWidth: '1400px',
  },
  settingsPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  section: {
    background: '#fff',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 16px 0',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
    marginTop: '16px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    boxSizing: 'border-box' as const,
  },
  colorInput: {
    width: '100%',
    height: '50px',
    padding: '4px',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  helpText: {
    fontSize: '12px',
    color: '#999',
    margin: '6px 0 0 0',
  },
  toggleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  toggleButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  toggleButtonActive: {
    background: '#4CAF50',
    color: '#fff',
  },
  toggleButtonInactive: {
    background: '#e5e5e5',
    color: '#666',
  },
  toggleLabel: {
    fontSize: '14px',
    fontWeight: '500',
  },
  saveButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    width: '100%',
  },
  previewPanel: {
    position: 'sticky' as const,
    top: '0',
  },
  previewTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#888',
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
};

