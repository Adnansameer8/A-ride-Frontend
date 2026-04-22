import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Authcontext';
import logo from '/logo.png';
import { 
  Eye, User, Clipboard, LogOut, BarChart3, ClipboardList, 
  Users, Map, Headphones, Ticket, Home, Wrench, Route, LifeBuoy, Settings
} from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  // ── ROLE-BASED DYNAMIC LINKS (With Icons for Mobile) ──
  const getRoleLinks = () => {
    // 1. ADMIN NAVIGATION
   if (user?.role === 'admin') {
  return [
    { id: 'admin-dash',      label: 'Dashboard',  path: '/admin/dashboard',        icon: <BarChart3 size={18} /> },
    { id: 'admin-users',     label: 'Users',      path: '/admin/users',            icon: <Users size={18} /> },
    { id: 'admin-services',  label: 'Services',   path: '/admin/servicesManagement', icon: <Settings size={18} /> },
    { id: 'admin-trips',     label: 'Trips',      path: '/admin/trips',            icon: <Map size={18} /> },
    { id: 'admin-bookings',  label: 'Bookings',   path: '/admin/bookings',         icon: <ClipboardList size={18} /> },
    { id: 'admin-tickets',   label: 'Tickets',    path: '/admin/tickets',          icon: <Ticket size={18} /> },
  ];
}
    // 2. SUPPORT NAVIGATION
    if (user?.role === 'support') {
  return [
    { id: 'support-dash',     label: 'Support Dash',  path: '/support/dashboard', icon: <Headphones size={18} /> },
    { id: 'support-tickets',  label: 'Active Tickets', path: '/admin/tickets',    icon: <Ticket size={18} /> },
    { id: 'support-bookings', label: 'Bookings',       path: '/admin/bookings',   icon: <ClipboardList size={18} /> },
    { id: 'support-services', label: 'Services',       path: '/admin/services',   icon: <Settings size={18} /> }, // ← ADD THIS
  ];
}
    // 3. REGULAR USER NAVIGATION
    return [
      { id: 'home', label: 'Home', path: '/home', icon: <Home size={18} /> },
       { id: 'mechanic', label: 'Services', path: '/services', icon: <Wrench size={18} /> },
      { id: 'onroading', label: 'Explore Trips', path: '/explore', icon: <Route size={18} /> },
      { id: 'contact', label: 'Support', path: '/support', icon: <LifeBuoy size={18} /> },
    ];
  };

  const currentLinks = getRoleLinks();

  // ── ACTIVE LINK DETECTION ──
  const getActiveLink = () => {
    const path = location.pathname;
    const found = currentLinks.find(link => link.path === path);
    if (found) return found.id;
    if (path === '/my-bookings') return 'mybookings';
    if (path === '/profile') return 'profile';
    return '';
  };

  const active = getActiveLink();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // FIX: Changed to match the new unique class name
      if (showUserMenu && !e.target.closest('.nav-user-section')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const navigateTo = (path) => {
    setIsOpen(false);
    setShowUserMenu(false);
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setIsOpen(false);
    navigate('/login');
  };

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

        /* ══════════════════════════════════════
           DESKTOP NAVBAR
        ══════════════════════════════════════ */

        .navbar {
          position: sticky;
          top: 0; left: 0; right: 0;
          z-index: 9999;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%);
          border-bottom: 1px solid rgb(255, 255, 255);
          transition: all 0.4s ease;
          font-family: "Sekuya", system-ui, sans-serif;
        }

        .navbar::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent 0%, #ff5e00 30%, #ff9a00 60%, #ff5e00 80%, transparent 100%);
        }

        .navbar.scrolled {
          backdrop-filter: blur(20px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        /* ── LOGO ── */
        .nav-logo {
          cursor: pointer;
          user-select: none;
          display: flex;
          align-items: center;
          position: relative;
        }

        .nav-logo img {
          height: 42px;
          width: auto;
          object-fit: contain;
          transition: all 0.3s ease;
          filter: brightness(1);
        }

        .navbar.scrolled .nav-logo img { height: 36px; }

        .nav-logo img:hover {
          filter: brightness(1.15) drop-shadow(0 0 8px rgba(255,92,0,0.5));
          transform: scale(1.03);
        }

        /* ── DESKTOP LINKS ── */
        .nav-center {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          list-style: none;
        }

        .nav-links button {
          background: none;
          border: none;
          color: rgba(0, 0, 0, 0.95);
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 8px 18px;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          border-radius: 4px;
          font-family: "Sekuya", system-ui, sans-serif;
        }

        .nav-links button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,92,0,0.06);
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .nav-links button::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%) scaleX(0);
          width: 80%;
          height: 2px;
          background: linear-gradient(90deg, #FF5C00, #ff9a00);
          border-radius: 2px;
          transition: transform 0.3s ease;
        }

        .nav-links button:hover, .nav-links button.active { color: #FF5C00; }
        .nav-links button:hover::before { opacity: 1; }

        .nav-links button.active::after,
        .nav-links button:hover::after {
          transform: translateX(-50%) scaleX(1);
        }

        /* ── FIX: ISOLATED USER SECTION ── */
        .nav-user-section {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-user-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background: rgba(255,92,0,0.08);
          border: 2px solid rgba(255,92,0,0.15);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .nav-user-btn:hover {
          background: rgba(255,92,0,0.15);
          border-color: rgba(255,92,0,0.3);
          transform: translateY(-1px);
        }

        .nav-user-avatar {
          width: 36px !important;
          height: 36px !important;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF5C00, #ff9a00);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 16px;
          position: relative;
          flex-shrink: 0;
        }

        .nav-admin-badge {
          position: absolute;
          top: -6px;
          right: -8px;
          background: #ff0000;
          color: white;
          font-size: 8px;
          font-weight: 800;
          padding: 2px 5px;
          border-radius: 6px;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .nav-support-badge {
          position: absolute;
          top: -6px;
          right: -8px;
          background: #2563eb;
          color: white;
          font-size: 8px;
          font-weight: 800;
          padding: 2px 5px;
          border-radius: 6px;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .nav-user-details {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
        }

        .nav-user-name-text {
          font-size: 14px !important;
          font-weight: 700 !important;
          color: rgba(0, 0, 0, 0.9) !important;
          margin: 0 !important;
          line-height: 1.2 !important;
        }

        .nav-user-role-text {
          font-size: 11px !important;
          color: rgba(0, 0, 0, 0.5) !important;
          text-transform: capitalize !important;
          margin: 0 !important;
          line-height: 1.2 !important;
        }

        .user-dropdown {
          position: absolute;
          top: 58px;
          right: 0;
          min-width: 220px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          padding: 8px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          border: 1px solid rgba(0,0,0,0.08);
        }

        .user-dropdown.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .user-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .user-dropdown-item:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        .user-dropdown-item.active-item {
          background: rgba(255,92,0,0.08);
        }

        .user-dropdown-item .icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(0, 0, 0, 0.6);
        }

        .user-dropdown-item span:last-child {
          font-size: 14px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.85);
        }

        .user-dropdown-item.logout {
          margin-top: 4px;
          border-top: 1px solid rgba(0,0,0,0.08);
          padding-top: 12px;
          color: #dc2626;
        }

        .user-dropdown-item.logout .icon {
          color: #dc2626;
        }

        .user-dropdown-item.logout:hover {
          background: rgba(220, 38, 38, 0.08);
        }

        .login-button {
          background: linear-gradient(135deg, #ff5e00, #ff9a00);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(255,92,0,0.3);
        }

        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255,92,0,0.4);
        }

        /* ══════════════════════════════════════
           MOBILE PILL BAR
        ══════════════════════════════════════ */

        .mobile-pill-bar {
          display: none;
        }

        @media (max-width: 1024px) {
          .navbar { display: none; }
          .mobile-pill-bar { display: block; }
        }

        .pill-container {
          position: fixed;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 92%;
          max-width: 500px;
          height: 64px;
          background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9));
          backdrop-filter: blur(20px);
          border-radius: 32px;
          padding: 8px 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,92,0,0.1);
          border: 2px solid rgba(255,255,255,0.4);
        }

        .pill-logo {
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .pill-logo img {
          height: 36px;
          width: auto;
          object-fit: contain;
          filter: brightness(1);
        }

        .pill-user {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(255,92,0,0.08);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .pill-user:hover {
          background: rgba(255,92,0,0.15);
        }

        .pill-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF5C00, #ff9a00);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 14px;
        }

        .pill-name {
          font-size: 14px;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.9);
        }

        .pill-login {
          background: linear-gradient(135deg, #ff5e00, #ff9a00);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .pill-hamburger {
          width: 40px;
          height: 40px;
          background: rgba(255,92,0,0.1);
          border: none;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .pill-hamburger:hover {
          background: rgba(255,92,0,0.2);
        }

        .pill-hamburger span {
          width: 18px;
          height: 2px;
          background: #FF5C00;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .pill-hamburger.open span:nth-child(1) {
          transform: translateY(6px) rotate(45deg);
        }

        .pill-hamburger.open span:nth-child(2) {
          opacity: 0;
        }

        .pill-hamburger.open span:nth-child(3) {
          transform: translateY(-6px) rotate(-45deg);
        }

        /* ── MOBILE DROPDOWN ── */

        .pill-dropdown {
          position: fixed;
          bottom: 90px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          width: 92%;
          max-width: 500px;
          max-height: 70vh;
          overflow-y: auto;
          background: white;
          border-radius: 24px;
          box-shadow: 0 12px 48px rgba(0,0,0,0.2);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          z-index: 9998;
          border: 2px solid rgba(255,92,0,0.1);
        }

        .pill-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }

        .dropdown-user-section {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px;
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }

        .dropdown-user-info {
          flex: 1;
        }

        .dropdown-user-name {
          font-size: 16px;
          font-weight: 700;
          color: rgba(0, 0, 0, 0.9);
          margin-bottom: 2px;
        }

        .dropdown-user-email {
          font-size: 13px;
          color: rgba(0, 0, 0, 0.5);
        }

        .dropdown-items {
          padding: 12px;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 14px 16px;
          background: none;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          font-size: 15px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.9);
          margin-bottom: 6px;
        }

        .dropdown-item:hover {
          background: rgba(255,92,0,0.08);
        }

        .dropdown-item.active {
          background: rgba(255,92,0,0.12);
          color: #FF5C00;
        }

        .dropdown-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          color: rgba(0, 0, 0, 0.6);
        }

        .dropdown-item.active .dropdown-icon {
          color: #FF5C00;
        }

        .dropdown-arrow {
          margin-left: auto;
          font-size: 20px;
          color: rgba(0, 0, 0, 0.3);
        }

        .dropdown-item.active .dropdown-arrow {
          color: #FF5C00;
        }

        .dropdown-footer {
          padding: 12px 20px 20px 20px;
          border-top: 1px solid rgba(0,0,0,0.08);
        }

        .dropdown-logout {
          width: 100%;
          padding: 14px;
          background: rgba(220, 38, 38, 0.08);
          color: #dc2626;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dropdown-logout:hover {
          background: rgba(220, 38, 38, 0.15);
        }
      `}</style>

      {/* ════════════════════════════════
          DESKTOP NAVBAR
      ════════════════════════════════ */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo" onClick={() => navigateTo('/home')}>
          <img src={logo} alt="Logo" />
        </div>

        <div className="nav-center">
          <ul className="nav-links">
            {currentLinks.map(({ id, label, path }) => (
              <li key={id}>
                <button
                  className={active === id ? 'active' : ''}
                  onClick={() => navigateTo(path)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* ── ISOLATED USER SECTION ── */}
        <div className="nav-user-section">
          {isAuthenticated ? (
            <>
              <div
                className="nav-user-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="nav-user-avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                  {user?.role === 'admin' && (
                    <span className="nav-admin-badge">ADMIN</span>
                  )}
                  {user?.role === 'support' && (
                    <span className="nav-support-badge">SUPPORT</span>
                  )}
                </div>
                <div className="nav-user-details">
                  <span className="nav-user-name-text">{user?.name?.split(' ')[0]}</span>
                </div>
              </div>

              <div className={`user-dropdown ${showUserMenu ? 'show' : ''}`}>
                {/* ── ADMIN CONDITION DESKTOP ── */}
                {user?.role === 'admin' || user?.role === 'support' ? (
                  <div
                  className="user-dropdown-item"
                  onClick={() => navigateTo('/home')}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Icon */}
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6b7280"
                    }}
                  >
                    <Eye size={18} />
                  </span>

                  {/* Text */}
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#111827"
                    }}
                  >
                    User View
                  </span>
                </div>
                ) : (
                  <>
                    <div className="user-dropdown-item" onClick={() => navigateTo('/profile')}>
                      <span className="icon"><User size={18} /></span>
                      <span style={{fontFamily:"Outfit"}}>Profile</span>
                    </div>

                    <div className={`user-dropdown-item ${active === 'mybookings' ? 'active-item' : ''}`} onClick={() => navigateTo('/my-bookings')}>
                      <span className="icon"><Clipboard size={18} /></span>
                      <span style={{fontFamily:"'Outfit'"}}>My Bookings</span>
                    </div>
                  </>
                )}

                <div className="user-dropdown-item logout" onClick={handleLogout}>
                  <span className="icon"><LogOut size={18} /></span>
                  <span style={{fontFamily:"'Outfit', sans-serif"}}>Logout</span>
                </div>
              </div>
            </>
          ) : (
            <button className="login-button" onClick={() => navigateTo('/login')}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* ════════════════════════════════
          MOBILE PILL BAR
      ════════════════════════════════ */}
      <div className="mobile-pill-bar">
        <div style={{ position: 'relative' }}>
          
          <div className="pill-container">
            <div className="pill-logo" onClick={() => navigateTo('/home')}>
              <img src={logo} alt="Logo" />
            </div>

            {isAuthenticated ? (
              <div className="pill-user" onClick={() => setIsOpen(!isOpen)}>
                <div className="pill-avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="pill-name">{user?.name?.split(' ')[0]}</span>
              </div>
            ) : (
              <button className="pill-login" onClick={() => navigateTo('/login')}>
                Sign In
              </button>
            )}

            <button
              className={`pill-hamburger ${isOpen ? 'open' : ''}`}
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>
          </div>

          <div className={`pill-dropdown ${isOpen ? 'open' : ''}`}>
            {isAuthenticated && (
              <div className="dropdown-user-section">
                <div className="pill-avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="dropdown-user-info">
                  <div className="dropdown-user-name">{user?.name}</div>
                  <div className="dropdown-user-email">{user?.email}</div>
                </div>
              </div>
            )}

            <div className="dropdown-items">
              {/* Maps over the Dynamic Role Links automatically */}
              {currentLinks.map(({ id, label, icon, path }) => (
                <button
                  key={id}
                  className={`dropdown-item ${active === id ? 'active' : ''}`}
                  onClick={() => navigateTo(path)}
                >
                  <span className="dropdown-icon">{icon}</span>
                  {label}
                  <span className="dropdown-arrow">›</span>
                </button>
              ))}

              {isAuthenticated && (
                <>
                  {/* ── ADMIN CONDITION MOBILE ── */}
                  {user?.role === 'admin' ? (
                     <button
                      className={`dropdown-item ${active === 'home' ? 'active' : ''}`}
                      onClick={() => navigateTo('/home')}
                    >
                      <span className="dropdown-icon"><Eye size={18} /></span>
                      User View
                      <span className="dropdown-arrow">›</span>
                    </button>
                  ) : (
                    <>
                      <button
                        className={`dropdown-item ${active === 'profile' ? 'active' : ''}`}
                        onClick={() => navigateTo('/profile')}
                      >
                        <span className="dropdown-icon"><User size={18} /></span>
                        Profile
                        <span className="dropdown-arrow">›</span>
                      </button>
                      
                      <button
                        className={`dropdown-item ${active === 'mybookings' ? 'active' : ''}`}
                        onClick={() => navigateTo('/my-bookings')}
                      >
                        <span className="dropdown-icon"><Clipboard size={18} /></span>
                        My Bookings
                        <span className="dropdown-arrow">›</span>
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="dropdown-footer">
              {isAuthenticated ? (
                <button className="dropdown-logout" onClick={handleLogout}>
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  className="dropdown-logout"
                  style={{ background: 'linear-gradient(135deg, #ff5e00, #ff9a00)' }}
                  onClick={() => navigateTo('/login')}
                >
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;