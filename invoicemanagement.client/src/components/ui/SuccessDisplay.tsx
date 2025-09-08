import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessDisplayProps {
  title: string;
  message: string;
  onClose?: () => void;
}

export const SuccessDisplay: React.FC<SuccessDisplayProps> = ({ 
  title, 
  message, 
  onClose 
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full animate-in slide-in-from-right-2 duration-300">
      <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium mb-1">{title}</h3>
            <p className="text-sm opacity-90 leading-relaxed">{message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-full p-1 text-green-400 hover:text-green-600 hover:bg-green-100 transition-colors"
              aria-label="Close success message"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

