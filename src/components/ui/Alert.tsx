import { ReactNode } from 'react';
import { 
  FaTimesCircle, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaInfoCircle,
  FaUndo,
  FaTrash,
  FaEye
} from 'react-icons/fa';

export type AlertVariant = 'error' | 'success' | 'warning' | 'info';

export interface AlertAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
}

interface AlertProps {
  variant?: AlertVariant;
  title: string;
  children: ReactNode;
  className?: string;
  actions?: AlertAction[];
  onDismiss?: () => void;
}

const variantStyles = {
  error: {
    bg: 'bg-red-50',
    icon: <FaTimesCircle className="h-5 w-5 text-red-400" />,
    title: 'text-red-800',
    text: 'text-red-700',
    button: {
      bg: 'bg-red-50',
      hover: 'hover:bg-red-100',
      focus: 'focus:ring-red-600 focus:ring-offset-red-50',
      text: 'text-red-800',
    },
  },
  success: {
    bg: 'bg-green-50',
    icon: <FaCheckCircle className="h-5 w-5 text-green-400" />,
    title: 'text-green-800',
    text: 'text-green-700',
    button: {
      bg: 'bg-green-50',
      hover: 'hover:bg-green-100',
      focus: 'focus:ring-green-600 focus:ring-offset-green-50',
      text: 'text-green-800',
    },
  },
  warning: {
    bg: 'bg-yellow-50',
    icon: <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />,
    title: 'text-yellow-800',
    text: 'text-yellow-700',
    button: {
      bg: 'bg-yellow-50',
      hover: 'hover:bg-yellow-100',
      focus: 'focus:ring-yellow-600 focus:ring-offset-yellow-50',
      text: 'text-yellow-800',
    },
  },
  info: {
    bg: 'bg-blue-50',
    icon: <FaInfoCircle className="h-5 w-5 text-blue-400" />,
    title: 'text-blue-800',
    text: 'text-blue-700',
    button: {
      bg: 'bg-blue-50',
      hover: 'hover:bg-blue-100',
      focus: 'focus:ring-blue-600 focus:ring-offset-blue-50',
      text: 'text-blue-800',
    },
  },
};

export function Alert({ 
  variant = 'info', 
  title, 
  children, 
  className = '',
  actions = [],
  onDismiss
}: AlertProps) {
  const style = variantStyles[variant];
  const hasActions = actions.length > 0 || onDismiss;

  return (
    <div className={`rounded-md p-4 ${style.bg} ${className}`}>
      <div className="flex">
        <div className="shrink-0">
          {style.icon}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${style.title}`}>{title}</h3>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="ml-3 rounded-md p-1 -mr-1 hover:bg-opacity-30 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-gray-400"
              >
                <span className="sr-only">Cerrar</span>
                <FaTimesCircle className="h-4 w-4 text-gray-500" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className={`mt-2 text-sm ${style.text}`}>
            {children}
          </div>
          
          {hasActions && (
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex flex-wrap gap-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={action.onClick}
                    className={`inline-flex items-center rounded-md px-2 py-1.5 text-sm font-medium ${
                      style.button.bg
                    } ${
                      style.button.text
                    } ${
                      style.button.hover
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      style.button.focus
                    }`}
                  >
                    {action.icon && <span className="mr-1.5">{action.icon}</span>}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AlertList({ 
  messages, 
  variant = 'error',
  title,
  onDismiss
}: { 
  messages: string[]; 
  variant?: AlertVariant;
  title?: string;
  onDismiss?: () => void;
}) {
  if (messages.length === 0) return null;

  return (
    <Alert 
      variant={variant} 
      title={title || `There ${messages.length === 1 ? 'was' : 'were'} ${messages.length} ${messages.length === 1 ? 'error' : 'errors'} with your submission`}
      onDismiss={onDismiss}
    >
      <ul role="list" className="list-disc space-y-1 pl-5">
        {messages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
    </Alert>
  );
}

// Helper components for common alerts
export function SuccessAlert({ 
  title, 
  message, 
  onDismiss,
  onView,
  onUndo,
  actions: propActions = [],
  className = '' 
}: { 
  title: string; 
  message: string | ReactNode;
  onDismiss?: () => void;
  onView?: () => void;
  onUndo?: () => void;
  actions?: AlertAction[];
  className?: string;
}) {
  const defaultActions: AlertAction[] = [];
  
  if (onUndo) {
    defaultActions.push({
      label: 'Deshacer',
      onClick: onUndo,
      icon: <FaUndo className="mr-1.5 h-3.5 w-3.5" />
    });
  }
  
  if (onView) {
    defaultActions.push({
      label: 'Ver',
      onClick: onView,
      icon: <FaEye className="mr-1.5 h-3.5 w-3.5" />
    });
  }

  // Combine default actions with provided actions
  const actions = [...defaultActions, ...propActions];

  return (
    <Alert 
      variant="success" 
      title={title}
      onDismiss={onDismiss}
      actions={actions}
      className={className}
    >
      {message}
    </Alert>
  );
}

export function ErrorAlert({ 
  title, 
  message, 
  onDismiss,
  onRetry,
  actions: propActions = [],
  className = '' 
}: { 
  title: string; 
  message: string | ReactNode;
  onDismiss?: () => void;
  onRetry?: () => void;
  actions?: AlertAction[];
  className?: string;
}) {
  const defaultActions: AlertAction[] = [];
  
  if (onRetry) {
    defaultActions.push({
      label: 'Reintentar',
      onClick: onRetry,
      variant: 'primary' as const
    });
  }

  // Combine default actions with provided actions
  const actions = [...defaultActions, ...propActions];

  return (
    <Alert 
      variant="error" 
      title={title}
      onDismiss={onDismiss}
      actions={actions}
      className={className}
    >
      {message}
    </Alert>
  );
}
