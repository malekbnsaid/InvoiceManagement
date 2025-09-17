import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { InvoiceStatus } from '../../types/enums';
import { InvoiceStatusService } from '../../services/invoiceStatusService';
import { useAuth } from '../../context/AuthContext';

interface InvoiceStatusChangeProps {
  currentStatus: InvoiceStatus;
  invoiceId: number;
  onStatusChange: (newStatus: InvoiceStatus, reason?: string, comment?: string) => Promise<void>;
  disabled?: boolean;
}

export function InvoiceStatusChange({ 
  currentStatus, 
  invoiceId, 
  onStatusChange, 
  disabled = false 
}: InvoiceStatusChangeProps) {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | ''>('');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const userRole = user?.role || 'User';
  const validTransitions = InvoiceStatusService.getValidTransitions(currentStatus, userRole);
  const currentStatusInfo = InvoiceStatusService.getStatusDisplayInfo(currentStatus);

  const handleStatusChange = async () => {
    if (!selectedStatus) return;

    const requirements = InvoiceStatusService.getTransitionRequirements(
      currentStatus, 
      selectedStatus as InvoiceStatus, 
      userRole
    );

    if (requirements.requiresReason && !reason.trim()) {
      alert('Reason is required for this status change');
      return;
    }

    if (requirements.requiresComment && !comment.trim()) {
      alert('Comment is required for this status change');
      return;
    }

    setIsChanging(true);
    try {
      await onStatusChange(
        selectedStatus as InvoiceStatus,
        requirements.requiresReason ? reason : undefined,
        requirements.requiresComment ? comment : undefined
      );
      
      // Reset form
      setSelectedStatus('');
      setReason('');
      setComment('');
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Failed to change status. Please try again.');
    } finally {
      setIsChanging(false);
    }
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.Approved:
      case InvoiceStatus.Paid:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case InvoiceStatus.Rejected:
      case InvoiceStatus.Cancelled:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case InvoiceStatus.PendingApproval:
      case InvoiceStatus.Processing:
        return <Clock className="h-4 w-4 text-blue-600" />;
      case InvoiceStatus.Overdue:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (validTransitions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(currentStatus)}
            Status Management
          </CardTitle>
          <CardDescription>
            Current status: <Badge className={currentStatusInfo.color}>{currentStatusInfo.label}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No status changes available for your role at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(currentStatus)}
          Change Status
        </CardTitle>
        <CardDescription>
          Current status: <Badge className={currentStatusInfo.color}>{currentStatusInfo.label}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="status-select">New Status</Label>
          <Select 
            value={selectedStatus} 
            onValueChange={(value) => setSelectedStatus(value as InvoiceStatus)}
            disabled={disabled || isChanging}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {validTransitions.map((status) => {
                const statusInfo = InvoiceStatusService.getStatusDisplayInfo(status);
                return (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span>{statusInfo.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedStatus && (
          <>
            {InvoiceStatusService.getTransitionRequirements(
              currentStatus, 
              selectedStatus as InvoiceStatus, 
              userRole
            ).requiresReason && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for status change..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={disabled || isChanging}
                  rows={3}
                />
              </div>
            )}

            {InvoiceStatusService.getTransitionRequirements(
              currentStatus, 
              selectedStatus as InvoiceStatus, 
              userRole
            ).requiresComment && (
              <div className="space-y-2">
                <Label htmlFor="comment">Comment *</Label>
                <Textarea
                  id="comment"
                  placeholder="Enter additional comments..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={disabled || isChanging}
                  rows={3}
                />
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
                onClick={() => {
                  setSelectedStatus('');
                  setReason('');
                  setComment('');
                }}
                disabled={disabled || isChanging}
              >
                Cancel
              </Button>
            </div>
          </>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Current Status:</strong> {currentStatusInfo.description}</p>
          {selectedStatus && (
            <p><strong>New Status:</strong> {InvoiceStatusService.getStatusDisplayInfo(selectedStatus as InvoiceStatus).description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
