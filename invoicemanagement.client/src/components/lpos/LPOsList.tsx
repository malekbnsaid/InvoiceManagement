import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
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
    currency: 'USD',
    startDate: '2023-04-01',
    completionDate: '2023-05-15',
    projectId: 1,
    projectNumber: 'PRJ-2023-001',
    projectName: 'Network Infrastructure Upgrade',
    status: 'Active',
    invoicesCount: 3,
    remainingAmount: 12500
  },
  {
    id: 2,
    lpoNumber: 'LPO-20230002',
    issueDate: '2023-03-20',
    supplierName: 'Tech Consulting Group',
    description: 'ERP implementation consulting services',
    totalAmount: 75000,
    currency: 'USD',
    startDate: '2023-04-15',
    completionDate: '2023-10-30',
    projectId: 2,
    projectNumber: 'PRJ-2023-002',
    projectName: 'ERP System Implementation',
    status: 'Active',
    invoicesCount: 4,
    remainingAmount: 30000
  },
  {
    id: 3,
    lpoNumber: 'LPO-20230003',
    issueDate: '2023-01-10',
    supplierName: 'CreativeTech Design',
    description: 'Website redesign and development',
    totalAmount: 35000,
    currency: 'USD',
    startDate: '2023-01-15',
    completionDate: '2023-04-15',
    projectId: 3,
    projectNumber: 'PRJ-2023-003',
    projectName: 'Company Website Redesign',
    status: 'Completed',
    invoicesCount: 4,
    remainingAmount: 0
  },
  {
    id: 4,
    lpoNumber: 'LPO-20230004',
    issueDate: '2023-04-05',
    supplierName: 'SecureNet Systems',
    description: 'Cybersecurity software and implementation',
    totalAmount: 42000,
    currency: 'USD',
    startDate: '2023-04-15',
    completionDate: '2023-06-30',
    projectId: 4,
    projectNumber: 'PRJ-2023-004',
    projectName: 'Cybersecurity Enhancement',
    status: 'Active',
    invoicesCount: 2,
    remainingAmount: 18000
  },
  {
    id: 5,
    lpoNumber: 'LPO-20230005',
    issueDate: '2023-02-10',
    supplierName: 'Cloud Infrastructure Partners',
    description: 'Server virtualization hardware and services',
    totalAmount: 62000,
    currency: 'USD',
    startDate: '2023-02-20',
    completionDate: '2023-05-10',
    projectId: 5,
    projectNumber: 'PRJ-2023-005',
    projectName: 'Server Virtualization',
    status: 'Completed',
    invoicesCount: 3,
    remainingAmount: 0
  }
];

type LPO = typeof mockLPOs[0];

const LPOsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [lpos, setLpos] = useState<LPO[]>(mockLPOs);

  // Filter LPOs based on search and filters
  const filteredLPOs = lpos.filter(lpo => {
    const matchesSearch = searchTerm === '' || 
      lpo.lpoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lpo.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lpo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lpo.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProject = selectedProject === null || lpo.projectId === selectedProject;
    const matchesStatus = selectedStatus === null || lpo.status === selectedStatus;
    
    return matchesSearch && matchesProject && matchesStatus;
  });

  // Extract unique projects and statuses for filters
  const projects = [...new Set(lpos.map(lpo => ({ id: lpo.projectId, name: lpo.projectName })))];
  const statuses = [...new Set(lpos.map(lpo => lpo.status))];

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
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
                <TableHead>LPO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Completion Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLPOs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4">
                    No LPOs found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLPOs.map(lpo => (
                  <TableRow key={lpo.id}>
                    <TableCell className="font-medium">{lpo.lpoNumber}</TableCell>
                    <TableCell>{lpo.supplierName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{lpo.projectName}</span>
                        <span className="text-xs text-gray-500">{lpo.projectNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(lpo.issueDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatCurrency(lpo.totalAmount, lpo.currency)}</span>
                        {lpo.remainingAmount > 0 && (
                          <span className="text-xs text-gray-500">
                            Remaining: {formatCurrency(lpo.remainingAmount, lpo.currency)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(lpo.completionDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(lpo.status)}>
                        {lpo.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{lpo.invoicesCount}</TableCell>
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
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LPOsList; 