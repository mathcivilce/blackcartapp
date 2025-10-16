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

export default function DashboardPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7'); // 7, 14, 30, 90, 365, all

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/sales');
      const data = await response.json();
      
      if (response.ok) {
        setSales(data.sales || []);
      }
    } catch (error) {
      console.error('Failed to load sales:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.protection_price, 0);
  const totalCommission = sales.reduce((sum, sale) => sum + sale.commission, 0);
  const userCommission = totalRevenue - totalCommission;

  // Filter sales by date range
  const getFilteredSales = () => {
    if (dateRange === 'all') return sales;
    
    const now = new Date();
    const daysAgo = parseInt(dateRange);
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    return sales.filter(sale => new Date(sale.created_at) >= cutoffDate);
  };

  const filteredSales = getFilteredSales();

  // Prepare chart data - group by day and fill missing days with $0
  const getChartData = () => {
    // Get date range
    const now = new Date();
    const daysAgo = dateRange === 'all' ? 365 : parseInt(dateRange);
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Create a map of sales by day
    const salesByDay: { [key: string]: number } = {};
    
    filteredSales.forEach(sale => {
      const date = new Date(sale.created_at);
      const dayKey = date.toISOString().split('T')[0];
      salesByDay[dayKey] = (salesByDay[dayKey] || 0) + sale.protection_price;
    });

    // Generate all dates in range
    const allDates: Array<{ date: string; revenue: number }> = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= now) {
      const dayKey = currentDate.toISOString().split('T')[0];
      allDates.push({
        date: dayKey,
        revenue: salesByDay[dayKey] || 0 // Use 0 if no sales on this day
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return allDates;
  };

  const chartData = getChartData();
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard</h1>
      <p style={styles.subtitle}>Overview of your sales and revenue</p>

      {/* Summary Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statLabel}>Total Sales</h3>
          <p style={styles.statValue}>{loading ? '...' : sales.length}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statLabel}>Total Revenue</h3>
          <p style={styles.statValue}>{loading ? '...' : formatCurrency(totalRevenue)}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statLabel}>Your Commission (75%)</h3>
          <p style={styles.statValue}>{loading ? '...' : formatCurrency(userCommission)}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statLabel}>Platform Fee (25%)</h3>
          <p style={styles.statValue}>{loading ? '...' : formatCurrency(totalCommission)}</p>
        </div>
      </div>

      {/* Sales Revenue Chart */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h2 style={styles.chartTitle}>Sales Revenue</h2>
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

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading chart data...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No sales data available</p>
            <p style={styles.emptyHint}>Sales will appear here once customers purchase shipping protection</p>
          </div>
        ) : (
          <div style={styles.chartContainer}>
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
              <svg style={styles.svg} viewBox={`0 0 ${Math.max(chartData.length * 50, 800)} 300`} preserveAspectRatio="none">
                {/* Area fill under the line */}
                <defs>
                  <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Filled area */}
                <path
                  d={
                    chartData.length > 0
                      ? `M 0,300 ${chartData.map((d, i) => {
                          const x = (i / (chartData.length - 1 || 1)) * 100;
                          const y = 300 - ((d.revenue / maxRevenue) * 280);
                          return `L ${x}%,${y}`;
                        }).join(' ')} L 100%,300 Z`
                      : ''
                  }
                  fill="url(#areaGradient)"
                />
                
                {/* Line */}
                <polyline
                  points={chartData.map((d, i) => {
                    const x = (i / (chartData.length - 1 || 1)) * 100;
                    const y = 300 - ((d.revenue / maxRevenue) * 280);
                    return `${x}%,${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />
                
                {/* Data points */}
                {chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1 || 1)) * 100;
                  const y = 300 - ((d.revenue / maxRevenue) * 280);
                  return (
                    <circle
                      key={i}
                      cx={`${x}%`}
                      cy={y}
                      r="4"
                      fill="#fff"
                      stroke="#111"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>

              {/* X-axis labels */}
              <div style={styles.xAxis}>
                {chartData.length <= 31 ? (
                  // Show all dates for ranges up to 31 days
                  chartData.map((d, i) => (
                    <span key={i} style={styles.xAxisLabel}>
                      {formatDate(d.date)}
                    </span>
                  ))
                ) : (
                  // Show fewer labels for longer ranges
                  chartData.filter((_, i) => i % Math.ceil(chartData.length / 15) === 0).map((d, i) => (
                    <span key={i} style={styles.xAxisLabel}>
                      {formatDate(d.date)}
                    </span>
                  ))
                )}
              </div>
            </div>
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
  chartCard: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
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
    fontSize: '16px',
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
  emptyHint: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  chartContainer: {
    display: 'flex',
    gap: '16px',
    minHeight: '300px',
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
};

