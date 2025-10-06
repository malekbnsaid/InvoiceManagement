import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';
import React from 'react';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-qatar/10 text-qatar dark:bg-qatar/20 dark:text-qatar',
      secondary: 'bg-silver/10 text-silver dark:bg-silver/20 dark:text-silver',
      outline: 'border border-gray-200 text-gray-800 dark:border-gray-700 dark:text-gray-100',
      success: 'bg-success/10 text-success dark:bg-success/20 dark:text-success',
      warning: 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning',
      danger: 'bg-error/10 text-error dark:bg-error/20 dark:text-error',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge }; 