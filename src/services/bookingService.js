// services/bookingService.js
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

const API_URL = `${API_BASE_URL}/bookings`;

class BookingService {
  async getAllBookings(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.dateRange) {
      params.append('startDate', filters.dateRange.start);
      params.append('endDate', filters.dateRange.end);
    }

    const response = await axios.get(`${API_URL}?${params.toString()}`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async getUserBookings(userId) {
    const response = await axios.get(`${API_URL}/user/${userId}`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async getBookingById(bookingId) {
    const response = await axios.get(`${API_URL}/${bookingId}`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async createBooking(bookingData) {
    const payload = {
      ...bookingData,
      bookingId: this.generateBookingId(bookingData.type),
      bookingDate: new Date().toLocaleDateString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const response = await axios.post(API_URL, payload, {
      headers: this.getAuthHeader(),
    });
    
    // Also update localStorage for offline support
    this.saveToLocalStorage(response.data);
    
    return response.data;
  }

  async updateStatus(bookingId, status, updatedBy) {
    const response = await axios.patch(
      `${API_URL}/${bookingId}/status`,
      {
        status,
        statusUpdatedBy: updatedBy,
        statusUpdatedAt: new Date().toISOString(),
      },
      { headers: this.getAuthHeader() }
    );
    
    this.updateLocalStorage(response.data);
    
    return response.data;
  }

  async updateBooking(bookingId, updates) {
    const response = await axios.put(`${API_URL}/${bookingId}`, updates, {
      headers: this.getAuthHeader(),
    });
    
    this.updateLocalStorage(response.data);
    
    return response.data;
  }

  async deleteBooking(bookingId) {
    await axios.delete(`${API_URL}/${bookingId}`, {
      headers: this.getAuthHeader(),
    });
    
    this.removeFromLocalStorage(bookingId);
  }

  async getBookingStats() {
    const response = await axios.get(`${API_URL}/stats`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  // Helper methods
  getAuthHeader() {
    const token = localStorage.getItem('aride_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  generateBookingId(type) {
    const prefix = type?.includes('Trip') ? 'LT' : type?.includes('Service') ? 'SV' : 'OR';
    const timestamp = Date.now().toString().slice(-8);
    return `${prefix}${timestamp}`;
  }

  saveToLocalStorage(booking) {
    const bookings = JSON.parse(localStorage.getItem('aride_bookings') || '[]');
    bookings.push(booking);
    localStorage.setItem('aride_bookings', JSON.stringify(bookings));
  }

  updateLocalStorage(booking) {
    const bookings = JSON.parse(localStorage.getItem('aride_bookings') || '[]');
    const index = bookings.findIndex((b) => b.bookingId === booking.bookingId);
    if (index !== -1) {
      bookings[index] = booking;
      localStorage.setItem('aride_bookings', JSON.stringify(bookings));
    }
  }

  removeFromLocalStorage(bookingId) {
    const bookings = JSON.parse(localStorage.getItem('aride_bookings') || '[]');
    const filtered = bookings.filter((b) => b.bookingId !== bookingId);
    localStorage.setItem('aride_bookings', JSON.stringify(filtered));
  }
}

export const bookingService = new BookingService();