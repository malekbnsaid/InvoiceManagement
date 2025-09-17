import React, { useState } from 'react';
import { SimpleInvoiceStatusChange } from './SimpleInvoiceStatusChange';
import { SimpleInvoiceWorkflow } from './SimpleInvoiceWorkflow';
import { InvoiceStatus } from '../../types/enums';

// Example component showing how to use the simple invoice status system
export function InvoiceStatusExample() {
  const [invoice, setInvoice] = useState({
    id: 1,
    status: InvoiceStatus.Draft,
    invoiceNumber: 'INV-001',
    invoiceValue: 1000,
    vendorName: 'Example Vendor'
  });

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    // Update the invoice status in your state
    setInvoice(prev => ({ ...prev, status: newStatus }));
    
    // You can also call your API here to persist the change
    console.log(`Status changed to: ${newStatus}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Invoice Status Management</h1>
        <p className="text-gray-600">Simple workflow for managing invoice statuses</p>
      </div>

      {/* Invoice Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-medium">Invoice Number:</label>
            <p>{invoice.invoiceNumber}</p>
          </div>
          <div>
            <label className="font-medium">Vendor:</label>
            <p>{invoice.vendorName}</p>
          </div>
          <div>
            <label className="font-medium">Amount:</label>
            <p>${invoice.invoiceValue}</p>
          </div>
          <div>
            <label className="font-medium">Current Status:</label>
            <p className="font-semibold">{invoice.status}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Change Component */}
        <SimpleInvoiceStatusChange
          invoiceId={invoice.id}
          currentStatus={invoice.status}
          onStatusChange={handleStatusChange}
        />

        {/* Workflow Visualization */}
        <SimpleInvoiceWorkflow currentStatus={invoice.status} />
      </div>

      {/* Status History (Mock) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Status History</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Created as Draft</span>
            <span className="text-gray-500 ml-auto">2 hours ago</span>
          </div>
          {invoice.status !== InvoiceStatus.Draft && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Status changed to {invoice.status}</span>
              <span className="text-gray-500 ml-auto">Just now</span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800">
          <li>Select a new status from the dropdown</li>
          <li>Click "Change Status" to update</li>
          <li>The workflow will show your progress</li>
          <li>Status changes are automatically saved</li>
        </ol>
      </div>
    </div>
  );
}
