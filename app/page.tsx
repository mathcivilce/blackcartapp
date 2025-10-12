'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <main style={{ padding: '40px', fontFamily: 'system-ui', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>🛒 Shipping Protection Cart</h1>
          <p style={{ fontSize: '18px', color: '#666' }}>Custom cart sidebar with protection toggle for Shopify stores</p>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Logout
        </button>
      </div>
      
      <div style={{ marginTop: '40px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>✅ Week 3 Complete: Protection Toggle</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>✅ Protection toggle in cart footer</li>
          <li>✅ Add/remove protection product when toggled</li>
          <li>✅ Hide protection product from cart display</li>
          <li>✅ Settings API for customization</li>
          <li>✅ Settings page for merchants</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', background: '#e3f2fd', borderRadius: '8px' }}>
        <h2>🧪 Testing</h2>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Open <code>test/shopify-test.html</code> in your browser</li>
          <li>Add products to cart</li>
          <li>Toggle the "Protect my order" checkbox</li>
          <li>See protection product added/removed from cart</li>
          <li>Test on mobile by resizing browser</li>
        </ol>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
        <h2>⚙️ Configuration</h2>
        <p>
          <a href="/settings" style={{ color: '#0066cc', textDecoration: 'none', fontWeight: '600' }}>
            → Go to Settings Page
          </a>
        </p>
        <p style={{ color: '#666', marginTop: '8px' }}>
          Customize colors, text, and pricing for your protection product
        </p>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', background: '#f0fdf4', borderRadius: '8px' }}>
        <h3>📦 Installation</h3>
        <p style={{ marginBottom: '12px' }}>Merchants will add this to their Shopify theme:</p>
        <code style={{ background: '#fff', padding: '12px', display: 'block', borderRadius: '4px', fontSize: '14px' }}>
          {'<script src="https://blackcartapp.netlify.app/cart.js"></script>'}
        </code>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', background: '#fef3c7', borderRadius: '8px' }}>
        <h3>🚀 Next: Week 4 - Sales Tracking</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li>Webhook endpoint to receive orders</li>
          <li>Parse orders for protection product</li>
          <li>Calculate 20% commission</li>
          <li>Save to database</li>
          <li>Dashboard with stats</li>
        </ul>
      </div>
    </main>
  )
}

