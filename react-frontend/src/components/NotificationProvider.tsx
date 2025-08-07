import React from 'react';
import { Toaster, toast } from 'react-hot-toast';

// Custom toast styles for pink/purple theme
const toastStyles = {
  style: {
    background: 'linear-gradient(135deg, #ff2d55 0%, #8b5cf6 100%)',
    color: 'white',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 10px 25px rgba(255, 45, 85, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  success: {
    style: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)',
    },
  },
  error: {
    style: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      boxShadow: '0 10px 25px rgba(239, 68, 68, 0.2)',
    },
  },
  warning: {
    style: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      boxShadow: '0 10px 25px rgba(245, 158, 11, 0.2)',
    },
  },
  info: {
    style: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      boxShadow: '0 10px 25px rgba(139, 92, 246, 0.2)',
    },
  },
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          ...toastStyles,
        }}
        containerStyle={{
          top: 20,
          right: 20,
        }}
      />
    </>
  );
};

// Custom hook for notifications
export const useNotifications = () => {
  return {
    success: (message: string, duration?: number) =>
      toast.success(message, { duration, ...toastStyles.success }),
    error: (message: string, duration?: number) =>
      toast.error(message, { duration, ...toastStyles.error }),
    warning: (message: string, duration?: number) =>
      toast(message, { duration, ...toastStyles.warning }),
    info: (message: string, duration?: number) =>
      toast(message, { duration, ...toastStyles.info }),
  };
}; 