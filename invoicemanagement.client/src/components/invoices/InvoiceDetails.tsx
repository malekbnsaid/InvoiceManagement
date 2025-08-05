import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { Invoice } from '../../types/interfaces';
import { invoiceService } from '../../services/invoiceService';
import { CurrencyType } from '../../types/enums';

const InvoiceDetails = () => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        if (!id || isNaN(parseInt(id))) {
          console.error('Invalid invoice ID');
          setLoading(false);
          return;
        }
        const data = await invoiceService.getInvoiceById(parseInt(id));
        setInvoice(data);
      } catch (error) {
        console.error('Error fetching invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!invoice) {
    return <div>Invoice not found or invalid ID</div>;
  }

  const getCurrencySymbol = (currency: CurrencyType) => {
    switch (currency) {
      case CurrencyType.USD:
        return '$';
      case CurrencyType.EUR:
        return '€';
      case CurrencyType.GBP:
        return '£';
      default:
        return '';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return `${getCurrencySymbol(invoice.currency)}${amount.toLocaleString()}`;
  };

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
                  Invoice #{invoice.invoiceNumber}
                </CardTitle>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  invoice.status === 1 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {invoice.status === 1 ? 'Processed' : 'Pending'}
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
                      {invoice.vendorName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-500 mr-1" />
                      {formatCurrency(invoice.invoiceValue)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Invoice Date</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                      <CalendarIcon className="h-5 w-5 text-gray-500 mr-1" />
                      {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                      <CalendarIcon className="h-5 w-5 text-gray-500 mr-1" />
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Currency</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-500 mr-1" />
                      {CurrencyType[invoice.currency] || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">PO Number</h3>
                    <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                      <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-1" />
                      {invoice.purchaseOrderNumber || 'N/A'}
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
                          <td className="px-4 py-3">{formatCurrency(invoice.subTotal)}</td>
                        </tr>
                        <tr className="border-b dark:border-gray-700">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Tax Amount</td>
                          <td className="px-4 py-3">{formatCurrency(invoice.taxAmount)}</td>
                        </tr>
                        <tr className="font-semibold text-gray-900 dark:text-white">
                          <td className="px-4 py-3">Total Amount</td>
                          <td className="px-4 py-3">{formatCurrency(invoice.invoiceValue)}</td>
                        </tr>
                      </tbody>
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
    </motion.div>
  );
};

export default InvoiceDetails; 