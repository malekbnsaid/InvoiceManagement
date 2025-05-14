import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

type CheckboxProps = {
  label?: string;
  className?: string;
  id?: string;
  type?: 'checkbox';
  checked?: boolean;
  onChange?: (event: any) => void;
  [key: string]: any;
};

const CheckboxComponent = (
  { className, label, ...props }: CheckboxProps,
  ref: any
) => {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          'h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-primary-600',
          className
        )}
        {...props}
      />
      {label && (
        <label
          htmlFor={props.id}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
    </div>
  );
};

const Checkbox = forwardRef(CheckboxComponent);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
