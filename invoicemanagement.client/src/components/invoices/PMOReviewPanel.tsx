import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useToast } from '../ui/use-toast';
import { invoiceApi } from '../../services/api/invoiceApi';
import { InvoiceStatus } from '../../types/enums';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  FileText, 
  DollarSign,
  Calendar,
  Building,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface PMOReviewPanelProps {
  className?: string;
}

interface InvoiceForReview {
  id: number;
  invoiceNumber: string;
  vendorName: string;
  invoiceValue: number;
  invoiceDate: string;
  projectReference: string;
  status: InvoiceStatus;
  createdAt: string;
  statusHistories: Array<{
    id: number;
    status: InvoiceStatus;
    changedAt: string;
    changedBy: string;
    reason?: string;
  }>;
}

export function PMOReviewPanel({ className }: PMOReviewPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceForReview | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Fetch invoices that need PMO review
  const { data: invoicesForReview, isLoading, error } = useQuery({
    queryKey: ['invoices-pmo-review'],
    queryFn: async () => {
      try {
        console.log('🔍 PMOReviewPanel: Fetching all invoices...');
        const response = await invoiceApi.getInvoices();
        console.log('🔍 PMOReviewPanel: Raw response:', response);
        console.log('🔍 PMOReviewPanel: Response type:', typeof response);
        console.log('🔍 PMOReviewPanel: Is array:', Array.isArray(response));
        
        // Handle Entity Framework JSON format
        let invoices = response;
        if (response && response.$values && Array.isArray(response.$values)) {
          console.log('🔍 PMOReviewPanel: Extracting invoices from $values array');
          invoices = response.$values;
        } else if (!Array.isArray(response)) {
          console.error('❌ PMOReviewPanel: Response is not an array and no $values found:', response);
          return [];
        }
        
        console.log('🔍 PMOReviewPanel: Final invoices array:', invoices);
        console.log('🔍 PMOReviewPanel: Final array length:', invoices.length);
        
        // Filter for invoices in PMO Review status
        const filteredInvoices = invoices.filter((invoice: any) => {
          console.log('🔍 PMOReviewPanel: Checking invoice:', invoice.invoiceNumber, 'Status:', invoice.status, 'Type:', typeof invoice.status);
          return Number(invoice.status) === InvoiceStatus.PMOReview;
        });
        
        console.log('🔍 PMOReviewPanel: Filtered invoices for PMO review:', filteredInvoices);
        
        // Debug: Show status breakdown
        const statusCounts = invoices.reduce((acc: any, invoice: any) => {
          const status = Number(invoice.status);
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        console.log('🔍 PMOReviewPanel: Status breakdown:', statusCounts);
        console.log('🔍 PMOReviewPanel: Invoices in InProgress (3):', invoices.filter((i: any) => Number(i.status) === 3).length);
        
        return filteredInvoices;
      } catch (error) {
        console.error('❌ PMOReviewPanel: Error in queryFn:', error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Approve invoice mutation
  const approveMutation = useMutation({
    mutationFn: async ({ invoiceId, comment }: { invoiceId: number; comment: string }) => {
      return await invoiceApi.changeStatus(invoiceId, {
        Status: InvoiceStatus.Completed,
        ChangedBy: user?.userId?.toString() || user?.email || 'PMO',
        Reason: comment || 'Approved by PMO'
      });
    },
    onSuccess: () => {
      toast({
        title: "Invoice Approved",
        description: "Invoice has been approved and marked as completed.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['invoices-pmo-review'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['project-spend'] });
      setSelectedInvoice(null);
      setReviewComment('');
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject invoice mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ invoiceId, comment }: { invoiceId: number; comment: string }) => {
      return await invoiceApi.changeStatus(invoiceId, {
        Status: InvoiceStatus.Rejected,
        ChangedBy: user?.userId?.toString() || user?.email || 'PMO',
        Reason: comment || 'Rejected by PMO'
      });
    },
    onSuccess: () => {
      toast({
        title: "Invoice Rejected",
        description: "Invoice has been rejected and sent back for revision.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['invoices-pmo-review'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setSelectedInvoice(null);
      setReviewComment('');
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = async () => {
    if (!selectedInvoice) return;
    setIsReviewing(true);
    try {
      await approveMutation.mutateAsync({
        invoiceId: selectedInvoice.id,
        comment: reviewComment
      });
    } finally {
      setIsReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedInvoice) return;
    setIsReviewing(true);
    try {
      await rejectMutation.mutateAsync({
        invoiceId: selectedInvoice.id,
        comment: reviewComment
      });
    } finally {
      setIsReviewing(false);
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PMOReview:
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case InvoiceStatus.Completed:
        return 'bg-green-100 text-green-800 border border-green-200';
      case InvoiceStatus.Rejected:
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PMOReview:
        return <User className="h-4 w-4" />;
      case InvoiceStatus.Completed:
        return <CheckCircle className="h-4 w-4" />;
      case InvoiceStatus.Rejected:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-amber-600" />
            PMO Review Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Loading invoices for review...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-amber-600" />
            PMO Review Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-400 mb-2" />
            <p className="text-red-500">Error loading invoices for review</p>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">Error details: {error.message}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
              >
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-amber-600" />
            PMO Review Panel
            <Badge variant="outline" className="ml-2">
              {invoicesForReview?.length || 0} pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!invoicesForReview || invoicesForReview.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-8 w-8 mx-auto text-green-400 mb-2" />
              <p className="text-gray-500">No invoices pending PMO review</p>
              <p className="text-sm text-gray-400 mt-2">
                Invoices will appear here when they reach the PMO Review status
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>To test:</strong> Move an invoice from "In Progress" to "PMO Review" status
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Invoice List */}
              <div className="space-y-2">
                {invoicesForReview.map((invoice) => (
                  <Card 
                    key={invoice.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedInvoice?.id === invoice.id 
                        ? 'ring-2 ring-amber-500 bg-amber-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {invoice.invoiceNumber}
                            </p>
                            <p className="text-sm text-gray-500">
                              {invoice.vendorName} • {invoice.projectReference}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(invoice.invoiceValue)}
                          </p>
                          <Badge className={getStatusColor(invoice.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(invoice.status)}
                              PMO Review
                            </div>
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Review Actions */}
              {selectedInvoice && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Review Invoice: {selectedInvoice.invoiceNumber}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-600">Vendor</Label>
                        <p className="font-medium">{selectedInvoice.vendorName}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Amount</Label>
                        <p className="font-medium">{formatCurrency(selectedInvoice.invoiceValue)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Project</Label>
                        <p className="font-medium">{selectedInvoice.projectReference}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Invoice Date</Label>
                        <p className="font-medium">
                          {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="review-comment">Review Comment</Label>
                      <Textarea
                        id="review-comment"
                        placeholder="Add your review comment (optional)..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleApprove}
                        disabled={isReviewing}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve & Complete
                      </Button>
                      <Button
                        onClick={handleReject}
                        disabled={isReviewing}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedInvoice(null);
                          setReviewComment('');
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
