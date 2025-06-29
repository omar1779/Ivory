'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Notification } from './Notification';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationMessage {
  id: string;
  message: string | string[];
  type: NotificationType;
  title?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

interface NotificationAction {
  label: string;
  onClick: () => void;
}

interface NotificationOptions {
  title?: string;
  duration?: number;
  onUndo?: () => void;
  onView?: () => void;
  onRetry?: () => void;
  actions?: NotificationAction[];
}

interface NotificationContextType {
  showNotification: (
    message: string | string[],
    type?: NotificationType,
    options?: NotificationOptions
  ) => void;
  showError: (message: string | string[], options?: Omit<NotificationOptions, 'onUndo' | 'onView'>) => void;
  showSuccess: (message: string | string[], options?: Omit<NotificationOptions, 'onRetry'>) => void;
  showWarning: (message: string | string[], options?: Omit<NotificationOptions, 'onUndo' | 'onRetry'>) => void;
  showInfo: (message: string | string[], options?: Omit<NotificationOptions, 'onUndo' | 'onRetry'>) => void;
  showSuccessWithUndo: (message: string, onUndo: () => void, options?: Omit<NotificationOptions, 'onUndo'>) => void;
  showErrorWithRetry: (message: string, onRetry: () => void, options?: Omit<NotificationOptions, 'onRetry'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  
  const defaultDuration = 5000;

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback(
    (
      message: string | string[],
      type: NotificationType = 'info',
      options: NotificationOptions = {}
    ) => {
      const id = uuidv4();
      const { 
        title, 
        duration = defaultDuration,
        onUndo,
        onView,
        onRetry,
        actions = []
      } = options;

      // Add action buttons based on provided callbacks
      const notificationActions = [...actions];
      
      if (onUndo) {
        notificationActions.push({
          label: 'Deshacer',
          onClick: onUndo
        });
      }
      
      if (onView) {
        notificationActions.push({
          label: 'Ver',
          onClick: onView
        });
      }
      
      if (onRetry) {
        notificationActions.push({
          label: 'Reintentar',
          onClick: onRetry
        });
      }

      setNotifications((prev) => [
        ...prev,
        {
          id,
          message,
          type,
          title,
          duration,
          actions: notificationActions.length > 0 ? notificationActions : undefined,
        },
      ]);

      // Auto-dismiss after duration
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    },
    [removeNotification]
  );

  const showError = useCallback(
    (message: string | string[], options: Omit<NotificationOptions, 'onUndo' | 'onView'> = {}) => {
      showNotification(message, 'error', { 
        duration: 7000, 
        ...options 
      });
    },
    [showNotification]
  );

  const showSuccess = useCallback(
    (message: string | string[], options: Omit<NotificationOptions, 'onRetry'> = {}) => {
      showNotification(message, 'success', { 
        duration: 5000, 
        ...options 
      });
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string | string[], options: Omit<NotificationOptions, 'onUndo' | 'onRetry'> = {}) => {
      showNotification(message, 'warning', { 
        duration: 6000, 
        ...options 
      });
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string | string[], options: Omit<NotificationOptions, 'onUndo' | 'onRetry'> = {}) => {
      showNotification(message, 'info', { 
        duration: 5000, 
        ...options 
      });
    },
    [showNotification]
  );
  
  const showSuccessWithUndo = useCallback(
    (message: string, onUndo: () => void, options: Omit<NotificationOptions, 'onUndo'> = {}) => {
      showSuccess(message, {
        ...options,
        onUndo,
        duration: options.duration || 10000, // Longer duration for undo actions
      });
    },
    [showSuccess]
  );
  
  const showErrorWithRetry = useCallback(
    (message: string, onRetry: () => void, options: Omit<NotificationOptions, 'onRetry'> = {}) => {
      showError(message, {
        ...options,
        onRetry,
        duration: options.duration || 10000, // Longer duration for retry actions
      });
    },
    [showError]
  );

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showError,
        showSuccess,
        showWarning,
        showInfo,
        showSuccessWithUndo,
        showErrorWithRetry,
      }}
    >
      {children}
      <div className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col space-y-2 overflow-y-auto p-4 sm:right-4 sm:bottom-4 sm:w-96 sm:p-0">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            title={notification.title}
            onClose={() => removeNotification(notification.id)}
            duration={notification.duration}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
