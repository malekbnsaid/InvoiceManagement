import React from 'react';
import { AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ValidationWarningProps {
  warnings: string[];
  type?: 'warning' | 'info' | 'error';
  className?: string;
}

export const ValidationWarning: React.FC<ValidationWarningProps> = ({ 
  warnings, 
  type = 'warning',
  className = '' 
}) => {
  if (!warnings || warnings.length === 0) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'warning':
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'warning':
      default:
        return 'bg-amber-50 border-amber-200 text-amber-700';
    }
  };

  return (
    <div className={`p-3 rounded-md border ${getStyles()} ${className}`}>
      <div className="flex items-start gap-2">
        {getIcon()}
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-1">
            {type === 'error' ? 'Validation Error' : 
             type === 'info' ? 'Information' : 'Validation Warning'}
          </h4>
          <ul className="text-sm space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-xs mt-1">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ValidationWarning;
