'use client';

import { useState, useEffect } from 'react';

interface Invoice {
  id: string;
  week: string;
  week_start_date: string;
  week_end_date: string;
  sales_count: number;
  commission_total: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'failed';
  stripe_invoice_id: string | null;
  created_at: string;
  paid_at: string | null;
}

interface InvoiceSummary {
  total: number;
  paid: number;
  pending: number;
  failed: number;
  totalAmount: number;
  paidAmount: number;
}

interface User {
  userId: string;
  email: string;
  shopDomain: string;
  shopName: string;
  subscriptionStatus: string;
  createdAt: string;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string>('');

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadInvoices();
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

  const loadInvoices = async () => {
    if (!selectedUserId) {
      setInvoices([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/admin/invoices?userId=${selectedUserId}`);
      const data = await response.json();
      
      if (response.ok) {
        setInvoices(data.invoices || []);
        setSummary(data.summary || null);
        console.log('✅ Invoices loaded for user:', selectedUserId, data.invoices?.length);
      } else {
        setError(data.error || 'Failed to load invoices');
        console.error('Failed to load invoices:', data);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
      setError('Network error while loading invoices.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualGeneration = async () => {
    if (!selectedUserId) {
      setGenerateMessage('❌ Please select a user first');
      setTimeout(() => setGenerateMessage(''), 3000);
      return;
    }

    if (!confirm('Are you sure you want to manually generate an invoice for this user?\n\nThis will create a REAL Stripe invoice and charge the customer for the previous week.')) {
      return;
    }

    try {
      setGenerating(true);
      setGenerateMessage('');
      
      const response = await fetch('/api/admin/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate invoice');
      }

      const results = data.results?.results || {};
      const created = results.invoices_created || 0;
      const failed = results.invoices_failed || 0;
      const totalCommission = (results.total_commission || 0) / 100;

      if (created > 0) {
        setGenerateMessage(`✅ Invoice generated successfully!\n\nCreated: ${created}\nFailed: ${failed}\nTotal Commission: $${totalCommission.toFixed(2)}`);
        // Refresh invoices after generation
        setTimeout(() => loadInvoices(), 1000);
      } else if (failed > 0) {
        setGenerateMessage(`❌ Invoice generation failed.\n\nFailed: ${failed}`);
      } else {
        setGenerateMessage(`⚠️ No invoice generated. This user may have no sales for the previous week.`);
      }

      setTimeout(() => setGenerateMessage(''), 10000);
    } catch (error) {
      console.error('Error generating invoice:', error);
      setGenerateMessage(`❌ Error: ${error instanceof Error ? error.message : 'Failed to generate invoice'}`);
      setTimeout(() => setGenerateMessage(''), 5000);
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatWeek = (weekId: string) => {
    const [year, week] = weekId.split('-W');
    return `Week ${week}, ${year}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Show error if not admin
  if (!isAdmin && !usersLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h1 style={styles.errorTitle}>⛔ Access Denied</h1>
          <p style={styles.errorText}>{error || 'You do not have admin privileges to view this page.'}</p>
          <p style={styles.errorHint}>Only administrators can access the admin invoices dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🔐 Admin Invoices Dashboard</h1>
          <p style={styles.subtitle}>View invoices and billing data for all users</p>
        </div>
      </div>

      {/* User Selection */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Select User</h2>
        <p style={styles.hint}>
          Choose a user to view their invoices and billing history.
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
          {/* Manual Invoice Generation */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Generate Invoice</h2>
            <p style={styles.hint}>
              Manually generate an invoice for the selected user for the previous week.
            </p>
            
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={handleManualGeneration}
                disabled={generating}
                style={{
                  ...styles.generateButton,
                  opacity: generating ? 0.5 : 1,
                  cursor: generating ? 'not-allowed' : 'pointer'
                }}
              >
                {generating ? 'Generating Invoice...' : 'Manual Generation'}
              </button>
            </div>

            {generateMessage && (
              <div style={{
                ...styles.message,
                backgroundColor: generateMessage.startsWith('✅') ? '#1a3a1a' : '#3a1a1a',
                color: generateMessage.startsWith('✅') ? '#4caf50' : '#f44336',
                border: generateMessage.startsWith('✅') ? '1px solid #2e7d32' : '1px solid #c62828',
                whiteSpace: 'pre-line'
              }}>
                {generateMessage}
              </div>
            )}
          </div>

          {/* Summary Cards */}
          {summary && (
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <h3 style={styles.summaryLabel}>Total Invoices</h3>
                <p style={styles.summaryValue}>{summary.total}</p>
              </div>
              <div style={styles.summaryCard}>
                <h3 style={styles.summaryLabel}>Paid</h3>
                <p style={{ ...styles.summaryValue, color: '#4CAF50' }}>
                  {summary.paid}
                </p>
              </div>
              <div style={styles.summaryCard}>
                <h3 style={styles.summaryLabel}>Pending</h3>
                <p style={{ ...styles.summaryValue, color: '#FF9800' }}>
                  {summary.pending}
                </p>
              </div>
              <div style={styles.summaryCard}>
                <h3 style={styles.summaryLabel}>Failed</h3>
                <p style={{ ...styles.summaryValue, color: '#F44336' }}>
                  {summary.failed}
                </p>
              </div>
              <div style={styles.summaryCard}>
                <h3 style={styles.summaryLabel}>Total Amount</h3>
                <p style={styles.summaryValue}>
                  {formatCurrency(summary.totalAmount)}
                </p>
              </div>
              <div style={styles.summaryCard}>
                <h3 style={styles.summaryLabel}>Amount Paid</h3>
                <p style={{ ...styles.summaryValue, color: '#4CAF50' }}>
                  {formatCurrency(summary.paidAmount)}
                </p>
              </div>
            </div>
          )}

          {/* Invoices Table */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Invoices History</h2>
            
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Loading invoices data...</p>
              </div>
            ) : error ? (
              <div style={styles.errorState}>
                <p style={styles.errorText}>❌ {error}</p>
              </div>
            ) : invoices.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>No invoices yet</p>
                <p style={styles.hint}>
                  This user hasn't had any invoices generated yet.
                </p>
              </div>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.tableHeader}>Week</th>
                      <th style={styles.tableHeader}>Period</th>
                      <th style={styles.tableHeader}>Sales</th>
                      <th style={styles.tableHeader}>Commission</th>
                      <th style={styles.tableHeader}>Status</th>
                      <th style={styles.tableHeader}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} style={styles.tableRow}>
                        <td style={styles.tableCell}>
                          <strong>{formatWeek(invoice.week)}</strong>
                        </td>
                        <td style={styles.tableCell}>
                          {formatDate(invoice.week_start_date)} - {formatDate(invoice.week_end_date)}
                        </td>
                        <td style={styles.tableCell}>{invoice.sales_count}</td>
                        <td style={styles.tableCell}>
                          <strong>{formatCurrency(invoice.commission_total)}</strong>
                        </td>
                        <td style={styles.tableCell}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              backgroundColor: getStatusColor(invoice.status),
                            }}
                          >
                            {getStatusLabel(invoice.status)}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          {formatDate(invoice.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div style={styles.infoBox}>
            <h3 style={styles.infoTitle}>💡 About Weekly Invoices</h3>
            <ul style={styles.infoList}>
              <li>Invoices are generated every Monday at 2:00 AM UTC</li>
              <li>Users are charged 25% commission on protection sales</li>
              <li>Charges are automatically processed via Stripe</li>
              <li>Failed payments may result in cart deactivation</li>
            </ul>
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
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  summaryCard: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '24px',
  },
  summaryLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#888',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  summaryValue: {
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
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
  },
  infoBox: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '24px',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    margin: '0 0 16px 0',
  },
  infoList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#888',
    fontSize: '14px',
    lineHeight: '1.8',
  },
  generateButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    border: '1px solid #fff',
    borderRadius: '8px',
    backgroundColor: '#fff',
    color: '#000',
    transition: 'all 0.2s',
  },
  message: {
    marginTop: '16px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
  },
};

