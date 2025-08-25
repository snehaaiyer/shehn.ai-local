import React from 'react';
import { Toaster, toast } from 'react-hot-toast';

// Custom toast styles for pink/purple theme
const toastStyles = {
  success: {
    style: {
      border: '1px solid #10B981',
      padding: '16px',
      color: '#065F46',
      background: '#ECFDF5',
    },
    iconTheme: {
      primary: '#10B981',
      secondary: '#FFFFFF',
    },
  },
  error: {
    style: {
      border: '1px solid #EF4444',
      padding: '16px',
      color: '#7F1D1D',
      background: '#FEF2F2',
    },
    iconTheme: {
      primary: '#EF4444',
      secondary: '#FFFFFF',
    },
  },
  loading: {
    style: {
      border: '1px solid #F59E0B',
      padding: '16px',
      color: '#92400E',
      background: '#FFFBEB',
    },
    iconTheme: {
      primary: '#F59E0B',
      secondary: '#FFFFFF',
    },
  },
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#1F2937',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: toastStyles.success,
          error: toastStyles.error,
          loading: toastStyles.loading,
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

// Export toast for use in components
export { toast };