import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  User, 
  CheckCircle, 
  AlertCircle,
  Download,
  Upload,
  History,
  Eye,
  X,
  Coins,
  CreditCard
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Invoice } from '../../types/interfaces';
import { invoiceService } from '../../services/invoiceService';
import { CurrencyType, InvoiceStatus } from '../../types/enums';
import { formatCurrency } from '../../utils/formatters';
import { SimpleInvoiceStatusChange } from './SimpleInvoiceStatusChange';
import { SimpleInvoiceWorkflow } from './SimpleInvoiceWorkflow';
import { InvoiceWorkflowAutomation } from './InvoiceWorkflowAutomation';
import { Skeleton } from '../ui/skeleton';

const InvoiceDetails = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoiceById(parseInt(id!));
      setInvoice(data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('Failed to fetch invoice details');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert status number to enum
  const getStatusFromNumber = (statusNumber: any): InvoiceStatus => {
    switch (Number(statusNumber)) {
      case 0: return InvoiceStatus.Submitted;
      case 1: return InvoiceStatus.UnderReview;
      case 2: return InvoiceStatus.Approved;
      case 3: return InvoiceStatus.InProgress;
      case 4: return InvoiceStatus.Completed;
      case 5: return InvoiceStatus.Rejected;
      case 6: return InvoiceStatus.Cancelled;
      case 7: return InvoiceStatus.OnHold;
      default: return InvoiceStatus.Submitted;
    }
  };

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    if (!invoice) return;
    
    try {
      console.log('Changing status from', getStatusFromNumber(invoice.status), 'to', newStatus);
      
      // Update local state immediately for better UX
      setInvoice(prev => prev ? { ...prev, status: newStatus } : null);
      
      // You can also call your API here to persist the change
      console.log(`Status changed to: ${newStatus}`);
      
      // Optionally refresh the invoice data
      // await fetchInvoice();
    } catch (error) {
      console.error('Error changing status:', error);
      // Revert the local state change if API call fails
      await fetchInvoice();
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        {/* Header Skeleton */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </motion.div>

        {/* Invoice Info Card Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex space-x-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-28" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Line Items Skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-6 w-24" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Invoice
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{error || 'Invoice not found'}</p>
      </div>
    </div>
  );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
              <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Invoice Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Invoice #{invoice.invoiceNumber}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>

        {/* Status Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimpleInvoiceStatusChange
            invoiceId={invoice.id}
            currentStatus={getStatusFromNumber(invoice.status)}
            onStatusChange={handleStatusChange}
          />
          <SimpleInvoiceWorkflow currentStatus={getStatusFromNumber(invoice.status)} />
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="line-items">Line Items</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Existing invoice details content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                        <FileText className="h-6 w-6 text-primary-500 mr-2" />
                        Invoice #{invoice.invoiceNumber}
                </CardTitle>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  getStatusFromNumber(invoice.status) === InvoiceStatus.Completed 
                    ? 'bg-green-100 text-green-800' 
                    : getStatusFromNumber(invoice.status) === InvoiceStatus.Approved
                    ? 'bg-green-100 text-green-800'
                    : getStatusFromNumber(invoice.status) === InvoiceStatus.InProgress
                    ? 'bg-purple-100 text-purple-800'
                    : getStatusFromNumber(invoice.status) === InvoiceStatus.UnderReview
                    ? 'bg-yellow-100 text-yellow-800'
                    : getStatusFromNumber(invoice.status) === InvoiceStatus.Submitted
                    ? 'bg-blue-100 text-blue-800'
                    : getStatusFromNumber(invoice.status) === InvoiceStatus.Rejected
                    ? 'bg-red-100 text-red-800'
                    : getStatusFromNumber(invoice.status) === InvoiceStatus.Cancelled
                    ? 'bg-gray-100 text-gray-800'
                    : getStatusFromNumber(invoice.status) === InvoiceStatus.OnHold
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {getStatusFromNumber(invoice.status) === InvoiceStatus.Submitted ? 'Submitted' :
                   getStatusFromNumber(invoice.status) === InvoiceStatus.UnderReview ? 'Under Review' :
                   getStatusFromNumber(invoice.status) === InvoiceStatus.Approved ? 'Approved' :
                   getStatusFromNumber(invoice.status) === InvoiceStatus.InProgress ? 'In Progress' :
                   getStatusFromNumber(invoice.status) === InvoiceStatus.Completed ? 'Completed' :
                   getStatusFromNumber(invoice.status) === InvoiceStatus.Rejected ? 'Rejected' :
                   getStatusFromNumber(invoice.status) === InvoiceStatus.Cancelled ? 'Cancelled' :
                   getStatusFromNumber(invoice.status) === InvoiceStatus.OnHold ? 'On Hold' :
                   'Unknown'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                            <User className="h-5 w-5 text-gray-500 mr-1" />
                            {invoice.vendorName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                      <Coins className="h-5 w-5 text-gray-500 mr-1" />
                      {formatCurrency(invoice.invoiceValue, invoice.currency)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Invoice Date</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                            <Calendar className="h-5 w-5 text-gray-500 mr-1" />
                            {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                            <Calendar className="h-5 w-5 text-gray-500 mr-1" />
                            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Currency</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                      <CreditCard className="h-5 w-5 text-gray-500 mr-1" />
                      {CurrencyType[invoice.currency] || 'N/A'}
                    </p>
                  </div>
                  <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">PO Number</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                            <FileText className="h-5 w-5 text-gray-500 mr-1" />
                            {invoice.referenceNumber || 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                  <p className="text-base text-gray-900 dark:text-white mt-1">
                          {invoice.subject || 'No description available'}
                  </p>
                </div>

                <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Financial Details</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <tbody>
                              <tr className="border-b dark:border-gray-700">
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Sub Total</td>
                                <td className="px-4 py-3">{formatCurrency(0, invoice.currency)}</td>
                              </tr>
                              <tr className="border-b dark:border-gray-700">
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Tax Amount</td>
                                <td className="px-4 py-3">{formatCurrency(0, invoice.currency)}</td>
                                </tr>
                              <tr className="font-semibold text-gray-900 dark:text-white">
                                <td className="px-4 py-3">Total Amount</td>
                                <td className="px-4 py-3">{formatCurrency(invoice.invoiceValue, invoice.currency)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Line Items Section */}
                      {Array.isArray(invoice.lineItems) && invoice.lineItems.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Line Items</h3>
                          
                          {/* Validation Warning */}
                          {(() => {
                            const lineItemsTotal = invoice.lineItems.reduce((sum, item) => sum + item.amount, 0);
                            const difference = Math.abs(lineItemsTotal - invoice.invoiceValue);
                            const tolerance = invoice.invoiceValue * 0.01; // 1% tolerance
                            const hasWarning = difference > tolerance;
                            
                            return hasWarning ? (
                              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <div className="flex items-center">
                                  <X className="h-5 w-5 text-yellow-400 mr-2" />
                                  <div>
                                    <h4 className="text-sm font-medium text-yellow-800">Validation Warning</h4>
                                    <p className="text-sm text-yellow-700">
                                      Line items total ({formatCurrency(lineItemsTotal, invoice.currency)}) differs from invoice total ({formatCurrency(invoice.invoiceValue, invoice.currency)}) by {formatCurrency(difference, invoice.currency)}.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : null;
                          })()}
                          
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
                                <tr>
                                  <th className="px-4 py-3 text-left">Description</th>
                                  <th className="px-4 py-3 text-left">Item #</th>
                                  <th className="px-4 py-3 text-right">Quantity</th>
                                  <th className="px-4 py-3 text-left">Unit</th>
                                  <th className="px-4 py-3 text-right">Unit Price</th>
                                  <th className="px-4 py-3 text-right">Amount</th>
                                  <th className="px-4 py-3 text-center">Confidence</th>
                        </tr>
                      </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {invoice.lineItems.map((item, index) => (
                                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                                      {item.description || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                                      {item.itemNumber || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                                      {item.quantity.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                                      {item.unit || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                                      {formatCurrency(item.unitPrice, invoice.currency)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                      {formatCurrency(item.amount, invoice.currency)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {item.confidenceScore !== undefined ? (
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          item.confidenceScore >= 0.8 
                                            ? 'bg-green-100 text-green-800' 
                                            : item.confidenceScore >= 0.6 
                                            ? 'bg-yellow-100 text-yellow-800' 
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {Math.round(item.confidenceScore * 100)}%
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-xs">N/A</span>
                                      )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                              <tfoot className="bg-gray-50 dark:bg-gray-800">
                        <tr className="font-semibold text-gray-900 dark:text-white">
                                  <td colSpan={6} className="px-4 py-3 text-right">Total:</td>
                                  <td className="px-4 py-3 text-right">
                                    {formatCurrency(Array.isArray(invoice.lineItems) ? invoice.lineItems.reduce((sum, item) => sum + item.amount, 0) : 0, invoice.currency)}
                                  </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                      )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
                    <CardTitle>Processing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</h3>
                        <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                          {new Date(invoice.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By</h3>
                        <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                          {invoice.createdBy}
                        </p>
                      </div>
                      {invoice.modifiedAt && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Modified</h3>
                          <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                            {new Date(invoice.modifiedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {invoice.remark && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Remarks</h3>
                          <p className="text-base text-gray-900 dark:text-white mt-1">
                            {invoice.remark}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            {/* Status Management Tab */}
            <div className="space-y-6">
              <InvoiceWorkflowAutomation
                invoiceId={invoice.id}
                currentStatus={getStatusFromNumber(invoice.status)}
                onStatusChange={handleStatusChange}
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SimpleInvoiceStatusChange
                  invoiceId={invoice.id}
                  currentStatus={getStatusFromNumber(invoice.status)}
                  onStatusChange={handleStatusChange}
                />
                <SimpleInvoiceWorkflow currentStatus={getStatusFromNumber(invoice.status)} />
              </div>
            </div>
            
            {/* Status History */}
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
                <CardDescription>Track all status changes for this invoice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Invoice Created</p>
                      <p className="text-sm text-gray-500">
                        {new Date(invoice.createdAt).toLocaleDateString()} at {new Date(invoice.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {invoice.modifiedAt && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Status Updated</p>
                        <p className="text-sm text-gray-500">
                          {new Date(invoice.modifiedAt).toLocaleDateString()} at {new Date(invoice.modifiedAt).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-400">Modified by: {invoice.modifiedBy}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="line-items" className="space-y-6">
            {/* Existing line items content */}
            <Card>
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
                <CardDescription>Individual items and services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left">Description</th>
                        <th className="px-4 py-3 text-left">Item #</th>
                        <th className="px-4 py-3 text-right">Quantity</th>
                        <th className="px-4 py-3 text-left">Unit</th>
                        <th className="px-4 py-3 text-right">Unit Price</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-center">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {Array.isArray(invoice.lineItems) && invoice.lineItems.length > 0 ? (
                        invoice.lineItems.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                              {item.description || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                              {item.itemNumber || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                              {item.quantity.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                              {item.unit || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                              {formatCurrency(item.unitPrice, invoice.currency)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                              {formatCurrency(item.amount, invoice.currency)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.confidenceScore !== undefined ? (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  item.confidenceScore >= 0.8 
                                    ? 'bg-green-100 text-green-800' 
                                    : item.confidenceScore >= 0.6 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {Math.round(item.confidenceScore * 100)}%
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">N/A</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No line items available
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-800">
                      <tr className="font-semibold text-gray-900 dark:text-white">
                        <td colSpan={6} className="px-4 py-3 text-right">Total:</td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(Array.isArray(invoice.lineItems) ? invoice.lineItems.reduce((sum, item) => sum + item.amount, 0) : 0, invoice.currency)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            {/* Document Management Tab */}
            <Card>
              <CardHeader>
                <CardTitle>Document Management</CardTitle>
                <CardDescription>Manage invoice documents, versions, and approval workflow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Document */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-lg">Current Document</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">v1.0</Badge>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">File Name:</span>
                      <p className="text-gray-600">{invoice.fileName || 'No file attached'}</p>
                    </div>
                    <div>
                      <span className="font-medium">File Type:</span>
                      <p className="text-gray-600">{invoice.fileType || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="font-medium">File Size:</span>
                      <p className="text-gray-600">
                        {invoice.fileSize ? `${(invoice.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Document
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      New Version
                    </Button>
                  </div>
                </div>

                {/* Document Approval Workflow */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-lg mb-4">Approval Workflow</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Document Uploaded</p>
                        <p className="text-sm text-green-700">
                          {new Date().toLocaleDateString()} • {invoice.createdBy || 'System'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">OCR Processing Complete</p>
                        <p className="text-sm text-blue-700">
                          {new Date().toLocaleDateString()} • OCR System
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-900">Pending Approval</p>
                        <p className="text-sm text-yellow-700">
                          Awaiting manager approval
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button size="sm" variant="default">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button size="sm" variant="outline">
                      <History className="h-4 w-4 mr-2" />
                      Request Changes
                    </Button>
                  </div>
                </div>

                {/* Document Versions */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-lg mb-4">Version History</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">v1.0 - Current</p>
                          <p className="text-sm text-gray-500">
                            {invoice.fileName || 'Original document'} • {new Date().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Placeholder for additional versions */}
                    <div className="text-center text-gray-500 py-4">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No previous versions</p>
                      <p className="text-sm text-gray-400">Upload a new version to see version history</p>
                    </div>
                  </div>
                </div>

                {/* Document Metadata */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-lg mb-4">Document Metadata</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Processing Status:</span>
                      <p className="text-gray-600">Completed</p>
                    </div>
                    <div>
                      <span className="font-medium">OCR Confidence:</span>
                      <p className="text-gray-600">High (95%)</p>
                    </div>
                    <div>
                      <span className="font-medium">Document Type:</span>
                      <p className="text-gray-600">Invoice</p>
                    </div>
                    <div>
                      <span className="font-medium">Language:</span>
                      <p className="text-gray-600">English</p>
                    </div>
                    <div>
                      <span className="font-medium">Page Count:</span>
                      <p className="text-gray-600">1</p>
                    </div>
                    <div>
                      <span className="font-medium">Quality Score:</span>
                      <p className="text-gray-600">Excellent</p>
                    </div>
                    <div>
                      <span className="font-medium">Processing Date:</span>
                      <p className="text-gray-600">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div>
                      <span className="font-medium">Processed By:</span>
                      <p className="text-gray-600">OCR System</p>
                    </div>
                  </div>
                </div>

                {/* Document Actions */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-lg mb-4">Document Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New Version
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <History className="h-4 w-4 mr-2" />
                        View Processing History
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export Document
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Eye className="h-4 w-4 mr-2" />
                        Compare Versions
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Approved
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Report Issue
                      </Button>
                    </div>
                  </div>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Status History Tab */}
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
                <CardDescription>Track invoice status changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Invoice Created</p>
                      <p className="text-sm text-gray-500">
                        {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {/* Add more status history items as needed */}
                </div>
            </CardContent>
          </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default InvoiceDetails; 