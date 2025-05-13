import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  EyeIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';

// Mock data for invoices
const mockInvoices = [
  {
    id: 'INV-001',
    vendor: 'ABC Corp',
    amount: 1250.00,
    date: '2023-11-15',
    dueDate: '2023-12-15',
    status: 'paid',
    department: 'IT',
    vendorLogo: ''
  },
  {
    id: 'INV-002',
    vendor: 'XYZ Services',
    amount: 3450.75,
    date: '2023-11-20',
    dueDate: '2023-12-20',
    status: 'pending',
    department: 'Marketing',
    vendorLogo: ''
  },
  {
    id: 'INV-003',
    vendor: 'Tech Solutions',
    amount: 875.50,
    date: '2023-11-25',
    dueDate: '2023-12-25',
    status: 'approved',
    department: 'Engineering',
    vendorLogo: ''
  },
  {
    id: 'INV-004',
    vendor: 'Global Supplies',
    amount: 2150.25,
    date: '2023-11-28',
    dueDate: '2023-12-28',
    status: 'overdue',
    department: 'Operations',
    vendorLogo: ''
  },
  {
    id: 'INV-005',
    vendor: 'Office Essentials',
    amount: 495.00,
    date: '2023-12-01',
    dueDate: '2024-01-01',
    status: 'pending',
    department: 'HR',
    vendorLogo: ''
  },
  {
    id: 'INV-006',
    vendor: 'Data Systems Inc',
    amount: 5785.50,
    date: '2023-12-05',
    dueDate: '2024-01-05',
    status: 'paid',
    department: 'IT',
    vendorLogo: ''
  },
  {
    id: 'INV-007',
    vendor: 'Marketing Experts',
    amount: 3250.00,
    date: '2023-12-10',
    dueDate: '2024-01-10',
    status: 'pending',
    department: 'Marketing',
    vendorLogo: ''
  },
  {
    id: 'INV-008',
    vendor: 'Cloud Services Co',
    amount: 9520.75,
    date: '2023-12-15',
    dueDate: '2024-01-15',
    status: 'draft',
    department: 'Engineering',
    vendorLogo: ''
  }
];

// Utility function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Status badge styles
const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'approved':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const InvoiceList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const itemsPerPage = 5;

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter invoices based on search term, status, and department
  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === null || invoice.status === selectedStatus;
    
    const matchesDepartment = selectedDepartment === null || invoice.department === selectedDepartment;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Sort invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (sortField === 'amount') {
      return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    } else if (sortField === 'date') {
      return sortDirection === 'asc' 
        ? new Date(a.date).getTime() - new Date(b.date).getTime() 
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortField === 'dueDate') {
      return sortDirection === 'asc' 
        ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() 
        : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    } else if (sortField === 'vendor') {
      return sortDirection === 'asc' 
        ? a.vendor.localeCompare(b.vendor) 
        : b.vendor.localeCompare(a.vendor);
    } else {
      return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage);
  const paginatedInvoices = sortedInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle invoice selection
  const toggleInvoiceSelection = (id: string) => {
    if (selectedInvoices.includes(id)) {
      setSelectedInvoices(selectedInvoices.filter(invId => invId !== id));
    } else {
      setSelectedInvoices([...selectedInvoices, id]);
    }
  };

  // Handle bulk selection
  const toggleSelectAll = () => {
    if (selectedInvoices.length === paginatedInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(paginatedInvoices.map(invoice => invoice.id));
    }
  };

  // Simulate refresh data
  const refreshData = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const departmentOptions = [...new Set(mockInvoices.map(invoice => invoice.department))];
  const statusOptions = [...new Set(mockInvoices.map(invoice => invoice.status))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4"
    >
      <Card className="w-full shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">Invoices</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage and track your invoices
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={refreshData}
              disabled={isLoading}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="default"
              className="bg-primary text-white hover:bg-primary/90"
              asChild
            >
              <Link to="/invoices/upload">
                <PlusIcon className="h-4 w-4 mr-2" />
                New Invoice
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between mb-4 space-y-2 md:space-y-0">
            <div className="relative w-full md:w-1/3">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search invoices..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex space-x-1">
                    <FunnelIcon className="h-4 w-4" />
                    <span>Filter</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Status</h4>
                      <Select 
                        value={selectedStatus || ""} 
                        onValueChange={(value) => setSelectedStatus(value || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Statuses</SelectItem>
                          {statusOptions.map(status => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Department</h4>
                      <Select 
                        value={selectedDepartment || ""} 
                        onValueChange={(value) => setSelectedDepartment(value || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Departments</SelectItem>
                          {departmentOptions.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedStatus(null);
                          setSelectedDepartment(null);
                        }}
                      >
                        Reset
                      </Button>
                      <Button 
                        onClick={() => {
                          // Apply filters
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={
                        paginatedInvoices.length > 0 &&
                        selectedInvoices.length === paginatedInvoices.length
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Invoice #</span>
                      {sortField === 'id' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('vendor')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Vendor</span>
                      {sortField === 'vendor' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Amount</span>
                      {sortField === 'amount' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      {sortField === 'date' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('dueDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Due Date</span>
                      {sortField === 'dueDate' && (
                        sortDirection === 'asc' ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="group">
                      <TableCell>
                        <Checkbox 
                          checked={selectedInvoices.includes(invoice.id)}
                          onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                          aria-label={`Select invoice ${invoice.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            {invoice.vendorLogo ? (
                              <AvatarImage src={invoice.vendorLogo} alt={invoice.vendor} />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {invoice.vendor.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{invoice.vendor}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(invoice.status)} capitalize`}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{invoice.department}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/invoices/${invoice.id}`}>
                              <EyeIcon className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon">
                            <PencilSquareIcon className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon">
                            <DocumentTextIcon className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {paginatedInvoices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} 
              to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} 
              of {filteredInvoices.length} invoices
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default InvoiceList; 