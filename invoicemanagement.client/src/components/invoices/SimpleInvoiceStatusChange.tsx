import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { InvoiceStatus } from '../../types/enums';
import { SimpleInvoiceStatusService } from '../../services/simpleInvoiceStatusService';
import { InvoiceStatusApi } from '../../services/api/invoiceStatusApi';
import { useAuth } from '../../context/AuthContext';

interface SimpleInvoiceStatusChangeProps {
  invoiceId: number;
  currentStatus: InvoiceStatus;
  onStatusChange: (newStatus: InvoiceStatus) => Promise<void>;
  disabled?: boolean;
}

export function SimpleInvoiceStatusChange({ 
  invoiceId,
  currentStatus, 
  onStatusChange, 
  disabled = false 
}: SimpleInvoiceStatusChangeProps) {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | ''>('');
  const [isChanging, setIsChanging] = useState(false);

  const validTransitions = SimpleInvoiceStatusService.getValidTransitions(currentStatus);
  const currentStatusInfo = SimpleInvoiceStatusService.getStatusInfo(currentStatus);

  const handleStatusChange = async () => {
    if (!selectedStatus || !user) return;

    setIsChanging(true);
    try {
      // Call API to change status
      await InvoiceStatusApi.changeStatus(invoiceId, {
        status: selectedStatus as InvoiceStatus,
        changedBy: user.id || user.email || 'unknown',
        reason: undefined // Simple workflow doesn't require reasons
      });

      // Update local state
      await onStatusChange(selectedStatus as InvoiceStatus);
      setSelectedStatus('');
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Failed to change status. Please try again.');
    } finally {
      setIsChanging(false);
    }
  };

  if (validTransitions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{currentStatusInfo.icon}</span>
            Invoice Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${currentStatusInfo.color}`}>
              {currentStatusInfo.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {currentStatusInfo.description}
          </p>
          {SimpleInvoiceStatusService.isFinal(currentStatus) && (
            <p className="text-sm text-green-600 mt-2">
              ✅ This invoice is complete and cannot be changed further.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{currentStatusInfo.icon}</span>
          Change Status
        </CardTitle>
        <CardDescription>
          Current: <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${currentStatusInfo.color}`}>
            {currentStatusInfo.label}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="status-select" className="text-sm font-medium">New Status</label>
          <Select 
            value={selectedStatus} 
            onValueChange={(value) => setSelectedStatus(value as InvoiceStatus)}
            disabled={disabled || isChanging}
          >
            <SelectTrigger id="status-select">
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {validTransitions.map((status) => {
                const statusInfo = SimpleInvoiceStatusService.getStatusInfo(status);
                return (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <span>{statusInfo.icon}</span>
                      <span>{statusInfo.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedStatus && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Next Status:</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${SimpleInvoiceStatusService.getStatusInfo(selectedStatus as InvoiceStatus).color}`}>
                {SimpleInvoiceStatusService.getStatusInfo(selectedStatus as InvoiceStatus).label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {SimpleInvoiceStatusService.getStatusInfo(selectedStatus as InvoiceStatus).description}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleStatusChange}
            disabled={disabled || isChanging || !selectedStatus}
            className="flex-1"
          >
            {isChanging ? 'Changing...' : 'Change Status'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setSelectedStatus('')}
            disabled={disabled || isChanging}
          >
            Cancel
          </Button>
        </div>

        {/* Next Steps */}
        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Next Steps:</p>
          <ul className="list-disc list-inside space-y-1">
            {SimpleInvoiceStatusService.getNextSteps(currentStatus).map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
