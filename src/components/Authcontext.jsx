// components/Authcontext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const ROLES = {
  ADMIN: 'admin',
  SUPPORT: 'support',
  USER: 'user',
};

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'aride_token';
const USER_KEY = 'aride_user';

// ─── helpers ─────────────────────────────────────────────────────────────────

const saveSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

// ─── provider ────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount — verify stored token against /api/auth/me
  useEffect(() => {
    const restore = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Token invalid');

        const data = await res.json();
        setUser(data.user);
        // Keep localStorage user in sync
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } catch {
        clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  // ── login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    saveSession(data.token, data.user);
    setUser(data.user);
    return data;
  }, []);

  // ── register (candidates only) ─────────────────────────────────────────────
  const register = useCallback(async (name, email, phone, password) => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    saveSession(data.token, data.user);
    setUser(data.user);
    return data;
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const token = getStoredToken();
    // tell the server (fire-and-forget)
    if (token) {
      fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    clearSession();
    setUser(null);
  }, []);

  // ── add support account (admin only) ──────────────────────────────────────
  const addSupportUser = useCallback(async (name, email, phone, password) => {
    const token = getStoredToken();
    const res = await fetch(`${API}/auth/add-support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, phone, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create support user');
    return data;
  }, []);

  // ── role helpers ───────────────────────────────────────────────────────────
  const isAdmin    = useCallback(() => user?.role === ROLES.ADMIN, [user]);
  const isSupport  = useCallback(() => user?.role === ROLES.SUPPORT, [user]);
  const isUser     = useCallback(() => user?.role === ROLES.USER, [user]);
  const hasRole    = useCallback((role) => user?.role === role, [user]);
  const hasAnyRole = useCallback((...roles) => roles.includes(user?.role), [user]);

  // ── token getter (for manual API calls) ────────────────────────────────────
  const getToken = useCallback(() => getStoredToken(), []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    addSupportUser,
    getToken,
    isAuthenticated: !!user,
    isAdmin,
    isSupport,
    isUser,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};