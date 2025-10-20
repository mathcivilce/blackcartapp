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

interface AllAccountsSummary {
  totalSales: number;
  totalRevenue: number;
  userCommission: number;
  platformFee: number;
}

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [daysBack, setDaysBack] = useState(7);
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // All Accounts states
  const [allAccountsSummary, setAllAccountsSummary] = useState<AllAccountsSummary | null>(null);
  const [allAccountsLoading, setAllAccountsLoading] = useState(true);
  const [batchSyncing, setBatchSyncing] = useState(false);
  const [batchSyncMessage, setBatchSyncMessage] = useState('');
  const [batchDaysBack, setBatchDaysBack] = useState(7);
  const [batchUseCustomDates, setBatchUseCustomDates] = useState(false);
  const [batchStartDate, setBatchStartDate] = useState('');
  const [batchEndDate, setBatchEndDate] = useState('');

  // Chart states
  const [chartSales, setChartSales] = useState<Array<{protection_price: number, created_at: string}>>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; revenue: number } | null>(null);

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAllAccountsSummary();
      loadChartData();
    }
  }, [isAdmin]);

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

  const loadAllAccountsSummary = async () => {
    try {
      setAllAccountsLoading(true);
      
      const response = await fetch('/api/admin/sales/all');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAllAccountsSummary(data.summary);
        console.log('✅ All accounts summary loaded:', data.summary);
      } else {
        console.error('Failed to load all accounts summary:', data);
      }
    } catch (error) {
      console.error('Failed to load all accounts summary:', error);
    } finally {
      setAllAccountsLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      setChartLoading(true);
      
      const response = await fetch('/api/admin/sales/chart');
      const data = await response.json();
      
      if (response.ok) {
        setChartSales(data.sales || []);
        console.log('✅ Chart data loaded:', data.sales?.length);
      } else {
        console.error('Failed to load chart data:', data);
      }
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  // Chart helper functions
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    
    const index = Math.round(percentage * (chartData.length - 1));
    if (index >= 0 && index < chartData.length) {
      const dataPoint = chartData[index];
      setTooltip({
        x: e.clientX,
        y: e.clientY,
        date: dataPoint.date,
        revenue: dataPoint.revenue
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const getFilteredChartSales = () => {
    if (dateRange === 'all') return chartSales;
    
    const now = new Date();
    const daysAgo = parseInt(dateRange);
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    return chartSales.filter(sale => new Date(sale.created_at) >= cutoffDate);
  };

  const filteredChartSales = getFilteredChartSales();

  const getChartData = () => {
    const now = new Date();
    const daysAgo = dateRange === 'all' ? 365 : parseInt(dateRange);
    const startDateCalc = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    const salesByDay: { [key: string]: number } = {};
    
    filteredChartSales.forEach(sale => {
      const date = new Date(sale.created_at);
      const dayKey = date.toISOString().split('T')[0];
      salesByDay[dayKey] = (salesByDay[dayKey] || 0) + sale.protection_price;
    });

    const allDates: Array<{ date: string; revenue: number }> = [];
    const currentDate = new Date(startDateCalc);
    
    while (currentDate <= now) {
      const dayKey = currentDate.toISOString().split('T')[0];
      allDates.push({
        date: dayKey,
        revenue: salesByDay[dayKey] || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return allDates;
  };

  const chartData = getChartData();
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleBatchSync = async () => {
    setBatchSyncing(true);
    setBatchSyncMessage('');

    // Prepare request body based on whether custom dates are used
    let requestBody: any = {};
    
    if (batchUseCustomDates) {
      if (!batchStartDate || !batchEndDate) {
        setBatchSyncMessage('❌ Please select both start and end dates');
        setBatchSyncing(false);
        setTimeout(() => setBatchSyncMessage(''), 3000);
        return;
      }
      requestBody = {
        start_date: batchStartDate,
        end_date: batchEndDate
      };
    } else {
      requestBody = {
        days_back: batchDaysBack
      };
    }

    try {
      const response = await fetch('/api/admin/sync/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { summary } = data;
        
        let message = `✅ Batch sync complete!\n`;
        message += `Stores synced: ${summary.successfulSyncs}/${summary.totalStores}\n`;
        if (summary.failedSyncs > 0) {
          message += `Failed: ${summary.failedSyncs}\n`;
        }
        message += `Total sales: ${summary.totalSales}\n`;
        message += `Revenue: $${(summary.totalRevenue / 100).toFixed(2)}\n`;
        message += `Commission: $${(summary.totalCommission / 100).toFixed(2)}\n`;
        if (summary.totalNewSales > 0) {
          message += `New sales added: ${summary.totalNewSales}`;
        }
        
        setBatchSyncMessage(message);
        
        // Reload all accounts summary
        loadAllAccountsSummary();
      } else {
        setBatchSyncMessage(`❌ ${data.error || 'Batch sync failed'}`);
      }

      setTimeout(() => setBatchSyncMessage(''), 15000);
    } catch (error) {
      console.error('Batch sync error:', error);
      setBatchSyncMessage('❌ Network error during batch sync');
      setTimeout(() => setBatchSyncMessage(''), 5000);
    } finally {
      setBatchSyncing(false);
    }
  };

  const handleManualSync = async () => {
    if (!selectedUserId) {
      setSyncMessage('❌ Please select a user first');
      setTimeout(() => setSyncMessage(''), 3000);
      return;
    }

    // Prepare request body based on whether custom dates are used
    let requestBody: any = { userId: selectedUserId };
    
    if (useCustomDates) {
      if (!startDate || !endDate) {
        setSyncMessage('❌ Please select both start and end dates');
        setTimeout(() => setSyncMessage(''), 3000);
        return;
      }
      requestBody.start_date = startDate;
      requestBody.end_date = endDate;
    } else {
      requestBody.days_back = daysBack;
    }

    setSyncing(true);
    setSyncMessage('');

    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        const result = data.results?.storeResults?.[0];
        
        if (result?.success) {
          const totalSales = result.protection_sales || 0;
          const newSales = result.new_sales_count || 0;
          const existingSales = result.existing_sales_count || 0;
          const ordersChecked = result.orders_checked || 0;
          const revenue = ((result.revenue || 0) / 100).toFixed(2);
          const commission = ((result.commission || 0) / 100).toFixed(2);
          
          let message = `✅ Sync complete! Found ${totalSales} protection sale${totalSales !== 1 ? 's' : ''} from ${ordersChecked} orders. `;
          message += `Revenue: $${revenue}, Commission: $${commission}`;
          
          if (existingSales > 0) {
            message += `\n${existingSales} sale${existingSales !== 1 ? 's' : ''} already saved, ${newSales} new sale${newSales !== 1 ? 's' : ''} added`;
          } else if (newSales > 0) {
            message += `\n${newSales} new sale${newSales !== 1 ? 's' : ''} added`;
          } else {
            message += `\nAll sales already saved in database`;
          }
          
          setSyncMessage(message);
          
          if (newSales > 0) {
            loadSales(); // Reload sales data only if there are new sales
          }
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

      {/* All Accounts Section */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>All Accounts</h2>
        <p style={styles.hint}>
          Aggregated statistics from all user accounts combined.
        </p>

        {/* Batch Sync Controls */}
        <div style={styles.dateToggleContainer}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={batchUseCustomDates}
              onChange={(e) => setBatchUseCustomDates(e.target.checked)}
              style={styles.checkbox}
            />
            <span>Use custom date range</span>
          </label>
        </div>

        <div style={styles.syncControls}>
          {!batchUseCustomDates ? (
            <div style={styles.syncFormGroup}>
              <label style={styles.label}>Sync Last</label>
              <select 
                value={batchDaysBack} 
                onChange={(e) => setBatchDaysBack(Number(e.target.value))}
                style={styles.select}
                disabled={batchSyncing}
              >
                <option value={1}>1 Day</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>
          ) : (
            <>
              <div style={styles.syncFormGroup}>
                <label style={styles.label}>Start Date</label>
                <input
                  type="date"
                  value={batchStartDate}
                  onChange={(e) => setBatchStartDate(e.target.value)}
                  style={styles.dateInput}
                  disabled={batchSyncing}
                />
              </div>
              <div style={styles.syncFormGroup}>
                <label style={styles.label}>End Date</label>
                <input
                  type="date"
                  value={batchEndDate}
                  onChange={(e) => setBatchEndDate(e.target.value)}
                  style={styles.dateInput}
                  disabled={batchSyncing}
                />
              </div>
            </>
          )}
          
          <button
            onClick={handleBatchSync}
            disabled={batchSyncing}
            style={{
              ...styles.syncButton,
              opacity: batchSyncing ? 0.5 : 1,
              cursor: batchSyncing ? 'not-allowed' : 'pointer'
            }}
          >
            {batchSyncing ? 'Syncing All...' : 'Sync Now (All Accounts)'}
          </button>
        </div>

        {batchSyncMessage && (
          <div style={{
            ...styles.message,
            backgroundColor: batchSyncMessage.startsWith('✅') ? '#1a3a1a' : '#3a1a1a',
            color: batchSyncMessage.startsWith('✅') ? '#4caf50' : '#f44336',
            border: batchSyncMessage.startsWith('✅') ? '1px solid #2e7d32' : '1px solid #c62828',
            whiteSpace: 'pre-line'
          }}>
            {batchSyncMessage}
          </div>
        )}

        {/* All Accounts Stats */}
        {allAccountsLoading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading all accounts data...</p>
          </div>
        ) : allAccountsSummary ? (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <h3 style={styles.statLabel}>Total Sales</h3>
              <p style={styles.statValue}>{allAccountsSummary.totalSales}</p>
            </div>
            <div style={styles.statCard}>
              <h3 style={styles.statLabel}>Total Revenue</h3>
              <p style={styles.statValue}>{formatCurrency(allAccountsSummary.totalRevenue)}</p>
            </div>
            <div style={styles.statCard}>
              <h3 style={styles.statLabel}>Users Commission (75%)</h3>
              <p style={styles.statValue}>{formatCurrency(allAccountsSummary.userCommission)}</p>
            </div>
            <div style={styles.statCard}>
              <h3 style={styles.statLabel}>Platform Fee (25%)</h3>
              <p style={styles.statValue}>{formatCurrency(allAccountsSummary.platformFee)}</p>
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No data available</p>
          </div>
        )}
      </div>

      {/* Sales Revenue Chart for All Accounts */}
      <div style={styles.card}>
        <div style={styles.chartHeader}>
          <h2 style={styles.sectionTitle}>All Accounts Revenue</h2>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            style={styles.dateSelect}
          >
            <option value="7">Last 7 Days</option>
            <option value="14">Last 14 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {chartLoading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading chart data...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No sales data available</p>
            <p style={styles.hint}>Sales will appear here once users make protection sales</p>
          </div>
        ) : (
          <div 
            style={styles.chartContainer}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Y-axis labels */}
            <div style={styles.yAxis}>
              <span style={styles.yAxisLabel}>{formatCurrency(maxRevenue)}</span>
              <span style={styles.yAxisLabel}>{formatCurrency(maxRevenue * 0.75)}</span>
              <span style={styles.yAxisLabel}>{formatCurrency(maxRevenue * 0.5)}</span>
              <span style={styles.yAxisLabel}>{formatCurrency(maxRevenue * 0.25)}</span>
              <span style={styles.yAxisLabel}>$0</span>
            </div>

            {/* Chart area */}
            <div style={styles.chartArea}>
              {/* Grid lines */}
              <div style={styles.gridLines}>
                <div style={styles.gridLine}></div>
                <div style={styles.gridLine}></div>
                <div style={styles.gridLine}></div>
                <div style={styles.gridLine}></div>
                <div style={styles.gridLine}></div>
              </div>

              {/* Line chart */}
              <svg style={styles.svg} viewBox="0 0 100 300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {(() => {
                  if (chartData.length === 0) return null;
                  
                  const points = chartData.map((d, i) => ({
                    x: (i / (chartData.length - 1 || 1)) * 100,
                    y: 300 - ((d.revenue / maxRevenue) * 280)
                  }));
                  
                  const createSmoothPath = (points: Array<{x: number, y: number}>) => {
                    if (points.length < 2) return '';
                    
                    let path = `M ${points[0].x},${points[0].y}`;
                    
                    for (let i = 0; i < points.length - 1; i++) {
                      const p1 = points[i];
                      const p2 = points[i + 1];
                      const rev1 = chartData[i].revenue;
                      const rev2 = chartData[i + 1].revenue;
                      
                      if (rev1 === 0 && rev2 === 0) {
                        path += ` L ${p2.x},${p2.y}`;
                      } else {
                        const p0 = points[i > 0 ? i - 1 : i];
                        const p3 = points[i + 2] || p2;
                        const cp1x = p1.x + (p2.x - p0.x) / 6;
                        const cp1y = p1.y + (p2.y - p0.y) / 6;
                        const cp2x = p2.x - (p3.x - p1.x) / 6;
                        const cp2y = p2.y - (p3.y - p1.y) / 6;
                        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
                      }
                    }
                    return path;
                  };
                  
                  const linePath = createSmoothPath(points);
                  const areaPath = `${linePath} L ${points[points.length - 1].x},300 L ${points[0].x},300 Z`;
                  
                  return (
                    <>
                      <path d={areaPath} fill="url(#areaGradient)" />
                      <path d={linePath} fill="none" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    </>
                  );
                })()}
                
                {chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1 || 1)) * 100;
                  const y = 300 - ((d.revenue / maxRevenue) * 280);
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="0.8"
                      fill="#fff"
                      stroke="#111"
                      strokeWidth="0.4"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>

              {/* X-axis labels */}
              <div style={styles.xAxis}>
                {chartData.length <= 31 ? (
                  chartData.map((d, i) => (
                    <span key={i} style={styles.xAxisLabel}>
                      {formatDateLabel(d.date)}
                    </span>
                  ))
                ) : (
                  chartData.filter((_, i) => i % Math.ceil(chartData.length / 15) === 0).map((d, i) => (
                    <span key={i} style={styles.xAxisLabel}>
                      {formatDateLabel(d.date)}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          ...styles.tooltip,
          left: `${tooltip.x + 10}px`,
          top: `${tooltip.y - 40}px`,
        }}>
          <div style={styles.tooltipDate}>{formatDateLabel(tooltip.date)}</div>
          <div style={styles.tooltipValue}>{formatCurrency(tooltip.revenue)}</div>
        </div>
      )}

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
          {/* Manual Sync Section */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Sync Orders</h2>
            <p style={styles.hint}>
              Manually sync orders for the selected user to get the latest sales data.
            </p>
            
            <div style={styles.dateToggleContainer}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={useCustomDates}
                  onChange={(e) => setUseCustomDates(e.target.checked)}
                  style={styles.checkbox}
                />
                <span>Use custom date range</span>
              </label>
            </div>

            <div style={styles.syncControls}>
              {!useCustomDates ? (
                <div style={styles.syncFormGroup}>
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
              ) : (
                <>
                  <div style={styles.syncFormGroup}>
                    <label style={styles.label}>Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={styles.dateInput}
                      disabled={syncing}
                    />
                  </div>
                  <div style={styles.syncFormGroup}>
                    <label style={styles.label}>End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={styles.dateInput}
                      disabled={syncing}
                    />
                  </div>
                </>
              )}
              
              <button
                onClick={handleManualSync}
                disabled={syncing}
                style={{
                  ...styles.syncButton,
                  opacity: syncing ? 0.5 : 1,
                  cursor: syncing ? 'not-allowed' : 'pointer'
                }}
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            {syncMessage && (
              <div style={{
                ...styles.message,
                backgroundColor: syncMessage.startsWith('✅') ? '#1a3a1a' : '#3a1a1a',
                color: syncMessage.startsWith('✅') ? '#4caf50' : '#f44336',
                border: syncMessage.startsWith('✅') ? '1px solid #2e7d32' : '1px solid #c62828',
                whiteSpace: 'pre-line'
              }}>
                {syncMessage}
              </div>
            )}
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
  syncControls: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-end',
    marginTop: '16px',
  },
  syncFormGroup: {
    flex: '0 0 200px',
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
  dateInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #222',
    borderRadius: '8px',
    backgroundColor: '#000',
    color: '#fff',
    colorScheme: 'dark',
  },
  dateToggleContainer: {
    marginBottom: '16px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  syncButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    border: '1px solid #fff',
    borderRadius: '8px',
    backgroundColor: '#000',
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
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  dateSelect: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #222',
    borderRadius: '8px',
    backgroundColor: '#000',
    color: '#fff',
    cursor: 'pointer',
  },
  chartContainer: {
    display: 'flex',
    gap: '16px',
    minHeight: '300px',
    cursor: 'crosshair',
    position: 'relative',
  },
  yAxis: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingTop: '10px',
    paddingBottom: '30px',
  },
  yAxisLabel: {
    fontSize: '12px',
    color: '#888',
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '300px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingTop: '10px',
    paddingBottom: '30px',
  },
  gridLine: {
    height: '1px',
    backgroundColor: '#222',
    width: '100%',
  },
  svg: {
    width: '100%',
    height: '300px',
    position: 'relative',
    zIndex: 1,
    overflow: 'visible',
  },
  xAxis: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '8px',
    marginTop: 'auto',
    gap: '4px',
  },
  xAxisLabel: {
    fontSize: '11px',
    color: '#888',
    textAlign: 'center',
    flex: '0 0 auto',
    minWidth: '40px',
  },
  tooltip: {
    position: 'fixed',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '8px 12px',
    pointerEvents: 'none',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  },
  tooltipDate: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '4px',
  },
  tooltipValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
  },
};

