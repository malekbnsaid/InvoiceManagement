import React from 'react';

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus as PlusIcon, 
  Filter as FilterIcon, 
  Search as SearchIcon, 
  ChevronUp, 
  ChevronDown,
  Eye as EyeIcon,
  Pencil as PencilIcon,
  FileText as DocumentIcon,
  RotateCw as RefreshIcon,
  Building,
  Cpu,
  Shield,
  Server as ServerIcon,
  Terminal
} from 'lucide-react';
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

// Define Invoice interface
interface Invoice {
  id: string;
  vendor: string;
  amount: number;
  date: string;
  dueDate: string;
  status: string;
  section: string;
  unit: string;
  vendorLogo: string;
  projectId: string;
}

// Mock data for IT department invoices
const mockInvoices: Invoice[] = [
  {
    id: 'INV-2023-156',
    vendor: 'Cyber Security Solutions',
    amount: 28500.00,
    date: '2023-05-11',
    dueDate: '2023-06-11',
    status: 'approved',
    section: 'ISO',
    unit: 'Security Operations',
    vendorLogo: '',
    projectId: 'ISO/5/2023-01'
  },
  {
    id: 'INV-2023-142',
    vendor: 'Dell Technologies',
    amount: 12340.75,
    date: '2023-05-09',
    dueDate: '2023-06-09',
    status: 'pending',
    section: 'TSS',
    unit: 'Hardware Support',
    vendorLogo: '',
    projectId: 'TSS/4/2023-04'
  },
  {
    id: 'INV-2023-138',
    vendor: 'AWS Cloud Services',
    amount: 8790.50,
    date: '2023-05-08',
    dueDate: '2023-06-08',
    status: 'processing',
    section: 'ISS',
    unit: 'Cloud Services',
    vendorLogo: '',
    projectId: 'ISS/5/2023-02'
  },
  {
    id: 'INV-2023-127',
    vendor: 'Microsoft Corporation',
    amount: 15400.25,
    date: '2023-05-05',
    dueDate: '2023-06-05',
    status: 'approved',
    section: 'APP',
    unit: 'Custom Development',
    vendorLogo: '',
    projectId: 'APP/4/2023-05'
  },
  {
    id: 'INV-2023-119',
    vendor: 'Oracle Database Systems',
    amount: 22350.00,
    date: '2023-05-03',
    dueDate: '2023-06-03',
    status: 'pending',
    section: 'ISS',
    unit: 'Database Administration',
    vendorLogo: '',
    projectId: 'ISS/4/2023-09'
  },
  {
    id: 'INV-2023-112',
    vendor: 'Cisco Networks',
    amount: 31780.50,
    date: '2023-04-28',
    dueDate: '2023-05-28',
    status: 'paid',
    section: 'ISS',
    unit: 'Network Infrastructure',
    vendorLogo: '',
    projectId: 'ISS/4/2023-07'
  },
  {
    id: 'INV-2023-108',
    vendor: 'SAP Enterprise Solutions',
    amount: 45250.00,
    date: '2023-04-25',
    dueDate: '2023-05-25',
    status: 'overdue',
    section: 'APP',
    unit: 'Enterprise Applications',
    vendorLogo: '',
    projectId: 'APP/3/2023-02'
  },
  {
    id: 'INV-2023-103',
    vendor: 'Symantec Security',
    amount: 18720.75,
    date: '2023-04-20',
    dueDate: '2023-05-20',
    status: 'paid',
    section: 'ISO',
    unit: 'Risk Management',
    vendorLogo: '',
    projectId: 'ISO/3/2023-08'
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
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'approved':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
    case 'processing':
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400';
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
  }
};

// Section icon mapping
const getSectionIcon = (section: string) => {
  switch (section) {
    case 'ISO':
      return <Shield className="h-4 w-4 text-red-500" />;
    case 'TSS':
      return <Terminal className="h-4 w-4 text-blue-500" />;
    case 'ISS':
      return <ServerIcon className="h-4 w-4 text-green-500" />;
    case 'APP':
      return <Cpu className="h-4 w-4 text-purple-500" />;
    default:
      return <Building className="h-4 w-4 text-gray-500" />;
  }
};

const InvoiceList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc' as 'asc' | 'desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState([] as string[]);
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

  // Filter invoices based on search term, status, and section
  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.projectId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === null || invoice.status === selectedStatus;
    
    const matchesSection = selectedSection === null || invoice.section === selectedSection;
    
    return matchesSearch && matchesStatus && matchesSection;
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
  const toggleInvoiceSelection = (id: string): void => {
    if (selectedInvoices.includes(id)) {
      setSelectedInvoices(selectedInvoices.filter((invId: string) => invId !== id));
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

  const sectionOptions = Array.from(new Set(mockInvoices.map(invoice => invoice.section)));
  const statusOptions = Array.from(new Set(mockInvoices.map(invoice => invoice.status)));

  // Move event handlers to separate functions
  const handleSearchChange = (e: any) => {
    setSearchTerm(e.target.value);
  };
  
  const handleStatusChange = (value: any) => {
    setSelectedStatus(value || null);
  };
  
  const handleSectionChange = (value: any) => {
    setSelectedSection(value || null);
  };
  
  const handlePrevPage = () => {
    setCurrentPage((prev: number) => Math.max(prev - 1, 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage((prev: number) => Math.min(prev + 1, totalPages));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto"
    >
      <Card className="w-full shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">IT Department Invoices</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage and track invoices across IT sections
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={refreshData}
              disabled={isLoading}
            >
              <RefreshIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
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
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search invoices or projects..."
                className="pl-9"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex space-x-1">
                    <FilterIcon className="h-4 w-4" />
                    <span>Filter</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Status</h4>
                      <Select 
                        value={selectedStatus || ""} 
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          {statusOptions.map(status => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">IT Section</h4>
                      <Select 
                        value={selectedSection || ""} 
                        onValueChange={handleSectionChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Sections" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sections</SelectItem>
                          {sectionOptions.map(section => (
                            <SelectItem key={section} value={section}>
                              {section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedStatus(null);
                          setSelectedSection(null);
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
                      onChange={toggleSelectAll}
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
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
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
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
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
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
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
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
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
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Project ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="group">
                      <TableCell>
                        <Checkbox 
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={() => toggleInvoiceSelection(invoice.id)}
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
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getSectionIcon(invoice.section)}
                          <span>{invoice.section}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link to={`/projects/${invoice.projectId}`} className="text-primary-600 hover:underline">
                          {invoice.projectId}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/invoices/${invoice.id}`}>
                              <EyeIcon className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon">
                            <PencilIcon className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon">
                            <DocumentIcon className="h-4 w-4" />
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
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
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