'use client';

import { useState, useEffect } from 'react';

interface Sale {
  id: string;
  order_number: string;
  protection_price: number;
  commission: number;
  created_at: string;
  month: string;
}

interface SyncResult {
  store_domain: string;
  success: boolean;
  orders_checked?: number;
  protection_sales?: number;
  revenue?: number;
  commission?: number;
  error?: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [daysBack, setDaysBack] = useState(7);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      // We'll create this endpoint to fetch user's sales
      const response = await fetch('/api/user/sales');
      
      const data = await response.json();
      console.log('Sales API Response:', { status: response.status, ok: response.ok, data });
      
      if (response.ok) {
        setSales(data.sales || []);
      } else {
        console.error('Failed to load sales:', data);
      }
    } catch (error) {
      console.error('Failed to load sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncMessage('');

    try {
      const response = await fetch('/api/shopify/manual-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days_back: daysBack })
      });

      const data = await response.json();

      if (response.ok) {
        const result = data.results?.storeResults?.[0] as SyncResult;
        
        if (result?.success) {
          setSyncMessage(
            `✅ Sync complete! Found ${result.protection_sales || 0} protection sales from ${result.orders_checked || 0} orders. ` +
            `Revenue: $${((result.revenue || 0) / 100).toFixed(2)}, ` +
            `Commission: $${((result.commission || 0) / 100).toFixed(2)}`
          );
          loadSales(); // Reload sales data
        } else {
          setSyncMessage(`❌ ${result?.error || data.error || 'Sync failed'}`);
        }
      } else {
        setSyncMessage(`❌ ${data.error || 'Sync failed'}`);
      }

      setTimeout(() => setSyncMessage(''), 10000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncMessage('❌ Network error during sync');
      setTimeout(() => setSyncMessage(''), 5000);
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate totals
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.protection_price, 0);
  const totalCommission = sales.reduce((sum, sale) => sum + sale.commission, 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Sales & Revenue</h1>
          <p style={styles.subtitle}>Track your shipping protection sales and earnings</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statLabel}>Total Sales</h3>
          <p style={styles.statValue}>{sales.length}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statLabel}>Total Revenue</h3>
          <p style={styles.statValue}>{formatCurrency(totalRevenue)}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statLabel}>Your Commission (75%)</h3>
          <p style={styles.statValue}>{formatCurrency(totalRevenue - totalCommission)}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statLabel}>Platform Fee (25%)</h3>
          <p style={styles.statValue}>{formatCurrency(totalCommission)}</p>
        </div>
      </div>

      {/* Manual Sync Section */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Sync Orders</h2>
        <p style={styles.hint}>
          Orders are automatically synced daily. You can also manually sync to get the latest sales data.
        </p>
        
        <div style={styles.syncControls}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Sync Last</label>
            <select 
              value={daysBack} 
              onChange={(e) => setDaysBack(Number(e.target.value))}
              style={styles.select}
              disabled={syncing}
            >
              <option value={1}>1 Day</option>
              <option value={3}>3 Days</option>
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
            </select>
          </div>
          
          <button
            onClick={handleManualSync}
            disabled={syncing}
            style={{
              ...styles.button,
              backgroundColor: syncing ? '#333' : '#fff',
              color: syncing ? '#666' : '#000',
              cursor: syncing ? 'not-allowed' : 'pointer'
            }}
          >
            {syncing ? '🔄 Syncing...' : '🔄 Sync Now'}
          </button>
        </div>

        {syncMessage && (
          <div style={{
            ...styles.message,
            backgroundColor: syncMessage.startsWith('✅') ? '#1a3a1a' : '#3a1a1a',
            color: syncMessage.startsWith('✅') ? '#4caf50' : '#f44336',
            border: syncMessage.startsWith('✅') ? '1px solid #2e7d32' : '1px solid #c62828'
          }}>
            {syncMessage}
          </div>
        )}
      </div>

      {/* Sales Table */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Recent Sales</h2>
        
        {loading ? (
          <p style={styles.loading}>Loading sales data...</p>
        ) : sales.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No sales data yet</p>
            <p style={styles.hint}>
              Sales will appear here once customers purchase shipping protection.
              Make sure your Shopify API token is configured and try syncing manually.
            </p>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.tableHeader}>Order #</th>
                  <th style={styles.tableHeader}>Date</th>
                  <th style={styles.tableHeader}>Protection Price</th>
                  <th style={styles.tableHeader}>Your Share (75%)</th>
                  <th style={styles.tableHeader}>Platform Fee (25%)</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} style={styles.tableRow}>
                    <td style={styles.tableCell}>{sale.order_number}</td>
                    <td style={styles.tableCell}>{formatDate(sale.created_at)}</td>
                    <td style={styles.tableCell}>{formatCurrency(sale.protection_price)}</td>
                    <td style={styles.tableCell}>
                      {formatCurrency(sale.protection_price - sale.commission)}
                    </td>
                    <td style={styles.tableCell}>{formatCurrency(sale.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
  },
  header: {
    marginBottom: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    color: '#fff',
  },
  subtitle: {
    fontSize: '16px',
    color: '#888',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '24px',
  },
  statLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#888',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
  },
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 16px 0',
    color: '#fff',
  },
  syncControls: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-end',
    marginTop: '16px',
  },
  formGroup: {
    flex: '0 0 200px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#888',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #222',
    borderRadius: '8px',
    backgroundColor: '#000',
    color: '#fff',
  },
  button: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    transition: 'all 0.2s',
  },
  message: {
    marginTop: '16px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
  },
  hint: {
    fontSize: '14px',
    color: '#888',
    margin: '8px 0 0 0',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#888',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#888',
    margin: '0 0 8px 0',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    borderBottom: '2px solid #222',
  },
  tableHeader: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableRow: {
    borderBottom: '1px solid #222',
  },
  tableCell: {
    padding: '16px',
    fontSize: '14px',
    color: '#fff',
  },
};

