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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const activeStores = backupStores.filter(s => s.enabled).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Multi-Store Checkout</h1>
          <p className="text-gray-600">
            Redirect checkout traffic to backup stores for business continuity
          </p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            saveMessage.includes('Failed') || saveMessage.includes('Error') 
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}>
            {saveMessage}
          </div>
        )}

        {/* Enable/Disable Feature */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Feature Status
              </h2>
              <p className="text-sm text-gray-600">
                Enable multi-store checkout redirect for your cart
              </p>
            </div>
            <button
              onClick={() => handleToggleFeature(!enabled)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                enabled ? 'bg-blue-600' : 'bg-gray-300'
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
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ✓ Multi-Store Checkout is active. Traffic will be randomly distributed across {activeStores} active backup store{activeStores !== 1 ? 's' : ''}.
              </p>
            </div>
          )}
        </div>

        {/* Backup Stores */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Backup Stores ({backupStores.length}/5)
              </h2>
              <p className="text-sm text-gray-600">
                Add up to 5 backup stores to redirect checkout traffic
              </p>
            </div>
            {backupStores.length < 5 && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Add Store
              </button>
            )}
          </div>

          {/* Add Store Form */}
          {showAddForm && (
            <form onSubmit={handleAddStore} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Domain
                  </label>
                  <input
                    type="text"
                    value={newStoreDomain}
                    onChange={(e) => setNewStoreDomain(e.target.value)}
                    placeholder="backup-store.myshopify.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Token
                  </label>
                  <input
                    type="password"
                    value={newStoreToken}
                    onChange={(e) => setNewStoreToken(e.target.value)}
                    placeholder="shpat_xxxxx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    API token must have read_products permission
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={adding}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Store List */}
          {backupStores.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p>No backup stores added yet</p>
              <p className="text-sm mt-1">Click "Add Store" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backupStores.map((store, index) => (
                <div key={store.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-400">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{store.shop_domain}</div>
                      <div className="text-sm text-gray-500">Added {new Date(store.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleStore(store.id, store.enabled)}
                      className={`px-3 py-1 text-sm rounded-full ${
                        store.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {store.enabled ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleRemoveStore(store.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove store"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Product Mapping
              </h2>
              <p className="text-sm text-gray-600">
                Sync products from your primary store to backup stores using SKUs
              </p>
            </div>
            <button
              onClick={handleSyncProducts}
              disabled={syncing || backupStores.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
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
            <div className="text-sm text-gray-600">
              Last synced: {new Date(lastSyncTime).toLocaleString()}
            </div>
          )}

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">Important Notes:</h3>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Products must have matching SKUs across all stores</li>
              <li>Ensure products exist in backup stores before syncing</li>
              <li>Sync runs automatically when adding new stores</li>
              <li>Manual sync recommended after adding new products</li>
            </ul>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
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

