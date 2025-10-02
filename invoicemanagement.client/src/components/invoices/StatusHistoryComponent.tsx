import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { statusHistoryApi, StatusHistory } from '../../services/api/statusHistoryApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/badge';
import { Clock, User, MessageSquare } from 'lucide-react';
import { InvoiceStatus } from '../../types/enums';

interface StatusHistoryComponentProps {
  invoiceId: number;
}

const getStatusColor = (status: InvoiceStatus): string => {
  switch (status) {
    case InvoiceStatus.Submitted:
      return 'bg-blue-500';
    case InvoiceStatus.UnderReview:
      return 'bg-yellow-500';
    case InvoiceStatus.Approved:
      return 'bg-emerald-500';
    case InvoiceStatus.InProgress:
      return 'bg-purple-500';
    case InvoiceStatus.PMOReview:
      return 'bg-orange-500';
    case InvoiceStatus.Completed:
      return 'bg-green-600';
    case InvoiceStatus.Rejected:
      return 'bg-red-500';
    case InvoiceStatus.Cancelled:
      return 'bg-gray-500';
    case InvoiceStatus.OnHold:
      return 'bg-yellow-600';
    default:
      return 'bg-gray-400';
  }
};

const getStatusLabel = (status: InvoiceStatus): string => {
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

export function StatusHistoryComponent({ invoiceId }: StatusHistoryComponentProps) {
  const { data: statusHistory = [], isLoading, error } = useQuery({
    queryKey: ['invoice-status-history', invoiceId],
    queryFn: () => statusHistoryApi.getStatusHistory(invoiceId),
    enabled: !!invoiceId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
          <CardDescription>Track invoice status changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-8 w-8 mx-auto text-gray-400 animate-spin mb-2" />
            <p className="text-gray-500">Loading status history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
          <CardDescription>Track invoice status changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-red-500">Failed to load status history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statusHistory || statusHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
          <CardDescription>Track invoice status changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No status history available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status History</CardTitle>
        <CardDescription>Track invoice status changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusHistory.map((history, index) => (
            <div key={history.id} className="flex items-start space-x-3">
              <div className={`w-3 h-3 rounded-full mt-2 ${getStatusColor(history.newStatus)}`}></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-medium">
                    Changed from {getStatusLabel(history.previousStatus)} to {getStatusLabel(history.newStatus)}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {getStatusLabel(history.newStatus)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(history.changeDate).toLocaleDateString()} at {new Date(history.changeDate).toLocaleTimeString('en-US', { hour12: false })}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{history.changedBy}</span>
                  </div>
                </div>
                {history.comments && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-start space-x-1">
                      <MessageSquare className="h-3 w-3 mt-0.5 text-gray-400" />
                      <span className="text-gray-700">{history.comments}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
