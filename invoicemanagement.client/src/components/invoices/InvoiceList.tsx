import React from 'react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  AlertTriangle,
  AlertCircle,
  X,
  DollarSign,
  SortAsc,
  SortDesc,
  SlidersHorizontal
} from 'lucide-react';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { invoiceApi } from '../../services/api/invoiceApi';
import { Invoice } from '../../types/interfaces';
import { useToast } from '../ui/use-toast';
import { InvoiceEditModal } from './InvoiceEditModal';
import { formatCurrency } from '../../utils/formatters';
import { Skeleton, SkeletonList } from '../ui/skeleton';

// Status badge styles with enhanced visual design
const getStatusColor = (status: any) => {
  // Convert status to number for InvoiceStatus enum
  const statusNum = Number(status);
  
  switch (statusNum) {
    case 0: // Submitted
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 1: // UnderReview
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 2: // Approved
      return 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600';
    case 3: // InProgress
      return 'bg-purple-100 text-purple-800 border border-purple-200';
    case 4: // PMOReview
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 5: // Completed
      return 'bg-green-100 text-green-800 border border-green-200';
    case 6: // Rejected
      return 'bg-red-100 text-red-800 border border-red-200';
    case 7: // Cancelled
      return 'bg-gray-100 text-gray-800 border border-gray-200';
    case 8: // OnHold
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

// Status icons for enhanced visual feedback
const getStatusIcon = (status: any) => {
  const statusNum = Number(status);
  
  switch (statusNum) {
    case 0: // Submitted
      return <FileText className="h-3 w-3" />;
    case 1: // UnderReview
      return <Clock className="h-3 w-3" />;
    case 2: // Approved
      return <CheckCircle2 className="h-3 w-3" />;
    case 3: // InProgress
      return <RefreshCw className="h-3 w-3" />;
    case 4: // PMOReview
      return <User className="h-3 w-3" />;
    case 5: // Completed
      return <CheckCircle2 className="h-3 w-3" />;
    case 6: // Rejected
      return <XCircle className="h-3 w-3" />;
    case 7: // Cancelled
      return <XCircle className="h-3 w-3" />;
    case 8: // OnHold
      return <AlertTriangle className="h-3 w-3" />;
    default:
      return <FileText className="h-3 w-3" />;
  }
};

// Helper function to get status display text
const getStatusText = (status: any) => {
  const statusNum = Number(status);
  
  switch (statusNum) {
    case 0: // Submitted
      return 'Submitted';
    case 1: // UnderReview
      return 'Under Review';
    case 2: // Approved
      return 'Approved';
    case 3: // InProgress
      return 'In Progress';
    case 4: // PMOReview
      return 'PMO Review';
    case 5: // Completed
      return 'Completed';
    case 6: // Rejected
      return 'Rejected';
    case 7: // Cancelled
      return 'Cancelled';
    case 8: // OnHold
      return 'On Hold';
    default:
      return 'Unknown';
  }
};


const InvoiceList = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit modal state
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{from: Date | null, to: Date | null}>({from: null, to: null});
  const [amountRange, setAmountRange] = useState<{min: number | null, max: number | null}>({min: null, max: null});
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting States
  const [sortField, setSortField] = useState('upload');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Pagination and Selection States
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  
  const { toast } = useToast();
  const itemsPerPage = 5;

  // Helper functions for filter options
  const getUniqueVendors = () => {
    if (!invoices || !Array.isArray(invoices)) return [];
    const vendors = [...new Set(invoices.map(invoice => invoice.vendorName).filter(Boolean))];
    return vendors.sort();
  };

  const getUniqueProjects = () => {
    if (!invoices || !Array.isArray(invoices)) return [];
    const projects = [...new Set(invoices.map(invoice => invoice.projectReference).filter(Boolean))];
    return projects.sort();
  };

  // Convert numeric status to readable string
  const getStatusString = (status: number): string => {
    const statusMap: { [key: number]: string } = {
      0: 'Submitted',
      1: 'Under Review',
      2: 'Approved',
      3: 'In Progress',
      4: 'PMO Review',
      5: 'Completed',
      6: 'Rejected',
      7: 'Cancelled',
      8: 'On Hold'
    };
    return statusMap[status] || 'Unknown';
  };

  const getUniqueStatuses = () => {
    if (!invoices || !Array.isArray(invoices)) return [];
    const statuses = [...new Set(invoices.map(invoice => invoice.status).filter(status => status !== undefined && status !== null))];
    return statuses.sort((a, b) => a - b); // Sort numerically
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedStatus(null);
    setSelectedVendor(null);
    setSelectedProject(null);
    setDateRange({from: null, to: null});
    setAmountRange({min: null, max: null});
    setCurrentPage(1);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedStatus && selectedStatus !== 'all') count++;
    if (selectedVendor && selectedVendor !== 'all') count++;
    if (selectedProject && selectedProject !== 'all') count++;
    if (dateRange.from || dateRange.to) count++;
    if (amountRange.min || amountRange.max) count++;
    return count;
  };

  // Edit modal handlers
  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingInvoice(null);
  };

  const handleSaveInvoice = (updatedInvoice: Invoice) => {
    // The invoice will be automatically refreshed by React Query
    console.log('Invoice updated:', updatedInvoice);
  };

  // Fetch invoices using React Query for proper caching and auto-refreshing
  const { data: invoicesData, isLoading: queryLoading, error: queryError, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      console.log('🔍 InvoiceList: Fetching invoices...');
      const response = await invoiceApi.getInvoices();
      console.log('🔍 InvoiceList: Response received:', response);
      
      // Handle different response formats
      let data;
      if (Array.isArray(response)) {
        data = response;
      } else if (response && (response as any).$values && Array.isArray((response as any).$values)) {
        data = (response as any).$values;
      } else if (response && Array.isArray(response)) {
        data = response;
      } else {
        console.warn('Unexpected response format:', response);
        data = [];
      }
      
      console.log('🔍 InvoiceList: Final invoices array:', data);
      console.log('🔍 InvoiceList: Array length:', data.length);
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Update local state when query data changes
  useEffect(() => {
    if (invoicesData) {
      console.log('🔍 InvoiceList: Updating local state with invoices:', invoicesData);
      setInvoices(invoicesData);
      setError(null);
    }
  }, [invoicesData]);

  // Handle query error
  useEffect(() => {
    if (queryError) {
      console.error('❌ InvoiceList: Query error:', queryError);
      setError('Failed to load invoices');
      setInvoices([]);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive"
      });
    }
  }, [queryError, toast]);

  // Set loading state
  useEffect(() => {
    setLoading(queryLoading);
  }, [queryLoading]);

  // Manual refresh function
  const handleRefresh = () => {
    console.log('🔍 InvoiceList: Manual refresh triggered');
    refetch();
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Smart search function - searches across multiple fields
  const smartSearch = (invoice: Invoice, searchTerm: string): boolean => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const searchFields = [
      invoice.vendorName,
      invoice.invoiceNumber,
      invoice.projectReference,
      invoice.subject,
      invoice.referenceNumber,
      invoice.remark,
      invoice.vendor?.name,
      invoice.vendor?.email,
      invoice.vendor?.contactPerson,
      invoice.project?.name,
      invoice.project?.projectNumber,
      invoice.lpo?.lpoNumber,
      (invoice.lpo as any)?.subject
    ];
    
    return searchFields.some(field => 
      field?.toLowerCase().includes(searchLower) ?? false
    );
  };

  // Advanced filtering logic
  const filteredInvoices = (invoices || []).filter(invoice => {
    // Smart search
    const matchesSearch = smartSearch(invoice, searchTerm);
    
    // Status filter
    const matchesStatus = selectedStatus === null || selectedStatus === 'all' || invoice.status.toString() === selectedStatus;
    
    // Vendor filter
    const matchesVendor = selectedVendor === null || selectedVendor === 'all' || 
      invoice.vendorName === selectedVendor || invoice.vendorId?.toString() === selectedVendor;
    
    // Project filter
    const matchesProject = selectedProject === null || selectedProject === 'all' || 
      invoice.projectReference === selectedProject || invoice.projectId?.toString() === selectedProject;
    
    // Date range filter (invoice date)
    const matchesDateRange = !dateRange.from || !dateRange.to || (
      new Date(invoice.invoiceDate) >= dateRange.from && 
      new Date(invoice.invoiceDate) <= dateRange.to
    );
    
    // Amount range filter
    const matchesAmountRange = !amountRange.min || !amountRange.max || (
      invoice.invoiceValue >= amountRange.min && 
      invoice.invoiceValue <= amountRange.max
    );
    
    return matchesSearch && matchesStatus && matchesVendor && matchesProject && 
           matchesDateRange && matchesAmountRange;
  });

  // Enhanced sorting with more options
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'upload':
        // Upload/creation date
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'date':
        // Invoice date
        aValue = new Date(a.invoiceDate);
        bValue = new Date(b.invoiceDate);
        break;
      case 'due':
        // Due date
        aValue = a.dueDate ? new Date(a.dueDate) : new Date(0);
        bValue = b.dueDate ? new Date(b.dueDate) : new Date(0);
        break;
      case 'amount':
        // Invoice amount
        aValue = a.invoiceValue;
        bValue = b.invoiceValue;
        break;
      case 'vendor':
        // Vendor name
        aValue = a.vendorName || '';
        bValue = b.vendorName || '';
        break;
      case 'project':
        // Project reference
        aValue = a.projectReference || '';
        bValue = b.projectReference || '';
        break;
      case 'status':
        // Status
        aValue = a.status;
        bValue = b.status;
        break;
      case 'number':
        // Invoice number
        aValue = a.invoiceNumber || '';
        bValue = b.invoiceNumber || '';
        break;
      case 'processed':
        // Processed date
        aValue = a.processedDate ? new Date(a.processedDate) : new Date(0);
        bValue = b.processedDate ? new Date(b.processedDate) : new Date(0);
        break;
      default:
        // Default to upload order (creation date) - most recent first
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
    }
    
    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    }
    
    // Handle date/number comparison
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/invoices/upload">
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Upload Invoice
              </Button>
            </Link>
          </div>
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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link to="/invoices/upload">
                <Button className="bg-primary hover:bg-primary/90">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Upload First Invoice
                </Button>
              </Link>
            </div>
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/invoices/upload">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Upload Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Enhanced Filters & Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Smart Search & Filters
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFilterCount()} active
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <FilterIcon className="h-4 w-4" />
                {showFilters ? 'Hide' : 'Show'} Advanced
              </Button>
              {getActiveFilterCount() > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Search Bar */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Smart search: vendor, invoice number, project, subject, remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedStatus || 'all'} onValueChange={(value) => setSelectedStatus(value === 'all' ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {getUniqueStatuses().map(status => (
                  <SelectItem key={status} value={status.toString()}>
                    {getStatusString(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedVendor || 'all'} onValueChange={(value) => setSelectedVendor(value === 'all' ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {getUniqueVendors().map(vendor => (
                  <SelectItem key={vendor} value={vendor || ''}>{vendor}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedProject || 'all'} onValueChange={(value) => setSelectedProject(value === 'all' ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {getUniqueProjects().map(project => (
                  <SelectItem key={project} value={project || ''}>{project}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Invoice Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        type="date"
                        placeholder="From"
                        value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : null }))}
                      />
                    </div>
                    <div>
                      <Input
                        type="date"
                        placeholder="To"
                        value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : null }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Amount Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Amount Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="number"
                        placeholder="Min amount"
                        value={amountRange.min || ''}
                        onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value ? parseFloat(e.target.value) : null }))}
                        className="pl-10"
                      />
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="number"
                        placeholder="Max amount"
                        value={amountRange.max || ''}
                        onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value ? parseFloat(e.target.value) : null }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invoice List</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select value={sortField} onValueChange={(value) => handleSort(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload">Upload Date</SelectItem>
                  <SelectItem value="date">Invoice Date</SelectItem>
                  <SelectItem value="due">Due Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="number">Invoice Number</SelectItem>
                  <SelectItem value="processed">Processed Date</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1"
              >
                {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                {sortDirection === 'asc' ? 'Asc' : 'Desc'}
              </Button>
            </div>
          </div>
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
                  onClick={() => handleSort('upload')}
                >
                  <div className="flex items-center gap-1">
                    Upload Date
                    {sortField === 'upload' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Invoice Date
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
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('project')}
                >
                  <div className="flex items-center gap-1">
                    Project
                    {sortField === 'project' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('due')}
                >
                  <div className="flex items-center gap-1">
                    Due Date
                    {sortField === 'due' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
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
                        {invoice.projectReference && (
                          <div className="text-xs text-blue-600 mt-1">
                            <Link 
                              to={`/projects?search=${invoice.projectReference}`}
                              className="hover:underline"
                            >
                              Project: {invoice.projectReference}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(invoice.createdAt).toLocaleTimeString()}
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
                    {(() => {
                      const statusNum = Number(invoice.status);
                      const statusText = getStatusText(invoice.status);
                      console.log('🔍 DEBUG: Invoice status:', invoice.status, 'Number:', statusNum, 'Text:', statusText);
                      
                      // Force blue for Approved status (to distinguish from green Completed)
                      if (statusText === 'Approved' || statusNum === 2) {
                        console.log('🔍 DEBUG: Forcing blue color for Approved status');
                        return (
                          <div 
                            id={`approved-badge-${invoice.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: '#3b82f6', 
                              color: '#ffffff', 
                              border: '2px solid #2563eb',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                            }}
                          >
                            <span style={{ color: '#ffffff', fontWeight: 'bold' }}>
                              {getStatusIcon(invoice.status)}
                            </span>
                            <span style={{ color: '#ffffff', fontWeight: 'bold' }}>
                              {statusText}
                            </span>
                          </div>
                        );
                      }
                      
                      return (
                        <Badge className={`${getStatusColor(invoice.status)} flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium`}>
                          {getStatusIcon(invoice.status)}
                          {statusText}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {invoice.projectReference ? (
                      <div className="text-sm">
                        <Link 
                          to={`/projects?search=${invoice.projectReference}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {invoice.projectReference}
                        </Link>
                        {invoice.project?.name && (
                          <div className="text-xs text-gray-500 mt-1">
                            {invoice.project.name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No project</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {invoice.dueDate ? (
                      <div>
                        <div className="font-medium">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(invoice.dueDate).toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No due date</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link to={`/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="sm">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditInvoice(invoice)}
                        title="Edit invoice"
                      >
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

      {/* Edit Modal */}
      {editingInvoice && (
        <InvoiceEditModal
          invoice={editingInvoice}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveInvoice}
        />
      )}
    </motion.div>
  );
};

export default InvoiceList; 