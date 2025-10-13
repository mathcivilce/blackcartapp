'use client';

import { useState, useEffect } from 'react';
import CartPreview from '../components/CartPreview';

export default function DesignPage() {
  const [design, setDesign] = useState({
    backgroundColor: '#FFFFFF',
    cartAccentColor: '#f6f6f7',
    cartTextColor: '#000000',
    savingsTextColor: '#2ea818',
    cornerRadius: '21',
    buttonText: 'Proceed to Checkout',
    buttonColor: '#1c8cd9',
    buttonTextColor: '#FFFFFF',
    buttonTextHoverColor: '#e9e9e9',
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
  });

  const [addons, setAddons] = useState({
    enabled: true,
    title: 'Shipping Protection',
    description: 'Protect your order from damage, loss, or theft during shipping.',
    price: '4.90',
    acceptByDefault: false,
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
      await fetchAddons(store.id);
    } catch (error) {
      console.error('Error loading user and settings:', error);
      setLoading(false);
    }
  };

  const fetchSettings = async (storeIdParam: string) => {
    try {
      const response = await fetch(`/api/design?storeId=${storeIdParam}`);
      if (response.ok) {
        const data = await response.json();
        setDesign(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddons = async (storeIdParam: string) => {
    try {
      const response = await fetch(`/api/addons?storeId=${storeIdParam}`);
      if (response.ok) {
        const data = await response.json();
        setAddons(data.shippingProtection);
        setAddons(prev => ({ ...prev, enabled: data.featureEnabled }));
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
      const response = await fetch('/api/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          ...design
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setDesign(prev => ({
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
      <h1 style={styles.title}>Design</h1>
      <p style={styles.subtitle}>Customize the appearance of your cart sidebar</p>

      <div style={styles.splitLayout}>
        {/* Left Column - Customization Options */}
        <div className="design-left-column" style={styles.leftColumn}>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Colors</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Background color</label>
              <div style={styles.colorInputGroup}>
                <input
                  type="color"
                  name="backgroundColor"
                  value={design.backgroundColor}
                  onChange={handleInputChange}
                  style={styles.colorPicker}
                />
                <input
                  type="text"
                  name="backgroundColor"
                  value={design.backgroundColor}
                  onChange={handleInputChange}
                  style={styles.colorInput}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Cart accent color</label>
              <div style={styles.colorInputGroup}>
                <input
                  type="color"
                  name="cartAccentColor"
                  value={design.cartAccentColor}
                  onChange={handleInputChange}
                  style={styles.colorPicker}
                />
                <input
                  type="text"
                  name="cartAccentColor"
                  value={design.cartAccentColor}
                  onChange={handleInputChange}
                  style={styles.colorInput}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Cart text color</label>
              <div style={styles.colorInputGroup}>
                <input
                  type="color"
                  name="cartTextColor"
                  value={design.cartTextColor}
                  onChange={handleInputChange}
                  style={styles.colorPicker}
                />
                <input
                  type="text"
                  name="cartTextColor"
                  value={design.cartTextColor}
                  onChange={handleInputChange}
                  style={styles.colorInput}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Savings text color</label>
              <div style={styles.colorInputGroup}>
                <input
                  type="color"
                  name="savingsTextColor"
                  value={design.savingsTextColor}
                  onChange={handleInputChange}
                  style={styles.colorPicker}
                />
                <input
                  type="text"
                  name="savingsTextColor"
                  value={design.savingsTextColor}
                  onChange={handleInputChange}
                  style={styles.colorInput}
                />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Button settings</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Corner radius</label>
              <div style={styles.sliderGroup}>
                <input
                  type="range"
                  name="cornerRadius"
                  value={design.cornerRadius}
                  onChange={handleInputChange}
                  min="0"
                  max="30"
                  style={styles.slider}
                />
                <input
                  type="number"
                  name="cornerRadius"
                  value={design.cornerRadius}
                  onChange={handleInputChange}
                  style={styles.numberInput}
                />
                <span style={styles.unit}>px</span>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Button text</label>
              <input
                type="text"
                name="buttonText"
                value={design.buttonText}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Button color</label>
              <div style={styles.colorInputGroup}>
                <input
                  type="color"
                  name="buttonColor"
                  value={design.buttonColor}
                  onChange={handleInputChange}
                  style={styles.colorPicker}
                />
                <input
                  type="text"
                  name="buttonColor"
                  value={design.buttonColor}
                  onChange={handleInputChange}
                  style={styles.colorInput}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Button text color</label>
              <div style={styles.colorInputGroup}>
                <input
                  type="color"
                  name="buttonTextColor"
                  value={design.buttonTextColor}
                  onChange={handleInputChange}
                  style={styles.colorPicker}
                />
                <input
                  type="text"
                  name="buttonTextColor"
                  value={design.buttonTextColor}
                  onChange={handleInputChange}
                  style={styles.colorInput}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Button text hover color</label>
              <div style={styles.colorInputGroup}>
                <input
                  type="color"
                  name="buttonTextHoverColor"
                  value={design.buttonTextHoverColor}
                  onChange={handleInputChange}
                  style={styles.colorPicker}
                />
                <input
                  type="text"
                  name="buttonTextHoverColor"
                  value={design.buttonTextHoverColor}
                  onChange={handleInputChange}
                  style={styles.colorInput}
                />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Text & Labels</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Cart Title</label>
              <input
                type="text"
                name="cartTitle"
                value={design.cartTitle}
                onChange={handleInputChange}
                style={styles.textInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Cart Title Alignment</label>
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => setDesign(prev => ({ ...prev, cartTitleAlignment: 'left' }))}
                  style={{
                    ...styles.alignButton,
                    ...(design.cartTitleAlignment === 'left' ? styles.alignButtonActive : {})
                  }}
                >
                  Left
                </button>
                <button
                  type="button"
                  onClick={() => setDesign(prev => ({ ...prev, cartTitleAlignment: 'center' }))}
                  style={{
                    ...styles.alignButton,
                    ...(design.cartTitleAlignment === 'center' ? styles.alignButtonActive : {})
                  }}
                >
                  Center
                </button>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Empty cart message</label>
              <input
                type="text"
                name="emptyCartText"
                value={design.emptyCartText}
                onChange={handleInputChange}
                style={styles.textInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Automatic discount savings text</label>
              <input
                type="text"
                name="savingsText"
                value={design.savingsText}
                onChange={handleInputChange}
                style={styles.textInput}
              />
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Display options</h2>
            
            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="showSavings"
                  checked={design.showSavings}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                />
                <span>Show savings below product prices</span>
              </label>
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="showContinueShopping"
                  checked={design.showContinueShopping}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                />
                <span>Show continue shopping button</span>
              </label>
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="showTotalOnButton"
                  checked={design.showTotalOnButton}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                />
                <span>Show total on button</span>
              </label>
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="displayCompareAtPrice"
                  checked={design.displayCompareAtPrice}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                />
                <span>Display compare-at-price</span>
              </label>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Close Button</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Icon size</label>
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => setDesign(prev => ({ ...prev, closeButtonSize: 'small' }))}
                  style={{
                    ...styles.alignButton,
                    ...(design.closeButtonSize === 'small' ? styles.alignButtonActive : {})
                  }}
                >
                  Small
                </button>
                <button
                  type="button"
                  onClick={() => setDesign(prev => ({ ...prev, closeButtonSize: 'medium' }))}
                  style={{
                    ...styles.alignButton,
                    ...(design.closeButtonSize === 'medium' ? styles.alignButtonActive : {})
                  }}
                >
                  Medium
                </button>
                <button
                  type="button"
                  onClick={() => setDesign(prev => ({ ...prev, closeButtonSize: 'large' }))}
                  style={{
                    ...styles.alignButton,
                    ...(design.closeButtonSize === 'large' ? styles.alignButtonActive : {})
                  }}
                >
                  Large
                </button>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Icon color</label>
              <div style={styles.colorInputGroup}>
                <input
                  type="color"
                  name="closeButtonColor"
                  value={design.closeButtonColor}
                  onChange={handleInputChange}
                  style={styles.colorPicker}
                />
                <input
                  type="text"
                  name="closeButtonColor"
                  value={design.closeButtonColor}
                  onChange={handleInputChange}
                  style={styles.colorInput}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Border</label>
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => setDesign(prev => ({ ...prev, closeButtonBorder: 'none' }))}
                  style={{
                    ...styles.alignButton,
                    ...(design.closeButtonBorder === 'none' ? styles.alignButtonActive : {})
                  }}
                >
                  None
                </button>
                <button
                  type="button"
                  onClick={() => setDesign(prev => ({ ...prev, closeButtonBorder: 'thin' }))}
                  style={{
                    ...styles.alignButton,
                    ...(design.closeButtonBorder === 'thin' ? styles.alignButtonActive : {})
                  }}
                >
                  Thin
                </button>
                <button
                  type="button"
                  onClick={() => setDesign(prev => ({ ...prev, closeButtonBorder: 'normal' }))}
                  style={{
                    ...styles.alignButton,
                    ...(design.closeButtonBorder === 'normal' ? styles.alignButtonActive : {})
                  }}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setDesign(prev => ({ ...prev, closeButtonBorder: 'thick' }))}
                  style={{
                    ...styles.alignButton,
                    ...(design.closeButtonBorder === 'thick' ? styles.alignButtonActive : {})
                  }}
                >
                  Thick
                </button>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Border color</label>
              <div style={styles.colorInputGroup}>
                <input
                  type="color"
                  name="closeButtonBorderColor"
                  value={design.closeButtonBorderColor}
                  onChange={handleInputChange}
                  style={styles.colorPicker}
                />
                <input
                  type="text"
                  name="closeButtonBorderColor"
                  value={design.closeButtonBorderColor}
                  onChange={handleInputChange}
                  style={styles.colorInput}
                />
              </div>
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
          <CartPreview design={design} addons={addons} />
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
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '20px',
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
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #333',
    borderRadius: '6px',
    background: '#000',
    color: '#fff',
  },
  checkboxGroup: {
    marginBottom: '16px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
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
  textInput: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #333',
    borderRadius: '6px',
    background: '#000',
    color: '#fff',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
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
  previewLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#888',
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  cartPreview: {
    border: '1px solid #333',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    height: 'calc(100% - 50px)',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e5e5e5',
  },
  cartTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
  },
  cartItems: {
    padding: '20px',
    flex: 1,
    overflowY: 'auto' as const,
  },
  cartItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  itemImage: {
    width: '60px',
    height: '60px',
    background: '#ccc',
    borderRadius: '6px',
    objectFit: 'cover' as const,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px 0',
  },
  itemVariant: {
    fontSize: '12px',
    margin: '0 0 4px 0',
    opacity: 0.7,
  },
  itemPrice: {
    fontSize: '14px',
    fontWeight: '600',
    margin: 0,
  },
  itemSavings: {
    fontSize: '12px',
    fontWeight: '600',
    margin: '4px 0 0 0',
  },
  itemQuantity: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  qtyButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  cartFooter: {
    padding: '20px',
    borderTop: '1px solid #e5e5e5',
  },
  checkoutButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '12px',
  },
  continueButton: {
    width: '100%',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px',
  },
};

