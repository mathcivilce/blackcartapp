'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoices');
      
      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      console.log('Invoices API Response:', { status: response.status, ok: response.ok, data });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invoices');
      }

      setInvoices(data.invoices);
      setSummary(data.summary);
      setError(null);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const triggerGeneration = async () => {
    if (!confirm('Are you sure you want to manually trigger invoice generation?')) {
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch('/api/invoices/trigger-generation', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger invoice generation');
      }

      alert(`Invoice generation completed!\n\nCreated: ${data.results?.results?.invoices_created || 0}\nFailed: ${data.results?.results?.invoices_failed || 0}`);
      
      // Refresh invoices
      await fetchInvoices();
    } catch (err) {
      console.error('Error triggering invoice generation:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to trigger invoice generation'}`);
    } finally {
      setGenerating(false);
    }
  };

  const triggerTestGeneration = async () => {
    if (!confirm('🧪 TEST MODE: Generate invoice for CURRENT WEEK?\n\nThis will create a REAL Stripe invoice and charge the customer.\n\nNormal operation: Invoices are generated for PREVIOUS week on Mondays.\n\nContinue with test?')) {
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch('/api/invoices/test-generate', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate test invoice');
      }

      const results = data.results?.results || {};
      alert(`🧪 Test Invoice Generated!\n\n✅ Created: ${results.invoices_created || 0}\n❌ Failed: ${results.invoices_failed || 0}\n💰 Total Commission: $${((results.total_commission || 0) / 100).toFixed(2)}\n\n⚠️ This created a REAL Stripe invoice and will charge the customer.`);
      
      // Refresh invoices
      await fetchInvoices();
    } catch (err) {
      console.error('Error triggering test invoice:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to generate test invoice'}`);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

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

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <p>Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchInvoices} style={styles.button}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Invoices</h1>
          <p style={styles.subtitle}>Weekly commission charges</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={triggerGeneration}
            disabled={generating}
            style={{
              ...styles.button,
              ...(generating ? styles.buttonDisabled : {}),
            }}
          >
            {generating ? 'Generating...' : 'Manual Generation'}
          </button>
          <button
            onClick={triggerTestGeneration}
            disabled={generating}
            style={{
              ...styles.button,
              backgroundColor: '#FF9800',
              ...(generating ? styles.buttonDisabled : {}),
            }}
          >
            {generating ? 'Testing...' : '🧪 Test (Current Week)'}
          </button>
        </div>
      </div>

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

      {invoices.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No invoices yet</p>
          <p style={styles.emptySubtext}>
            Invoices are generated weekly for protection sales
          </p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.tableHeaderCell}>Week</th>
                <th style={styles.tableHeaderCell}>Period</th>
                <th style={styles.tableHeaderCell}>Sales</th>
                <th style={styles.tableHeaderCell}>Commission</th>
                <th style={styles.tableHeaderCell}>Status</th>
                <th style={styles.tableHeaderCell}>Created</th>
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

      <div style={styles.infoBox}>
        <h3 style={styles.infoTitle}>💡 How Weekly Billing Works</h3>
        <ul style={styles.infoList}>
          <li>Invoices are generated every Monday at 2:00 AM UTC</li>
          <li>You're charged 25% commission on protection sales</li>
          <li>Charges are automatically processed via Stripe</li>
          <li>Your Shopify cart remains active with an active subscription</li>
          <li>Failed payments may result in cart deactivation</li>
        </ul>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '40px',
    flexWrap: 'wrap',
    gap: '20px',
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
  button: {
    padding: '12px 24px',
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#333',
    color: '#666',
    cursor: 'not-allowed',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
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
  tableContainer: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '40px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#0a0a0a',
  },
  tableHeaderCell: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid #222',
  },
  tableRow: {
    borderBottom: '1px solid #222',
    transition: 'background-color 0.2s',
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
  link: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
  emptyState: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '60px 20px',
    textAlign: 'center',
    marginBottom: '40px',
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    margin: '0 0 8px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#888',
    margin: 0,
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
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '16px',
    color: '#888',
  },
  error: {
    background: '#3a1a1a',
    border: '1px solid #c62828',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
  },
};

