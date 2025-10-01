import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  FolderKanban, 
  BadgeDollarSign, 
  BarChart3,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  PlusCircle,
  Clock,
  Building,
  User,
  CircleDollarSign,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';
import { Skeleton, SkeletonDashboardCard, SkeletonList } from '../ui/skeleton';
import { dashboardApi, DashboardStats, RecentProject, RecentInvoice, DepartmentBreakdown } from '../../services/api/dashboardApi';
import { formatCurrency } from '../../utils/formatters';

// Status helper functions
const getStatusText = (status: number): string => {
  const statusMap: { [key: number]: string } = {
    0: 'Submitted',
    1: 'Under Review',
    2: 'Approved',
    3: 'In Progress',
    4: 'Completed',
    5: 'Rejected',
    6: 'Cancelled',
    7: 'On Hold'
  };
  return statusMap[status] || 'Unknown';
};

const getStatusColor = (status: number): string => {
  switch (status) {
    case 0: return 'bg-blue-100 text-blue-800';
    case 1: return 'bg-yellow-100 text-yellow-800';
    case 2: return 'bg-green-100 text-green-800';
    case 3: return 'bg-purple-100 text-purple-800';
    case 4: return 'bg-green-100 text-green-800';
    case 5: return 'bg-red-100 text-red-800';
    case 6: return 'bg-gray-100 text-gray-800';
    case 7: return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: number) => {
  switch (status) {
    case 0: return <FileText className="h-3 w-3" />;
    case 1: return <Clock className="h-3 w-3" />;
    case 2: return <CheckCircle2 className="h-3 w-3" />;
    case 3: return <TrendingUp className="h-3 w-3" />;
    case 4: return <CheckCircle2 className="h-3 w-3" />;
    case 5: return <AlertTriangle className="h-3 w-3" />;
    case 6: return <AlertTriangle className="h-3 w-3" />;
    case 7: return <Clock className="h-3 w-3" />;
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
    onSuccess: (data) => {
      console.log('🔍 Dashboard: Recent projects data:', data);
      console.log('🔍 Dashboard: Is array?', Array.isArray(data));
      console.log('🔍 Dashboard: Length:', data?.length);
    },
    onError: (error) => {
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
    onSuccess: (data) => {
      console.log('🔍 Dashboard: Department breakdown data:', data);
      console.log('🔍 Dashboard: Is array?', Array.isArray(data));
      console.log('🔍 Dashboard: Length:', data?.length);
    },
    onError: (error) => {
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Dashboard Error</h3>
          <p className="text-red-600 text-sm mt-1">
            There was an error loading dashboard data. Please check the console for details.
          </p>
          <div className="mt-2 text-xs text-red-500">
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
      value: formatCurrency(stats.totalBudget, 0),
      change: `${stats.budgetUtilization.toFixed(1)}%`,
      changeType: stats.budgetUtilization < 80 ? 'positive' as const : 'negative' as const,
      icon: <BadgeDollarSign className="h-8 w-8 text-green-500" />,
    },
    {
      title: 'Budget Utilization',
      value: `${stats.budgetUtilization.toFixed(1)}%`,
      change: `$${formatCurrency(stats.remainingBudget, 0)} left`,
      changeType: stats.budgetUtilization < 80 ? 'positive' as const : 'negative' as const,
      icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
    },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
        <div className="flex flex-wrap gap-2">
          <Button 
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
            onClick={() => navigate('/projects/new')}
          >
            <PlusCircle className="h-4 w-4" />
            New Project
          </Button>
          <Button 
            className="flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-200" 
            variant="outline"
            onClick={() => navigate('/invoices/upload')}
          >
            <PlusCircle className="h-4 w-4" />
            Upload Invoice
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statsData.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-primary-500">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                    <div className="flex items-center mt-2">
                      {stat.changeType === 'positive' ? (
                        <ArrowUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-rose-500" />
                      )}
                      <span 
                        className={`text-sm font-medium ml-1 ${
                          stat.changeType === 'positive' ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Projects */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-primary-500" />
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
                {console.log('🔍 Dashboard: Rendering projects, data:', projectsData, 'isArray:', Array.isArray(projectsData), 'length:', projectsData?.length)}
                {Array.isArray(projectsData) && projectsData.length > 0 ? (
                  projectsData.map((project) => (
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
                            <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 text-xs font-semibold mr-2">
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

        {/* Projects Needing Approval */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
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
                  approvalData.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-semibold">
                            {project.section?.substring(0, 3).toUpperCase() || 'GEN'}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-amber-800">{project.name}</p>
                            <p className="text-xs text-amber-600">{project.projectNumber} • {project.section}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-amber-700 border-amber-300">
                          Pending
                        </Badge>
                        <p className="text-xs text-amber-600 mt-1">
                          {project.budget ? `$${project.budget.toLocaleString()}` : 'No budget'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="text-gray-500">No projects pending approval</p>
                    <p className="text-sm text-gray-400">All projects are up to date</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Department Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Building className="h-5 w-5 text-primary-500" />
                Department Breakdown
              </CardTitle>
              <CardDescription>Budget and project allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {console.log('🔍 Dashboard: Rendering departments, data:', departmentsData, 'isArray:', Array.isArray(departmentsData), 'length:', departmentsData?.length)}
                {Array.isArray(departmentsData) && departmentsData.length > 0 ? (
                  departmentsData.map((dept, index) => {
                    const utilization = dept.totalBudget > 0 ? (dept.spentAmount / dept.totalBudget) * 100 : 0;
                    const colors = [
                      'from-red-500 to-orange-500',
                      'from-blue-500 to-cyan-500',
                      'from-emerald-500 to-green-500',
                      'from-violet-500 to-purple-500'
                    ];
                    
                    return (
                      <div key={dept.section} className="space-y-2">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-200">{dept.section}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {dept.projectCount} projects • {formatCurrency(dept.totalBudget, 0)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {utilization.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatCurrency(dept.spentAmount, 0)} spent
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
      </div>

      {/* Recent Invoices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-500" />
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
                    invoicesData.map((invoice) => (
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
                          <div className="inline-flex items-center justify-center h-6 w-10 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400 text-xs font-medium">
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

      {/* Budget Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Budget Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Budget</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatCurrency(stats?.totalBudget || 0, 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Spent</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatCurrency(stats?.totalSpent || 0, 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${stats?.budgetUtilization || 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Remaining</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatCurrency(stats?.remainingBudget || 0, 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
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
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Invoice Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Invoices</span>
                <span className="font-medium">{stats?.totalInvoices || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-medium text-amber-600">{stats?.pendingInvoices || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Approved</span>
                <span className="font-medium text-green-600">{stats?.approvedInvoices || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-medium text-blue-600">{stats?.completedInvoices || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New Projects (30d)</span>
                <span className="font-medium text-green-600">+{stats?.recentProjects || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New Invoices (30d)</span>
                <span className="font-medium text-blue-600">+{stats?.recentInvoices || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Budget Used</span>
                <span className="font-medium text-red-600">{stats?.budgetUtilization.toFixed(1) || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
