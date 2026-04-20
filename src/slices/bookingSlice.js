// store/slices/bookingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingService } from '../../services/bookingService';

const initialState = {
  bookings: [],
  currentBooking: null,
  userBookings: [],
  pendingBookings: [],
  stats: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  },
  loading: false,
  error: null,
  filters: {
    status: 'all',
    type: 'all',
    dateRange: null,
  },
};

export const fetchAllBookings = createAsyncThunk(
  'bookings/fetchAll',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await bookingService.getAllBookings(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUserBookings = createAsyncThunk(
  'bookings/fetchUserBookings',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await bookingService.getUserBookings(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createBooking = createAsyncThunk(
  'bookings/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await bookingService.createBooking(bookingData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateBookingStatus = createAsyncThunk(
  'bookings/updateStatus',
  async ({ bookingId, status, updatedBy }, { rejectWithValue }) => {
    try {
      const response = await bookingService.updateStatus(bookingId, status, updatedBy);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteBooking = createAsyncThunk(
  'bookings/delete',
  async (bookingId, { rejectWithValue }) => {
    try {
      await bookingService.deleteBooking(bookingId);
      return bookingId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Bookings
      .addCase(fetchAllBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload.bookings;
        state.stats = action.payload.stats;
        state.pendingBookings = action.payload.bookings.filter(
          (b) => b.status === 'pending'
        );
      })
      .addCase(fetchAllBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch User Bookings
      .addCase(fetchUserBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.userBookings = action.payload;
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings.unshift(action.payload);
        state.currentBooking = action.payload;
        state.stats.total += 1;
        state.stats.pending += 1;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Booking Status
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(
          (b) => b.bookingId === action.payload.bookingId
        );
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        // Update stats
        const oldStatus = state.bookings[index]?.status || 'pending';
        const newStatus = action.payload.status;
        if (oldStatus !== newStatus) {
          state.stats[oldStatus] -= 1;
          state.stats[newStatus] += 1;
        }
      })
      // Delete Booking
      .addCase(deleteBooking.fulfilled, (state, action) => {
        state.bookings = state.bookings.filter(
          (b) => b.bookingId !== action.payload
        );
        state.stats.total -= 1;
      });
  },
});

export const { setFilters, clearCurrentBooking, clearError } = bookingSlice.actions;
export default bookingSlice.reducer;