// hooks/useAuth.js
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, register, logout, verifyToken, clearError } from '../store/slices/authSlice';
import { ROLES } from '../config/constants';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const handleLogin = async (credentials) => {
    const result = await dispatch(login(credentials));
    if (result.type === 'auth/login/fulfilled') {
      navigate('/');
      return { success: true };
    }
    return { success: false, error: result.payload };
  };

  const handleRegister = async (userData) => {
    const result = await dispatch(register(userData));
    if (result.type === 'auth/register/fulfilled') {
      navigate('/');
      return { success: true };
    }
    return { success: false, error: result.payload };
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const checkAuth = async () => {
    if (token) {
      await dispatch(verifyToken());
    }
  };

  const isAdmin = () => {
    return user?.role === ROLES.ADMIN;
  };

  const isSupport = () => {
    return user?.role === ROLES.SUPPORT || user?.role === ROLES.ADMIN;
  };

  const hasPermission = (requiredRole) => {
    const roleHierarchy = {
      [ROLES.ADMIN]: 3,
      [ROLES.SUPPORT]: 2,
      [ROLES.CUSTOMER]: 1,
    };
    return roleHierarchy[user?.role] >= roleHierarchy[requiredRole];
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    handleLogin,
    handleRegister,
    handleLogout,
    checkAuth,
    isAdmin,
    isSupport,
    hasPermission,
    clearAuthError,
  };
};