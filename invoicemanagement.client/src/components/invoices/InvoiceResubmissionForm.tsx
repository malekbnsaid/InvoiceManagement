import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  RefreshCw, 
  FileText, 
  AlertTriangle, 
  CheckCircle2,
  Upload,
  XCircle,
  Calendar,
  User,
  Edit3,
  FileUp,
  X
} from 'lucide-react';
import { InvoiceStatus } from '../../types/enums';
import { useAuth } from '../../context/AuthContext';
import { invoiceApi } from '../../services/api/invoiceApi';

interface InvoiceData {
  invoiceNumber: string;
  vendorName: string;
  invoiceDate: string;
  invoiceValue: number;
  vendorTaxId: string;
  dueDate: string;
  currency: string;
}

interface InvoiceResubmissionFormProps {
  invoiceId: number;
  currentStatus: InvoiceStatus;
  onResubmit: (newStatus: InvoiceStatus) => Promise<void>;
  disabled?: boolean;
  className?: string;
  currentInvoiceData?: Partial<InvoiceData>; // Add current invoice data as prop
}

export function InvoiceResubmissionForm({ 
  invoiceId,
  currentStatus, 
  onResubmit, 
  disabled = false,
  className,
  currentInvoiceData
}: InvoiceResubmissionFormProps) {
  const { user } = useAuth();
  const [resubmissionReason, setResubmissionReason] = useState('');
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [resubmissionType, setResubmissionType] = useState<'same' | 'new_file' | 'manual_edit'>('same');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualData, setManualData] = useState<Partial<InvoiceData>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Only show resubmission for rejected or cancelled invoices
  const canResubmit = currentStatus === InvoiceStatus.Rejected || currentStatus === InvoiceStatus.Cancelled;

  // Helper function to safely format dates for display
  const formatDateForDisplay = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString; // Return original string if parsing fails
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleManualDataChange = (field: keyof InvoiceData, value: string | number) => {
    setManualData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const resetForm = () => {
    setResubmissionReason('');
    setSelectedFile(null);
    setManualData({});
    setHasChanges(false);
    setResubmissionType('same');
    setShowForm(false);
  };

  const handleResubmit = async () => {
    if (!resubmissionReason.trim()) {
      alert('Please provide a reason for resubmission');
      return;
    }

    if (resubmissionType === 'new_file' && !selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    if (resubmissionType === 'manual_edit') {
      if (!hasChanges) {
        alert('Please make at least one correction to the invoice data');
        return;
      }
    }

    setIsResubmitting(true);
    try {
      let reason = `Resubmitted: ${resubmissionReason}`;
      
      if (resubmissionType === 'new_file') {
        reason += ` (New file uploaded: ${selectedFile?.name})`;
        // TODO: Upload new file and process with OCR
        console.log('Uploading new file:', selectedFile);
      } else if (resubmissionType === 'manual_edit') {
        reason += ` (Manual corrections applied)`;
        // Update invoice data with manual corrections
        console.log('Manual corrections:', manualData);
        
        // Prepare the update request
        const updateRequest: any = {};
        if (manualData.invoiceNumber) updateRequest.invoiceNumber = manualData.invoiceNumber;
        if (manualData.vendorName) updateRequest.vendorName = manualData.vendorName;
        if (manualData.invoiceDate) updateRequest.invoiceDate = manualData.invoiceDate;
        if (manualData.invoiceValue) updateRequest.invoiceValue = manualData.invoiceValue;
        if (manualData.vendorTaxId) updateRequest.vendorTaxId = manualData.vendorTaxId;
        if (manualData.dueDate) updateRequest.dueDate = manualData.dueDate;
        if (manualData.currency) updateRequest.currency = manualData.currency;

        // Update the invoice data
        if (Object.keys(updateRequest).length > 0) {
          console.log('🔧 Manual Edit: Updating invoice data with:', updateRequest);
          try {
            const updatedInvoice = await invoiceApi.updateInvoiceData(invoiceId, updateRequest);
            console.log('✅ Manual Edit: Invoice data updated successfully:', updatedInvoice);
          } catch (error) {
            console.error('❌ Manual Edit: Failed to update invoice data:', error);
            throw error; // Re-throw to stop the process
          }
        } else {
          console.log('⚠️ Manual Edit: No changes to update');
        }
      }

      // Change status to Submitted (resubmit from beginning)
      await invoiceApi.changeStatus(invoiceId, {
        Status: InvoiceStatus.Submitted,
        ChangedBy: user?.userId?.toString() || user?.email || 'unknown',
        Reason: reason
      });

      // Update local state
      await onResubmit(InvoiceStatus.Submitted);
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error resubmitting invoice:', error);
      alert('Failed to resubmit invoice. Please try again.');
    } finally {
      setIsResubmitting(false);
    }
  };

  if (!canResubmit) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-600" />
          Resubmit Invoice
        </CardTitle>
        <CardDescription>
          This invoice can be resubmitted for review after making necessary corrections.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status Alert */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Current Status:</strong> {currentStatus === InvoiceStatus.Rejected ? 'Rejected' : 'Cancelled'}
            <br />
            This invoice needs to be corrected and resubmitted for review.
          </AlertDescription>
        </Alert>

        {!showForm ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">
                Choose how you want to resubmit this invoice for review.
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => setShowForm(true)}
                  disabled={disabled}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resubmit Invoice
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resubmission Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Choose Resubmission Method</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setResubmissionType('same')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    resubmissionType === 'same' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <RefreshCw className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Same File</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Resubmit with the same file and status change
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setResubmissionType('new_file')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    resubmissionType === 'new_file' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <FileUp className="h-5 w-5 text-green-600" />
                    <span className="font-medium">New File</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Upload a corrected invoice file
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setResubmissionType('manual_edit')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    resubmissionType === 'manual_edit' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Edit3 className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Manual Edit</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Manually correct invoice data
                  </p>
                </button>
              </div>
            </div>

            {/* Resubmission Reason */}
            <div className="space-y-2">
              <Label htmlFor="resubmission-reason">
                Reason for Resubmission <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="resubmission-reason"
                placeholder="Please explain what corrections were made to the invoice..."
                value={resubmissionReason}
                onChange={(e) => setResubmissionReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-sm text-gray-500">
                Provide details about the corrections made to help reviewers understand the changes.
              </p>
            </div>

            {/* Conditional Content Based on Resubmission Type */}
            {resubmissionType === 'new_file' && (
              <div className="space-y-3">
                <Label htmlFor="file-upload">Upload Corrected Invoice File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, PNG files only
                    </p>
                  </label>
                </div>
                {selectedFile && (
                  <div className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">{selectedFile.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedFile(null)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}

             {resubmissionType === 'manual_edit' && (
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <Label className="text-base font-medium">Edit Invoice Data</Label>
                   {hasChanges && (
                     <Badge className="bg-orange-100 text-orange-800">
                       {Object.keys(manualData).length} field{Object.keys(manualData).length !== 1 ? 's' : ''} changed
                     </Badge>
                   )}
                 </div>
                 <p className="text-sm text-gray-600">
                   Only edit the fields that need correction. Leave unchanged fields empty.
                 </p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="invoice-number">Invoice Number</Label>
                     <div className="space-y-1">
                       {currentInvoiceData?.invoiceNumber && (
                         <p className="text-xs text-gray-500">Current: {currentInvoiceData.invoiceNumber}</p>
                       )}
                       <Input
                         id="invoice-number"
                         value={manualData.invoiceNumber || ''}
                         onChange={(e) => handleManualDataChange('invoiceNumber', e.target.value)}
                         placeholder="Enter corrected invoice number"
                         className={manualData.invoiceNumber ? 'border-orange-300 bg-orange-50' : ''}
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="vendor-name">Vendor Name</Label>
                     <div className="space-y-1">
                       {currentInvoiceData?.vendorName && (
                         <p className="text-xs text-gray-500">Current: {currentInvoiceData.vendorName}</p>
                       )}
                       <Input
                         id="vendor-name"
                         value={manualData.vendorName || ''}
                         onChange={(e) => handleManualDataChange('vendorName', e.target.value)}
                         placeholder="Enter corrected vendor name"
                         className={manualData.vendorName ? 'border-orange-300 bg-orange-50' : ''}
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="invoice-date">Invoice Date</Label>
                     <div className="space-y-1">
                       {currentInvoiceData?.invoiceDate && (
                         <p className="text-xs text-gray-500">Current: {formatDateForDisplay(currentInvoiceData.invoiceDate)}</p>
                       )}
                       <Input
                         id="invoice-date"
                         type="date"
                         value={manualData.invoiceDate || ''}
                         onChange={(e) => handleManualDataChange('invoiceDate', e.target.value)}
                         className={manualData.invoiceDate ? 'border-orange-300 bg-orange-50' : ''}
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="invoice-value">Invoice Amount</Label>
                     <div className="space-y-1">
                       {currentInvoiceData?.invoiceValue && (
                         <p className="text-xs text-gray-500">Current: ${currentInvoiceData.invoiceValue}</p>
                       )}
                       <Input
                         id="invoice-value"
                         type="number"
                         step="0.01"
                         value={manualData.invoiceValue || ''}
                         onChange={(e) => handleManualDataChange('invoiceValue', parseFloat(e.target.value) || 0)}
                         placeholder="Enter corrected amount"
                         className={manualData.invoiceValue ? 'border-orange-300 bg-orange-50' : ''}
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="vendor-tax-id">Vendor Tax ID</Label>
                     <div className="space-y-1">
                       {currentInvoiceData?.vendorTaxId && (
                         <p className="text-xs text-gray-500">Current: {currentInvoiceData.vendorTaxId}</p>
                       )}
                       <Input
                         id="vendor-tax-id"
                         value={manualData.vendorTaxId || ''}
                         onChange={(e) => handleManualDataChange('vendorTaxId', e.target.value)}
                         placeholder="Enter corrected tax ID"
                         className={manualData.vendorTaxId ? 'border-orange-300 bg-orange-50' : ''}
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="due-date">Due Date</Label>
                     <div className="space-y-1">
                       {currentInvoiceData?.dueDate && (
                         <p className="text-xs text-gray-500">Current: {formatDateForDisplay(currentInvoiceData.dueDate)}</p>
                       )}
                       <Input
                         id="due-date"
                         type="date"
                         value={manualData.dueDate || ''}
                         onChange={(e) => handleManualDataChange('dueDate', e.target.value)}
                         className={manualData.dueDate ? 'border-orange-300 bg-orange-50' : ''}
                       />
                     </div>
                   </div>
                 </div>
                 
                 {/* Changes Summary */}
                 {hasChanges && (
                   <div className="bg-orange-50 p-3 rounded-lg">
                     <h5 className="text-sm font-medium text-orange-900 mb-2">Changes Summary:</h5>
                     <ul className="text-xs text-orange-800 space-y-1">
                       {Object.entries(manualData).map(([field, value]) => (
                         <li key={field} className="flex items-center gap-2">
                           <Edit3 className="h-3 w-3" />
                           <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                           <span className="font-medium">{String(value)}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}
               </div>
             )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Invoice will be moved to "Submitted" status
                </li>
                <li className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  PM will review the corrected invoice
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  New review timeline will start
                </li>
              </ul>
            </div>

            <div className="flex gap-2">
               <Button 
                 onClick={handleResubmit}
                 disabled={disabled || isResubmitting || !resubmissionReason.trim() || (resubmissionType === 'manual_edit' && !hasChanges)}
                 className="flex-1 bg-blue-600 hover:bg-blue-700"
               >
                {isResubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Resubmitting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resubmit Invoice
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={resetForm}
                disabled={disabled || isResubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
