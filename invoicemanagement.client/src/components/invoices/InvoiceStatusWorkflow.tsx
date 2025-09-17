import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle, FileText, DollarSign } from 'lucide-react';
import { InvoiceStatus } from '../../types/enums';
import { InvoiceStatusService } from '../../services/invoiceStatusService';

interface InvoiceStatusWorkflowProps {
  currentStatus: InvoiceStatus;
  className?: string;
}

export function InvoiceStatusWorkflow({ currentStatus, className }: InvoiceStatusWorkflowProps) {
  const workflowSteps = [
    {
      status: InvoiceStatus.Draft,
      title: 'Draft',
      description: 'Invoice is being prepared',
      icon: FileText,
      color: 'bg-gray-100 text-gray-800',
      completed: false
    },
    {
      status: InvoiceStatus.PendingApproval,
      title: 'Pending Approval',
      description: 'Waiting for section head approval',
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
      completed: false
    },
    {
      status: InvoiceStatus.Approved,
      title: 'Approved',
      description: 'Approved and ready for processing',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
      completed: false
    },
    {
      status: InvoiceStatus.Processing,
      title: 'Processing',
      description: 'Being processed by procurement',
      icon: Clock,
      color: 'bg-blue-100 text-blue-800',
      completed: false
    },
    {
      status: InvoiceStatus.Paid,
      title: 'Paid',
      description: 'Payment completed',
      icon: DollarSign,
      color: 'bg-green-100 text-green-800',
      completed: false
    }
  ];

  const getStatusPriority = (status: InvoiceStatus): number => {
    const priorities = {
      [InvoiceStatus.Draft]: 1,
      [InvoiceStatus.PendingApproval]: 2,
      [InvoiceStatus.Approved]: 3,
      [InvoiceStatus.Processing]: 4,
      [InvoiceStatus.Paid]: 5,
      [InvoiceStatus.Rejected]: 0,
      [InvoiceStatus.Cancelled]: 0,
      [InvoiceStatus.OnHold]: 3.5,
      [InvoiceStatus.Overdue]: 4.5,
      [InvoiceStatus.UnderReview]: 3.2,
      [InvoiceStatus.SentToFinance]: 3.8,
      [InvoiceStatus.Returned]: 1.5
    };
    return priorities[status] || 0;
  };

  const currentPriority = getStatusPriority(currentStatus);
  const isCompleted = (stepStatus: InvoiceStatus): boolean => {
    const stepPriority = getStatusPriority(stepStatus);
    return stepPriority > 0 && stepPriority < currentPriority;
  };

  const isCurrent = (stepStatus: InvoiceStatus): boolean => {
    return stepStatus === currentStatus;
  };

  const isError = (stepStatus: InvoiceStatus): boolean => {
    return [InvoiceStatus.Rejected, InvoiceStatus.Cancelled].includes(stepStatus);
  };

  const getStepIcon = (step: any, isStepCompleted: boolean, isStepCurrent: boolean, isStepError: boolean) => {
    const IconComponent = step.icon;
    
    if (isStepError) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    
    if (isStepCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    
    if (isStepCurrent) {
      return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
    
    return <IconComponent className="h-5 w-5 text-gray-400" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Invoice Workflow
        </CardTitle>
        <CardDescription>
          Current status: <Badge className={InvoiceStatusService.getStatusDisplayInfo(currentStatus).color}>
            {InvoiceStatusService.getStatusDisplayInfo(currentStatus).label}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workflowSteps.map((step, index) => {
            const isStepCompleted = isCompleted(step.status);
            const isStepCurrent = isCurrent(step.status);
            const isStepError = isError(step.status);
            
            return (
              <div key={step.status} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getStepIcon(step, isStepCompleted, isStepCurrent, isStepError)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-sm font-medium ${
                      isStepCompleted ? 'text-green-700' : 
                      isStepCurrent ? 'text-blue-700' : 
                      isStepError ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {step.title}
                    </h4>
                    {isStepCurrent && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Current
                      </Badge>
                    )}
                    {isStepCompleted && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Completed
                      </Badge>
                    )}
                    {isStepError && (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        Error
                      </Badge>
                    )}
                  </div>
                  <p className={`text-xs ${
                    isStepCompleted ? 'text-green-600' : 
                    isStepCurrent ? 'text-blue-600' : 
                    isStepError ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {step.description}
                  </p>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className={`w-px h-8 ml-2 ${
                    isStepCompleted ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Special statuses that don't follow the main workflow */}
        {[InvoiceStatus.Rejected, InvoiceStatus.Cancelled, InvoiceStatus.OnHold, InvoiceStatus.Overdue].includes(currentStatus) && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              {currentStatus === InvoiceStatus.Rejected && <XCircle className="h-4 w-4 text-red-600" />}
              {currentStatus === InvoiceStatus.Cancelled && <XCircle className="h-4 w-4 text-gray-600" />}
              {currentStatus === InvoiceStatus.OnHold && <AlertCircle className="h-4 w-4 text-orange-600" />}
              {currentStatus === InvoiceStatus.Overdue && <AlertCircle className="h-4 w-4 text-red-600" />}
              <span className="text-sm font-medium text-gray-700">
                {InvoiceStatusService.getStatusDisplayInfo(currentStatus).label}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {InvoiceStatusService.getStatusDisplayInfo(currentStatus).description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
