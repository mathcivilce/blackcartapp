'use client';

import { useState } from 'react';

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setDesign(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

          <button style={styles.saveButton}>
            Save Changes
          </button>
        </div>

        {/* Right Column - Cart Preview */}
        <div style={styles.rightColumn}>
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
                  <p style={{ ...styles.itemTitle, color: design.cartTextColor }}>Leather Sneakers</p>
                  <p style={{ ...styles.itemVariant, color: design.cartTextColor }}>Size 10</p>
                  <div>
                    {design.displayCompareAtPrice && (
                      <span style={{ 
                        fontSize: '13px', 
                        color: '#999', 
                        textDecoration: 'line-through',
                        marginRight: '8px'
                      }}>$139.99</span>
                    )}
                    <span style={{ ...styles.itemPrice, color: design.cartTextColor, display: 'inline' }}>$129.99</span>
                  </div>
                  {design.showSavings && (
                    <p style={{ ...styles.itemSavings, color: design.savingsTextColor }}>{design.savingsText} $10.00</p>
                  )}
                </div>
                <div style={styles.itemQuantity}>
                  <button style={{ ...styles.qtyButton, color: design.cartTextColor }}>-</button>
                  <span style={{ color: design.cartTextColor }}>1</span>
                  <button style={{ ...styles.qtyButton, color: design.cartTextColor }}>+</button>
                </div>
              </div>
            </div>

            {/* Cart Footer */}
            <div style={styles.cartFooter}>
              <button 
                style={{
                  ...styles.checkoutButton,
                  background: design.buttonColor,
                  color: design.buttonTextColor,
                  borderRadius: `${design.cornerRadius}px`
                }}
              >
                {design.buttonText}
                {design.showTotalOnButton && ' • $29.99'}
              </button>
              {design.showContinueShopping && (
                <button style={{ ...styles.continueButton, color: design.cartTextColor }}>
                  Or continue shopping
                </button>
              )}
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

