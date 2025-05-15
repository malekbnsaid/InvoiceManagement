import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  UserIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';

// Mock data
const invoiceData = {
  id: 'INV-001',
  date: '2023-05-11',
  dueDate: '2023-06-10',
  vendor: 'Tech Solutions LLC',
  department: 'Information Technology',
  vendorSpecialty: 'Software Development & Consulting',
  lpoNumber: 'LPO-2023-089',
  completionDate: '2023-05-18',
  amount: '$12,500',
  status: 'Paid',
  invoiceNumber: 'Q01230',
  paymentDate: '2023-05-20',
  description: 'IT Consulting Services - May 2023',
  items: [
    { id: 1, description: 'Software Development', quantity: 80, unitPrice: '$125', total: '$10,000' },
    { id: 2, description: 'System Maintenance', quantity: 20, unitPrice: '$125', total: '$2,500' }
  ]
};

// Certificate component
interface CertificateProps {
  data: {
    department: string;
    vendor: string;
    vendorSpecialty: string;
    lpoNumber: string;
    completionDate: string;
    invoiceNumber: string;
  };
}

const Certificate: React.FC<CertificateProps> = ({ data }) => {
  return (
    <div className="border-2 border-gray-300 rounded-md p-6 bg-white text-black mx-auto max-w-2xl">
      <div className="flex justify-center mb-6">
        <div className="bg-gray-200 p-2 rounded">
          <span className="text-xl font-bold">Company Logo</span>
        </div>
      </div>
      
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-2">COMPLETION CERTIFICATE</h1>
        <p>This certificate confirms the successful completion of services</p>
      </div>
      
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-2 border-b pb-2">
          <div className="font-bold">Department:</div>
          <div>{data.department}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 border-b pb-2">
          <div className="font-bold">Vendor:</div>
          <div>{data.vendor}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 border-b pb-2">
          <div className="font-bold">Specialty:</div>
          <div>{data.vendorSpecialty}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 border-b pb-2">
          <div className="font-bold">LPO Number:</div>
          <div>{data.lpoNumber}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 border-b pb-2">
          <div className="font-bold">Completion Date:</div>
          <div>{data.completionDate}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 border-b pb-2">
          <div className="font-bold">Invoice Number:</div>
          <div>{data.invoiceNumber}</div>
        </div>
      </div>
      
      <div className="text-center mb-8">
        <p className="italic">This certificate confirms that all services have been completed satisfactorily 
          in accordance with our agreement.</p>
      </div>
      
      <div className="flex justify-between mt-12">
        <div>
          <div className="border-t-2 border-black pt-2 w-40">
            <p className="text-sm">Authorized Signature</p>
          </div>
        </div>
        
        <div>
          <div className="border-t-2 border-black pt-2 w-40">
            <p className="text-sm">Date</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Email form component
interface EmailFormProps {
  data: {
    vendor: string;
    lpoNumber: string;
  };
  onClose: () => void;
}

const EmailForm: React.FC<EmailFormProps> = ({ data, onClose }) => {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  
  const handleSendEmail = () => {
    setIsSending(true);
    // Simulate sending email
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      // Close after showing success
      setTimeout(() => {
        onClose();
      }, 2000);
    }, 1500);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Send Completion Certificate</h2>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="recipient">
                  To:
                </label>
                <input
                  id="recipient"
                  type="email"
                  className="w-full p-2 border rounded"
                  placeholder="recipient@example.com"
                  defaultValue="pmEmail@olympic.cqa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="cc">
                  CC:
                </label>
                <input
                  id="cc"
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder="cc1@example.com, cc2@example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="subject">
                Subject:
              </label>
              <input
                id="subject"
                type="text"
                className="w-full p-2 border rounded"
                defaultValue={`Completion Certificate - ${data.lpoNumber}`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="message">
                Message:
              </label>
              <textarea
                id="message"
                className="w-full p-2 border rounded min-h-[120px]"
                defaultValue={`Dear ${data.vendor},\n\nPlease find attached the completion certificate for the services rendered as per LPO ${data.lpoNumber}.\n\nThank you for your services.\n\nBest regards,\nFinance Department`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Certificate Preview:
              </label>
              <div className="border rounded p-4 bg-gray-50 dark:bg-gray-900">
                <div className="transform scale-75 origin-top-left">
                  <Certificate data={invoiceData} />
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <input type="checkbox" id="include-invoice" defaultChecked className="mr-2" />
              <label htmlFor="include-invoice" className="text-sm">
                Also attach invoice PDF
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isSending || isSent}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
            >
              {isSending ? 'Sending...' : isSent ? 'Sent!' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InvoiceDetails = () => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <DocumentTextIcon className="h-6 w-6 text-primary-500 mr-2" />
                  Invoice #{invoiceData.id}
                </CardTitle>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  invoiceData.status === 'Paid' 
                    ? 'bg-green-100 text-green-800' 
                    : invoiceData.status === 'Pending' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {invoiceData.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                      <UserIcon className="h-5 w-5 text-gray-500 mr-1" />
                      {invoiceData.vendor}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-500 mr-1" />
                      {invoiceData.amount}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Invoice Date</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                      <CalendarIcon className="h-5 w-5 text-gray-500 mr-1" />
                      {invoiceData.date}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                      <CalendarIcon className="h-5 w-5 text-gray-500 mr-1" />
                      {invoiceData.dueDate}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-500 mr-1" />
                      {invoiceData.department}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">LPO Number</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                      <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-1" />
                      {invoiceData.lpoNumber}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                  <p className="text-base text-gray-900 dark:text-white mt-1">
                    {invoiceData.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Invoice Items</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3">Quantity</th>
                          <th className="px-4 py-3">Unit Price</th>
                          <th className="px-4 py-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceData.items.map((item) => (
                          <tr key={item.id} className="border-b dark:border-gray-700">
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                              {item.description}
                            </td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3">{item.unitPrice}</td>
                            <td className="px-4 py-3">{item.total}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-semibold text-gray-900 dark:text-white">
                          <td className="px-4 py-3" colSpan={3}>Total</td>
                          <td className="px-4 py-3">{invoiceData.amount}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-200 rounded-full dark:bg-green-900">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="w-px h-full bg-gray-300 dark:bg-gray-600"></div>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Paid</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{invoiceData.paymentDate}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Payment processed successfully</p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-200 rounded-full dark:bg-blue-900">
                      <ClockIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="w-px h-full bg-gray-300 dark:bg-gray-600"></div>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Processed</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2023-05-15</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Invoice verified and processed</p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full dark:bg-gray-700">
                      <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Received</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{invoiceData.date}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Invoice received and recorded</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                      <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">Invoice PDF</span>
                  </div>
                  <button className="text-primary hover:text-primary-700 text-sm font-medium">
                    View
                  </button>
                </li>
                
                <li className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                      <DocumentTextIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">Completion Certificate</span>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setShowEmailForm(true)}
                      className="text-primary hover:text-primary-700 text-sm font-medium"
                    >
                      Send
                    </button>
                    <button className="text-primary hover:text-primary-700 text-sm font-medium">
                      View
                    </button>
                  </div>
                </li>
                
                <li className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded">
                      <DocumentTextIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">LPO</span>
                  </div>
                  <button className="text-primary hover:text-primary-700 text-sm font-medium">
                    View
                  </button>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Email Form Modal */}
      {showEmailForm && (
        <EmailForm 
          data={invoiceData} 
          onClose={() => setShowEmailForm(false)} 
        />
      )}
    </motion.div>
  );
};

export default InvoiceDetails; 