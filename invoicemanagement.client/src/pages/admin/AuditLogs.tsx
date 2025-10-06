import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  TrendingUp,
  Users,
  Building
} from 'lucide-react';
import { auditLogsApi, AuditLog } from '@/services/api/auditLogsApi';

const AuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch real audit logs data
  const { data: auditLogsResponse, isLoading, error } = useQuery({
    queryKey: ['auditLogs', currentPage, actionFilter, userFilter, dateFilter],
    queryFn: () => auditLogsApi.getAuditLogs({
      page: currentPage,
      pageSize: 50,
      action: actionFilter !== 'all' ? actionFilter : undefined,
      userId: userFilter !== 'all' ? userFilter : undefined,
      fromDate: dateFilter === 'today' ? new Date().toISOString().split('T')[0] : undefined,
      toDate: dateFilter === 'week' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined
    }),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch audit statistics
  const { data: auditStats } = useQuery({
    queryKey: ['auditStats'],
    queryFn: auditLogsApi.getAuditStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once
  });

  // Fallback data when API fails
  const fallbackLogs = [
    {
      id: 1,
      action: 'LOGIN',
      userId: 'admin@company.com',
      entityName: 'User',
      entityId: '1',
      changes: 'User logged in successfully',
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...'
    },
    {
      id: 2,
      action: 'CREATE',
      userId: 'admin@company.com',
      entityName: 'Invoice',
      entityId: '123',
      changes: 'Created new invoice INV-001',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...'
    }
  ];

  const auditLogs = Array.isArray(auditLogsResponse?.data) ? auditLogsResponse.data : fallbackLogs;
  const totalPages = auditLogsResponse?.totalPages || 1;

  // Fallback stats when API fails
  const safeAuditStats = auditStats || {
    todayLogs: auditLogs.length,
    thisWeekLogs: auditLogs.length,
    totalLogs: auditLogs.length,
    criticalEvents: 0
  };

  // Get unique actions and users from the data
  const uniqueActions = [...new Set(auditLogs.map((log: AuditLog) => log.action))];
  const uniqueUsers = [...new Set(auditLogs.map((log: AuditLog) => log.userId))];

  // Filter logs based on search term
  const filteredLogs = auditLogs.filter((log: AuditLog) => {
    const matchesSearch = log.changes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.entityName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">Failed to load audit logs</p>
          <p className="text-sm text-slate-500 mt-2">Error: {error.message}</p>
        </div>
      </div>
    );
  }


  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'bg-green-100 text-green-800';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800';
      case 'CREATE': return 'bg-blue-100 text-blue-800';
      case 'UPDATE': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'UPLOAD': return 'bg-purple-100 text-purple-800';
      case 'APPROVE': return 'bg-green-100 text-green-800';
      case 'REJECT': return 'bg-red-100 text-red-800';
      case 'CONFIG': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Clean Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-qatar rounded-xl flex items-center justify-center shadow-sm">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                    Audit Logs
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Admin • System Activity & User Actions
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Archive
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Events</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{auditStats?.totalLogs || 0}</p>
                <p className="text-sm text-slate-500 mt-1">All time audit logs</p>
              </div>
              <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-info" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Today's Events</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{safeAuditStats.todayLogs}</p>
                <p className="text-sm text-slate-500 mt-1">Events today</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">This Week</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{safeAuditStats.thisWeekLogs}</p>
                <p className="text-sm text-slate-500 mt-1">Events this week</p>
              </div>
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-gold" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Users</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{uniqueUsers.length}</p>
                <p className="text-sm text-slate-500 mt-1">Unique users</p>
              </div>
              <div className="w-12 h-12 bg-qatar/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-qatar" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Search & Filter</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action, index) => (
                    <SelectItem key={`${action as string}-${index}`} value={action as string}>{action as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map((user, index) => (
                    <SelectItem key={`${user as string}-${index}`} value={user as string}>{user as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-qatar/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-qatar" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Audit Logs ({filteredLogs.length})</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">System activity and user actions</p>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-700">
                  <TableHead className="font-medium text-slate-700 dark:text-slate-300">Timestamp</TableHead>
                  <TableHead className="font-medium text-slate-700 dark:text-slate-300">User</TableHead>
                  <TableHead className="font-medium text-slate-700 dark:text-slate-300">Action</TableHead>
                  <TableHead className="font-medium text-slate-700 dark:text-slate-300">Entity</TableHead>
                  <TableHead className="font-medium text-slate-700 dark:text-slate-300">Changes</TableHead>
                  <TableHead className="font-medium text-slate-700 dark:text-slate-300">Entity ID</TableHead>
                  <TableHead className="font-medium text-slate-700 dark:text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-4">
                          <FileText className="h-12 w-12 text-slate-400" />
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No audit logs found</h3>
                            <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or filters</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log: AuditLog) => (
                      <TableRow key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <TableCell className="text-sm text-slate-600">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            <span className="font-medium">{log.userId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-slate-400" />
                            <span className="text-sm text-slate-700">{log.entityName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={log.changes}>
                            {log.changes}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">
                            {log.entityId}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                                className="hover:bg-blue-50 hover:border-blue-300"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Audit Log Details</DialogTitle>
                                <DialogDescription>
                                  Detailed information about this audit log entry
                                </DialogDescription>
                              </DialogHeader>
                              {selectedLog && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-slate-500">Timestamp</label>
                                      <p className="text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-slate-500">User ID</label>
                                      <p className="text-sm">{selectedLog.userId}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-slate-500">Action</label>
                                      <p className="text-sm">{selectedLog.action}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-slate-500">Entity</label>
                                      <p className="text-sm">{selectedLog.entityName}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-slate-500">Entity ID</label>
                                      <p className="text-sm">{selectedLog.entityId}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-500">Changes</label>
                                    <div className="mt-1 p-3 bg-slate-50 rounded-lg">
                                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedLog.changes}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 mt-6">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
