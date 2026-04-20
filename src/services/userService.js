// services/userService.js
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

const API_URL = `${API_BASE_URL}/users`;

class UserService {
  async getAllUsers() {
    const response = await axios.get(API_URL, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async getUserById(userId) {
    const response = await axios.get(`${API_URL}/${userId}`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async createUser(userData) {
    const response = await axios.post(API_URL, userData, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async updateUser(userId, updates) {
    const response = await axios.put(`${API_URL}/${userId}`, updates, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async deleteUser(userId) {
    await axios.delete(`${API_URL}/${userId}`, {
      headers: this.getAuthHeader(),
    });
  }

  async updateUserRole(userId, role) {
    const response = await axios.patch(
      `${API_URL}/${userId}/role`,
      { role },
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async getUserStats() {
    const response = await axios.get(`${API_URL}/stats`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  getAuthHeader() {
    const token = localStorage.getItem('aride_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export const userService = new UserService();