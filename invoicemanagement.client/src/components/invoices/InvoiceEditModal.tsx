import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { 
  Save, 
  X, 
  AlertTriangle,
  Loader2,
  CheckCircle,
  Calendar,
  DollarSign,
  Building,
  FileText
} from 'lucide-react';
import { Invoice, CurrencyType } from '../../types/enums';
import { invoiceApi } from '../../services/api/invoiceApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../ui/use-toast';

interface InvoiceEditModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedInvoice: Invoice) => void;
}

export function InvoiceEditModal({ 
  invoice, 
  isOpen, 
  onClose, 
  onSave 
}: InvoiceEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState({
    invoiceNumber: invoice.invoiceNumber || '',
    vendorName: invoice.vendorName || '',
    invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : '',
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
    invoiceValue: invoice.invoiceValue || 0,
    vendorTaxId: '', // This might not be available in the Invoice interface
    currency: invoice.currency?.toString() || 'USD',
    subject: invoice.subject || '',
    remark: invoice.remark || ''
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when invoice changes
  useEffect(() => {
    setFormData({
      invoiceNumber: invoice.invoiceNumber || '',
      vendorName: invoice.vendorName || '',
      invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : '',
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      invoiceValue: invoice.invoiceValue || 0,
      vendorTaxId: '',
      currency: invoice.currency?.toString() || 'USD',
      subject: invoice.subject || '',
      remark: invoice.remark || ''
    });
    setHasChanges(false);
    setErrors({});
  }, [invoice]);

  // Handle form field changes
  const handleFieldChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }

    if (!formData.vendorName.trim()) {
      newErrors.vendorName = 'Vendor name is required';
    }

    if (!formData.invoiceDate) {
      newErrors.invoiceDate = 'Invoice date is required';
    }

    if (formData.invoiceValue <= 0) {
      newErrors.invoiceValue = 'Invoice value must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: (data: any) => invoiceApi.updateInvoiceData(invoice.id, data),
    onSuccess: (updatedInvoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] });
      
      toast({
        title: "Invoice Updated",
        description: "Invoice has been successfully updated.",
        variant: "default",
      });
      
      onSave?.(updatedInvoice);
      onClose();
    },
    onError: (error: any) => {
      console.error('Error updating invoice:', error);
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update invoice. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare update request
    const updateRequest: any = {};
    
    if (formData.invoiceNumber !== invoice.invoiceNumber) {
      updateRequest.invoiceNumber = formData.invoiceNumber;
    }
    
    if (formData.vendorName !== invoice.vendorName) {
      updateRequest.vendorName = formData.vendorName;
    }
    
    if (formData.invoiceDate && new Date(formData.invoiceDate).toISOString() !== new Date(invoice.invoiceDate).toISOString()) {
      updateRequest.invoiceDate = formData.invoiceDate;
    }
    
    if (formData.dueDate && new Date(formData.dueDate).toISOString() !== new Date(invoice.dueDate).toISOString()) {
      updateRequest.dueDate = formData.dueDate;
    }
    
    if (formData.invoiceValue !== invoice.invoiceValue) {
      updateRequest.invoiceValue = formData.invoiceValue;
    }
    
    if (formData.vendorTaxId) {
      updateRequest.vendorTaxId = formData.vendorTaxId;
    }
    
    if (formData.currency !== invoice.currency?.toString()) {
      updateRequest.currency = formData.currency;
    }

    if (Object.keys(updateRequest).length === 0) {
      toast({
        title: "No Changes",
        description: "No changes were made to the invoice.",
        variant: "default",
      });
      onClose();
      return;
    }

    updateInvoiceMutation.mutate(updateRequest);
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Edit Invoice
          </DialogTitle>
          <DialogDescription>
            Update invoice details. Only modified fields will be saved.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Information</CardTitle>
              <CardDescription>
                Basic invoice details and identification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                    className={errors.invoiceNumber ? 'border-red-500' : ''}
                    placeholder="Enter invoice number"
                  />
                  {errors.invoiceNumber && (
                    <p className="text-sm text-red-500">{errors.invoiceNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendorName">Vendor Name *</Label>
                  <Input
                    id="vendorName"
                    value={formData.vendorName}
                    onChange={(e) => handleFieldChange('vendorName', e.target.value)}
                    className={errors.vendorName ? 'border-red-500' : ''}
                    placeholder="Enter vendor name"
                  />
                  {errors.vendorName && (
                    <p className="text-sm text-red-500">{errors.vendorName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Invoice Date *</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => handleFieldChange('invoiceDate', e.target.value)}
                    className={errors.invoiceDate ? 'border-red-500' : ''}
                  />
                  {errors.invoiceDate && (
                    <p className="text-sm text-red-500">{errors.invoiceDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Details</CardTitle>
              <CardDescription>
                Amount, currency, and tax information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceValue">Invoice Value *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="invoiceValue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.invoiceValue}
                      onChange={(e) => handleFieldChange('invoiceValue', parseFloat(e.target.value) || 0)}
                      className={`pl-10 ${errors.invoiceValue ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.invoiceValue && (
                    <p className="text-sm text-red-500">{errors.invoiceValue}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleFieldChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="QAR">QAR - Qatari Riyal</SelectItem>
                      <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendorTaxId">Vendor Tax ID</Label>
                  <Input
                    id="vendorTaxId"
                    value={formData.vendorTaxId}
                    onChange={(e) => handleFieldChange('vendorTaxId', e.target.value)}
                    placeholder="Enter vendor tax ID"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
              <CardDescription>
                Subject, remarks, and other details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleFieldChange('subject', e.target.value)}
                  placeholder="Enter invoice subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remark">Remarks</Label>
                <Textarea
                  id="remark"
                  value={formData.remark}
                  onChange={(e) => handleFieldChange('remark', e.target.value)}
                  placeholder="Enter any remarks or notes"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Changes Summary */}
          {hasChanges && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes. Click Save to update the invoice.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateInvoiceMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || updateInvoiceMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
