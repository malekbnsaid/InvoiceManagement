import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api/dashboardApi';
import { projectApi } from '@/services/api/projectApi';
import { employeeApi } from '@/services/api/employeeApi';
import { invoiceApi } from '@/services/api/invoiceApi';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import PMODashboard from '@/components/dashboard/PMODashboard';
import ProjectManagerDashboard from '@/components/dashboard/ProjectManagerDashboard';
import SecretaryDashboard from '@/components/dashboard/SecretaryDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';

const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
  });

  const { data: projectList, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['projects-detailed'],
    queryFn: projectApi.getAll,
    refetchInterval: 60000, // Refetch every minute
    retry: 1,
    staleTime: 60 * 1000, // 1 minute
  });

  const { data: userList, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['employees'],
    queryFn: employeeApi.getAll,
    refetchInterval: 300000, // Refetch every 5 minutes
    retry: 1, // Only retry once on failure
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: invoiceList, isLoading: invoicesLoading, error: invoicesError } = useQuery({
    queryKey: ['invoices-detailed'],
    queryFn: invoiceApi.getInvoices,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
  });

  useEffect(() => {
    const allLoading = dashboardLoading || projectsLoading || usersLoading || invoicesLoading;
    const anyError = dashboardError || projectsError || usersError || invoicesError;
    
    setIsLoading(allLoading);
    setError(anyError ? 'Failed to load dashboard data' : null);
  }, [dashboardLoading, projectsLoading, usersLoading, invoicesLoading, dashboardError, projectsError, usersError, invoicesError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8">
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-lg font-medium">Loading dashboard...</p>
            <p className="text-sm text-gray-600">Fetching your personalized data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8">
          <CardContent className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <p className="text-lg font-medium text-red-600">Error loading dashboard</p>
            <p className="text-sm text-gray-600">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8">
          <CardContent className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <p className="text-lg font-medium text-red-600">Authentication required</p>
            <p className="text-sm text-gray-600">Please log in to view your dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Debug: Log the actual data being received
  console.log('🔍 RoleBasedDashboard - Raw Data:');
  console.log('📊 Dashboard Data:', dashboardData);
  console.log('📋 Invoice List:', invoiceList);
  console.log('🏗️ Project List:', projectList);
  console.log('👥 User List:', userList);
  console.log('👤 Current User:', user);
  console.log('🎭 User Role:', user?.role);

  // Calculate real metrics from actual data if dashboard API fails
  const calculateRealMetrics = () => {
    const invoices = Array.isArray(invoiceList) ? invoiceList : [];
    const projects = Array.isArray(projectList) ? projectList : [];
    
    const totalInvoices = invoices.length;
    const totalSpent = invoices
      .filter((inv: any) => inv.status === 5) // Completed invoices
      .reduce((sum: number, inv: any) => sum + (inv.invoiceValue || 0), 0);
    
    const completedInvoices = invoices.filter((inv: any) => inv.status === 5).length;
    const rejectedInvoices = invoices.filter((inv: any) => inv.status === 6).length;
    const completionRate = totalInvoices > 0 ? (completedInvoices / totalInvoices) * 100 : 0;
    const rejectionRate = totalInvoices > 0 ? (rejectedInvoices / totalInvoices) * 100 : 0;
    
    const uniqueVendors = new Set(invoices.map((inv: any) => inv.vendorName).filter(Boolean)).size;
    
    return {
      totalInvoices,
      totalSpent,
      completionRate,
      rejectionRate,
      vendorCount: uniqueVendors,
      approvedInvoices: invoices.filter((inv: any) => inv.status === 2).length,
      pendingInvoices: invoices.filter((inv: any) => inv.status === 0).length,
      completedInvoices,
      rejectedInvoices
    };
  };

  // Prepare data for dashboards with fallbacks
  const dashboardProps = {
    invoiceList: Array.isArray(invoiceList) ? invoiceList : [],
    projectList: Array.isArray(projectList) ? projectList : [],
    userList: Array.isArray(userList) ? userList : [],
    metrics: dashboardData || calculateRealMetrics()
  };

  console.log('🎯 Dashboard Props:', dashboardProps);

  // Render appropriate dashboard based on user role
  const renderDashboard = () => {
    const userRole = user.role?.toLowerCase() || '';
    switch (userRole) {
      case 'admin':
        return <AdminDashboard {...dashboardProps} />;
      case 'pmo':
        return <PMODashboard {...dashboardProps} />;
      case 'project manager':
      case 'pm':
      case 'projectmanager':
        return <ProjectManagerDashboard {...dashboardProps} />;
      case 'secretary':
        return <SecretaryDashboard {...dashboardProps} />;
      default:
        // Default to Project Manager dashboard for unknown roles
        return <ProjectManagerDashboard {...dashboardProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">

        {/* Debug: Current User Role */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-2">🔍 Current User Info:</h3>
          <div className="text-sm text-blue-700">
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Current Role:</strong> {user?.role}</p>
            <p><strong>Dashboard Type:</strong> {
              user?.role?.toLowerCase() === 'admin' ? 'Admin Dashboard' :
              user?.role?.toLowerCase() === 'pmo' ? 'PMO Dashboard' :
              user?.role?.toLowerCase() === 'project manager' || user?.role?.toLowerCase() === 'pm' ? 'Project Manager Dashboard' :
              user?.role?.toLowerCase() === 'secretary' ? 'Secretary Dashboard' :
              'Default Dashboard'
            }</p>
          </div>
        </div>

        {/* Power BI Integration Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BI</span>
                </div>
                <span>Power BI Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Access advanced analytics and interactive reports through Power BI
                </p>
                <Button 
                  onClick={() => window.open('https://app.powerbi.com/groups/me/reports/363cb7e3-a150-491e-9eda-ad785b51e131/aaf757017b0d61341d67?experience=power-bi', '_blank')}
                  size="lg"
                  className="px-8 py-3"
                >
                  📊 Open Power BI Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {renderDashboard()}
      </div>
    </div>
  );
};

export default RoleBasedDashboard;
