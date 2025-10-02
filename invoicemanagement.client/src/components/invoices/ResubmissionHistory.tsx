import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  History, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  Eye,
  Download
} from 'lucide-react';
import { InvoiceStatus } from '../../types/enums';
import { statusHistoryApi, StatusHistory } from '../../services/api/statusHistoryApi';
import { useQuery } from '@tanstack/react-query';

interface ResubmissionRecord {
  id: number;
  invoiceId: number;
  originalStatus: InvoiceStatus;
  resubmissionReason: string;
  resubmittedBy: string;
  resubmittedAt: string;
  currentStatus: InvoiceStatus;
  statusChanges: StatusChange[];
}

interface StatusChange {
  id: number;
  fromStatus: InvoiceStatus;
  toStatus: InvoiceStatus;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

interface ResubmissionHistoryProps {
  invoiceId: number;
  currentStatus: InvoiceStatus;
  className?: string;
}

export function ResubmissionHistory({ 
  invoiceId,
  currentStatus,
  className 
}: ResubmissionHistoryProps) {
  const [selectedRecord, setSelectedRecord] = useState<ResubmissionRecord | null>(null);

  // Helper function to create resubmission record from status history
  const createResubmissionRecord = (cycle: StatusHistory[], invoiceId: number): ResubmissionRecord => {
    const firstChange = cycle[0];
    const lastChange = cycle[cycle.length - 1];
    
    // Determine if this is a resubmission or initial submission
    const isResubmission = firstChange.previousStatus === InvoiceStatus.Rejected || firstChange.previousStatus === InvoiceStatus.Cancelled;
    
    return {
      id: firstChange.id,
      invoiceId,
      originalStatus: firstChange.previousStatus,
      resubmissionReason: isResubmission 
        ? (firstChange.comments || 'Resubmitted')
        : (firstChange.comments || 'Initial submission'),
      resubmittedBy: firstChange.changedBy,
      resubmittedAt: firstChange.changeDate,
      currentStatus: lastChange.newStatus,
      statusChanges: cycle.map(change => ({
        id: change.id,
        fromStatus: change.previousStatus,
        toStatus: change.newStatus,
        changedBy: change.changedBy,
        changedAt: change.changeDate,
        reason: change.comments || 'Status changed'
      }))
    };
  };

  // Fetch status history using React Query
  const { data: statusHistory = [], isLoading, error } = useQuery({
    queryKey: ['invoice-status-history', invoiceId],
    queryFn: () => statusHistoryApi.getStatusHistory(invoiceId),
    enabled: !!invoiceId,
  });

  // Convert status history to resubmission records
  const resubmissions = React.useMemo(() => {
    if (!statusHistory || statusHistory.length === 0) return [];
    
    // Group status changes by resubmission cycles
    const resubmissionCycles: ResubmissionRecord[] = [];
    let currentCycle: StatusHistory[] = [];
    
    for (let i = 0; i < statusHistory.length; i++) {
      const history = statusHistory[i];
      
      // Start a new cycle if:
      // 1. This is a resubmission (from Rejected/Cancelled to Submitted)
      // 2. This is the first status change (initial submission)
      // 3. This is a rejection that starts a new cycle
      const isResubmission = history.previousStatus === InvoiceStatus.Rejected || history.previousStatus === InvoiceStatus.Cancelled;
      const isInitialSubmission = i === 0;
      const isRejectionStart = history.newStatus === InvoiceStatus.Rejected && currentCycle.length === 0;
      
      if (isResubmission || isInitialSubmission || isRejectionStart) {
        if (currentCycle.length > 0) {
          resubmissionCycles.push(createResubmissionRecord(currentCycle, invoiceId));
        }
        currentCycle = [history];
      } else {
        currentCycle.push(history);
      }
    }
    
    // Add the last cycle
    if (currentCycle.length > 0) {
      resubmissionCycles.push(createResubmissionRecord(currentCycle, invoiceId));
    }
    
    return resubmissionCycles;
  }, [statusHistory, invoiceId, createResubmissionRecord]);

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.Submitted:
        return 'bg-blue-100 text-blue-800';
      case InvoiceStatus.UnderReview:
        return 'bg-yellow-100 text-yellow-800';
      case InvoiceStatus.Approved:
        return 'bg-emerald-100 text-emerald-800';
      case InvoiceStatus.InProgress:
        return 'bg-purple-100 text-purple-800';
      case InvoiceStatus.PMOReview:
        return 'bg-amber-100 text-amber-800';
      case InvoiceStatus.Completed:
        return 'bg-green-100 text-green-800';
      case InvoiceStatus.Rejected:
        return 'bg-red-100 text-red-800';
      case InvoiceStatus.Cancelled:
        return 'bg-gray-100 text-gray-800';
      case InvoiceStatus.OnHold:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.Submitted:
        return 'Submitted';
      case InvoiceStatus.UnderReview:
        return 'Under Review';
      case InvoiceStatus.Approved:
        return 'Approved';
      case InvoiceStatus.InProgress:
        return 'In Progress';
      case InvoiceStatus.PMOReview:
        return 'PMO Review';
      case InvoiceStatus.Completed:
        return 'Completed';
      case InvoiceStatus.Rejected:
        return 'Rejected';
      case InvoiceStatus.Cancelled:
        return 'Cancelled';
      case InvoiceStatus.OnHold:
        return 'On Hold';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getResubmissionCount = () => {
    return resubmissions.length;
  };

  const getLatestResubmission = () => {
    return resubmissions.length > 0 ? resubmissions[0] : null;
  };

  const hasBeenResubmitted = () => {
    return resubmissions.length > 0;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 mx-auto text-gray-400 animate-spin mb-2" />
            <p className="text-gray-500">Loading resubmission history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-400 mb-2" />
            <p className="text-red-500">Failed to load resubmission history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasBeenResubmitted()) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-blue-600" />
          Resubmission History
        </CardTitle>
        <CardDescription>
          Track all resubmissions and status changes for this invoice.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900">Resubmission Summary</h4>
              <p className="text-sm text-blue-800">
                This invoice has been resubmitted {getResubmissionCount()} time{getResubmissionCount() !== 1 ? 's' : ''}.
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {getResubmissionCount()} Resubmission{getResubmissionCount() !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Resubmission Records */}
        <div className="space-y-4">
          {resubmissions.map((record, index) => (
            <div key={record.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Resubmission #{resubmissions.length - index}</span>
                  <Badge className={getStatusColor(record.originalStatus)}>
                    Originally {getStatusText(record.originalStatus)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(record.resubmittedAt)}
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Reason:</span>
                  <p className="text-sm text-gray-800 mt-1">{record.resubmissionReason}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Resubmitted by:</span>
                  <span className="text-sm text-gray-800 ml-1">{record.resubmittedBy}</span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Status Timeline:</h5>
                <div className="space-y-1">
                  {record.statusChanges.map((change, changeIndex) => (
                    <div key={change.id} className="flex items-center space-x-2 text-sm">
                      <div className="flex items-center space-x-1">
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(change.fromStatus)}
                        >
                          {getStatusText(change.fromStatus)}
                        </Badge>
                        <span className="text-gray-400">→</span>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(change.toStatus)}
                        >
                          {getStatusText(change.toStatus)}
                        </Badge>
                      </div>
                      <span className="text-gray-500 text-xs">
                        by {change.changedBy} at {formatDate(change.changedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Status */}
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Current Status:</span>
                  <Badge className={getStatusColor(record.currentStatus)}>
                    {getStatusText(record.currentStatus)}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedRecord(getLatestResubmission() || null)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {/* Export functionality */}}
          >
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
