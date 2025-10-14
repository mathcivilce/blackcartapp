'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [customizationExpanded, setCustomizationExpanded] = useState(true);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: '▦' },
    { name: 'Sales', path: '/sales', icon: '💰' },
    { name: 'Settings', path: '/settings', icon: '⚙' },
  ];

  const customizationSubmenu = [
    { name: '  Design', path: '/customization/design', icon: '▣' },
    { name: '  Add-ons', path: '/customization/add-ons', icon: '⊞' },
  ];

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h1 style={styles.logo}>BlackCart</h1>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item: any) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                ...styles.navItem,
                ...(pathname === item.path ? styles.navItemActive : {})
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navText}>{item.name}</span>
            </button>
          ))}
          
          {/* Customization Menu with Submenu */}
          <button
            onClick={() => setCustomizationExpanded(!customizationExpanded)}
            style={{
              ...styles.navItem,
              ...(pathname.startsWith('/customization') ? styles.navItemActive : {})
            }}
          >
            <span style={styles.navIcon}>◨</span>
            <span style={styles.navText}>Customization</span>
            <span style={styles.expandIcon}>{customizationExpanded ? '▼' : '▶'}</span>
          </button>
          
          {customizationExpanded && customizationSubmenu.map((item: any) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                ...styles.navItem,
                ...styles.navItemSubmenu,
                ...(pathname === item.path ? styles.navItemActive : {})
              }}
            >
              <span style={styles.navIcon}>└</span>
              <span style={styles.navText}>{item.name}</span>
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={handleLogout} style={styles.logoutButton}>
            <span style={styles.navIcon}>⎋</span>
            <span style={styles.navText}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    width: '260px',
    background: '#000',
    borderRight: '1px solid #222',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'fixed' as const,
    height: '100vh',
    left: 0,
    top: 0,
  },
  sidebarHeader: {
    padding: '32px 24px',
    borderBottom: '1px solid #222',
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
  },
  nav: {
    flex: 1,
    padding: '24px 0',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#888',
    fontSize: '15px',
    fontWeight: '500',
    transition: 'all 0.2s',
    textAlign: 'left' as const,
  },
  navItemActive: {
    background: '#111',
    color: '#fff',
    borderLeft: '3px solid #fff',
  },
  navItemSubmenu: {
    paddingLeft: '40px',
    fontSize: '14px',
  },
  navIcon: {
    fontSize: '18px',
  },
  navText: {
    fontSize: '15px',
  },
  expandIcon: {
    fontSize: '12px',
    marginLeft: 'auto',
    color: '#888',
  },
  sidebarFooter: {
    padding: '24px',
    borderTop: '1px solid #222',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#888',
    fontSize: '15px',
    fontWeight: '500',
    width: '100%',
    transition: 'all 0.2s',
  },
  main: {
    flex: 1,
    marginLeft: '260px',
    padding: '40px',
    overflowY: 'auto' as const,
  },
};

