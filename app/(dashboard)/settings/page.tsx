export default function SettingsPage() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Settings</h1>
      <p style={styles.subtitle}>Configure your store and protection product</p>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Store Information</h2>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Store Domain</label>
          <input
            type="text"
            defaultValue="example-store.myshopify.com"
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
            defaultValue=""
            style={styles.input}
            placeholder="Enter variant ID (e.g., 12345678901234)"
          />
          <p style={styles.hint}>
            The variant ID of your protection product in Shopify.
          </p>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>API Configuration</h2>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Shopify API Token</label>
          <input
            type="password"
            style={styles.input}
            placeholder="shpat_••••••••••••••••"
          />
          <p style={styles.hint}>Admin API access token for your Shopify store</p>
        </div>
      </div>

      <button style={styles.saveButton}>
        Save Settings
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
};

// test