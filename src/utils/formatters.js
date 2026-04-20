// utils/formatters.js
export const formatters = {
  currency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  },

  number: (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  },

  date: (date, format = 'short') => {
    const options = {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
      time: { hour: '2-digit', minute: '2-digit' },
      datetime: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    };

    return new Intl.DateTimeFormat('en-IN', options[format] || options.short).format(
      new Date(date)
    );
  },

  phone: (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  },

  truncate: (text, length = 50) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  },

  capitalize: (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  titleCase: (text) => {
    return text
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  fileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },
};