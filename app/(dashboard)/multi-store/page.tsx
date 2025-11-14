'use client';

import { useState, useEffect } from 'react';

interface BackupStore {
  id: string;
  shop_domain: string;
  enabled: boolean;
  created_at: string;
}

interface ProductMapping {
  sku: string;
  primary_variant_id: string;
  backup_variant_id: string;
  primary_product_title: string;
}

export default function MultiStorePage() {
  const [enabled, setEnabled] = useState(false);
  const [backupStores, setBackupStores] = useState<BackupStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  // Add store form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStoreDomain, setNewStoreDomain] = useState('');
  const [newStoreToken, setNewStoreToken] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/multi-store');
      if (response.ok) {
        const data = await response.json();
        setEnabled(data.enabled || false);
        setBackupStores(data.backupStores || []);
        setLastSyncTime(data.lastSyncTime);
      }
    } catch (error) {
      console.error('Failed to load multi-store settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (newValue: boolean) => {
    if (newValue === enabled) return;
    
    setEnabled(newValue);
    
    try {
      const response = await fetch('/api/multi-store/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue })
      });

      if (!response.ok) {
        setEnabled(!newValue); // Revert on error
        showMessage('Failed to update feature status', 'error');
      } else {
        showMessage(`Multi-Store Checkout ${newValue ? 'enabled' : 'disabled'}!`, 'success');
      }
    } catch (error) {
      console.error('Error toggling feature:', error);
      setEnabled(!newValue);
      showMessage('Error updating feature status', 'error');
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStoreDomain || !newStoreToken) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    if (backupStores.length >= 5) {
      showMessage('Maximum 5 backup stores allowed', 'error');
      return;
    }

    setAdding(true);

    try {
      const response = await fetch('/api/multi-store/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_domain: newStoreDomain,
          api_token: newStoreToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.error || 'Failed to add backup store', 'error');
        return;
      }

      showMessage('Backup store added successfully!', 'success');
      setNewStoreDomain('');
      setNewStoreToken('');
      setShowAddForm(false);
      loadSettings(); // Reload to get updated list
    } catch (error) {
      console.error('Error adding store:', error);
      showMessage('Error adding backup store', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveStore = async (storeId: string) => {
    if (!confirm('Are you sure you want to remove this backup store?')) {
      return;
    }

    try {
      const response = await fetch(`/api/multi-store/stores/${storeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showMessage('Backup store removed', 'success');
        loadSettings();
      } else {
        showMessage('Failed to remove store', 'error');
      }
    } catch (error) {
      console.error('Error removing store:', error);
      showMessage('Error removing store', 'error');
    }
  };

  const handleToggleStore = async (storeId: string, currentEnabled: boolean) => {
    try {
      const response = await fetch(`/api/multi-store/stores/${storeId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled })
      });

      if (response.ok) {
        showMessage(`Store ${!currentEnabled ? 'enabled' : 'disabled'}`, 'success');
        loadSettings();
      } else {
        showMessage('Failed to toggle store', 'error');
      }
    } catch (error) {
      console.error('Error toggling store:', error);
      showMessage('Error toggling store', 'error');
    }
  };

  const handleSyncProducts = async () => {
    if (backupStores.length === 0) {
      showMessage('Please add at least one backup store first', 'error');
      return;
    }

    setSyncing(true);

    try {
      const response = await fetch('/api/multi-store/sync-products', {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(`Products synced! ${data.mappingsCreated} mappings created.`, 'success');
        setLastSyncTime(new Date().toISOString());
      } else {
        showMessage(data.error || 'Failed to sync products', 'error');
      }
    } catch (error) {
      console.error('Error syncing products:', error);
      showMessage('Error syncing products', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const showMessage = (message: string, type: 'success' | 'error') => {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(''), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const activeStores = backupStores.filter(s => s.enabled).length;

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Multi-Store Checkout</h1>
          <p className="text-gray-400">
            Redirect checkout traffic to backup stores for business continuity
          </p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '16px',
            textAlign: 'center' as const,
            ...(saveMessage.includes('Failed') || saveMessage.includes('Error') 
              ? {
                  background: '#f8d7da',
                  color: '#721c24',
                  border: '1px solid #f5c6cb',
                }
              : {
                  background: '#d4edda',
                  color: '#155724',
                  border: '1px solid #c3e6cb',
                })
          }}>
            {saveMessage}
          </div>
        )}

        {/* Enable/Disable Feature */}
        <div style={{
          background: '#111',
          border: '1px solid #222',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Feature Status
              </h2>
              <p className="text-sm text-gray-400">
                Enable multi-store checkout redirect for your cart
              </p>
            </div>
            <button
              onClick={() => handleToggleFeature(!enabled)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                enabled ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {enabled && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: '#155724',
                fontWeight: '500'
              }}>
                ✓ Multi-Store Checkout is active. Traffic will be randomly distributed across {activeStores} active backup store{activeStores !== 1 ? 's' : ''}.
              </p>
            </div>
          )}
        </div>

        {/* Backup Stores */}
        <div style={{
          background: '#111',
          border: '1px solid #222',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Backup Stores ({backupStores.length}/5)
              </h2>
              <p className="text-sm text-gray-400">
                Add up to 5 backup stores to redirect checkout traffic
              </p>
            </div>
            {backupStores.length < 5 && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  padding: '10px 20px',
                  background: '#fff',
                  color: '#000',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
              >
                + Add Store
              </button>
            )}
          </div>

          {/* Add Store Form */}
          {showAddForm && (
            <form onSubmit={handleAddStore} style={{
              marginBottom: '24px',
              padding: '16px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
            }}>
              <div className="space-y-4">
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '8px',
                  }}>
                    Store Domain
                  </label>
                  <input
                    type="text"
                    value={newStoreDomain}
                    onChange={(e) => setNewStoreDomain(e.target.value)}
                    placeholder="backup-store.myshopify.com"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box' as const,
                      background: '#000',
                      color: '#fff',
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '8px',
                  }}>
                    API Token
                  </label>
                  <input
                    type="password"
                    value={newStoreToken}
                    onChange={(e) => setNewStoreToken(e.target.value)}
                    placeholder="shpat_xxxxx"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box' as const,
                      background: '#000',
                      color: '#fff',
                    }}
                    required
                  />
                  <p style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    marginTop: '6px' 
                  }}>
                    API token must have read_products permission
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={adding}
                    style={{
                      padding: '10px 20px',
                      background: '#fff',
                      color: '#000',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      cursor: adding ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      opacity: adding ? 0.6 : 1,
                    }}
                  >
                    {adding ? 'Adding...' : 'Add Store'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewStoreDomain('');
                      setNewStoreToken('');
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'transparent',
                      color: '#fff',
                      border: '1px solid #666',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Store List */}
          {backupStores.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 0',
              color: '#666',
            }}>
              <p style={{ 
                fontSize: '14px',
                color: '#666',
                marginBottom: '4px'
              }}>
                No backup stores added yet
              </p>
              <p style={{ 
                fontSize: '13px',
                color: '#888',
                marginTop: '4px'
              }}>
                Click "Add Store" to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {backupStores.map((store, index) => (
                <div key={store.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  background: '#1a1a1a',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '500',
                      color: '#666'
                    }}>
                      #{index + 1}
                    </div>
                    <div>
                      <div style={{ 
                        fontWeight: '500', 
                        color: '#fff',
                        marginBottom: '4px'
                      }}>
                        {store.shop_domain}
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#666'
                      }}>
                        Added {new Date(store.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => handleToggleStore(store.id, store.enabled)}
                      style={{
                        padding: '6px 16px',
                        fontSize: '13px',
                        fontWeight: '600',
                        borderRadius: '20px',
                        border: store.enabled ? '1px solid #4CAF50' : '1px solid #666',
                        background: store.enabled ? '#1a3a1a' : '#1a1a1a',
                        color: store.enabled ? '#4CAF50' : '#666',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {store.enabled ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleRemoveStore(store.id)}
                      style={{
                        padding: '8px',
                        color: '#f44336',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      title="Remove store"
                    >
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Mapping Sync */}
        <div style={{
          background: '#111',
          border: '1px solid #222',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Product Mapping
              </h2>
              <p className="text-sm text-gray-400">
                Sync products from your primary store to backup stores using SKUs
              </p>
            </div>
            <button
              onClick={handleSyncProducts}
              disabled={syncing || backupStores.length === 0}
              style={{
                padding: '10px 20px',
                background: '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: (syncing || backupStores.length === 0) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s',
                opacity: (syncing || backupStores.length === 0) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {syncing ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Products
                </>
              )}
            </button>
          </div>

          {lastSyncTime && (
            <div className="text-sm text-gray-400">
              Last synced: {new Date(lastSyncTime).toLocaleString()}
            </div>
          )}

          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#000',
            borderRadius: '8px',
            border: '1px solid #fff',
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: '#fff',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              Important Notes:
            </h3>
            <ul style={{ 
              margin: '8px 0 0 0', 
              paddingLeft: '20px', 
              fontSize: '13px', 
              color: '#fff',
              lineHeight: '1.6'
            }}>
              <li>Products must have matching SKUs across all stores</li>
              <li>Ensure products exist in backup stores before syncing</li>
              <li>Sync runs automatically when adding new stores</li>
              <li>Manual sync recommended after adding new products</li>
            </ul>
          </div>
        </div>

        {/* Help Section */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          backgroundColor: '#000',
          borderRadius: '8px',
          border: '1px solid #fff',
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '14px', 
            color: '#fff',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            📚 How it works:
          </h3>
          <ol style={{ 
            margin: '8px 0 0 0', 
            paddingLeft: '20px', 
            fontSize: '13px', 
            color: '#fff',
            lineHeight: '1.6'
          }}>
            <li>Customers shop on your primary store</li>
            <li>When clicking "Proceed to Checkout", they're redirected to a random backup store</li>
            <li>Cart contents are automatically transferred using SKU matching</li>
            <li>Traffic is evenly distributed across all active backup stores</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

