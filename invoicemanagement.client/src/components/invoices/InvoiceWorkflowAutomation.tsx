import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { InvoiceWorkflowApi, WORKFLOW_ACTIONS } from '../../services/api/invoiceWorkflowApi';
import { InvoiceStatus } from '../../types/enums';
import { SimpleInvoiceStatusService } from '../../services/simpleInvoiceStatusService';

interface InvoiceWorkflowAutomationProps {
  invoiceId: number;
  currentStatus: InvoiceStatus;
  onStatusChange: (newStatus: InvoiceStatus) => void;
  className?: string;
}

export function InvoiceWorkflowAutomation({ 
  invoiceId, 
  currentStatus, 
  onStatusChange, 
  className 
}: InvoiceWorkflowAutomationProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWorkflowAction = async (action: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      await InvoiceWorkflowApi.triggerWorkflowAction(invoiceId, action);
      
      // Determine new status based on action
      let newStatus: InvoiceStatus;
      switch (action) {
        case WORKFLOW_ACTIONS.PM_REVIEWED:
          newStatus = InvoiceStatus.UnderReview;
          break;
        case WORKFLOW_ACTIONS.HEAD_APPROVED:
          newStatus = InvoiceStatus.Approved;
          break;
        case WORKFLOW_ACTIONS.PROCUREMENT_PROCESSED:
          newStatus = InvoiceStatus.InProgress;
          break;
        case WORKFLOW_ACTIONS.EXTERNAL_SYSTEM_UPDATED:
          newStatus = InvoiceStatus.Completed;
          break;
        default:
          throw new Error('Unknown workflow action');
      }

      onStatusChange(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const getAvailableActions = () => {
    switch (currentStatus) {
      case InvoiceStatus.Submitted:
        return [
          { action: WORKFLOW_ACTIONS.PM_REVIEWED, label: 'PM Reviewed', description: 'PM has reviewed and attached documents' }
        ];
      case InvoiceStatus.UnderReview:
        return [
          { action: WORKFLOW_ACTIONS.HEAD_APPROVED, label: 'Head Approved', description: 'Head has approved the invoice' }
        ];
      case InvoiceStatus.Approved:
        return [
          { action: WORKFLOW_ACTIONS.PROCUREMENT_PROCESSED, label: 'Procurement Processed', description: 'Procurement has processed the invoice' }
        ];
      case InvoiceStatus.InProgress:
        return [
          { action: WORKFLOW_ACTIONS.EXTERNAL_SYSTEM_UPDATED, label: 'External System Updated', description: 'Data entered in external system' }
        ];
      default:
        return [];
    }
  };

  const availableActions = getAvailableActions();

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          Workflow Automation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Automatically advance the invoice through your business process:
          </p>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {availableActions.map(({ action, label, description }) => (
              <div key={action} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{label}</div>
                  <div className="text-sm text-gray-600">{description}</div>
                </div>
                <Button
                  onClick={() => handleWorkflowAction(action)}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? 'Processing...' : 'Trigger'}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Note:</strong> This will automatically:
              <ul className="mt-1 ml-4 list-disc">
                <li>Update the invoice status</li>
                <li>Send email notifications to the next person</li>
                <li>Log the action in the audit trail</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
