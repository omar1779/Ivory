'use client';

import { useCallback, useEffect, useState } from 'react';
import { 
  Alert, 
  type AlertVariant, 
  SuccessAlert,
  ErrorAlert 
} from './Alert';

type NotificationType = AlertVariant;

interface NotificationProps {
  message: string | string[] | React.ReactNode;
  type?: NotificationType;
  onClose: () => void;
  duration?: number;
  title?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  onUndo?: () => void;
  onView?: () => void;
  onRetry?: () => void;
}

export function Notification({ 
  message, 
  type = 'info', 
  onClose, 
  duration = 5000, 
  title,
  actions = [],
  onUndo,
  onView,
  onRetry
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to finish
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  if (!isVisible) return null;

  const messages = Array.isArray(message) ? message : [message];
  const notificationTitle = title || (type === 'error' && messages.length > 1 
    ? `There ${messages.length === 1 ? 'was' : 'were'} ${messages.length} ${messages.length === 1 ? 'error' : 'errors'}` 
    : '');

  // Use specialized alert components when available
  if (type === 'success') {
    const messageContent = messages.length === 1 ? messages[0] : (
      <ul role="list" className="list-disc space-y-1 pl-5">
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    );

    return (
      <div className={`fixed bottom-4 right-4 z-50 w-full max-w-md transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}>
        <SuccessAlert
          title={notificationTitle}
          message={messageContent}
          onDismiss={handleClose}
          onView={onView}
          onUndo={onUndo}
          actions={actions}
        />
      </div>
    );
  }

  if (type === 'error') {
    const messageContent = messages.length === 1 ? messages[0] : (
      <ul role="list" className="list-disc space-y-1 pl-5">
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    );

    return (
      <div className={`fixed bottom-4 right-4 z-50 w-full max-w-md transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}>
        <ErrorAlert
          title={notificationTitle}
          message={messageContent}
          onDismiss={handleClose}
          onRetry={onRetry}
          actions={actions}
        />
      </div>
    );
  }

  // Default alert for other types
  return (
    <div className={`fixed bottom-4 right-4 z-50 w-full max-w-md transition-all duration-300 ease-in-out ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
    }`}>
      <Alert 
        variant={type} 
        title={notificationTitle}
        onDismiss={handleClose}
        actions={actions}
      >
        {messages.length === 1 ? (
          <p>{messages[0]}</p>
        ) : (
          <ul role="list" className="list-disc space-y-1 pl-5">
            {messages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        )}
      </Alert>
    </div>
  );
}

// Helper function to show a success notification with undo action
export const showSuccessWithUndo = (
  message: string,
  onUndo: () => void,
  options: { title?: string; duration?: number } = {}
) => {
  return {
    message,
    type: 'success' as const,
    onUndo,
    ...options
  };
};

// Helper function to show an error notification with retry action
export const showErrorWithRetry = (
  message: string,
  onRetry: () => void,
  options: { title?: string; duration?: number } = {}
) => {
  return {
    message,
    type: 'error' as const,
    onRetry,
    ...options
  };
};
