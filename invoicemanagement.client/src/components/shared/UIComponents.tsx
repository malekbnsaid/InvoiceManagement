import React from 'react';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/utils';

// Consistent status badge styling
export const StatusBadge = ({ status, className }: { status: string; className?: string }) => {
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-emerald-100 text-emerald-800',
      active: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800'
    };

    return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Badge className={cn(getStatusColor(status), className)}>
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </Badge>
  );
};

// Consistent date formatting
export const FormattedDate = ({ date, includeTime = false }: { date: string | Date; includeTime?: boolean }) => {
  const formatPattern = includeTime ? 'MMM d, yyyy HH:mm' : 'MMM d, yyyy';
  return (
    <span>{format(new Date(date), formatPattern)}</span>
  );
};

// Consistent currency formatting
export const FormattedCurrency = ({ 
  amount, 
  currency = 'USD',
  className
}: { 
  amount: number; 
  currency?: string;
  className?: string;
}) => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);

  return <span className={className}>{formatted}</span>;
};

// Consistent tooltip
export const InfoTooltip = ({ content, children }: { content: string; children: React.ReactNode }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Consistent loading state
export const LoadingSpinner = ({ className }: { className?: string }) => {
  return (
    <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-primary h-5 w-5', className)} />
  );
};

// Consistent empty state
export const EmptyState = ({ 
  title, 
  message, 
  icon: Icon,
  action
}: { 
  title: string; 
  message: string;
  icon?: React.ComponentType<any>;
  action?: React.ReactNode;
}) => {
  return (
    <div className="text-center py-12">
      {Icon && <Icon className="mx-auto h-12 w-12 text-gray-400" />}
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

// Consistent breadcrumb
export const Breadcrumb = ({ items }: { items: { label: string; href?: string }[] }) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gray-400">/</span>}
            {item.href ? (
              <a href={item.href} className="text-sm text-gray-500 hover:text-gray-700">
                {item.label}
              </a>
            ) : (
              <span className="text-sm text-gray-900">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Consistent section header
export const SectionHeader = ({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

// Consistent filter button
export const FilterButton = ({
  isActive,
  onClick,
  children
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-md',
        isActive
          ? 'bg-primary text-white'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
      )}
    >
      {children}
    </button>
  );
}; 