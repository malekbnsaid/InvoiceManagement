import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
  helperText?: string;
  variant?: 'default' | 'error' | 'success';
  options: SelectOption[];
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ 
    label, 
    error, 
    success, 
    icon, 
    helperText, 
    variant = 'default',
    className,
    id,
    options,
    placeholder,
    ...props 
  }, ref) => {
    const fieldId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    
    const getVariantStyles = () => {
      switch (variant) {
        case 'error':
          return {
            select: 'border-error focus:border-error focus:ring-error/20 bg-error/5',
            label: 'text-error',
            icon: 'text-error/60',
            helper: 'text-error/80'
          };
        case 'success':
          return {
            select: 'border-success focus:border-success focus:ring-success/20 bg-success/5',
            label: 'text-success',
            icon: 'text-success/60',
            helper: 'text-success/80'
          };
        default:
          return {
            select: 'border-gray-300 focus:border-qatar focus:ring-qatar/20 bg-white/80',
            label: 'text-gray-700',
            icon: 'text-qatar/60',
            helper: 'text-gray-500'
          };
      }
    };

    const styles = getVariantStyles();
    const hasError = !!error;
    const showSuccess = success && !hasError;

    return (
      <div className="space-y-2">
        <label 
          htmlFor={fieldId}
          className={cn(
            'block text-sm font-semibold transition-colors duration-200',
            styles.label
          )}
        >
          {label}
        </label>
        
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <div className={cn('h-5 w-5', styles.icon)}>
                {icon}
              </div>
            </div>
          )}
          
          <select
            ref={ref}
            id={fieldId}
            className={cn(
              'w-full px-4 py-3 rounded-xl shadow-sm transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'appearance-none cursor-pointer',
              icon ? 'pl-10' : 'pl-4',
              hasError ? 'pr-10' : 'pr-10', // Always space for chevron and status icon
              styles.select,
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Chevron Down Icon */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
          
          {/* Status Icons */}
          <div className="absolute inset-y-0 right-0 pr-8 flex items-center pointer-events-none">
            {hasError && (
              <AlertCircle className="h-5 w-5 text-error animate-pulse" />
            )}
            {showSuccess && (
              <CheckCircle className="h-5 w-5 text-success" />
            )}
          </div>
        </div>
        
        {/* Error Message */}
        {hasError && (
          <div className="flex items-start space-x-2 animate-in slide-in-from-top-1 duration-200">
            <AlertCircle className="h-4 w-4 text-error flex-shrink-0 mt-0.5" />
            <p className="text-sm text-error font-medium leading-relaxed">
              {error}
            </p>
          </div>
        )}
        
        {/* Helper Text */}
        {helperText && !hasError && (
          <p className={cn('text-xs leading-relaxed', styles.helper)}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
