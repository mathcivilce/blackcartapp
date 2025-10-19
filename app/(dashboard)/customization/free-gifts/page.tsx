'use client';

import { useState, useEffect } from 'react';
import CartPreview from '../components/CartPreview';

export default function FreeGiftsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  
  const [freeGifts, setFreeGifts] = useState({
    enabled: false,
    conditionType: 'quantity',
    headline: 'Unlock Your Free Gifts!',
    headlineColor: '#000000',
    progressColor: '#4CAF50',
    position: 'bottom',
    showBorder: true,
    tier1: {
      enabled: false,
      threshold: 1,
      productHandle: '',
      variantId: '',
      rewardText: 'Free Gift',
      unlockedMessage: '🎉 Free Gift Unlocked!',
      showUnlockedMessage: true,
      icon: '🎁',
    },
    tier2: {
      enabled: false,
      threshold: 2,
      productHandle: '',
      variantId: '',
      rewardText: 'Free Gift',
      unlockedMessage: '🎉 Free Gift Unlocked!',
      showUnlockedMessage: true,
      icon: '🎁',
    },
    tier3: {
      enabled: false,
      threshold: 3,
      productHandle: '',
      variantId: '',
      rewardText: 'Free Gift',
      unlockedMessage: '🎉 Free Gift Unlocked!',
      showUnlockedMessage: true,
      icon: '🎁',
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
      await fetchFreeGifts(store.id);
      await fetchDesign(store.id);
      await fetchAnnouncement(store.id);
    } catch (error) {
      console.error('Error loading user and settings:', error);
      setLoading(false);
    }
  };

  const fetchFreeGifts = async (storeIdParam: string) => {
    try {
      const response = await fetch(`/api/freegifts?storeId=${storeIdParam}`);
      if (response.ok) {
        const data = await response.json();
        setFreeGifts(data);
      }
    } catch (error) {
      console.error('Error fetching free gifts settings:', error);
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

  const handleSave = async () => {
    if (!storeId) {
      alert('Store ID not found');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/freegifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          ...freeGifts,
        }),
      });

      if (response.ok) {
        alert('Free gifts settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving free gifts settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTierChange = (tier: 'tier1' | 'tier2' | 'tier3', field: string, value: any) => {
    setFreeGifts(prev => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.settingsPanel}>
        <div style={styles.header}>
          <h1 style={styles.title}>Free Gifts</h1>
          <button
            style={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Master Switch */}
        <div style={styles.section}>
          <label style={styles.label}>Free Gifts</label>
          <div style={styles.toggleContainer}>
            <button
              onClick={() => setFreeGifts({ ...freeGifts, enabled: !freeGifts.enabled })}
              style={{
                ...styles.toggleButton,
                ...(freeGifts.enabled ? styles.toggleButtonActive : styles.toggleButtonInactive)
              }}
            >
              {freeGifts.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        {freeGifts.enabled && (
          <>
            {/* Condition Type */}
            <div style={styles.section}>
              <label style={styles.label}>Condition Category</label>
              <div style={styles.buttonGroup}>
                <button
                  onClick={() => setFreeGifts({ ...freeGifts, conditionType: 'quantity' })}
                  style={{
                    ...styles.alignButton,
                    ...(freeGifts.conditionType === 'quantity' ? styles.active : {})
                  }}
                >
                  Quantity Items
                </button>
                <button
                  onClick={() => setFreeGifts({ ...freeGifts, conditionType: 'amount' })}
                  style={{
                    ...styles.alignButton,
                    ...(freeGifts.conditionType === 'amount' ? styles.active : {})
                  }}
                >
                  Amount Spent
                </button>
              </div>
            </div>

            {/* Progress Bar Settings */}
            <div style={styles.section}>
              <label style={styles.label}>Progress Bar Headline</label>
              <input
                type="text"
                style={styles.input}
                value={freeGifts.headline}
                onChange={(e) => setFreeGifts({ ...freeGifts, headline: e.target.value })}
                placeholder="Unlock Your Free Gifts!"
              />
            </div>

            <div style={styles.section}>
              <label style={styles.label}>Headline Color</label>
              <input
                type="color"
                style={styles.colorInput}
                value={freeGifts.headlineColor}
                onChange={(e) => setFreeGifts({ ...freeGifts, headlineColor: e.target.value })}
              />
            </div>

            <div style={styles.section}>
              <label style={styles.label}>Progress Bar Color</label>
              <input
                type="color"
                style={styles.colorInput}
                value={freeGifts.progressColor}
                onChange={(e) => setFreeGifts({ ...freeGifts, progressColor: e.target.value })}
              />
            </div>

            {/* Position */}
            <div style={styles.section}>
              <label style={styles.label}>Progress Bar Position</label>
              <div style={styles.buttonGroup}>
                <button
                  className={`${styles.alignButton} ${freeGifts.position === 'top' ? styles.active : ''}`}
                  onClick={() => setFreeGifts({ ...freeGifts, position: 'top' })}
                  style={{
                    ...styles.alignButton,
                    ...(freeGifts.position === 'top' ? styles.active : {})
                  }}
                >
                  Top
                </button>
                <button
                  className={`${styles.alignButton} ${freeGifts.position === 'bottom' ? styles.active : ''}`}
                  onClick={() => setFreeGifts({ ...freeGifts, position: 'bottom' })}
                  style={{
                    ...styles.alignButton,
                    ...(freeGifts.position === 'bottom' ? styles.active : {})
                  }}
                >
                  Bottom
                </button>
              </div>
              <p style={styles.helpText}>
                Top: Below cart header | Bottom: Above protection product
              </p>
            </div>

            {/* Show Border */}
            <div style={styles.section}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={freeGifts.showBorder}
                  onChange={(e) => setFreeGifts({ ...freeGifts, showBorder: e.target.checked })}
                />
                <span>Show section border</span>
              </label>
              <p style={styles.helpText}>
                Display borders around the free gifts progress bar section
              </p>
            </div>

            {/* Tier 1 */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Tier 1</h2>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={freeGifts.tier1.enabled}
                  onChange={(e) => handleTierChange('tier1', 'enabled', e.target.checked)}
                />
                <span>Enable Tier 1</span>
              </label>

              {freeGifts.tier1.enabled && (
                <>
                  <label style={styles.label}>
                    {freeGifts.conditionType === 'quantity' ? 'Quantity Threshold' : 'Amount Threshold ($)'}
                  </label>
                  <input
                    type="number"
                    style={styles.input}
                    value={freeGifts.tier1.threshold}
                    onChange={(e) => handleTierChange('tier1', 'threshold', parseInt(e.target.value) || 0)}
                    min="0"
                  />

                  <label style={styles.label}>Product Handle</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={freeGifts.tier1.productHandle}
                    onChange={(e) => handleTierChange('tier1', 'productHandle', e.target.value)}
                    placeholder="e.g., free-wallet"
                  />

                  <label style={styles.label}>Variant ID (Optional)</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={freeGifts.tier1.variantId}
                    onChange={(e) => handleTierChange('tier1', 'variantId', e.target.value)}
                    placeholder="e.g., 12345678901234"
                  />

                  <label style={styles.label}>Icon (emoji or symbol)</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={freeGifts.tier1.icon}
                    onChange={(e) => handleTierChange('tier1', 'icon', e.target.value)}
                    placeholder="e.g., 🎁 or 🎉"
                    maxLength={4}
                  />

                  <label style={styles.label}>Reward Text (shown in progress bar)</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={freeGifts.tier1.rewardText}
                    onChange={(e) => handleTierChange('tier1', 'rewardText', e.target.value)}
                    placeholder="e.g., Free Wallet"
                  />

                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={freeGifts.tier1.showUnlockedMessage}
                      onChange={(e) => handleTierChange('tier1', 'showUnlockedMessage', e.target.checked)}
                    />
                    <span>Show unlocked message when this tier is reached</span>
                  </label>

                  {freeGifts.tier1.showUnlockedMessage && (
                    <>
                      <label style={styles.label}>Unlocked Message</label>
                      <input
                        type="text"
                        style={styles.input}
                        value={freeGifts.tier1.unlockedMessage}
                        onChange={(e) => handleTierChange('tier1', 'unlockedMessage', e.target.value)}
                        placeholder="e.g., 🎉 Free Wallet Unlocked!"
                      />
                    </>
                  )}
                </>
              )}
            </div>

            {/* Tier 2 */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Tier 2</h2>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={freeGifts.tier2.enabled}
                  onChange={(e) => handleTierChange('tier2', 'enabled', e.target.checked)}
                />
                <span>Enable Tier 2</span>
              </label>

              {freeGifts.tier2.enabled && (
                <>
                  <label style={styles.label}>
                    {freeGifts.conditionType === 'quantity' ? 'Quantity Threshold' : 'Amount Threshold ($)'}
                  </label>
                  <input
                    type="number"
                    style={styles.input}
                    value={freeGifts.tier2.threshold}
                    onChange={(e) => handleTierChange('tier2', 'threshold', parseInt(e.target.value) || 0)}
                    min="0"
                  />

                  <label style={styles.label}>Product Handle</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={freeGifts.tier2.productHandle}
                    onChange={(e) => handleTierChange('tier2', 'productHandle', e.target.value)}
                    placeholder="e.g., free-hat"
                  />

                  <label style={styles.label}>Variant ID (Optional)</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={freeGifts.tier2.variantId}
                    onChange={(e) => handleTierChange('tier2', 'variantId', e.target.value)}
                    placeholder="e.g., 12345678901234"
                  />

                  <label style={styles.label}>Icon (emoji or symbol)</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={freeGifts.tier2.icon}
                    onChange={(e) => handleTierChange('tier2', 'icon', e.target.value)}
                    placeholder="e.g., 🎁 or 🎉"
                    maxLength={4}
                  />

                  <label style={styles.label}>Reward Text (shown in progress bar)</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={freeGifts.tier2.rewardText}
                    onChange={(e) => handleTierChange('tier2', 'rewardText', e.target.value)}
                    placeholder="e.g., Free Hat"
                  />

                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={freeGifts.tier2.showUnlockedMessage}
                      onChange={(e) => handleTierChange('tier2', 'showUnlockedMessage', e.target.checked)}
                    />
                    <span>Show unlocked message when this tier is reached</span>
                  </label>

                  {freeGifts.tier2.showUnlockedMessage && (
                    <>
                      <label style={styles.label}>Unlocked Message</label>
                      <input
                        type="text"
                        style={styles.input}
                        value={freeGifts.tier2.unlockedMessage}
                        onChange={(e) => handleTierChange('tier2', 'unlockedMessage', e.target.value)}
                        placeholder="e.g., 🎉 Free Hat Unlocked!"
                      />
                    </>
                  )}
                </>
              )}
            </div>

            {/* Tier 3 */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Tier 3</h2>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={freeGifts.tier3.enabled}
                  onChange={(e) => handleTierChange('tier3', 'enabled', e.target.checked)}
                />
                <span>Enable Tier 3</span>
              </label>

              {freeGifts.tier3.enabled && (
                <>
                  <label style={styles.label}>
                    {freeGifts.conditionType === 'quantity' ? 'Quantity Threshold' : 'Amount Threshold ($)'}
                  </label>
                  <input
                    type="number"
                    style={styles.input}
                    value={freeGifts.tier3.threshold}
                    onChange={(e) => handleTierChange('tier3', 'threshold', parseInt(e.target.value) || 0)}
                    min="0"
                  />

                  <label style={styles.label}>Product Handle</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={freeGifts.tier3.productHandle}
                    onChange={(e) => handleTierChange('tier3', 'productHandle', e.target.value)}
                    placeholder="e.g., free-sunglasses"
                  />

                  <label style={styles.label}>Variant ID (Optional)</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={freeGifts.tier3.variantId}
                    onChange={(e) => handleTierChange('tier3', 'variantId', e.target.value)}
                    placeholder="e.g., 12345678901234"
                  />

                  <label style={styles.label}>Icon (emoji or symbol)</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={freeGifts.tier3.icon}
                    onChange={(e) => handleTierChange('tier3', 'icon', e.target.value)}
                    placeholder="e.g., 🎁 or 🎉"
                    maxLength={4}
                  />

                  <label style={styles.label}>Reward Text (shown in progress bar)</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={freeGifts.tier3.rewardText}
                    onChange={(e) => handleTierChange('tier3', 'rewardText', e.target.value)}
                    placeholder="e.g., Free Sunglasses"
                  />

                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={freeGifts.tier3.showUnlockedMessage}
                      onChange={(e) => handleTierChange('tier3', 'showUnlockedMessage', e.target.checked)}
                    />
                    <span>Show unlocked message when this tier is reached</span>
                  </label>

                  {freeGifts.tier3.showUnlockedMessage && (
                    <>
                      <label style={styles.label}>Unlocked Message</label>
                      <input
                        type="text"
                        style={styles.input}
                        value={freeGifts.tier3.unlockedMessage}
                        onChange={(e) => handleTierChange('tier3', 'unlockedMessage', e.target.value)}
                        placeholder="e.g., 🎉 Free Sunglasses Unlocked!"
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div style={styles.previewPanel}>
        <h2 style={styles.previewTitle}>Live Preview</h2>
        <CartPreview
          design={design}
          addons={addons}
          announcement={announcement}
          freeGifts={freeGifts}
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
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
  },
  section: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '16px',
    marginTop: '0',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#fff',
    marginBottom: '8px',
    marginTop: '12px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #333',
    borderRadius: '6px',
    background: '#000',
    color: '#fff',
  },
  colorInput: {
    width: '60px',
    height: '40px',
    padding: '4px',
    border: '1px solid #333',
    borderRadius: '6px',
    background: '#000',
    cursor: 'pointer',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '12px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  alignButton: {
    flex: 1,
    padding: '10px 20px',
    fontSize: '14px',
    background: '#000',
    color: '#888',
    border: '1px solid #333',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  active: {
    background: '#1c8cd9',
    color: '#fff',
    borderColor: '#1c8cd9',
  },
  saveButton: {
    background: '#000',
    color: '#fff',
    border: '2px solid #fff',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#fff',
    fontSize: '18px',
  },
  previewPanel: {
    height: '100%',
    position: 'sticky' as const,
    top: '0',
  },
  previewTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#888',
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  helpText: {
    fontSize: '12px',
    color: '#888',
    marginTop: '6px',
    marginBottom: '0',
  },
  toggleContainer: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  toggleButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '500',
    border: '2px solid',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '100px',
  },
  toggleButtonActive: {
    background: '#22c55e',
    borderColor: '#22c55e',
    color: '#fff',
  },
  toggleButtonInactive: {
    background: '#000',
    borderColor: '#333',
    color: '#888',
  },
};

