import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Edit3, 
  FileText, 
  AlertTriangle, 
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';
import { InvoiceStatus } from '../../types/enums';
import { useAuth } from '../../context/AuthContext';
import { invoiceApi } from '../../services/api/invoiceApi';

interface OcrField {
  name: string;
  label: string;
  value: string;
  confidence: number;
  isRequired: boolean;
  type: 'text' | 'number' | 'date' | 'currency';
}

interface ManualOcrCorrectionProps {
  invoiceId: number;
  ocrData: any;
  onCorrectionComplete: (correctedData: any) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function ManualOcrCorrection({ 
  invoiceId,
  ocrData,
  onCorrectionComplete, 
  disabled = false,
  className 
}: ManualOcrCorrectionProps) {
  const { user } = useAuth();
  const [fields, setFields] = useState<OcrField[]>([]);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize fields from OCR data
  useEffect(() => {
    if (ocrData) {
      const ocrFields: OcrField[] = [
        {
          name: 'invoiceNumber',
          label: 'Invoice Number',
          value: ocrData.invoiceNumber || '',
          confidence: ocrData.invoiceNumberConfidence || 0,
          isRequired: true,
          type: 'text'
        },
        {
          name: 'vendorName',
          label: 'Vendor Name',
          value: ocrData.vendorName || '',
          confidence: ocrData.vendorNameConfidence || 0,
          isRequired: true,
          type: 'text'
        },
        {
          name: 'invoiceDate',
          label: 'Invoice Date',
          value: ocrData.invoiceDate ? new Date(ocrData.invoiceDate).toISOString().split('T')[0] : '',
          confidence: ocrData.invoiceDateConfidence || 0,
          isRequired: true,
          type: 'date'
        },
        {
          name: 'invoiceValue',
          label: 'Invoice Amount',
          value: ocrData.invoiceValue?.toString() || '',
          confidence: ocrData.invoiceValueConfidence || 0,
          isRequired: true,
          type: 'currency'
        },
        {
          name: 'vendorTaxId',
          label: 'Vendor Tax ID',
          value: ocrData.vendorTaxId || '',
          confidence: ocrData.vendorTaxIdConfidence || 0,
          isRequired: false,
          type: 'text'
        },
        {
          name: 'dueDate',
          label: 'Due Date',
          value: ocrData.dueDate ? new Date(ocrData.dueDate).toISOString().split('T')[0] : '',
          confidence: ocrData.dueDateConfidence || 0,
          isRequired: false,
          type: 'date'
        }
      ];
      setFields(ocrFields);
    }
  }, [ocrData]);

  const handleFieldChange = (fieldName: string, newValue: string) => {
    setFields(prev => prev.map(field => 
      field.name === fieldName 
        ? { ...field, value: newValue }
        : field
    ));
    setHasChanges(true);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const hasLowConfidenceFields = fields.some(field => field.confidence < 0.6);
  const hasRequiredFieldsEmpty = fields.some(field => field.isRequired && !field.value.trim());

  const handleSaveCorrections = async () => {
    if (hasRequiredFieldsEmpty) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCorrecting(true);
    try {
      // Prepare corrected data
      const correctedData = {
        invoiceNumber: fields.find(f => f.name === 'invoiceNumber')?.value || '',
        vendorName: fields.find(f => f.name === 'vendorName')?.value || '',
        invoiceDate: fields.find(f => f.name === 'invoiceDate')?.value || '',
        invoiceValue: parseFloat(fields.find(f => f.name === 'invoiceValue')?.value || '0'),
        vendorTaxId: fields.find(f => f.name === 'vendorTaxId')?.value || '',
        dueDate: fields.find(f => f.name === 'dueDate')?.value || '',
        correctedBy: user?.userId?.toString() || user?.email || 'unknown',
        correctedAt: new Date().toISOString()
      };

      await onCorrectionComplete(correctedData);
      setHasChanges(false);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving corrections:', error);
      alert('Failed to save corrections. Please try again.');
    } finally {
      setIsCorrecting(false);
    }
  };

  const handleReset = () => {
    setFields(prev => prev.map(field => ({
      ...field,
      value: ocrData[field.name] || ''
    })));
    setHasChanges(false);
  };

  if (!ocrData) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5 text-blue-600" />
          Manual OCR Correction
        </CardTitle>
        <CardDescription>
          Review and correct OCR-extracted data with low confidence scores.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OCR Quality Alert */}
        {hasLowConfidenceFields && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Low OCR Confidence:</strong> Some fields have low confidence scores and may need manual correction.
            </AlertDescription>
          </Alert>
        )}

        {!showForm ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">
                Review the OCR-extracted data and make corrections if needed.
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => setShowForm(true)}
                  disabled={disabled}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Review & Correct
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowForm(true)}
                  disabled={disabled}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Data
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name} className="flex items-center gap-2">
                    {field.label}
                    {field.isRequired && <span className="text-red-500">*</span>}
                    <Badge 
                      className={`${getConfidenceColor(field.confidence)} text-xs`}
                    >
                      {getConfidenceText(field.confidence)} ({Math.round(field.confidence * 100)}%)
                    </Badge>
                  </Label>
                  
                  <Input
                    id={field.name}
                    type={field.type === 'date' ? 'date' : field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
                    value={field.value}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className={field.confidence < 0.6 ? 'border-orange-300 bg-orange-50' : ''}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                  
                  {field.confidence < 0.6 && (
                    <p className="text-xs text-orange-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low confidence - please verify this value
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={handleSaveCorrections}
                disabled={disabled || isCorrecting || !hasChanges || hasRequiredFieldsEmpty}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isCorrecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Corrections
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={disabled || isCorrecting || !hasChanges}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  handleReset();
                }}
                disabled={disabled || isCorrecting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>

            {/* Changes Indicator */}
            {hasChanges && (
              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  You have unsaved changes. Click "Save Corrections" to apply them.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
