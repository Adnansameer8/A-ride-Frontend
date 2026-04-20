// utils/validators.js
export const validators = {
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  phone: (phone) => {
    const regex = /^[6-9]\d{9}$/; // Indian phone numbers
    return regex.test(phone.replace(/\s/g, ''));
  },

  password: (password) => {
    // Minimum 8 characters, at least one letter and one number
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return regex.test(password);
  },

  required: (value) => {
    return value !== null && value !== undefined && value !== '';
  },

  minLength: (value, min) => {
    return value && value.length >= min;
  },

  maxLength: (value, max) => {
    return value && value.length <= max;
  },

  alphanumeric: (value) => {
    const regex = /^[a-zA-Z0-9]+$/;
    return regex.test(value);
  },

  url: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  date: (date) => {
    return !isNaN(Date.parse(date));
  },

  futureDate: (date) => {
    return new Date(date) > new Date();
  },
};