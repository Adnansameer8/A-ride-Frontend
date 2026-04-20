// hooks/useBookings.js
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAllBookings,
  fetchUserBookings,
  createBooking,
  updateBookingStatus,
  deleteBooking,
  setFilters,
  clearCurrentBooking,
} from '../store/slices/bookingSlice';
import { useAuth } from './useAuth';

export const useBookings = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const {
    bookings,
    currentBooking,
    userBookings,
    pendingBookings,
    stats,
    loading,
    error,
    filters,
  } = useSelector((state) => state.bookings);

  const loadAllBookings = (customFilters = {}) => {
    const mergedFilters = { ...filters, ...customFilters };
    dispatch(fetchAllBookings(mergedFilters));
  };

  const loadUserBookings = (userId = user?.id) => {
    if (userId) {
      dispatch(fetchUserBookings(userId));
    }
  };

  const createNewBooking = async (bookingData) => {
    const result = await dispatch(createBooking(bookingData));
    if (result.type === 'bookings/create/fulfilled') {
      return { success: true, booking: result.payload };
    }
    return { success: false, error: result.payload };
  };

  const approveBooking = async (bookingId) => {
    const result = await dispatch(
      updateBookingStatus({
        bookingId,
        status: 'approved',
        updatedBy: user?.name || 'Admin',
      })
    );
    return result.type === 'bookings/updateStatus/fulfilled';
  };

  const rejectBooking = async (bookingId) => {
    const result = await dispatch(
      updateBookingStatus({
        bookingId,
        status: 'rejected',
        updatedBy: user?.name || 'Admin',
      })
    );
    return result.type === 'bookings/updateStatus/fulfilled';
  };

  const cancelBooking = async (bookingId) => {
    const result = await dispatch(deleteBooking(bookingId));
    return result.type === 'bookings/delete/fulfilled';
  };

  const updateFilters = (newFilters) => {
    dispatch(setFilters(newFilters));
  };

  const clearBooking = () => {
    dispatch(clearCurrentBooking());
  };

  const getBookingsByStatus = (status) => {
    return bookings.filter((b) => b.status === status);
  };

  const getBookingsByType = (type) => {
    return bookings.filter((b) => b.type?.includes(type));
  };

  return {
    bookings,
    currentBooking,
    userBookings,
    pendingBookings,
    stats,
    loading,
    error,
    filters,
    loadAllBookings,
    loadUserBookings,
    createNewBooking,
    approveBooking,
    rejectBooking,
    cancelBooking,
    updateFilters,
    clearBooking,
    getBookingsByStatus,
    getBookingsByType,
  };
};