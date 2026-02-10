import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { useAuth } from '../auth/AuthContext';
import SidebarBrand from '../components/SidebarBrand';
import './AppLayout.css';

const navItems = [
  { to: '/chat', label: 'Chat history', icon: '💬' },
  { to: '/bookings', label: 'Bookings', icon: '📅' },
  { to: '/documents', label: 'Documents', icon: '📄' },
  { to: '/analytics', label: 'Analytics', icon: '📊' },
];

function getPageTitle(pathname: string): string {
  if (pathname === '/chat') return 'Chat history';
  if (pathname.startsWith('/chat/')) return 'Conversation';
  if (pathname === '/bookings') return 'Bookings';
  if (pathname === '/documents' || pathname.startsWith('/documents/')) return 'Documents';
  if (pathname.startsWith('/analytics')) return 'Analytics';
  return 'OrderlyAI CRM';
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const pageTitle = getPageTitle(location.pathname);

  const handleLogoutClick = () => {
    setSidebarOpen(false);
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <a href="#app-content" className="skip-link">Skip to main content</a>
      <div className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} aria-hidden />
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <SidebarBrand to="/chat" />
        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="sidebar-section-header sidebar-section-header-first">Navigation</div>
          {navItems.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={location.pathname === to || (to !== '/analytics' && location.pathname.startsWith(to)) ? 'active' : ''}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-nav-icon" aria-hidden>{icon}</span>
              {label}
            </Link>
          ))}
          <div className="sidebar-section-header">ACCOUNT</div>
          <button type="button" className="sidebar-nav-btn" onClick={handleLogoutClick}>
            <span className="sidebar-nav-icon" aria-hidden>⎋</span>
            Log out
          </button>
        </nav>
      </aside>
      <main className="app-main">
        <header className="app-header">
          <div className="app-header-inner">
            <div className="app-header-left">
              <button type="button" className="header-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <span className="header-menu-icon" aria-hidden>☰</span>
              </button>
              <span className="app-header-page-title">{pageTitle}</span>
            </div>
          </div>
        </header>
        <Modal
          open={logoutConfirmOpen}
          onClose={() => setLogoutConfirmOpen(false)}
          title="Log out"
          actions={
            <>
              <button type="button" className="btn-secondary" onClick={() => setLogoutConfirmOpen(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={confirmLogout}>Log out</button>
            </>
          }
        >
          <p style={{ margin: 0 }}>Are you sure you want to log out?</p>
        </Modal>
        <div id="app-content" className="app-content" tabIndex={-1}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
