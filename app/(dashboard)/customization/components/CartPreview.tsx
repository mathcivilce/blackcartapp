import React from 'react';

interface CartPreviewProps {
  design: {
    backgroundColor: string;
    cartAccentColor: string;
    cartTextColor: string;
    savingsTextColor: string;
    cornerRadius: string;
    buttonText: string;
    buttonColor: string;
    buttonTextColor: string;
    showSavings: boolean;
    showContinueShopping: boolean;
    showTotalOnButton: boolean;
    cartTitle: string;
    cartTitleAlignment: string;
    emptyCartText: string;
    savingsText: string;
    displayCompareAtPrice: boolean;
    closeButtonSize: string;
    closeButtonColor: string;
    closeButtonBorder: string;
    closeButtonBorderColor: string;
  };
  addons: {
    enabled: boolean;
    title: string;
    description: string;
    price: string;
    acceptByDefault: boolean;
    adjustTotalPrice?: boolean;
  };
}

export default function CartPreview({ design, addons }: CartPreviewProps) {
  const calculateTotal = () => {
    let total = 129.99;
    if (addons.enabled && addons.acceptByDefault && (addons.adjustTotalPrice !== false)) {
      total += parseFloat(addons.price || '0');
    }
    return total.toFixed(2);
  };

  return (
    <div style={styles.container}>
      <div style={styles.previewLabel}>Preview</div>
      <div style={{
        ...styles.cartPreview,
        background: design.backgroundColor
      }}>
        {/* Cart Header */}
        <div style={{
          ...styles.cartHeader,
          justifyContent: design.cartTitleAlignment === 'center' ? 'center' : 'space-between',
          position: 'relative' as const,
        }}>
          <h2 style={{ ...styles.cartTitle, color: design.cartTextColor }}>{design.cartTitle}</h2>
          {design.cartTitleAlignment === 'left' && (
            <button style={{ 
              ...styles.closeButton, 
              color: design.closeButtonColor,
              fontSize: design.closeButtonSize === 'small' ? '20px' : design.closeButtonSize === 'large' ? '32px' : '24px',
              border: design.closeButtonBorder === 'none' ? 'none' : 
                      design.closeButtonBorder === 'thin' ? `1px solid ${design.closeButtonBorderColor}` :
                      design.closeButtonBorder === 'normal' ? `2px solid ${design.closeButtonBorderColor}` :
                      `3px solid ${design.closeButtonBorderColor}`,
              borderRadius: design.closeButtonBorder !== 'none' ? '4px' : '0',
              padding: design.closeButtonBorder !== 'none' ? '4px 8px' : '0',
            }}>✕</button>
          )}
          {design.cartTitleAlignment === 'center' && (
            <button style={{ 
              ...styles.closeButton, 
              color: design.closeButtonColor,
              fontSize: design.closeButtonSize === 'small' ? '20px' : design.closeButtonSize === 'large' ? '32px' : '24px',
              border: design.closeButtonBorder === 'none' ? 'none' : 
                      design.closeButtonBorder === 'thin' ? `1px solid ${design.closeButtonBorderColor}` :
                      design.closeButtonBorder === 'normal' ? `2px solid ${design.closeButtonBorderColor}` :
                      `3px solid ${design.closeButtonBorderColor}`,
              borderRadius: design.closeButtonBorder !== 'none' ? '4px' : '0',
              padding: design.closeButtonBorder !== 'none' ? '4px 8px' : '0',
              position: 'absolute' as const, 
              right: '20px' 
            }}>✕</button>
          )}
        </div>

        {/* Cart Items */}
        <div style={styles.cartItems}>
          <div style={{ ...styles.cartItem, background: design.cartAccentColor }}>
            <img 
              src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop" 
              alt="Leather Sneakers" 
              style={styles.itemImage}
            />
            <div style={styles.itemDetails}>
              <div style={styles.itemHeader}>
                <p style={{ ...styles.itemTitle, color: design.cartTextColor }}>Leather Sneakers</p>
                <button style={styles.removeBtn} title="Remove item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
              <p style={{ ...styles.itemVariant, color: design.cartTextColor }}>Size 10</p>
              {design.displayCompareAtPrice && (
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ 
                    fontSize: '13px', 
                    color: '#999', 
                    textDecoration: 'line-through',
                    marginRight: '8px'
                  }}>$139.99</span>
                </div>
              )}
              {design.showSavings && (
                <p style={{ ...styles.itemSavings, color: design.savingsTextColor }}>{design.savingsText} $10.00</p>
              )}
              <div style={styles.itemControls}>
                <div style={styles.itemQuantity}>
                  <button style={{ ...styles.qtyButton, color: design.cartTextColor }}>-</button>
                  <span style={{ color: design.cartTextColor, fontSize: '13px' }}>1</span>
                  <button style={{ ...styles.qtyButton, color: design.cartTextColor }}>+</button>
                </div>
                <span style={{ ...styles.itemPrice, color: design.cartTextColor }}>$129.99</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Footer */}
        <div style={styles.cartFooter}>
          {/* Shipping Protection */}
          {addons.enabled && (
            <div style={styles.protectionContainer}>
              <div style={styles.protectionToggle}>
                <div style={styles.protectionIcon}>
                  <img 
                    src="/add-on.png" 
                    alt="Add-on icon" 
                    width="48" 
                    height="48" 
                    style={{ display: 'block' }}
                  />
                </div>
                <div style={styles.protectionInfo}>
                  <h3 style={styles.protectionTitle}>{addons.title}</h3>
                  <p style={styles.protectionDescription}>
                    {addons.description}
                  </p>
                </div>
                <div style={styles.protectionRight}>
                  <span style={styles.protectionPrice}>${addons.price}</span>
                  <label style={styles.toggleSwitch}>
                    <input 
                      type="checkbox" 
                      checked={addons.acceptByDefault}
                      readOnly
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{
                      ...styles.toggleSlider,
                      backgroundColor: addons.acceptByDefault ? '#2196F3' : '#ccc'
                    }}>
                      <span style={{
                        ...styles.toggleKnob,
                        transform: addons.acceptByDefault ? 'translateX(20px)' : 'translateX(0)'
                      }}></span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <button 
            style={{
              ...styles.checkoutButton,
              background: design.buttonColor,
              color: design.buttonTextColor,
              borderRadius: `${design.cornerRadius}px`
            }}
          >
            {design.buttonText}
            {design.showTotalOnButton && ` • $${calculateTotal()}`}
          </button>
          {design.showContinueShopping && (
            <button style={{ ...styles.continueButton, color: design.cartTextColor }}>
              Or continue shopping
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100%',
    position: 'sticky' as const,
    top: '0',
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
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '4px',
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: 0,
    flex: 1,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#999',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
  },
  itemVariant: {
    fontSize: '13px',
    color: '#666',
    margin: '0 0 4px 0',
  },
  itemPrice: {
    fontSize: '14px',
    fontWeight: '400',
    margin: 0,
  },
  itemSavings: {
    fontSize: '12px',
    fontWeight: '500',
    margin: '4px 0 0 0',
  },
  itemControls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '8px',
  },
  itemQuantity: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    padding: '2px',
  },
  qtyButton: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    padding: 0,
    width: '22px',
    height: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartFooter: {
    padding: '20px',
    borderTop: '1px solid #e5e5e5',
  },
  protectionContainer: {
    background: '#f8f9fa',
    padding: '16px',
    marginBottom: '20px',
    borderRadius: '8px',
  },
  protectionToggle: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  protectionIcon: {
    flexShrink: 0,
  },
  protectionInfo: {
    flex: 1,
  },
  protectionTitle: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#000',
    margin: '0 0 4px 0',
  },
  protectionDescription: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
  },
  protectionRight: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '8px',
    flexShrink: 0,
  },
  protectionPrice: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#000',
    margin: 0,
  },
  toggleSwitch: {
    position: 'relative' as const,
    display: 'inline-block',
    width: '51px',
    height: '31px',
  },
  toggleSlider: {
    position: 'absolute' as const,
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transition: '0.3s',
    borderRadius: '31px',
    display: 'block',
  },
  toggleKnob: {
    position: 'absolute' as const,
    content: '""',
    height: '23px',
    width: '23px',
    left: '4px',
    bottom: '4px',
    backgroundColor: 'white',
    transition: '0.3s',
    borderRadius: '50%',
    display: 'block',
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
    padding: '0',
    fontSize: '14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
};

