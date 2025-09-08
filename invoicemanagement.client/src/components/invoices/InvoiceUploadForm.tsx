import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Eye, 
  Download, 
  History, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  X,
  Plus,
  Save
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { invoiceService } from '../../services/invoiceService';
import { useToast } from '../ui/use-toast';
import { SecretaryOrHigher } from '../shared/RoleGuard';
import { usePermissions } from '../../hooks/usePermissions';

interface InvoiceFile {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: Date;
  version: number;
  isCurrent: boolean;
  metadata?: {
    pageCount?: number;
    language?: string;
    quality?: string;
    ocrConfidence?: number;
  };
}

const InvoiceUploadForm: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [invoiceFiles, setInvoiceFiles] = useState<InvoiceFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { canUploadInvoice } = usePermissions();

  // Show access denied message if user doesn't have permission
  if (!canUploadInvoice) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 text-center max-w-md">
              You don't have permission to upload invoices. Only users with Secretary role or higher can upload invoices.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList } }) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: `Please select a valid file type: ${allowedTypes.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }
    
    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    setSelectedFile(file);
    
    // Add to invoice files list
    const newFile: InvoiceFile = {
      id: Date.now().toString(),
      file,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadDate: new Date(),
      version: 1,
      isCurrent: true,
      metadata: {
        pageCount: 1, // Default, will be updated after OCR
        language: 'English',
        quality: 'High',
        ocrConfidence: 0.95
      }
    };
    
    // Deactivate previous current file
    setInvoiceFiles(prev => prev.map(f => ({ ...f, isCurrent: false })));
    setInvoiceFiles(prev => [...prev, newFile]);
    
    toast({
      title: "File Selected",
      description: `${file.name} has been selected for processing`,
    });
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      console.log('Starting file upload for:', selectedFile.name, 'Size:', selectedFile.size);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      console.log('FormData created, calling OCR service...');
      
      // Call the real OCR service
      const result = await invoiceService.uploadAndProcess(selectedFile);
      
      console.log('OCR service response:', result);
      
      // Ensure the result has the expected structure
      const processedResult = {
        ...result,
        lineItems: extractLineItemsFromResponse(result),
        vendorName: result?.vendorName || 'Unknown Vendor',
        invoiceNumber: result?.invoiceNumber || 'No Invoice Number',
        totalAmount: result?.totalAmount || result?.invoiceValue || 0,
        currency: result?.currency || 'USD',
        isProcessed: result?.isProcessed || false,
        confidenceScore: result?.confidenceScore || 0
      };
      
      if (processedResult && processedResult.isProcessed) {
        setOcrResult(processedResult);
                toast({
                    title: "OCR Processing Complete",
          description: `Invoice processed successfully with ${Math.round((processedResult.confidenceScore || 0) * 100)}% confidence`,
                });
            } else {
        // Handle OCR processing issues
        const errorMessage = processedResult?.errorMessage || "OCR processing failed";
        console.warn('OCR processing warning:', errorMessage);
                toast({
                    title: "OCR Processing Warning",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Still set the result so user can see what was extracted
        setOcrResult(processedResult);
      }
    } catch (error: any) {
      console.error('OCR processing error:', error);
      
      let errorMessage = "Failed to process invoice";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
            toast({
        title: "OCR Processing Failed",
        description: errorMessage,
        variant: "destructive",
            });
        } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to clean OCR result data
  const cleanOcrResult = (data: any): any => {
    if (data === null || data === undefined) return data;
    
    // Remove $id properties and clean the data structure
    const cleanData: any = {};
    
    Object.keys(data).forEach(key => {
      if (key.startsWith('$')) return; // Skip $id, $values, etc.
      
      if (key === 'lineItems' && data[key] && typeof data[key] === 'object') {
        // Handle lineItems specially - extract the actual array
        console.log('Processing lineItems:', data[key]); // Debug log
        
        if (data[key].$values && Array.isArray(data[key].$values)) {
          console.log('Found $values array with', data[key].$values.length, 'items'); // Debug log
          cleanData[key] = data[key].$values.map((item: any) => {
            console.log('Processing line item:', item); // Debug log
            // Don't recursively clean line items - just clean the top-level properties
            const cleanedItem: any = {};
            Object.keys(item).forEach(itemKey => {
              if (!itemKey.startsWith('$')) {
                cleanedItem[itemKey] = item[itemKey];
              }
            });
            console.log('Cleaned line item:', cleanedItem); // Debug log
            return cleanedItem;
          });
          console.log('Final cleaned lineItems:', cleanData[key]); // Debug log
        } else if (Array.isArray(data[key])) {
          cleanData[key] = data[key].map((item: any) => cleanOcrResult(item));
        } else {
          console.log('lineItems is not an array or $values, setting to empty array'); // Debug log
          cleanData[key] = [];
        }
      } else if (Array.isArray(data[key])) {
        cleanData[key] = data[key].map((item: any) => cleanOcrResult(item));
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        cleanData[key] = cleanOcrResult(data[key]);
      } else {
        cleanData[key] = data[key];
      }
    });
    
    return cleanData;
  };

  // Helper function to convert numeric currency to proper enum value
  const convertCurrency = (currency: any): string => {
    if (typeof currency === 'string') return currency;
    if (typeof currency === 'number') {
      // Map numeric values to currency codes
      switch (currency) {
        case 1: return 'USD';
        case 2: return 'EUR';
        case 3: return 'GBP';
        case 4: return 'AED';
        case 5: return 'SAR';
        case 6: return 'KWD';
        case 7: return 'BHD';
        case 8: return 'OMR';
        case 9: return 'QAR';
        case 10: return 'JPY';
        default: return 'USD'; // Default to USD
      }
    }
    return 'USD'; // Default fallback
  };

  // Fallback function to extract line items from raw text
  const extractLineItemsFromRawText = (rawText: string): any[] => {
    if (!rawText) return [];
    
    const lineItems: any[] = [];
    const lines = rawText.split('\n');
    
    // Look for lines that contain service descriptions and amounts
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for service fee lines
      if (line.includes('Basic Fee') || line.includes('Transaction Fee') || line.includes('Basis fee')) {
        const nextLines = lines.slice(i + 1, i + 4);
        let amount = 0;
        let quantity = 0;
        
        // Look for amount in next few lines
        for (const nextLine of nextLines) {
          const amountMatch = nextLine.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*€/);
          if (amountMatch) {
            amount = parseFloat(amountMatch[1].replace(',', '.'));
            break;
          }
        }
        
        // Look for quantity in next few lines
        for (const nextLine of nextLines) {
          const qtyMatch = nextLine.match(/^(\d+)$/);
          if (qtyMatch) {
            quantity = parseInt(qtyMatch[1]);
            break;
          }
        }
        
        if (amount > 0) {
          lineItems.push({
            description: line,
            amount: amount,
            quantity: quantity || 1,
            unitPrice: quantity > 0 ? amount / quantity : amount,
            confidenceScore: 0.8
          });
        }
      }
    }
    
    return lineItems;
  };

  // Function to extract line items from OCR response
  const extractLineItemsFromResponse = (result: any): any[] => {
    console.log('Extracting line items from response:', result);
    
    if (!result?.lineItems) {
      console.log('No lineItems property found in response');
      return [];
    }
    
    // Handle the case where lineItems is an object with $values
    if (result.lineItems.$values && Array.isArray(result.lineItems.$values)) {
      console.log('Found lineItems.$values with', result.lineItems.$values.length, 'items');
      return result.lineItems.$values.map((item: any) => {
        // Clean the item by removing $ properties
        const cleanedItem: any = {};
        Object.keys(item).forEach(key => {
          if (!key.startsWith('$')) {
            cleanedItem[key] = item[key];
          }
        });
        return cleanedItem;
      });
    }
    
    // Handle the case where lineItems is already an array
    if (Array.isArray(result.lineItems)) {
      console.log('lineItems is already an array with', result.lineItems.length, 'items');
      return result.lineItems;
    }
    
    // Handle the case where lineItems is an object but no $values
    if (typeof result.lineItems === 'object') {
      console.log('lineItems is an object but no $values found:', result.lineItems);
      return [];
    }
    
    console.log('lineItems is not in expected format:', result.lineItems);
    return [];
  };

  const handleSaveInvoice = async () => {
    if (!ocrResult || !ocrResult.isProcessed) {
      toast({
        title: "Cannot Save Invoice",
        description: "Please process a document first or ensure OCR processing is complete",
        variant: "destructive",
      });
      return;
    }

    // Get the current file information
    const currentFile = invoiceFiles.find(f => f.isCurrent);
    if (!currentFile) {
      toast({
        title: "No Document Found",
        description: "Please ensure a document is uploaded before saving",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Clean the OCR result data to remove $id references
      const cleanedOcrResult = cleanOcrResult(ocrResult);
      
      // Convert currency from numeric to string enum value
      if (cleanedOcrResult.currency !== undefined) {
        cleanedOcrResult.currency = convertCurrency(cleanedOcrResult.currency);
      }
      
      // Ensure numeric fields are properly typed
      if (cleanedOcrResult.invoiceValue !== undefined) {
        cleanedOcrResult.invoiceValue = Number(cleanedOcrResult.invoiceValue);
      }
      if (cleanedOcrResult.totalAmount !== undefined) {
        cleanedOcrResult.totalAmount = Number(cleanedOcrResult.totalAmount);
      }
      if (cleanedOcrResult.subTotal !== undefined) {
        cleanedOcrResult.subTotal = Number(cleanedOcrResult.subTotal);
      }
      if (cleanedOcrResult.taxAmount !== undefined) {
        cleanedOcrResult.taxAmount = Number(cleanedOcrResult.taxAmount);
      }
      if (cleanedOcrResult.confidenceScore !== undefined) {
        cleanedOcrResult.confidenceScore = Number(cleanedOcrResult.confidenceScore);
      }
      
      // Ensure line items have proper numeric types
      if (cleanedOcrResult.lineItems && Array.isArray(cleanedOcrResult.lineItems)) {
        console.log('Processing line items for numeric conversion:', cleanedOcrResult.lineItems);
        cleanedOcrResult.lineItems = cleanedOcrResult.lineItems.map((item: any) => ({
          ...item,
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
          amount: Number(item.amount || 0),
          taxAmount: item.taxAmount ? Number(item.taxAmount) : undefined,
          taxRate: item.taxRate ? Number(item.taxRate) : undefined,
          discountAmount: item.discountAmount ? Number(item.discountAmount) : undefined,
          discountRate: item.discountRate ? Number(item.discountRate) : undefined,
          confidenceScore: item.confidenceScore ? Number(item.confidenceScore) : undefined
        }));
        console.log('Line items after numeric conversion:', cleanedOcrResult.lineItems);
      } else {
        console.warn('No line items found or lineItems is not an array:', cleanedOcrResult.lineItems);
        
        // Try to extract line items from raw text as fallback
        console.log('Attempting to extract line items from raw text as fallback...');
        const fallbackLineItems = extractLineItemsFromRawText(cleanedOcrResult.rawText);
        if (fallbackLineItems.length > 0) {
          console.log('Extracted line items from raw text:', fallbackLineItems);
          cleanedOcrResult.lineItems = fallbackLineItems;
        }
      }
      
      // Prepare the request with both OCR data and file information
      const requestData = {
        ocrResult: {
          ...cleanedOcrResult,
          vendorTaxId: cleanedOcrResult.vendorTaxId || "PENDING" // Ensure required field is set
        },
        filePath: currentFile.fileName, // For now, just use filename as path
        fileName: currentFile.fileName,
        fileType: currentFile.fileType,
        fileSize: currentFile.fileSize
      };

      console.log('Saving invoice with cleaned data:', requestData);
      console.log('Line items count in request:', requestData.ocrResult.lineItems?.length || 0);
      console.log('Line items in request:', requestData.ocrResult.lineItems);
      
      // Final validation - ensure we have line items
      if (!requestData.ocrResult.lineItems || requestData.ocrResult.lineItems.length === 0) {
        console.error('WARNING: No line items found in request data!');
        console.error('Original OCR result lineItems:', ocrResult.lineItems);
        console.error('Cleaned OCR result lineItems:', cleanedOcrResult.lineItems);
        console.error('Final request lineItems:', requestData.ocrResult.lineItems);
      }
      
      // Save invoice with OCR data and file information
      await invoiceService.saveInvoice(requestData);
      
      toast({
        title: "Invoice Saved",
        description: "Invoice has been saved successfully with document attachment",
      });
      
      // Reset form
      setSelectedFile(null);
      setInvoiceFiles([]);
      setOcrResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addNewVersion = (file: File) => {
    const newVersion: InvoiceFile = {
      id: Date.now().toString(),
      file,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadDate: new Date(),
      version: Math.max(...invoiceFiles.map(f => f.version)) + 1,
      isCurrent: true,
      metadata: {
        pageCount: 1,
        language: 'English',
        quality: 'High',
        ocrConfidence: 0.95
      }
    };
    
    // Deactivate previous current file
    setInvoiceFiles(prev => prev.map(f => ({ ...f, isCurrent: false })));
    setInvoiceFiles(prev => [...prev, newVersion]);
    
    toast({
      title: "New Version Added",
      description: `Version ${newVersion.version} of ${file.name} has been added`,
    });
  };

  const removeFile = (fileId: string) => {
    setInvoiceFiles(prev => prev.filter(f => f.id !== fileId));
    toast({
      title: "File Removed",
      description: "File has been removed from the invoice",
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getCurrencySymbol = (currency: string) => {
      switch (currency) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'AED': return 'د.إ';
        case 'SAR': return 'ر.س';
        case 'KWD': return 'د.ك';
        case 'BHD': return 'د.ب';
        case 'OMR': return 'ر.ع';
        case 'QAR': return 'ر.ق';
        case 'JPY': return '¥';
        default: return '$';
      }
    };

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
              Upload Invoice
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Upload invoice documents and extract data using OCR
            </p>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload & Process</TabsTrigger>
            <TabsTrigger value="documents">Document Management</TabsTrigger>
            <TabsTrigger value="review">Review & Save</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
            <CardHeader>
                <CardTitle>Upload Invoice Document</CardTitle>
                <CardDescription>
                  Select an invoice file to process with OCR
                </CardDescription>
            </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload Area */}
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      handleFileSelect({ target: { files } } as any);
                    }
                  }}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop your invoice file here
                  </p>
                  <p className="text-gray-500 mb-4">
                    or click to browse files
                  </p>
                  <p className="text-sm text-gray-400">
                    Supports: PDF, JPG, PNG, TIFF (Max: 10MB)
                    </p>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
                  multiple={false}
                />
                
                {/* Upload Button */}
                <div className="flex justify-center">
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    variant="outline"
                    size="lg"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isProcessing ? 'Processing...' : 'Select Invoice File'}
                  </Button>
                </div>

                {/* Selected File Info */}
                {selectedFile && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(selectedFile.size)} • {selectedFile.type}
                                            </p>
                                        </div>
                                    </div>
                      <Button 
                        onClick={handleFileUpload}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4 mr-2" />
                        )}
                        {isProcessing ? 'Processing...' : 'Process with OCR'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* OCR Results */}
                {ocrResult && (
                  <div className="border rounded-lg p-4 bg-green-50">
                    <div className="flex items-center space-x-2 mb-4">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-medium text-green-900">OCR Processing Complete</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Vendor:</span> {ocrResult.vendorName}
                      </div>
                      <div>
                        <span className="font-medium">Invoice #:</span> {ocrResult.invoiceNumber}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {ocrResult.invoiceDate}
                      </div>
                      <div>
                        <span className="font-medium">Total Amount:</span> {getCurrencySymbol(ocrResult.currency)}{ocrResult.totalAmount || ocrResult.invoiceValue || 0}
                      </div>
                    </div>
                    <Button 
                            className="mt-4"
                      onClick={() => setCurrentTab('review')}
                        >
                      Review & Save Invoice
                    </Button>
                            </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Management</CardTitle>
                <CardDescription>
                  Manage invoice document versions and metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Version */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Add New Document Version</h4>
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Version
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) addNewVersion(file);
                      }}
                      accept=".pdf,.jpg,.jpeg,.png,.tiff"
                    />
                    <p className="text-sm text-gray-500">
                      Upload a new version of the invoice document
                    </p>
                                    </div>
                                </div>

                {/* Document Versions */}
                <div className="space-y-4">
                  <h4 className="font-medium">Document Versions</h4>
                  {invoiceFiles.map((file) => (
                    <div key={file.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-6 w-6 text-blue-600" />
                                <div>
                            <p className="font-medium">{file.fileName}</p>
                            <p className="text-sm text-gray-500">
                              Version {file.version} • {file.uploadDate.toLocaleDateString()}
                            </p>
                                    </div>
                                </div>
                        <div className="flex items-center space-x-2">
                          {file.isCurrent && (
                            <Badge variant="default">Current</Badge>
                          )}
                          <Badge variant="outline">{formatFileSize(file.fileSize)}</Badge>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => removeFile(file.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                                    </div>
                                </div>

                      {/* Document Metadata */}
                      {file.metadata && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-3 pt-3 border-t">
                          <div>
                            <span className="font-medium">Pages:</span> {file.metadata.pageCount}
                          </div>
                                <div>
                            <span className="font-medium">Language:</span> {file.metadata.language}
                                    </div>
                          <div>
                            <span className="font-medium">Quality:</span> {file.metadata.quality}
                                </div>
                                    <div>
                            <span className="font-medium">OCR Confidence:</span> {Math.round((file.metadata.ocrConfidence || 0) * 100)}%
                                        </div>
                                    </div>
                                )}
                    </div>
                  ))}
                  
                  {invoiceFiles.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No documents uploaded yet</p>
                      <p className="text-sm">Upload a file in the Upload & Process tab</p>
                                    </div>
                                )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review & Save Invoice</CardTitle>
                <CardDescription>
                  Review extracted data and save the invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {ocrResult ? (
                  <>
                    {/* Invoice Summary */}
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h4 className="font-medium text-blue-900 mb-3">Invoice Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">Vendor:</span> {ocrResult.vendorName || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Invoice Number:</span> {ocrResult.invoiceNumber || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {ocrResult.invoiceDate || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Due Date:</span> {ocrResult.dueDate || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Total Amount:</span> {getCurrencySymbol(ocrResult.currency)}{ocrResult.totalAmount || ocrResult.invoiceValue || 0}
                        </div>
                        <div>
                          <span className="font-medium">Currency:</span> {ocrResult.currency || 'USD'}
                        </div>
                      </div>
                    </div>

                    {/* Line Items */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Line Items</h4>
                      <div className="space-y-2">
                        {ocrResult.lineItems && Array.isArray(ocrResult.lineItems) && ocrResult.lineItems.length > 0 ? (
                          ocrResult.lineItems.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                              <div>
                                <p className="font-medium">{item.description || 'No description'}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Qty: {item.quantity || 0} × {getCurrencySymbol(ocrResult.currency)}{item.unitPrice || 0}
                                </p>
                              </div>
                              <p className="font-medium">{getCurrencySymbol(ocrResult.currency)}{item.amount || 0}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            <p>No line items found</p>
                            <p className="text-sm">Line items will appear here after OCR processing</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document Info */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Document Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">Files:</span> {invoiceFiles.length} document(s)
                        </div>
                        <div>
                          <span className="font-medium">Current Version:</span> {invoiceFiles.find(f => f.isCurrent)?.version || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Processing Date:</span> {new Date().toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span> Ready to Save
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                <Button
                        onClick={handleSaveInvoice}
                        disabled={isSaving}
                        size="lg"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {isSaving ? 'Saving...' : 'Save Invoice'}
                      </Button>
                    </div>
                        </>
                    ) : (
                  <div className="text-center text-gray-500 py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No invoice data to review</p>
                    <p className="text-sm">Process a document first in the Upload & Process tab</p>
                  </div>
                )}
              </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
    );
};

export default InvoiceUploadForm; 