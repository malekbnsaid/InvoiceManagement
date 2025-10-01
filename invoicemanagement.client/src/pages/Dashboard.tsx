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
import { RealDataDashboard } from '../components/dashboard/RealDataDashboard';
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
      
      {/* Real data dashboard */}
      <RealDataDashboard />
    </div>
  );
};

export default Dashboard; 