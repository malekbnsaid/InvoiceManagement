import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export function InvoiceWorkflowDiagram() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Processing Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            This diagram shows how invoices flow through your organization:
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-2xl">📤</span>
              <div>
                <div className="font-medium text-blue-900">1. Uploaded</div>
                <div className="text-sm text-blue-700">Secretary uploads via OCR</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <span className="text-2xl">📧</span>
              <div>
                <div className="font-medium text-purple-900">2. Sent to PM</div>
                <div className="text-sm text-purple-700">Email sent to Project Manager</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
              <span className="text-2xl">👤</span>
              <div>
                <div className="font-medium text-indigo-900">3. PM Reviewed</div>
                <div className="text-sm text-indigo-700">PM reviewed and attached documents</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <span className="text-2xl">👔</span>
              <div>
                <div className="font-medium text-orange-900">4. Sent to Head</div>
                <div className="text-sm text-orange-700">Sent to Head for approval</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-2xl">✅</span>
              <div>
                <div className="font-medium text-green-900">5. Head Approved</div>
                <div className="text-sm text-green-700">Head has approved the invoice</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-cyan-50 rounded-lg">
              <span className="text-2xl">🏢</span>
              <div>
                <div className="font-medium text-cyan-900">6. Sent to Procurement</div>
                <div className="text-sm text-cyan-700">Sent to Procurement department</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg">
              <span className="text-2xl">⚙️</span>
              <div>
                <div className="font-medium text-teal-900">7. Procurement Processed</div>
                <div className="text-sm text-teal-700">Procurement has processed the invoice</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-2xl">💰</span>
              <div>
                <div className="font-medium text-green-900">8. Paid</div>
                <div className="text-sm text-green-700">Data entered in external system - considered paid</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <div className="text-sm text-yellow-800">
              <strong>Note:</strong> At any stage, invoices can be rejected (❌) or cancelled (🚫). 
              Rejected invoices can be resubmitted from the beginning.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
