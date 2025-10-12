'use client';

import { useState } from 'react';

export default function CustomizationPage() {
  const [settings, setSettings] = useState({
    price: '4.90',
    toggleColor: '#2196F3',
    toggleText: 'Shipping Protection',
    description: 'Protect your order from damage, loss, or theft during shipping.',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Customization</h1>
      <p style={styles.subtitle}>Customize the appearance of your protection toggle</p>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Price</h2>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Protection Price</label>
          <input
            type="number"
            name="price"
            value={settings.price}
            onChange={handleInputChange}
            style={styles.input}
            step="0.01"
            min="0"
            placeholder="4.90"
          />
          <p style={styles.hint}>Price in dollars (e.g., 4.90 for $4.90)</p>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Colors</h2>
        
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
              placeholder="#2196F3"
            />
          </div>
          <p style={styles.hint}>Color for the toggle switch and price</p>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Text</h2>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Toggle Text</label>
          <input
            type="text"
            name="toggleText"
            value={settings.toggleText}
            onChange={handleInputChange}
            style={styles.input}
            placeholder="Shipping Protection"
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
            placeholder="Protect your order from damage, loss, or theft during shipping."
          />
          <p style={styles.hint}>Brief description of what's covered</p>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Preview</h2>
        <p style={styles.subtitle}>How it will look in the cart</p>
        
        <div style={styles.preview}>
          <div style={styles.previewToggle}>
            {/* Shield Icon */}
            <div style={{ flexShrink: 0 }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="24" fill="#E3F2FD"/>
                <path d="M24 12L16 16V22C16 27.55 19.84 32.74 25 34C30.16 32.74 34 27.55 34 22V16L24 12Z" fill={settings.toggleColor}/>
                <path d="M21 24L23 26L27 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            {/* Text Content */}
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                margin: '0 0 4px 0',
                color: '#fff'
              }}>
                {settings.toggleText}
              </h3>
              <p style={{
                fontSize: '13px',
                color: '#888',
                margin: 0,
                lineHeight: '1.4'
              }}>
                {settings.description}
              </p>
            </div>
            
            {/* Price and Toggle */}
            <div style={{
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'flex-end',
              gap: '8px',
              flexShrink: 0
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#fff'
              }}>
                ${settings.price}
              </span>
              <div style={{
                width: '51px',
                height: '31px',
                background: settings.toggleColor,
                borderRadius: '31px',
                position: 'relative' as const,
              }}>
                <div style={{
                  position: 'absolute' as const,
                  width: '23px',
                  height: '23px',
                  background: 'white',
                  borderRadius: '50%',
                  top: '4px',
                  right: '4px',
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button style={styles.saveButton}>
        Save Changes
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
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #333',
    borderRadius: '6px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
    background: '#000',
    color: '#fff',
  },
  colorPicker: {
    width: '60px',
    height: '44px',
    border: '1px solid #333',
    borderRadius: '6px',
    cursor: 'pointer',
    background: '#000',
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '6px',
    lineHeight: '1.5',
  },
  preview: {
    background: '#000',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '16px',
  },
  previewToggle: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
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

