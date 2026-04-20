// hooks/useNotification.js
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';

export const useNotification = () => {
  const dispatch = useDispatch();

  const showNotification = (message, type = 'info', duration = 5000) => {
    const notification = {
      id: Date.now().toString(),
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration,
    };
    dispatch(addNotification(notification));
  };

  const success = (message, duration) => showNotification(message, 'success', duration);
  const error = (message, duration) => showNotification(message, 'error', duration);
  const warning = (message, duration) => showNotification(message, 'warning', duration);
  const info = (message, duration) => showNotification(message, 'info', duration);

  return {
    showNotification,
    success,
    error,
    warning,
    info,
  };
};