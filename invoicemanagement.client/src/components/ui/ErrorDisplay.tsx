import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorDisplayProps {
  title: string;
  message: string;
  onClose?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  title, 
  message, 
  onClose, 
  variant = 'error' 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          container: 'bg-amber-50 border-amber-200 text-amber-800',
          icon: 'text-amber-500',
          closeButton: 'text-amber-400 hover:text-amber-600 hover:bg-amber-100'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-500',
          closeButton: 'text-blue-400 hover:text-blue-600 hover:bg-blue-100'
        };
      default: // error
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-500',
          closeButton: 'text-red-400 hover:text-red-600 hover:bg-red-100'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full animate-in slide-in-from-right-2 duration-300`}>
      <div className={`rounded-lg border p-4 shadow-lg ${styles.container}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertCircle className={`h-5 w-5 ${styles.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium mb-1">{title}</h3>
            <p className="text-sm opacity-90 leading-relaxed">{message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`flex-shrink-0 rounded-full p-1 transition-colors ${styles.closeButton}`}
              aria-label="Close error"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

