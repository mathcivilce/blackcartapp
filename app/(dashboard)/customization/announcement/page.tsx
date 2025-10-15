'use client';

import { useState, useEffect } from 'react';
import CartPreview from '../components/CartPreview';

export default function AnnouncementPage() {
  const [announcement, setAnnouncement] = useState({
    enabled: false,
    text: 'BUY 1 GET 2 FREE',
    textColor: '#FFFFFF',
    backgroundColor: '#000000',
    position: 'top',
    countdownEnabled: false,
    countdownEnd: '',
    fontSize: 14,
    showBorder: true,
  });

  const [design, setDesign] = useState({
    backgroundColor: '#FFFFFF',
    cartAccentColor: '#f6f6f7',
    cartTextColor: '#000000',
    savingsTextColor: '#2ea818',
    cornerRadius: '21',
    buttonText: 'Proceed to Checkout',
    buttonColor: '#1c8cd9',
    buttonTextColor: '#FFFFFF',
    showSavings: true,
    showContinueShopping: true,
    showTotalOnButton: true,
    cartTitle: 'Cart',
    cartTitleAlignment: 'left',
    emptyCartText: 'Your cart is empty',
    savingsText: 'Save',
    displayCompareAtPrice: true,
    closeButtonSize: 'medium',
    closeButtonColor: '#637381',
    closeButtonBorder: 'none',
    closeButtonBorderColor: '#000000',
    useCartImage: false,
    cartImageUrl: '',
    cartImageMobileSize: '100',
    cartImageDesktopSize: '120',
    cartImagePosition: 'left',
  });

  const [addons, setAddons] = useState({
    enabled: true,
    title: 'Shipping Protection',
    description: 'Protect your order from damage, loss, or theft during shipping.',
    price: '4.90',
    acceptByDefault: false,
    adjustTotalPrice: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);

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
      await fetchSettings(store.id);
      await fetchDesign(store.id);
      await fetchAddons(store.id);
    } catch (error) {
      console.error('Error loading user and settings:', error);
      setLoading(false);
    }
  };

  const fetchSettings = async (storeIdParam: string) => {
    try {
      const response = await fetch(`/api/announcement?storeId=${storeIdParam}`);
      if (response.ok) {
        const data = await response.json();
        
        // Convert ISO datetime to datetime-local format if countdownEnd exists
        if (data.countdownEnd) {
          const date = new Date(data.countdownEnd);
          // Format as YYYY-MM-DDTHH:MM (datetime-local format)
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          data.countdownEnd = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        
        setAnnouncement(data);
      }
    } catch (error) {
      console.error('Error fetching announcement settings:', error);
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
      console.error('Error fetching design:', error);
    }
  };

  const fetchAddons = async (storeIdParam: string) => {
    try {
      const response = await fetch(`/api/addons?storeId=${storeIdParam}`);
      if (response.ok) {
        const data = await response.json();
        setAddons({
          enabled: data.featureEnabled,
          title: data.shippingProtection.title,
          description: data.shippingProtection.description,
          price: data.shippingProtection.price,
          acceptByDefault: data.shippingProtection.acceptByDefault,
          adjustTotalPrice: data.shippingProtection.adjustTotalPrice,
        });
      }
    } catch (error) {
      console.error('Error fetching addons:', error);
    }
  };

  const handleSave = async () => {
    if (!storeId) {
      setSaveMessage('No store found. Please configure settings first.');
      return;
    }
    
    setSaving(true);
    setSaveMessage('');
    try {
      const response = await fetch('/api/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          ...announcement
        })
      });

      if (response.ok) {
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setAnnouncement(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return <div style={styles.container}><p style={{ color: '#fff' }}>Loading...</p></div>;
  }

  return (
    <div style={styles.container}>
      <style>{`
        .design-left-column::-webkit-scrollbar {
          width: 8px;
        }
        .design-left-column::-webkit-scrollbar-track {
          background: #000;
          border-radius: 4px;
        }
        .design-left-column::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        .design-left-column::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
      <h1 style={styles.title}>Announcement</h1>
      <p style={styles.subtitle}>Add an announcement banner to your cart</p>

      <div style={styles.splitLayout}>
        {/* Left Column - Announcement Configuration */}
        <div className="design-left-column" style={styles.leftColumn}>
          <div style={styles.card}>
            <div style={styles.toggleHeader}>
              <h2 style={styles.sectionTitle}>Enable Announcement</h2>
              <label style={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  name="enabled"
                  checked={announcement.enabled}
                  onChange={handleInputChange}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  ...styles.toggleSlider,
                  backgroundColor: announcement.enabled ? '#2196F3' : '#ccc'
                }}>
                  <span style={{
                    ...styles.toggleKnob,
                    transform: announcement.enabled ? 'translateX(22px)' : 'translateX(0)'
                  }}></span>
                </span>
              </label>
            </div>
            <p style={styles.description}>
              Show an announcement banner in your cart to highlight promotions or important messages
            </p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Announcement Content</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Announcement Text</label>
              <textarea
                name="text"
                value={announcement.text}
                onChange={handleInputChange}
                style={{ ...styles.textInput, minHeight: '80px', resize: 'vertical' as const }}
                placeholder="e.g., BUY 1 GET 2 FREE or Flash Sale ends in {{ countdown }}!"
                disabled={!announcement.enabled}
              />
              <p style={styles.helpText}>
                {announcement.countdownEnabled 
                  ? 'Use {{ countdown }} to show the countdown timer in your text'
                  : 'Enter your promotional message or announcement'}
              </p>
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="countdownEnabled"
                  checked={announcement.countdownEnabled}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                  disabled={!announcement.enabled}
                />
                <span>Enable countdown timer</span>
              </label>
              <p style={styles.helpText}>
                Shows a live countdown to a specific date/time
              </p>
            </div>

            {announcement.countdownEnabled && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Countdown End Time</label>
                <input
                  type="datetime-local"
                  name="countdownEnd"
                  value={announcement.countdownEnd}
                  onChange={handleInputChange}
                  style={styles.textInput}
                  disabled={!announcement.enabled}
                />
                <p style={styles.helpText}>
                  Select when the countdown should end
                </p>
              </div>
            )}
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Appearance</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Text Color</label>
              <div style={styles.colorInputGroup}>
                <input
                  type="color"
                  name="textColor"
                  value={announcement.textColor}
                  onChange={handleInputChange}
                  style={styles.colorPicker}
                  disabled={!announcement.enabled}
                />
                <input
                  type="text"
                  name="textColor"
                  value={announcement.textColor}
                  onChange={handleInputChange}
                  style={styles.colorInput}
                  disabled={!announcement.enabled}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Background Color</label>
              <div style={styles.colorInputGroup}>
                <input
                  type="color"
                  name="backgroundColor"
                  value={announcement.backgroundColor}
                  onChange={handleInputChange}
                  style={styles.colorPicker}
                  disabled={!announcement.enabled}
                />
                <input
                  type="text"
                  name="backgroundColor"
                  value={announcement.backgroundColor}
                  onChange={handleInputChange}
                  style={styles.colorInput}
                  disabled={!announcement.enabled}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Font Size</label>
              <div style={styles.sliderGroup}>
                <input
                  type="range"
                  name="fontSize"
                  value={announcement.fontSize}
                  onChange={handleInputChange}
                  min="10"
                  max="24"
                  style={styles.slider}
                  disabled={!announcement.enabled}
                />
                <input
                  type="number"
                  name="fontSize"
                  value={announcement.fontSize}
                  onChange={handleInputChange}
                  style={styles.numberInput}
                  disabled={!announcement.enabled}
                />
                <span style={styles.unit}>px</span>
              </div>
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="showBorder"
                  checked={announcement.showBorder}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                  disabled={!announcement.enabled}
                />
                <span>Show border line</span>
              </label>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Position</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Announcement Position</label>
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => setAnnouncement(prev => ({ ...prev, position: 'top' }))}
                  style={{
                    ...styles.alignButton,
                    ...(announcement.position === 'top' ? styles.alignButtonActive : {}),
                    opacity: announcement.enabled ? 1 : 0.5,
                    cursor: announcement.enabled ? 'pointer' : 'not-allowed'
                  }}
                  disabled={!announcement.enabled}
                >
                  Top
                </button>
                <button
                  type="button"
                  onClick={() => setAnnouncement(prev => ({ ...prev, position: 'bottom' }))}
                  style={{
                    ...styles.alignButton,
                    ...(announcement.position === 'bottom' ? styles.alignButtonActive : {}),
                    opacity: announcement.enabled ? 1 : 0.5,
                    cursor: announcement.enabled ? 'pointer' : 'not-allowed'
                  }}
                  disabled={!announcement.enabled}
                >
                  Bottom
                </button>
              </div>
              <p style={styles.helpText}>
                Top: Below the cart header • Bottom: Above shipping protection
              </p>
            </div>
          </div>

          {saveMessage && (
            <div style={{ 
              padding: '12px', 
              background: saveMessage.includes('success') ? '#4CAF50' : '#f44336',
              color: '#fff',
              borderRadius: '8px',
              marginBottom: '16px',
              textAlign: 'center' as const
            }}>
              {saveMessage}
            </div>
          )}
          <button 
            onClick={handleSave}
            disabled={saving}
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.6 : 1,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Right Column - Cart Preview */}
        <div style={styles.rightColumn}>
          <CartPreview design={design} addons={addons} announcement={announcement} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1400px',
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
  splitLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '32px',
    height: 'calc(100vh - 180px)',
    alignItems: 'flex-start',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    overflowY: 'auto' as const,
    height: '100%',
    paddingRight: '10px',
  },
  rightColumn: {
    height: '100%',
    position: 'sticky' as const,
    top: '0',
  },
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '24px',
  },
  toggleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },
  description: {
    fontSize: '14px',
    color: '#888',
    margin: '0',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#fff',
    marginBottom: '8px',
  },
  textInput: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #333',
    borderRadius: '6px',
    background: '#000',
    color: '#fff',
    fontFamily: 'inherit',
  },
  helpText: {
    fontSize: '12px',
    color: '#666',
    marginTop: '6px',
    marginBottom: '0',
  },
  sliderGroup: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: '6px',
    background: '#333',
    borderRadius: '3px',
    outline: 'none',
    cursor: 'pointer',
  },
  numberInput: {
    width: '60px',
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #333',
    borderRadius: '6px',
    background: '#000',
    color: '#fff',
    textAlign: 'center' as const,
  },
  unit: {
    fontSize: '14px',
    color: '#888',
  },
  colorInputGroup: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  colorPicker: {
    width: '48px',
    height: '48px',
    border: '1px solid #333',
    borderRadius: '6px',
    cursor: 'pointer',
    background: '#000',
  },
  colorInput: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #333',
    borderRadius: '6px',
    background: '#000',
    color: '#fff',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
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
  alignButtonActive: {
    background: '#1c8cd9',
    color: '#fff',
    borderColor: '#1c8cd9',
  },
  toggleSwitch: {
    position: 'relative' as const,
    display: 'inline-block',
    width: '50px',
    height: '28px',
  },
  toggleSlider: {
    position: 'absolute' as const,
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transition: '.4s',
    borderRadius: '28px',
    display: 'block',
  },
  toggleKnob: {
    position: 'absolute' as const,
    content: '""',
    height: '20px',
    width: '20px',
    left: '4px',
    bottom: '4px',
    backgroundColor: 'white',
    transition: '.4s',
    borderRadius: '50%',
    display: 'block',
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
};

