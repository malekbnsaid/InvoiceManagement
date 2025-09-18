import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RoleBasedDashboard } from '../components/dashboard/RoleBasedDashboard';
import { Skeleton, SkeletonDashboardCard, SkeletonList } from '../components/ui/skeleton';

// Mock data for IT department
const stats = [
  {
    title: 'Active IT Projects',
    value: '24',
    change: '+3',
    changeType: 'positive',
    icon: <FolderKanban className="h-8 w-8 text-primary-500" />,
  },
  {
    title: 'Pending Invoices',
    value: '18',
    change: '-4',
    changeType: 'negative',
    icon: <FileText className="h-8 w-8 text-amber-500" />,
  },
  {
    title: 'Total Budget',
    value: '$1.2M',
    change: '+12.7%',
    changeType: 'positive',
    icon: <BadgeDollarSign className="h-8 w-8 text-green-500" />,
  },
  {
    title: 'IT Systems Coverage',
    value: '94%',
    change: '+2.3%',
    changeType: 'positive',
    icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
  },
];

const recentProjects = [
  { id: 'ISO/5/2023-01', name: 'Security Compliance Framework', section: 'ISO', department: 'Security Operations', status: 'In Progress', completion: 65 },
  { id: 'TSS/4/2023-04', name: 'IT Help Desk Modernization', section: 'TSS', department: 'Service Desk', status: 'On Hold', completion: 30 },
  { id: 'ISS/5/2023-02', name: 'Cloud Infrastructure Migration', section: 'ISS', department: 'Cloud Services', status: 'In Progress', completion: 45 },
  { id: 'APP/4/2023-05', name: 'Invoice Management System', section: 'APP', department: 'Custom Development', status: 'Active', completion: 80 },
  { id: 'ISO/3/2023-08', name: 'Data Protection Implementation', section: 'ISO', department: 'Risk Management', status: 'Completed', completion: 100 },
];

const recentInvoices = [
  { id: 'INV-2023-156', date: '2023-05-11', vendor: 'Cyber Security Solutions', amount: '$28,500', section: 'ISO', status: 'Approved' },
  { id: 'INV-2023-142', date: '2023-05-09', vendor: 'Dell Technologies', amount: '$12,340', section: 'TSS', status: 'Pending' },
  { id: 'INV-2023-138', date: '2023-05-08', vendor: 'AWS Cloud Services', amount: '$8,790', section: 'ISS', status: 'Processing' },
  { id: 'INV-2023-127', date: '2023-05-05', vendor: 'Microsoft Corporation', amount: '$15,400', section: 'APP', status: 'Approved' },
];

const itDepartmentBreakdown = [
  { name: 'Information Security Office (ISO)', budget: '$320,000', projects: 8, color: 'from-red-500 to-orange-500' },
  { name: 'Technical Support Services (TSS)', budget: '$280,000', projects: 6, color: 'from-blue-500 to-cyan-500' },
  { name: 'Infrastructure & Systems Support (ISS)', budget: '$420,000', projects: 5, color: 'from-emerald-500 to-green-500' },
  { name: 'Applications (APP)', budget: '$180,000', projects: 5, color: 'from-violet-500 to-purple-500' },
];

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

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading for demonstration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

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
          {/* Recent Projects Skeleton */}
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

          {/* Recent Invoices Skeleton */}
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Role-based dashboard content */}
      <RoleBasedDashboard />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">IT Department Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-lg">Overview of IT projects, invoices, and department metrics</p>
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

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => (
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
                    Recent IT Projects
                  </CardTitle>
                  <CardDescription>Active projects across IT departments</CardDescription>
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
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 rounded-tr-lg">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {recentProjects.map((project) => (
                      <tr 
                        key={project.id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{project.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{project.id}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 text-xs font-semibold mr-2">
                              {project.section}
                            </div>
                            <span className="text-gray-600 dark:text-gray-400 text-xs">{project.department}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span 
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              project.status === 'Active' || project.status === 'In Progress'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                : project.status === 'On Hold' 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' 
                                : project.status === 'Completed'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div 
                              className={`h-2 rounded-full ${
                                project.completion >= 80 ? 'bg-emerald-500' : 
                                project.completion >= 40 ? 'bg-blue-500' : 'bg-amber-500'
                              }`} 
                              style={{ width: `${project.completion}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">
                            {project.completion}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Building className="h-5 w-5 text-primary-500" />
                IT Department Breakdown
              </CardTitle>
              <CardDescription>Budget and project allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {itDepartmentBreakdown.map((dept) => (
                  <div key={dept.name} className="space-y-2">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium text-gray-800 dark:text-gray-200">{dept.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{dept.projects} projects • {dept.budget}</div>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${dept.color}`}
                        style={{ width: `${(parseInt(dept.budget.replace(/\$|,/g, '')) / 1200000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

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
                <CardDescription>Latest IT department invoices</CardDescription>
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
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3 rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentInvoices.map((invoice) => (
                    <tr 
                      key={invoice.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {invoice.id}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{invoice.date}</td>
                      <td className="px-4 py-3">{invoice.vendor}</td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center justify-center h-6 w-10 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400 text-xs font-medium">
                          {invoice.section}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{invoice.amount}</td>
                      <td className="px-4 py-3">
                        <span 
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'Approved' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
                              : invoice.status === 'Pending' 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' 
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {invoice.status === 'Approved' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                          {invoice.status === 'Pending' && <Clock className="mr-1 h-3 w-3" />}
                          {invoice.status === 'Processing' && <CircleDollarSign className="mr-1 h-3 w-3" />}
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-400">Security Framework Review</p>
                  <p className="text-xs text-amber-700 dark:text-amber-500">Waiting for CIO approval</p>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto text-amber-600">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 p-3 border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-400">AWS Cloud Services Invoice</p>
                  <p className="text-xs text-amber-700 dark:text-amber-500">Needs financial verification</p>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto text-amber-600">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              IT Team Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-semibold">JD</div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900 dark:text-white">John Doe</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Information Security Lead</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 font-semibold">SJ</div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900 dark:text-white">Sarah Johnson</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Applications Team Lead</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold">RM</div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900 dark:text-white">Robert Miller</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Infrastructure Lead</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-green-500" />
              Budget Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Spent</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">42%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Remaining</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">$696,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '58%' }}></div>
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
  );
};

export default Dashboard; 