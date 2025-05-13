import { forwardRef, HTMLAttributes, ReactNode, useState } from 'react';
import { cn } from '../../utils/cn';

interface PopoverProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const Popover = ({ children, className, ...props }: PopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('relative inline-block', className)} {...props}>
      {children}
    </div>
  );
};

interface PopoverTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  onClick?: () => void;
}

const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ children, className, onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn('', className)}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);

PopoverTrigger.displayName = 'PopoverTrigger';

interface PopoverContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
}

const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ children, className, align = 'center', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-4 shadow-md animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 dark:border-gray-700 dark:bg-gray-800',
          {
            'left-0': align === 'start',
            'left-1/2 -translate-x-1/2': align === 'center',
            'right-0': align === 'end',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent }; 