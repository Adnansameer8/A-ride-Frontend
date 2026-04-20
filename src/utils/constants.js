// utils/constants.js
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const ROLES = {
  ADMIN: 'admin',
  SUPPORT: 'support',
  CUSTOMER: 'customer',
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

export const BOOKING_TYPES = {
  LONG_TRIP: 'Long Trip',
  OFF_ROAD: 'Off-Roading',
  SERVICE: 'Service',
};

export const TRIP_TAGS = [
  'Scenic',
  'High Passes',
  'Coastal',
  'Beaches',
  'Culture',
  'Heritage',
  'Pan-India',
  'Epic',
  'North-East',
  'Green',
];

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ABOUT: '/about',
  EXPLORE: '/explore',
  LONG_TRIP: '/explore/long-trip',
  OFF_ROADING: '/explore/off-roading',
  SERVICES: '/services',
  PROFILE: '/profile',
  MY_BOOKINGS: '/my-bookings',
  ADMIN_DASHBOARD: '/admin/dashboard',
  SUPPORT_DASHBOARD: '/support/dashboard',
  BOOKING_MANAGEMENT: '/admin/bookings',
  USER_MANAGEMENT: '/admin/users',
};

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'aride_token',
  USER: 'aride_user',
  BOOKINGS: 'aride_bookings',
  USERS: 'aride_users',
};