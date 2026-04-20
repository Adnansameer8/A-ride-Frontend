import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from './Authcontext';

// Protected Route for authenticated users
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Admin-only Route
export const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Support or Admin Route (for booking management)
export const SupportRoute = ({ children }) => {
  const { user, hasAnyRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAnyRole(ROLES.ADMIN, ROLES.SUPPORT)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route (redirect if already logged in)
export const PublicRoute = ({ children }) => {
  const { user, isAdmin, isSupport, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    // Redirect based on role
    if (isAdmin()) return <Navigate to="/admin/dashboard" replace />;
    if (isSupport()) return <Navigate to="/support/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// Loading Screen Component
const LoadingScreen = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f9fafb',
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '56px',
          height: '56px',
          border: '5px solid #f3f4f6',
          borderTopColor: '#ff5e00',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 24px',
        }} />
        <p style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#6b7280',
          letterSpacing: '0.5px'
        }}>
          Loading...
        </p>
        <style>{`
          @keyframes spin { 
            to { transform: rotate(360deg); } 
          }
        `}</style>
      </div>
    </div>
  );
};

export default ProtectedRoute;