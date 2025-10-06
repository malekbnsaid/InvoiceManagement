import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PMOReviewPanel } from '../invoices/PMOReviewPanel';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  FolderKanban, 
  BadgeDollarSign, 
  BarChart3,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  Clock,
  UserCheck,
  X,
  Building,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';
import { Skeleton, SkeletonDashboardCard, SkeletonList } from '../ui/skeleton';
import { dashboardApi } from '../../services/api/dashboardApi';
import { formatCurrency } from '../../utils/formatters';
import { CurrencyType } from '../../types/enums';

// Status helper functions
const getStatusText = (status: number): string => {
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

const getStatusColor = (status: number): string => {
  switch (status) {
    case 0: return 'bg-info/10 text-info border border-info/20';      // Submitted
    case 1: return 'bg-warning/10 text-warning border border-warning/20';  // Under Review
    case 2: return 'bg-success text-white border-success hover:bg-success/90'; // Approved
    case 3: return 'bg-qatar/10 text-qatar border border-qatar/20';  // In Progress
    case 4: return 'bg-warning text-white border-warning hover:bg-warning/90';  // PMO Review
    case 5: return 'bg-success/10 text-success border border-success/20';    // Completed
    case 6: return 'bg-error text-white border-error hover:bg-error/90';        // Rejected
    case 7: return 'bg-silver/10 text-silver border border-silver/20';      // Cancelled
    case 8: return 'bg-gold/10 text-gold border border-gold/20';  // On Hold
    default: return 'bg-silver/10 text-silver border border-silver/20';
  }
};

const getStatusIcon = (status: number) => {
  switch (status) {
    case 0: return <FileText className="h-3 w-3" />;      // Submitted
    case 1: return <Clock className="h-3 w-3" />;         // Under Review
    case 2: return <CheckCircle2 className="h-3 w-3" />;  // Approved
    case 3: return <TrendingUp className="h-3 w-3" />;    // In Progress
    case 4: return <UserCheck className="h-3 w-3" />;     // PMO Review
    case 5: return <CheckCircle2 className="h-3 w-3" />;  // Completed
    case 6: return <AlertTriangle className="h-3 w-3" />; // Rejected
    case 7: return <X className="h-3 w-3" />;             // Cancelled
    case 8: return <Clock className="h-3 w-3" />;         // On Hold
    default: return <FileText className="h-3 w-3" />;
  }
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const RealDataDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: recentProjects, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['dashboard-recent-projects'],
    queryFn: () => dashboardApi.getRecentProjects(5),
    staleTime: 5 * 60 * 1000,
    onSuccess: (data: any) => {
      console.log('🔍 Dashboard: Recent projects data:', data);
      console.log('🔍 Dashboard: Is array?', Array.isArray(data));
      console.log('🔍 Dashboard: Length:', data?.length);
    },
    onError: (error: any) => {
      console.error('🔍 Dashboard: Recent projects error:', error);
    },
  });

  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['dashboard-recent-invoices'],
    queryFn: () => dashboardApi.getRecentInvoices(5),
    staleTime: 5 * 60 * 1000,
  });

  const { data: departmentBreakdown, isLoading: deptLoading, error: deptError } = useQuery({
    queryKey: ['dashboard-department-breakdown'],
    queryFn: () => dashboardApi.getDepartmentBreakdown(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    onSuccess: (data: any) => {
      console.log('🔍 Dashboard: Department breakdown data:', data);
      console.log('🔍 Dashboard: Is array?', Array.isArray(data));
      console.log('🔍 Dashboard: Length:', data?.length);
    },
    onError: (error: any) => {
      console.error('🔍 Dashboard: Department breakdown error:', error);
    },
  });

  const { data: projectsNeedingApproval, isLoading: approvalLoading } = useQuery({
    queryKey: ['dashboard-projects-approval'],
    queryFn: () => dashboardApi.getProjectsNeedingApproval(5),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract data from Entity Framework JSON format
  const projectsData = recentProjects?.$values || recentProjects || [];
  const departmentsData = departmentBreakdown?.$values || departmentBreakdown || [];
  const invoicesData = recentInvoices?.$values || recentInvoices || [];
  const approvalData = projectsNeedingApproval?.$values || projectsNeedingApproval || [];

  const isLoading = statsLoading || projectsLoading || invoicesLoading || deptLoading || approvalLoading;
  const hasErrors = projectsError || deptError;

  if (hasErrors) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <h3 className="text-error font-medium">Dashboard Error</h3>
          <p className="text-error/80 text-sm mt-1">
            There was an error loading dashboard data. Please check the console for details.
          </p>
          <div className="mt-2 text-xs text-error">
            Projects Error: {projectsError?.message || 'None'}<br/>
            Department Error: {deptError?.message || 'None'}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="space-y-2">
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
          </div>
        </motion.div>

        {/* Stats Cards Skeleton */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonDashboardCard key={index} />
          ))}
        </motion.div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <SkeletonList count={5} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <SkeletonList count={4} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Prepare stats data
  const statsData = stats ? [
    {
      title: 'Active Projects',
      value: stats.totalProjects.toString(),
      change: `+${stats.recentProjects}`,
      changeType: 'positive' as const,
      icon: <FolderKanban className="h-8 w-8 text-primary-500" />,
    },
    {
      title: 'Pending Invoices',
      value: stats.pendingInvoices.toString(),
      change: `-${stats.approvedInvoices}`,
      changeType: 'negative' as const,
      icon: <FileText className="h-8 w-8 text-amber-500" />,
    },
    {
      title: 'Total Budget',
      value: formatCurrency(stats.totalBudget, CurrencyType.QAR),
      change: `${stats.budgetUtilization.toFixed(1)}%`,
      changeType: stats.budgetUtilization < 80 ? 'positive' as const : 'negative' as const,
      icon: <BadgeDollarSign className="h-8 w-8 text-success" />,
    },
    {
      title: 'Budget Utilization',
      value: `${stats.budgetUtilization.toFixed(1)}%`,
      change: `$${formatCurrency(stats.remainingBudget, CurrencyType.QAR)} left`,
      changeType: stats.budgetUtilization < 80 ? 'positive' as const : 'negative' as const,
      icon: <BarChart3 className="h-8 w-8 text-qatar" />,
    },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Invoice Management Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-lg">
            Real-time overview of projects, invoices, and financial metrics
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            className="flex items-center gap-2 bg-qatar hover:bg-qatar/90 transition-all duration-200 shadow-sm hover:shadow-md"
            onClick={() => navigate('/projects/new')}
          >
            <PlusCircle className="h-4 w-4" />
            New Project
          </Button>
          <Button 
            className="flex items-center gap-2 border-qatar text-qatar hover:bg-qatar hover:text-white transition-all duration-200" 
            variant="outline"
            onClick={() => navigate('/invoices/upload')}
          >
            <PlusCircle className="h-4 w-4" />
            Upload Invoice
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics - Cleaner Layout */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statsData.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-qatar">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                    <div className="flex items-center mt-2">
                      {stat.changeType === 'positive' ? (
                        <ArrowUp className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-error" />
                      )}
                      <span 
                        className={`text-sm font-medium ml-1 ${
                          stat.changeType === 'positive' ? 'text-success' : 'text-error'
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-qatar/10 dark:bg-qatar/20 rounded-lg flex items-center justify-center">
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* PMO Review Panel - Only show for PMO users */}
      {user?.role === 'PMO' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2"
        >
          <PMOReviewPanel />
        </motion.div>
      )}

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Left Column - Projects and Invoices */}
        <div className="xl:col-span-2 space-y-4">
          {/* Recent Projects */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FolderKanban className="h-5 w-5 text-qatar" />
                      Recent Projects
                    </CardTitle>
                    <CardDescription>Latest projects in the system</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate('/projects')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Project</th>
                        <th className="px-4 py-3">Section</th>
                        <th className="px-4 py-3 rounded-tr-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {Array.isArray(projectsData) && projectsData.length > 0 ? (
                        projectsData.slice(0, 5).map((project) => (
                          <tr 
                            key={project.id} 
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                            onClick={() => navigate(`/projects/${project.id}`)}
                          >
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{project.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{project.projectNumber}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className="h-6 w-6 rounded-full bg-qatar/10 flex items-center justify-center text-qatar text-xs font-semibold mr-2">
                                  {project.section?.substring(0, 3).toUpperCase() || 'GEN'}
                                </div>
                                <span className="text-gray-600 dark:text-gray-400 text-xs">{project.section}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`${getStatusColor(project.status)} flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium`}>
                                {getStatusIcon(project.status)}
                                {getStatusText(project.status)}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                            <FolderKanban className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No projects found</p>
                            <p className="text-sm">Projects will appear here once they are created</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Invoices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FileText className="h-5 w-5 text-qatar" />
                      Recent Invoices
                    </CardTitle>
                    <CardDescription>Latest invoices in the system</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate('/invoices')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Invoice ID</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Vendor</th>
                        <th className="px-4 py-3">Project</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3 rounded-tr-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {Array.isArray(invoicesData) && invoicesData.length > 0 ? (
                        invoicesData.slice(0, 5).map((invoice) => (
                          <tr 
                            key={invoice.id} 
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                              {invoice.invoiceNumber}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {new Date(invoice.invoiceDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">{invoice.vendorName || 'Unknown'}</td>
                            <td className="px-4 py-3">
                              {invoice.projectReference ? (
                                <div className="inline-flex items-center justify-center h-6 w-10 rounded bg-qatar/10 text-qatar text-xs font-medium">
                                  {invoice.projectReference}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">No project</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              {formatCurrency(invoice.invoiceValue, invoice.currency)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`${getStatusColor(invoice.status)} flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium`}>
                                {getStatusIcon(invoice.status)}
                                {getStatusText(invoice.status)}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No invoices found</p>
                            <p className="text-sm">Invoices will appear here once they are uploaded</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-6">
          {/* Projects Needing Approval - Only show for PMO users */}
          {user?.role === 'PMO' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        Projects Needing Approval
                      </CardTitle>
                      <CardDescription>Projects pending your approval</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate('/projects?status=pending')}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(approvalData) && approvalData.length > 0 ? (
                      approvalData.slice(0, 3).map((project) => (
                        <div key={project.id} className="flex items-center justify-between p-3 bg-warning/5 rounded-lg border border-warning/20 hover:bg-warning/10 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-warning/20 flex items-center justify-center text-warning text-xs font-semibold">
                                {project.section?.substring(0, 3).toUpperCase() || 'GEN'}
                              </div>
                              <div>
                                <p className="font-medium text-sm text-warning">{project.name}</p>
                                <p className="text-xs text-warning/70">{project.projectNumber}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-warning border-warning/30">
                              Pending
                            </Badge>
                            <p className="text-xs text-warning/70 mt-1">
                              {project.budget ? `QAR ${project.budget.toLocaleString()}` : 'No budget'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-success" />
                        <p className="text-gray-500">No projects pending approval</p>
                        <p className="text-sm text-gray-400">All projects are up to date</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Department Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building className="h-5 w-5 text-qatar" />
                  Department Breakdown
                </CardTitle>
                <CardDescription>Budget and project allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(departmentsData) && departmentsData.length > 0 ? (
                    departmentsData.map((dept, index) => {
                      const utilization = dept.totalBudget > 0 ? (dept.spentAmount / dept.totalBudget) * 100 : 0;
                      const colors = [
                        'from-qatar to-qatar/80',
                        'from-gold to-gold/80',
                        'from-success to-success/80',
                        'from-info to-info/80'
                      ];
                      
                      return (
                        <div key={dept.section} className="space-y-2">
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">{dept.section}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {dept.projectCount} projects
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {utilization.toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formatCurrency(dept.spentAmount, CurrencyType.QAR)}
                              </div>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div 
                              className={`h-full rounded-full bg-gradient-to-r ${colors[index % colors.length]}`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No department data available</p>
                      <p className="text-sm">Department breakdown will appear here once projects are created</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Budget Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-success" />
                  Budget Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Budget</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatCurrency(stats?.totalBudget || 0, CurrencyType.QAR)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div className="bg-qatar h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Spent</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatCurrency(stats?.totalSpent || 0, CurrencyType.QAR)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-error h-2 rounded-full" 
                        style={{ width: `${stats?.budgetUtilization || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Remaining</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatCurrency(stats?.remainingBudget || 0, CurrencyType.QAR)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-success h-2 rounded-full" 
                        style={{ width: `${100 - (stats?.budgetUtilization || 0)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" className="w-full" onClick={() => navigate('/reports')}>
                      View Detailed Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
