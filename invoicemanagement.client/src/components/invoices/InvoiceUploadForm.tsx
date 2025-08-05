import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { 
    FileUp as DocumentArrowUpIcon, 
    X as XMarkIcon, 
    CheckCircle as CheckCircleIcon,
    AlertCircle as AlertCircleIcon,
    Loader2 as SpinnerIcon,
    Save as SaveIcon
} from 'lucide-react';
import { invoiceService } from '../../services/invoiceService';
import { OcrResult } from '../../types/interfaces';
import { useToast } from '../ui/use-toast';
import { formatCurrency } from '../../utils/formatters';

interface InvoiceUploadFormProps {
    onOcrComplete?: (result: OcrResult) => void;
}

const InvoiceUploadForm: React.FC<InvoiceUploadFormProps> = ({ onOcrComplete }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const onDrop = (acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
        setOcrResult(null);
        setUploadProgress(0);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        },
        maxFiles: 1
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setOcrResult(null);
        setUploadProgress(0);
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        
        try {
            setUploading(true);
            setUploadProgress(10);

            // Simulate progress while processing
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 500);

            const result = await invoiceService.uploadAndProcess(files[0]);
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            setOcrResult(result);
            if (result.isProcessed) {
                onOcrComplete?.(result);
                toast({
                    title: "OCR Processing Complete",
                    description: `Confidence Score: ${(result.confidenceScore * 100).toFixed(1)}%`,
                });
            } else {
                toast({
                    title: "OCR Processing Warning",
                    description: result.errorMessage || "Some fields could not be extracted",
                    variant: "destructive"
                });
            }
        } catch (error) {
            setOcrResult(null);
            toast({
                title: "Error",
                description: "Failed to process the invoice",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!ocrResult) {
            toast({
                title: "Error",
                description: "No processed invoice data to save",
                variant: "destructive"
            });
            return;
        }

        // Validate required fields
        if (!ocrResult.invoiceNumber) {
            toast({
                title: "Error",
                description: "Invoice number is required",
                variant: "destructive"
            });
            return;
        }

        if (!ocrResult.invoiceValue && !ocrResult.totalAmount) {
            toast({
                title: "Error",
                description: "Invoice amount is required",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            const savedInvoice = await invoiceService.saveInvoice(ocrResult);
            toast({
                title: "Success",
                description: "Invoice saved successfully",
            });
            
            // Navigate to the invoice list instead of a specific invoice
            navigate('/invoices');
        } catch (error: any) {
            console.error('Error saving invoice:', error);
            toast({
                title: "Error",
                description: error.response?.data || error.message || "Failed to save invoice",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const renderField = (label: string, value: any, formatter?: (value: any) => string) => {
        const displayValue = value 
            ? (formatter ? formatter(value) : value)
            : 'Not found';
            
        return (
            <div>
                <label className="text-sm text-gray-500">{label}</label>
                <p className="font-medium">{displayValue}</p>
            </div>
        );
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString();
    };

    const formatMoney = (amount: number) => {
        return formatCurrency(amount, ocrResult?.currency);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Upload Invoice</CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                        ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}
                >
                    <input {...getInputProps()} />
                    <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                        {isDragActive
                            ? "Drop the files here..."
                            : "Drag 'n' drop invoice files here, or click to select"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Supports PDF, JPG, PNG files
                    </p>
                </div>

                <AnimatePresence>
                    {files.length > 0 && (
                        <motion.div 
                            key="file-list"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4"
                        >
                            <h3 className="text-sm font-medium mb-2">Selected Files</h3>
                            {files.map((file, index) => (
                                <motion.div 
                                    key={`${file.name}-${index}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center">
                                        <DocumentArrowUpIcon className="h-5 w-5 text-gray-400 mr-2" />
                                        <div>
                                            <p className="text-sm font-medium">{file.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {(file.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeFile(index)}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {uploading && (
                        <motion.div
                            key="upload-progress"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <SpinnerIcon className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Processing invoice...</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2" />
                        </motion.div>
                    )}

                    {ocrResult && (
                        <motion.div
                            key="ocr-result"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 space-y-4"
                        >
                            <Alert variant={ocrResult.isProcessed ? "default" : "destructive"}>
                                {ocrResult.isProcessed ? (
                                    <CheckCircleIcon className="h-4 w-4" />
                                ) : (
                                    <AlertCircleIcon className="h-4 w-4" />
                                )}
                                <AlertTitle>
                                    {ocrResult.isProcessed ? "OCR Processing Complete" : "OCR Processing Warning"}
                                </AlertTitle>
                                <AlertDescription>
                                    {ocrResult.confidenceScore > 0 
                                        ? `Confidence Score: ${(ocrResult.confidenceScore * 100).toFixed(1)}%`
                                        : "Confidence score not available"}
                                    {ocrResult.errorMessage && (
                                        <div className="text-sm text-red-500 mt-1">{ocrResult.errorMessage}</div>
                                    )}
                                    {ocrResult.isProcessed && (
                                        <div className="text-sm text-gray-500 mt-2">
                                            Please review the extracted data below and click "Save Invoice" to save it to the database.
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>

                            <div className="bg-gray-50 p-4 rounded-lg space-y-6">
                                <div>
                                    <h4 className="font-medium mb-3">Invoice Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {renderField("Invoice Number", ocrResult.invoiceNumber)}
                                        {renderField("Invoice Date", ocrResult.invoiceDate, formatDate)}
                                        {renderField("Due Date", ocrResult.dueDate, formatDate)}
                                        {renderField("Reference Number", ocrResult.referenceNumber)}
                                        {renderField("PO Number", ocrResult.purchaseOrderNumber)}
                                        {renderField("Payment Terms", ocrResult.paymentTerms)}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-3">Financial Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {renderField("Sub Total", ocrResult.subTotal, formatMoney)}
                                        {renderField("Tax Amount", ocrResult.taxAmount, formatMoney)}
                                        {renderField("Total Amount", ocrResult.totalAmount || ocrResult.invoiceValue, formatMoney)}
                                        {renderField("Tax Rate", ocrResult.taxRate)}
                                        {renderField("Currency", ocrResult.currency)}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-3">Vendor Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {renderField("Vendor Name", ocrResult.vendorName)}
                                        {renderField("Tax ID", ocrResult.vendorTaxId)}
                                        {renderField("Address", ocrResult.vendorAddress)}
                                        {renderField("Phone", ocrResult.vendorPhone)}
                                        {renderField("Email", ocrResult.vendorEmail)}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-3">Customer Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {renderField("Customer Name", ocrResult.customerName)}
                                        {renderField("Customer Number", ocrResult.customerNumber)}
                                        {renderField("Billing Address", ocrResult.billingAddress)}
                                        {renderField("Shipping Address", ocrResult.shippingAddress)}
                                    </div>
                                </div>

                                {ocrResult.description && (
                                    <div>
                                        <h4 className="font-medium mb-3">Line Items</h4>
                                        <div className="bg-white p-3 rounded border">
                                            <pre className="whitespace-pre-wrap text-sm">{ocrResult.description}</pre>
                                        </div>
                                    </div>
                                )}

                                {ocrResult.remark && (
                                    <div>
                                        <h4 className="font-medium mb-3">Additional Notes</h4>
                                        <p className="text-sm text-gray-600">{ocrResult.remark}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
                <Button
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploading}
                >
                    {uploading ? (
                        <>
                            <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
                            Processing
                        </>
                    ) : (
                        <>
                            <DocumentArrowUpIcon className="mr-2 h-4 w-4" />
                            Process Invoice
                        </>
                    )}
                </Button>
                {ocrResult?.isProcessed && (
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        variant="default"
                    >
                        {isSaving ? (
                            <>
                                <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <SaveIcon className="mr-2 h-4 w-4" />
                                Save Invoice
                            </>
                        )}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default InvoiceUploadForm; 