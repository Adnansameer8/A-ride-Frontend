// utils/helpers.js
export const helpers = {
  generateId: (prefix = '') => {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  sleep: (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  groupBy: (array, key) => {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    }, {});
  },

  sortBy: (array, key, order = 'asc') => {
    return [...array].sort((a, b) => {
      if (order === 'asc') {
        return a[key] > b[key] ? 1 : -1;
      }
      return a[key] < b[key] ? 1 : -1;
    });
  },

  filterBySearch: (array, searchTerm, keys) => {
    const term = searchTerm.toLowerCase();
    return array.filter((item) =>
      keys.some((key) => item[key]?.toString().toLowerCase().includes(term))
    );
  },

  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle: (func, limit) => {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  deepClone: (obj) => {
    return JSON.parse(JSON.stringify(obj));
  },

  isEqual: (obj1, obj2) => {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  },

  removeEmpty: (obj) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v != null && v !== '')
    );
  },

  calculatePercentage: (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  },

  getInitials: (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  },

  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  },

  downloadFile: (data, filename, type = 'text/plain') => {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};