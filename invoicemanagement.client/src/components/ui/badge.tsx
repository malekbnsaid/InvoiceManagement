import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-primary-100 text-primary-800 dark:bg-primary-700 dark:text-primary-100',
      secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
      outline: 'border border-gray-200 text-gray-800 dark:border-gray-700 dark:text-gray-100',
      success: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100',
      danger: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100',
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