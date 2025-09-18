import React from 'react';
import { useState, useEffect } from 'react';
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
  Terminal,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  AlertCircle
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
import { invoiceService } from '../../services/invoiceService';
import { Invoice } from '../../types/interfaces';
import { useToast } from '../ui/use-toast';
import { formatCurrency } from '../../utils/formatters';
import { Skeleton, SkeletonList } from '../ui/skeleton';

// Status badge styles with enhanced visual design
const getStatusColor = (status: any) => {
  // Convert status to string and handle different types
  const statusStr = String(status || '').toLowerCase();
  
  switch (statusStr) {
    // String enum values
    case 'draft':
    case '0':
    case '0.0':
      return 'bg-gray-100 text-gray-800 border border-gray-200';
    case 'pendingapproval':
    case 'pending':
    case '1':
    case '1.0':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'approved':
    case '2':
    case '2.0':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'rejected':
    case '3':
    case '3.0':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'processing':
    case '4':
    case '4.0':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'paid':
    case '5':
    case '5.0':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'cancelled':
    case '6':
    case '6.0':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'onhold':
    case '7':
    case '7.0':
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    case 'overdue':
    case '8':
    case '8.0':
      return 'bg-red-100 text-red-800 border border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

// Status icons for enhanced visual feedback
const getStatusIcon = (status: any) => {
  const statusStr = String(status || '').toLowerCase();
  
  switch (statusStr) {
    case 'draft':
    case '0':
    case '0.0':
      return <FileText className="h-3 w-3" />;
    case 'pendingapproval':
    case 'pending':
    case '1':
    case '1.0':
      return <Clock className="h-3 w-3" />;
    case 'approved':
    case '2':
    case '2.0':
      return <CheckCircle2 className="h-3 w-3" />;
    case 'rejected':
    case '3':
    case '3.0':
      return <XCircle className="h-3 w-3" />;
    case 'processing':
    case '4':
    case '4.0':
      return <RefreshCw className="h-3 w-3" />;
    case 'paid':
    case '5':
    case '5.0':
      return <CheckCircle2 className="h-3 w-3" />;
    case 'cancelled':
    case '6':
    case '6.0':
      return <XCircle className="h-3 w-3" />;
    case 'onhold':
    case '7':
    case '7.0':
      return <AlertTriangle className="h-3 w-3" />;
    case 'overdue':
    case '8':
    case '8.0':
      return <AlertCircle className="h-3 w-3" />;
    default:
      return <FileText className="h-3 w-3" />;
  }
};

// Helper function to get status display text
const getStatusText = (status: any) => {
  const statusStr = String(status || '').toLowerCase();
  
  switch (statusStr) {
    // String enum values
    case 'draft':
    case '0':
    case '0.0':
      return 'Draft';
    case 'pending':
    case '1':
    case '1.0':
      return 'Pending';
    case 'approved':
    case '2':
    case '2.0':
      return 'Approved';
    case 'rejected':
    case '3':
    case '3.0':
      return 'Rejected';
    case 'paid':
    case '4':
    case '4.0':
      return 'Paid';
    case 'cancelled':
    case '5':
    case '5.0':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

const getSectionIcon = (section: string) => {
  switch (section.toUpperCase()) {
    case 'ISO':
      return <Shield className="h-4 w-4 text-blue-500" />;
    case 'TSS':
      return <ServerIcon className="h-4 w-4 text-green-500" />;
    case 'ISS':
      return <Cpu className="h-4 w-4 text-purple-500" />;
    case 'APP':
      return <Terminal className="h-4 w-4 text-orange-500" />;
    default:
      return <Building className="h-4 w-4 text-gray-500" />;
  }
};

const InvoiceList = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  
  const { toast } = useToast();
  const itemsPerPage = 5;

  // Fetch invoices from API
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await invoiceService.getInvoices();
        
        // Handle different response formats
        let data;
        if (Array.isArray(response)) {
          data = response;
        } else if (response && response.$values && Array.isArray(response.$values)) {
          data = response.$values;
        } else if (response && Array.isArray(response)) {
          data = response;
        } else {
          console.warn('Unexpected response format:', response);
          data = [];
        }
        
        setInvoices(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Failed to load invoices');
        setInvoices([]); // Ensure invoices is always an array
        toast({
          title: "Error",
          description: "Failed to load invoices",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [toast]);

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
  const filteredInvoices = (invoices || []).filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      (invoice.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (invoice.projectReference?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = selectedStatus === null || selectedStatus === 'all' || invoice.status === selectedStatus;
    
    // Note: Section filtering would need to be implemented based on your data structure
    const matchesSection = selectedSection === null || selectedSection === 'all' || true; // Placeholder
    
    return matchesSearch && matchesStatus && matchesSection;
  });

  // Sort invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'date':
        aValue = new Date(a.invoiceDate);
        bValue = new Date(b.invoiceDate);
        break;
      case 'amount':
        aValue = a.invoiceValue;
        bValue = b.invoiceValue;
        break;
      case 'vendor':
        aValue = a.vendorName;
        bValue = b.vendorName;
        break;
      default:
        aValue = a.invoiceDate;
        bValue = b.invoiceDate;
        break;
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage);
  const paginatedInvoices = sortedInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === paginatedInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(paginatedInvoices.map(invoice => invoice.id.toString()));
    }
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <SkeletonList count={5} />
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshIcon className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show empty state if no invoices
  if (!invoices || invoices.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600">Manage and track all invoices</p>
          </div>
          <Link to="/invoices/upload">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Upload Invoice
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <DocumentIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-500 text-center max-w-sm mb-6">
              Get started by uploading your first invoice or check your filters
            </p>
            <Link to="/invoices/upload">
              <Button className="bg-primary hover:bg-primary/90">
                <PlusIcon className="h-4 w-4 mr-2" />
                Upload First Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage and track all invoices</p>
        </div>
        <Link to="/invoices/upload">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Upload Invoice
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedStatus || 'all'} onValueChange={(value) => setSelectedStatus(value === 'all' ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedSection || 'all'} onValueChange={(value) => setSelectedSection(value === 'all' ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                <SelectItem value="ISO">ISO</SelectItem>
                <SelectItem value="TSS">TSS</SelectItem>
                <SelectItem value="ISS">ISS</SelectItem>
                <SelectItem value="APP">APP</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setSelectedStatus('all');
              setSelectedSection('all');
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedInvoices.length === paginatedInvoices.length && paginatedInvoices.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('vendor')}
                >
                  <div className="flex items-center gap-1">
                    Vendor
                    {sortField === 'vendor' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortField === 'date' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-1">
                    Amount
                    {sortField === 'amount' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                  <TableCell>
                    <Checkbox 
                      checked={selectedInvoices.includes(invoice.id.toString())}
                      onChange={() => handleSelectInvoice(invoice.id.toString())}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-700">
                          {invoice.vendorName?.charAt(0).toUpperCase() || 'V'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{invoice.vendorName || 'Unknown Vendor'}</div>
                        <div className="text-sm text-gray-500">{invoice.invoiceNumber}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </div>
                      {invoice.dueDate && (
                        <div className="text-sm text-gray-500">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(invoice.invoiceValue, invoice.currency)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.currency}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(invoice.status)} flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium`}>
                      {getStatusIcon(invoice.status)}
                      {getStatusText(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link to={`/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="sm">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <DocumentIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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