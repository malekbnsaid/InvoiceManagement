import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { InvoiceStatus } from '../../types/enums';
import { SimpleInvoiceStatusService } from '../../services/simpleInvoiceStatusService';

interface SimpleInvoiceWorkflowProps {
  currentStatus: InvoiceStatus;
  className?: string;
}

export function SimpleInvoiceWorkflow({ currentStatus, className }: SimpleInvoiceWorkflowProps) {
  const workflowSteps = [
    InvoiceStatus.Submitted,
    InvoiceStatus.UnderReview,
    InvoiceStatus.Approved,
    InvoiceStatus.InProgress,
    InvoiceStatus.Completed
  ];

  const getStepStatus = (stepStatus: InvoiceStatus) => {
    const currentInfo = SimpleInvoiceStatusService.getStatusInfo(currentStatus);
    const stepInfo = SimpleInvoiceStatusService.getStatusInfo(stepStatus);
    
    if (stepStatus === currentStatus) {
      return 'current';
    }
    
    // Check if this step is completed
    const stepOrder = workflowSteps.indexOf(stepStatus);
    const currentOrder = workflowSteps.indexOf(currentStatus);
    
    if (stepOrder < currentOrder) {
      return 'completed';
    }
    
    if (currentStatus === InvoiceStatus.Rejected && stepStatus === InvoiceStatus.Submitted) {
      return 'current';
    }
    
    if (currentStatus === InvoiceStatus.Cancelled) {
      return 'cancelled';
    }
    
    return 'pending';
  };

  const getStepIcon = (stepStatus: InvoiceStatus, status: string) => {
    const stepInfo = SimpleInvoiceStatusService.getStatusInfo(stepStatus);
    
    if (status === 'completed') {
      return '✅';
    }
    if (status === 'current') {
      return stepInfo.icon;
    }
    if (status === 'cancelled') {
      return '🚫';
    }
    return '⭕';
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'current':
        return 'text-blue-600';
      case 'cancelled':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          Invoice Workflow
        </CardTitle>
        <CardDescription>
          Current status: <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${SimpleInvoiceStatusService.getStatusInfo(currentStatus).color}`}>
            {SimpleInvoiceStatusService.getStatusInfo(currentStatus).label}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {workflowSteps.map((step, index) => {
            const status = getStepStatus(step);
            const stepInfo = SimpleInvoiceStatusService.getStatusInfo(step);
            const icon = getStepIcon(step, status);
            const color = getStepColor(status);
            
            return (
              <div key={step} className="flex items-center gap-3">
                <div className={`text-2xl ${color}`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${color}`}>
                      {stepInfo.label}
                    </span>
                    {status === 'current' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-blue-600 border border-blue-600">
                        Current
                      </span>
                    )}
                    {status === 'completed' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-green-600 border border-green-600">
                        Done
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${color}`}>
                    {stepInfo.description}
                  </p>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className={`w-px h-8 ${
                    status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Special statuses */}
        {(currentStatus === InvoiceStatus.Rejected || currentStatus === InvoiceStatus.Cancelled) && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {currentStatus === InvoiceStatus.Rejected ? '❌' : '🚫'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">
                    {SimpleInvoiceStatusService.getStatusInfo(currentStatus).label}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-600 border border-gray-600">
                    {currentStatus === InvoiceStatus.Rejected ? 'Needs Fix' : 'Stopped'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {SimpleInvoiceStatusService.getStatusInfo(currentStatus).description}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
