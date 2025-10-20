'use client';

import { useState, useEffect } from 'react';

interface User {
  userId: string;
  email: string;
  shopDomain: string;
  shopName: string;
  subscriptionStatus: string;
  createdAt: string;
}

interface UserDetails {
  userId: string;
  email: string;
  shopDomain: string;
  shopName: string;
  subscriptionStatus: string;
  platformFee: number;
  createdAt: string;
}

export default function UserDetailsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [platformFee, setPlatformFee] = useState<number>(25);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadUserDetails();
    } else {
      setUserDetails(null);
      setPlatformFee(25);
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

  const loadUserDetails = async () => {
    if (!selectedUserId) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      const response = await fetch(`/api/admin/users/details?userId=${selectedUserId}`);
      const data = await response.json();
      
      if (response.ok) {
        setUserDetails(data.userDetails);
        setPlatformFee(data.userDetails.platformFee);
        console.log('✅ User details loaded:', data.userDetails);
      } else {
        setError(data.error || 'Failed to load user details');
        console.error('Failed to load user details:', data);
      }
    } catch (error) {
      console.error('Failed to load user details:', error);
      setError('Network error while loading user details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlatformFee = async () => {
    if (!selectedUserId) {
      setError('Please select a user first');
      return;
    }

    if (platformFee < 0 || platformFee > 100) {
      setError('Platform fee must be between 0 and 100');
      return;
    }

    if (!confirm(`Are you sure you want to update the platform fee to ${platformFee}% for this user?\n\nThis will affect all future invoices and sales calculations.`)) {
      return;
    }

    try {
      setUpdating(true);
      setError('');
      setSuccessMessage('');
      
      const response = await fetch('/api/admin/users/update-platform-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedUserId,
          platformFee: platformFee
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`✅ Platform fee updated successfully to ${platformFee}%`);
        // Reload user details to confirm the change
        setTimeout(() => loadUserDetails(), 500);
      } else {
        setError(data.error || 'Failed to update platform fee');
        console.error('Failed to update platform fee:', data);
      }
    } catch (error) {
      console.error('Failed to update platform fee:', error);
      setError('Network error while updating platform fee.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show error if not admin
  if (!isAdmin && !usersLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h1 style={styles.errorTitle}>⛔ Access Denied</h1>
          <p style={styles.errorText}>{error || 'You do not have admin privileges to view this page.'}</p>
          <p style={styles.errorHint}>Only administrators can access user details.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🔐 User Details</h1>
          <p style={styles.subtitle}>View and manage user settings</p>
        </div>
      </div>

      {/* User Selection */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Select User</h2>
        <p style={styles.hint}>
          Choose a user to view their details and adjust their platform fee percentage.
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

      {selectedUserId && userDetails && (
        <>
          {/* User Information */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>User Information</h2>
            
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Loading user details...</p>
              </div>
            ) : (
              <div style={styles.detailsGrid}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Email:</span>
                  <span style={styles.detailValue}>{userDetails.email}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Shop Name:</span>
                  <span style={styles.detailValue}>{userDetails.shopName || 'N/A'}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Shop Domain:</span>
                  <span style={styles.detailValue}>{userDetails.shopDomain}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Subscription Status:</span>
                  <span style={{
                    ...styles.detailValue,
                    color: userDetails.subscriptionStatus === 'active' ? '#4CAF50' : '#888',
                    fontWeight: '600'
                  }}>
                    {userDetails.subscriptionStatus.toUpperCase()}
                  </span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Joined:</span>
                  <span style={styles.detailValue}>{formatDate(userDetails.createdAt)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Platform Fee Settings */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Platform Fee Settings</h2>
            <p style={styles.hint}>
              Adjust the platform fee percentage for this user. This affects commission calculations on all future sales and invoices.
            </p>
            
            <div style={styles.platformFeeContainer}>
              <div style={styles.currentFeeBox}>
                <span style={styles.currentFeeLabel}>Current Platform Fee</span>
                <span style={styles.currentFeeValue}>{userDetails.platformFee}%</span>
                <span style={styles.currentFeeHint}>
                  User keeps {100 - userDetails.platformFee}% of sales
                </span>
              </div>

              <div style={styles.updateSection}>
                <label style={styles.label}>New Platform Fee (%)</label>
                <div style={styles.inputGroup}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(Number(e.target.value))}
                    style={styles.input}
                    disabled={updating}
                  />
                  <button
                    onClick={handleUpdatePlatformFee}
                    disabled={updating || platformFee === userDetails.platformFee}
                    style={{
                      ...styles.updateButton,
                      opacity: (updating || platformFee === userDetails.platformFee) ? 0.5 : 1,
                      cursor: (updating || platformFee === userDetails.platformFee) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {updating ? 'Updating...' : 'Update Fee'}
                  </button>
                </div>
                <p style={styles.hint}>
                  Enter a value between 0 and 100. User will keep {100 - platformFee}% of sales.
                </p>
              </div>
            </div>

            {error && (
              <div style={{
                ...styles.message,
                backgroundColor: '#3a1a1a',
                color: '#f44336',
                border: '1px solid #c62828'
              }}>
                ❌ {error}
              </div>
            )}

            {successMessage && (
              <div style={{
                ...styles.message,
                backgroundColor: '#1a3a1a',
                color: '#4caf50',
                border: '1px solid #2e7d32'
              }}>
                {successMessage}
              </div>
            )}
          </div>

          {/* Information Box */}
          <div style={styles.infoBox}>
            <h3 style={styles.infoTitle}>💡 How Platform Fee Works</h3>
            <ul style={styles.infoList}>
              <li>Platform fee is calculated as a percentage of each protection sale</li>
              <li>The remaining percentage goes to the user as their commission</li>
              <li>Changes apply to all future sales and invoices</li>
              <li>Past invoices and sales are not affected by this change</li>
              <li>Default platform fee is 25% for all new users</li>
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
  hint: {
    fontSize: '14px',
    color: '#888',
    margin: '8px 0 0 0',
  },
  formGroup: {
    marginTop: '16px',
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
  detailsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #222',
  },
  detailLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#888',
  },
  detailValue: {
    fontSize: '15px',
    color: '#fff',
  },
  platformFeeContainer: {
    marginTop: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  currentFeeBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    background: '#0a0a0a',
    border: '2px solid #222',
    borderRadius: '12px',
  },
  currentFeeLabel: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '8px',
  },
  currentFeeValue: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '8px',
  },
  currentFeeHint: {
    fontSize: '14px',
    color: '#4CAF50',
  },
  updateSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#888',
  },
  inputGroup: {
    display: 'flex',
    gap: '12px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '16px',
    border: '1px solid #222',
    borderRadius: '8px',
    backgroundColor: '#000',
    color: '#fff',
  },
  updateButton: {
    padding: '12px 32px',
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
};

