import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  UserIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Mock data
const invoiceData = {
  id: 'INV-001',
  date: '2023-05-11',
  dueDate: '2023-06-10',
  vendor: 'Tech Solutions LLC',
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

const InvoiceDetails = () => {
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
              <ul className="space-y-2">
                <li className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                      <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">Invoice PDF</span>
                  </div>
                  <button className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
                    View
                  </button>
                </li>
                <li className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                      <DocumentTextIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">Payment Receipt</span>
                  </div>
                  <button className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
                    View
                  </button>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default InvoiceDetails; 