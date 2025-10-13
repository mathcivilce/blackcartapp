'use client';

import { useState } from 'react';

export default function AddOnsPage() {
  const [addons, setAddons] = useState({
    featureEnabled: true,
    shippingProtection: {
      title: 'Shipping Protection',
      description: 'Protect your order from damage, loss, or theft during shipping.',
      price: '4.90',
      productId: '',
      acceptByDefault: false,
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name === 'featureEnabled') {
      setAddons(prev => ({
        ...prev,
        featureEnabled: checked
      }));
    } else {
      setAddons(prev => ({
        ...prev,
        shippingProtection: {
          ...prev.shippingProtection,
          [name]: type === 'checkbox' ? checked : value
        }
      }));
    }
  };

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
        
        input[type="checkbox"]:checked + .toggle-slider {
          background-color: #2196F3;
        }
        
        input[type="checkbox"]:checked + .toggle-slider:before {
          transform: translateX(22px);
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        .protection-toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        input[type="checkbox"]:checked + .protection-toggle-slider {
          background-color: #2196F3;
        }
        
        input[type="checkbox"]:checked + .protection-toggle-slider:before {
          transform: translateX(20px);
        }
      `}</style>
      <h1 style={styles.title}>Add-ons</h1>
      <p style={styles.subtitle}>Configure additional features for your cart</p>

      <div style={styles.splitLayout}>
        {/* Left Column - Add-ons Configuration */}
        <div className="design-left-column" style={styles.leftColumn}>
          <div style={styles.card}>
            <div style={styles.toggleHeader}>
              <h2 style={styles.sectionTitle}>Enable Feature</h2>
              <label style={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  name="featureEnabled"
                  checked={addons.featureEnabled}
                  onChange={handleInputChange}
                  style={{ display: 'none' }}
                />
                <span className="toggle-slider" style={styles.toggleSlider}></span>
              </label>
            </div>
            <p style={styles.description}>
              Enable this feature to show add-ons in the cart preview and on your store
            </p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Shipping Protection</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Add-on Title</label>
              <input
                type="text"
                name="title"
                value={addons.shippingProtection.title}
                onChange={handleInputChange}
                style={styles.textInput}
                disabled={!addons.featureEnabled}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                name="description"
                value={addons.shippingProtection.description}
                onChange={handleInputChange}
                style={{ ...styles.textInput, minHeight: '80px', resize: 'vertical' as const }}
                disabled={!addons.featureEnabled}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Price ($)</label>
              <input
                type="number"
                name="price"
                value={addons.shippingProtection.price}
                onChange={handleInputChange}
                style={styles.textInput}
                step="0.01"
                min="0"
                disabled={!addons.featureEnabled}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Product ID</label>
              <input
                type="text"
                name="productId"
                value={addons.shippingProtection.productId}
                onChange={handleInputChange}
                style={styles.textInput}
                placeholder="Enter Shopify Product ID"
                disabled={!addons.featureEnabled}
              />
              <p style={styles.helperText}>
                Link this feature to a product in your Shopify store. This product will be added to the cart automatically when customers enable the protection.
              </p>
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="acceptByDefault"
                  checked={addons.shippingProtection.acceptByDefault}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                  disabled={!addons.featureEnabled}
                />
                <span>Accept by default</span>
              </label>
              <p style={styles.helperText}>
                When enabled, the shipping protection toggle will be ON by default when customers open their cart.
              </p>
            </div>
          </div>

          <button style={styles.saveButton}>
            Save Changes
          </button>
        </div>

        {/* Right Column - Cart Preview */}
        <div style={styles.rightColumn}>
          <div style={styles.previewLabel}>Preview</div>
          <div style={styles.cartPreview}>
            {/* Cart Header */}
            <div style={styles.cartHeader}>
              <h2 style={styles.cartTitle}>Cart</h2>
              <button style={styles.closeButton}>✕</button>
            </div>

            {/* Cart Items */}
            <div style={styles.cartItems}>
              <div style={styles.cartItem}>
                <img 
                  src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop" 
                  alt="Leather Sneakers" 
                  style={styles.itemImage}
                />
                <div style={styles.itemDetails}>
                  <p style={styles.itemTitle}>Leather Sneakers</p>
                  <p style={styles.itemVariant}>Size 10</p>
                  <p style={styles.itemPrice}>$129.99</p>
                </div>
              </div>
            </div>

            {/* Cart Footer */}
            <div style={styles.cartFooter}>
              {addons.featureEnabled && (
                <div style={styles.protectionContainer}>
                  <div style={styles.protectionIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <div style={styles.protectionInfo}>
                    <p style={styles.protectionTitle}>{addons.shippingProtection.title}</p>
                    <p style={styles.protectionDesc}>{addons.shippingProtection.description}</p>
                  </div>
                  <p style={styles.protectionPrice}>${addons.shippingProtection.price}</p>
                  <label style={styles.protectionToggle}>
                    <input 
                      type="checkbox" 
                      style={{ display: 'none' }} 
                      checked={addons.shippingProtection.acceptByDefault}
                      readOnly
                    />
                    <span className="protection-toggle-slider" style={{
                      ...styles.protectionToggleSlider,
                      ...(addons.shippingProtection.acceptByDefault ? styles.protectionToggleSliderActive : {})
                    }}></span>
                  </label>
                </div>
              )}
              
              <div style={styles.subtotalRow}>
                <span>Subtotal</span>
                <span>${addons.featureEnabled && addons.shippingProtection.acceptByDefault ? 
                  (129.99 + parseFloat(addons.shippingProtection.price || '0')).toFixed(2) : 
                  '129.99'
                }</span>
              </div>
              
              <button style={styles.checkoutButton}>
                Proceed to Checkout
              </button>
            </div>
          </div>
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
  helperText: {
    fontSize: '12px',
    color: '#666',
    marginTop: '6px',
    marginBottom: '0',
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
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
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
    backgroundColor: '#333',
    transition: '.4s',
    borderRadius: '28px',
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
    background: '#FFFFFF',
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
    color: '#000',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
    color: '#000',
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
    background: '#f6f6f7',
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
    color: '#000',
  },
  itemVariant: {
    fontSize: '13px',
    color: '#666',
    margin: '0 0 4px 0',
  },
  itemPrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#000',
    margin: 0,
  },
  cartFooter: {
    padding: '20px',
    borderTop: '1px solid #e5e5e5',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  protectionContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: '#000',
    borderRadius: '8px',
  },
  protectionIcon: {
    width: '40px',
    height: '40px',
    background: '#2196F3',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  protectionInfo: {
    flex: 1,
  },
  protectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px 0',
    color: '#fff',
  },
  protectionDesc: {
    fontSize: '12px',
    color: '#999',
    margin: 0,
  },
  protectionPrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    margin: '0 12px 0 0',
  },
  protectionToggle: {
    position: 'relative' as const,
    display: 'inline-block',
    width: '44px',
    height: '24px',
    flexShrink: 0,
  },
  protectionToggleSlider: {
    position: 'absolute' as const,
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ccc',
    transition: '.4s',
    borderRadius: '24px',
    '::before': {
      position: 'absolute' as const,
      content: '""',
      height: '18px',
      width: '18px',
      left: '3px',
      bottom: '3px',
      backgroundColor: 'white',
      transition: '.4s',
      borderRadius: '50%',
    }
  },
  protectionToggleSliderActive: {
    backgroundColor: '#2196F3',
  },
  subtotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    fontWeight: '600',
    color: '#000',
  },
  checkoutButton: {
    width: '100%',
    padding: '16px',
    background: '#1c8cd9',
    color: '#fff',
    border: 'none',
    borderRadius: '21px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

