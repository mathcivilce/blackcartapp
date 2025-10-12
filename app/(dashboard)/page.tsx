export default function DashboardPage() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard</h1>
      <p style={styles.subtitle}>Welcome to BlackCart</p>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardIcon}>🛒</div>
          <h3 style={styles.cardTitle}>Total Sales</h3>
          <p style={styles.cardValue}>$0.00</p>
          <p style={styles.cardLabel}>This month</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>📦</div>
          <h3 style={styles.cardTitle}>Protected Orders</h3>
          <p style={styles.cardValue}>0</p>
          <p style={styles.cardLabel}>This month</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>💰</div>
          <h3 style={styles.cardTitle}>Commission</h3>
          <p style={styles.cardValue}>$0.00</p>
          <p style={styles.cardLabel}>This month</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>🏪</div>
          <h3 style={styles.cardTitle}>Active Stores</h3>
          <p style={styles.cardValue}>0</p>
          <p style={styles.cardLabel}>Connected</p>
        </div>
      </div>

      <div style={styles.infoBox}>
        <h2 style={styles.infoTitle}>📦 Installation</h2>
        <p style={styles.infoText}>Add this script to your Shopify theme:</p>
        <code style={styles.codeBlock}>
          {'<script src="https://blackcartapp.netlify.app/cart.js"></script>'}
        </code>
      </div>

      <div style={styles.infoBox}>
        <h2 style={styles.infoTitle}>🚀 Next Steps</h2>
        <ul style={styles.list}>
          <li style={styles.listItem}>Configure your protection settings</li>
          <li style={styles.listItem}>Customize colors and text</li>
          <li style={styles.listItem}>Install the cart script on your store</li>
          <li style={styles.listItem}>Start tracking protection sales</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
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
    marginBottom: '40px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '24px',
  },
  cardIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#888',
    marginBottom: '8px',
  },
  cardValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '4px',
  },
  cardLabel: {
    fontSize: '13px',
    color: '#666',
  },
  infoBox: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
  },
  infoTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '16px',
  },
  infoText: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '12px',
  },
  codeBlock: {
    display: 'block',
    background: '#000',
    border: '1px solid #222',
    borderRadius: '6px',
    padding: '12px',
    color: '#fff',
    fontSize: '13px',
    fontFamily: 'monospace',
    overflowX: 'auto' as const,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    fontSize: '14px',
    color: '#888',
    padding: '8px 0',
    borderBottom: '1px solid #222',
  },
};

