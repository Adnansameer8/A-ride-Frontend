// services/authService.js
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

const API_URL = `${API_BASE_URL}/auth`;

class AuthService {
  async login(credentials) {
    const response = await axios.post(`${API_URL}/login`, credentials);
    if (response.data.token) {
      localStorage.setItem('aride_token', response.data.token);
      localStorage.setItem('aride_user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async register(userData) {
    const response = await axios.post(`${API_URL}/register`, userData);
    if (response.data.token) {
      localStorage.setItem('aride_token', response.data.token);
      localStorage.setItem('aride_user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async logout() {
    localStorage.removeItem('aride_token');
    localStorage.removeItem('aride_user');
    localStorage.removeItem('aride_bookings');
  }

  async verifyToken() {
    const token = localStorage.getItem('aride_token');
    if (!token) throw new Error('No token found');
    
    const response = await axios.get(`${API_URL}/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async forgotPassword(email) {
    const response = await axios.post(`${API_URL}/forgot-password`, { email });
    return response.data;
  }

  async resetPassword(token, newPassword) {
    const response = await axios.post(`${API_URL}/reset-password`, {
      token,
      newPassword,
    });
    return response.data;
  }

  getCurrentUser() {
    const user = localStorage.getItem('aride_user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated() {
    return !!localStorage.getItem('aride_token');
  }
}

export const authService = new AuthService();