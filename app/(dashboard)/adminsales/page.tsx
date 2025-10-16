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

interface User {
  userId: string;
  email: string;
  shopDomain: string;
  shopName: string;
  subscriptionStatus: string;
  createdAt: string;
}

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadSales();
    }
  }, [selectedUserId]);

  const checkAdminAndLoadUsers = async () => {
    try {
      setUsersLoading(true);
      setError('');
      
      // Try to fetch users list (will fail if not admin)
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (response.ok) {
        setIsAdmin(true);
        setUsers(data.users || []);
        console.log('✅ Admin access confirmed. Users loaded:', data.users?.length);
      } else if (response.status === 403) {
        setIsAdmin(false);
        setError('Access Denied: You do not have admin privileges to view this page.');
        console.log('❌ Access denied - not an admin');
      } else {
        setError(data.error || 'Failed to load users');
        console.error('Failed to load users:', data);
      }
    } catch (error) {
      console.error('Failed to check admin status:', error);
      setError('Network error. Please try again.');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadSales = async () => {
    if (!selectedUserId) {
      setSales([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/admin/sales?userId=${selectedUserId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSales(data.sales || []);
        console.log('✅ Sales loaded for user:', selectedUserId, data.sales?.length);
      } else {
        setError(data.error || 'Failed to load sales');
        console.error('Failed to load sales:', data);
      }
    } catch (error) {
      console.error('Failed to load sales:', error);
      setError('Network error while loading sales.');
    } finally {
      setLoading(false);
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

  // Show error if not admin
  if (!isAdmin && !usersLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h1 style={styles.errorTitle}>⛔ Access Denied</h1>
          <p style={styles.errorText}>{error || 'You do not have admin privileges to view this page.'}</p>
          <p style={styles.errorHint}>Only administrators can access the admin sales dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🔐 Admin Sales Dashboard</h1>
          <p style={styles.subtitle}>View sales and revenue data for all users</p>
        </div>
      </div>

      {/* User Selection */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Select User</h2>
        <p style={styles.hint}>
          Choose a user to view their sales data and order history.
        </p>
        
        {usersLoading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading users...</p>
          </div>
        ) : (
          <div style={styles.formGroup}>
            <select 
              value={selectedUserId} 
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={styles.userSelect}
            >
              <option value="">-- Select a User --</option>
              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.email} - {user.shopName || user.shopDomain} ({user.subscriptionStatus})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedUserId && (
        <>
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
              <h3 style={styles.statLabel}>User Commission (75%)</h3>
              <p style={styles.statValue}>{formatCurrency(totalRevenue - totalCommission)}</p>
            </div>
            <div style={styles.statCard}>
              <h3 style={styles.statLabel}>Platform Fee (25%)</h3>
              <p style={styles.statValue}>{formatCurrency(totalCommission)}</p>
            </div>
          </div>

          {/* Sales Table */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Sales History</h2>
            
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Loading sales data...</p>
              </div>
            ) : error ? (
              <div style={styles.errorState}>
                <p style={styles.errorText}>❌ {error}</p>
              </div>
            ) : sales.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>No sales data yet</p>
                <p style={styles.hint}>
                  This user hasn't made any protection sales yet.
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
                      <th style={styles.tableHeader}>User Share (75%)</th>
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
        </>
      )}
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
  errorContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    background: '#1a0f0f',
    border: '1px solid #3a1a1a',
    borderRadius: '12px',
    marginTop: '40px',
  },
  errorTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#f44336',
    margin: '0 0 16px 0',
  },
  errorText: {
    fontSize: '16px',
    color: '#ff9999',
    margin: '0 0 8px 0',
  },
  errorHint: {
    fontSize: '14px',
    color: '#888',
    margin: 0,
  },
  errorState: {
    textAlign: 'center',
    padding: '20px',
  },
  userSelect: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #222',
    borderRadius: '8px',
    backgroundColor: '#000',
    color: '#fff',
    cursor: 'pointer',
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
  formGroup: {
    marginTop: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#888',
  },
  hint: {
    fontSize: '14px',
    color: '#888',
    margin: '8px 0 0 0',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: '16px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #222',
    borderTop: '4px solid #fff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },
  loadingHint: {
    fontSize: '14px',
    color: '#888',
    margin: 0,
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

