import React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { 
  DocumentDuplicateIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

// Mock data for LPOs
const mockLPOs = [
  {
    id: 1,
    lpoNumber: 'LPO-20230001',
    issueDate: '2023-03-15',
    supplierName: 'Network Solutions Inc.',
    description: 'Network equipment and installation services',
    totalAmount: 50000,
    predictedAmount: 48000,
    actualAmount: 37500,
    currency: 'USD',
    startDate: '2023-04-01',
    completionDate: '2023-05-15',
    projectId: 1,
    projectNumber: 'PRJ-2023-001',
    projectName: 'Network Infrastructure Upgrade',
    status: 'Active',
    invoicesCount: 3,
    remainingAmount: 12500,
    zajelNumber: 'ZAJ-2023-001',
    vendorId: 1,
    vendorSpecialty: 'Network Infrastructure',
    paymentTerms: 'Net 30',
    deliveryLocation: 'Main Office',
    approvalDate: '2023-03-20',
    sectionId: 1,
    sectionName: 'IT Infrastructure',
    sectionAbbreviation: 'IT-INF',
    departmentId: 1,
    departmentName: 'Information Technology',
    comments: 'Priority implementation required',
    attachments: ['scope_document.pdf', 'vendor_proposal.pdf'],
    createdBy: 'John Smith',
    createdAt: '2023-03-10',
    modifiedBy: 'Jane Doe',
    modifiedAt: '2023-03-20'
  },
  {
    id: 2,
    lpoNumber: 'LPO-20230002',
    issueDate: '2023-03-20',
    supplierName: 'Tech Consulting Group',
    description: 'ERP implementation consulting services',
    totalAmount: 75000,
    predictedAmount: 72000,
    actualAmount: 45000,
    currency: 'USD',
    startDate: '2023-04-15',
    completionDate: '2023-10-30',
    projectId: 2,
    projectNumber: 'PRJ-2023-002',
    projectName: 'ERP System Implementation',
    status: 'Active',
    invoicesCount: 4,
    remainingAmount: 30000,
    zajelNumber: 'ZAJ-2023-002',
    vendorId: 2,
    vendorSpecialty: 'ERP Implementation',
    paymentTerms: 'Net 45',
    deliveryLocation: 'IT Department',
    approvalDate: '2023-03-25'
  },
  {
    id: 3,
    lpoNumber: 'LPO-20230003',
    issueDate: '2023-01-10',
    supplierName: 'CreativeTech Design',
    description: 'Website redesign and development',
    totalAmount: 35000,
    predictedAmount: 35000,
    actualAmount: 35000,
    currency: 'USD',
    startDate: '2023-01-15',
    completionDate: '2023-04-15',
    projectId: 3,
    projectNumber: 'PRJ-2023-003',
    projectName: 'Company Website Redesign',
    status: 'Completed',
    invoicesCount: 4,
    remainingAmount: 0,
    zajelNumber: 'ZAJ-2023-003',
    vendorId: 3,
    vendorSpecialty: 'Web Development',
    paymentTerms: 'Net 30',
    deliveryLocation: 'Remote',
    approvalDate: '2023-01-12'
  },
  {
    id: 4,
    lpoNumber: 'LPO-20230004',
    issueDate: '2023-04-05',
    supplierName: 'SecureNet Systems',
    description: 'Cybersecurity software and implementation',
    totalAmount: 42000,
    predictedAmount: 40000,
    actualAmount: 24000,
    currency: 'USD',
    startDate: '2023-04-15',
    completionDate: '2023-06-30',
    projectId: 4,
    projectNumber: 'PRJ-2023-004',
    projectName: 'Cybersecurity Enhancement',
    status: 'Active',
    invoicesCount: 2,
    remainingAmount: 18000,
    zajelNumber: 'ZAJ-2023-004',
    vendorId: 4,
    vendorSpecialty: 'Cybersecurity',
    paymentTerms: 'Net 30',
    deliveryLocation: 'IT Department',
    approvalDate: '2023-04-10'
  },
  {
    id: 5,
    lpoNumber: 'LPO-20230005',
    issueDate: '2023-02-10',
    supplierName: 'Cloud Infrastructure Partners',
    description: 'Server virtualization hardware and services',
    totalAmount: 62000,
    predictedAmount: 60000,
    actualAmount: 62000,
    currency: 'USD',
    startDate: '2023-02-20',
    completionDate: '2023-05-10',
    projectId: 5,
    projectNumber: 'PRJ-2023-005',
    projectName: 'Server Virtualization',
    status: 'Completed',
    invoicesCount: 3,
    remainingAmount: 0,
    zajelNumber: 'ZAJ-2023-005',
    vendorId: 5,
    vendorSpecialty: 'Cloud Infrastructure',
    paymentTerms: 'Net 45',
    deliveryLocation: 'Data Center',
    approvalDate: '2023-02-15'
  }
];

type Project = { id: number; name: string };
type Vendor = { id: number; name: string };
type LPO = typeof mockLPOs[0];

const LPOsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null as number | null);
  const [selectedStatus, setSelectedStatus] = useState(null as string | null);
  const [selectedVendor, setSelectedVendor] = useState(null as number | null);
  const [lpos, setLpos] = useState(mockLPOs as LPO[]);

  // Filter LPOs based on search and filters
  const filteredLPOs = lpos.filter((lpo: LPO) => {
    const matchesSearch = searchTerm === '' || 
      lpo.lpoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lpo.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lpo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lpo.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lpo.zajelNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProject = selectedProject === null || lpo.projectId === selectedProject;
    const matchesStatus = selectedStatus === null || lpo.status === selectedStatus;
    const matchesVendor = selectedVendor === null || lpo.vendorId === selectedVendor;
    
    return matchesSearch && matchesProject && matchesStatus && matchesVendor;
  });

  // Extract unique projects, vendors and statuses for filters
  const projects = [...new Set(lpos.map((lpo: LPO) => ({ id: lpo.projectId, name: lpo.projectName })))] as Project[];
  const vendors = [...new Set(lpos.map((lpo: LPO) => ({ id: lpo.vendorId, name: lpo.supplierName })))] as Vendor[];
  const statuses = [...new Set(lpos.map((lpo: LPO) => lpo.status))] as string[];

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'secondary';
      case 'pending_approval':
        return 'warning';
      case 'approved':
        return 'success';
      case 'active':
        return 'default';
      case 'on_hold':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getAmountVarianceColor = (predicted: number, actual: number) => {
    if (actual === 0) return 'text-gray-500'; // Not started
    const variance = ((actual - predicted) / predicted) * 100;
    if (variance <= -5) return 'text-green-600 dark:text-green-400'; // Under budget
    if (variance >= 5) return 'text-red-600 dark:text-red-400'; // Over budget
    return 'text-yellow-600 dark:text-yellow-400'; // On budget
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <DocumentDuplicateIcon className="h-6 w-6 mr-2 text-primary-500" />
          Local Purchase Orders
        </h1>
        <Button className="flex items-center">
          <PlusIcon className="h-4 w-4 mr-1" />
          New LPO
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
            <div className="relative w-full md:w-64">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search LPOs..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
                value={selectedProject?.toString() || ''}
                onChange={(e) => setSelectedProject(e.target.value === '' ? null : parseInt(e.target.value))}
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
                value={selectedVendor?.toString() || ''}
                onChange={(e) => setSelectedVendor(e.target.value === '' ? null : parseInt(e.target.value))}
              >
                <option value="">All Vendors</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </select>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
                value={selectedStatus || ''}
                onChange={(e) => setSelectedStatus(e.target.value === '' ? null : e.target.value)}
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>LPO Details</TableHead>
                <TableHead>Project & Section</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Amount Tracking</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLPOs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    No LPOs found matching your criteria.
                  </TableCell>
                </TableRow>
              ) :
                filteredLPOs.map((lpo: LPO) => (
                  <TableRow key={lpo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{lpo.lpoNumber}</div>
                        <div className="text-sm text-gray-500">Zajel: {lpo.zajelNumber}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">{lpo.description}</div>
                        {lpo.createdBy && lpo.createdAt && (
                          <div className="text-xs text-gray-400">
                            Created by {lpo.createdBy} on {format(new Date(lpo.createdAt), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{lpo.projectName}</div>
                        <div className="text-sm text-gray-500">{lpo.projectNumber}</div>
                        <div className="text-sm text-gray-500">
                          {lpo.sectionName} ({lpo.sectionAbbreviation})
                        </div>
                        <div className="text-sm text-gray-500">{lpo.departmentName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{lpo.supplierName}</div>
                        <div className="text-sm text-gray-500">{lpo.vendorSpecialty}</div>
                        <div className="text-sm text-gray-500">{lpo.paymentTerms}</div>
                        <div className="text-sm text-gray-500">{lpo.deliveryLocation}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">Start: {format(new Date(lpo.startDate), 'MMM d, yyyy')}</div>
                        <div className="text-sm">End: {format(new Date(lpo.completionDate), 'MMM d, yyyy')}</div>
                        <div className="text-sm text-gray-500">Approved: {format(new Date(lpo.approvalDate), 'MMM d, yyyy')}</div>
                        {lpo.modifiedBy && lpo.modifiedAt && (
                          <div className="text-xs text-gray-400">
                            Last modified: {format(new Date(lpo.modifiedAt), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{formatCurrency(lpo.totalAmount, lpo.currency)}</div>
                        <div className={`text-sm ${getAmountVarianceColor(lpo.predictedAmount, lpo.actualAmount)}`}>
                          Actual: {formatCurrency(lpo.actualAmount, lpo.currency)}
                          <span className="text-gray-500"> / </span>
                          Predicted: {formatCurrency(lpo.predictedAmount, lpo.currency)}
                        </div>
                        {lpo.remainingAmount > 0 && (
                          <div className="text-sm text-gray-500">
                            Remaining: {formatCurrency(lpo.remainingAmount, lpo.currency)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(lpo.status)}>
                        {lpo.status}
                      </Badge>
                      <div className="text-sm text-gray-500 mt-1">
                        {lpo.invoicesCount} invoice{lpo.invoicesCount !== 1 ? 's' : ''}
                      </div>
                      {lpo.comments && (
                        <div className="text-xs text-gray-500 mt-1 italic line-clamp-2">
                          "{lpo.comments}"
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <DocumentArrowDownIcon className="h-4 w-4 inline mr-1" />
                          LPO Document
                        </div>
                        {lpo.invoicesCount > 0 && (
                          <div className="text-sm">
                            <DocumentDuplicateIcon className="h-4 w-4 inline mr-1" />
                            Invoices
                          </div>
                        )}
                        {lpo.attachments && lpo.attachments.length > 0 && (
                          <div className="text-xs text-gray-500">
                            +{lpo.attachments.length} attachment{lpo.attachments.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LPOsList; 