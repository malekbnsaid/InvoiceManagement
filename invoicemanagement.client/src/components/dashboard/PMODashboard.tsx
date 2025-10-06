import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  Clock, TrendingUp, DollarSign, FileText, CheckCircle, XCircle,
  AlertCircle, UserCheck, Calendar, Activity
} from 'lucide-react';

interface PMODashboardProps {
  invoiceList: any[];
  projectList: any[];
  userList: any[];
  metrics: any;
}

const PMODashboard: React.FC<PMODashboardProps> = ({ 
  invoiceList, 
  projectList, 
  userList, 
  metrics 
}) => {
  // Debug: Log the data received by PMODashboard
  console.log('🔍 PMODashboard - Received Data:');
  console.log('📋 Invoice List Length:', invoiceList?.length);
  console.log('📋 First Invoice:', invoiceList?.[0]);
  console.log('🏗️ Project List Length:', projectList?.length);
  console.log('🏗️ First Project:', projectList?.[0]);
  console.log('📊 Metrics:', metrics);
  // Pending Approvals
  const pendingApprovals = (invoiceList || []).filter((invoice: any) => invoice.status === 4); // PMO Review status
  
  // Debug: Show actual invoice data
  console.log('🔍 PMO Dashboard - Invoice Status Breakdown:');
  const statusCounts = (invoiceList || []).reduce((acc: any, invoice: any) => {
    acc[invoice.status] = (acc[invoice.status] || 0) + 1;
    return acc;
  }, {});
  console.log('📊 Status Counts:', statusCounts);
  console.log('⏳ Pending Approvals:', pendingApprovals.length);

  // Approval Rate Over Time (last 6 months)
  const approvalRateData = Object.entries(
    invoiceList.reduce((acc: any, invoice: any) => {
      const date = new Date(invoice.invoiceDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, approved: 0, rejected: 0, total: 0 };
      }
      acc[monthKey].total++;
      if (invoice.status === 5) acc[monthKey].approved++;
      if (invoice.status === 6) acc[monthKey].rejected++;
      return acc;
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, data]: any) => ({
      ...data,
      approvalRate: data.total > 0 ? (data.approved / data.total) * 100 : 0,
      rejectionRate: data.total > 0 ? (data.rejected / data.total) * 100 : 0
    }));

  // Top Vendors by Amount
  const vendorData = Object.entries(
    invoiceList.reduce((acc: any, invoice: any) => {
      const vendor = invoice.vendorName || 'Unknown';
      if (!acc[vendor]) {
        acc[vendor] = { name: vendor, amount: 0, count: 0 };
      }
      acc[vendor].amount += invoice.invoiceValue || 0;
      acc[vendor].count++;
      return acc;
    }, {})
  )
    .sort(([,a]: any, [,b]: any) => b.amount - a.amount)
    .slice(0, 8)
    .map(([, data]: any) => data);

  // Invoice Processing Time by Project (only approved projects)
  const processingTimeData = (projectList || [])
    .filter((project: any) => project.status === 1) // Only approved projects (status 1)
    .slice(0, 6)
    .map((project: any) => {
    const projectInvoices = (invoiceList || []).filter((inv: any) => inv.projectReference === project.projectNumber);
    const completedInvoices = projectInvoices.filter((inv: any) => inv.status === 5);
    
    // Calculate average processing time based on real dates
    let avgProcessingTime = 0;
    if (completedInvoices.length > 0) {
      const totalDays = completedInvoices.reduce((sum: number, invoice: any) => {
        const createdDate = new Date(invoice.createdAt);
        const completedDate = new Date(invoice.modifiedAt || invoice.createdAt);
        const daysDiff = Math.ceil((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + Math.max(daysDiff, 1); // Minimum 1 day
      }, 0);
      avgProcessingTime = totalDays / completedInvoices.length;
    }

    return {
      name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
      avgDays: avgProcessingTime,
      invoiceCount: projectInvoices.length,
      completedCount: completedInvoices.length
    };
  });

  // Activity Feed (based on real data)
  const activityFeed = [
    // Recent invoice activities
    ...(invoiceList || [])
      .filter((invoice: any) => invoice.status === 5 || invoice.status === 6) // Completed or Rejected
      .slice(0, 3)
      .map((invoice: any) => ({
        id: `invoice-${invoice.id}`,
        type: invoice.status === 5 ? 'approval' : 'rejection',
        message: `Invoice #${invoice.invoiceNumber} ${invoice.status === 5 ? 'approved' : 'rejected'}`,
        user: 'PMO User',
        time: new Date(invoice.modifiedAt || invoice.createdAt).toLocaleDateString(),
        icon: invoice.status === 5 ? CheckCircle : XCircle
      })),
    // Recent project activities
    ...(projectList || [])
      .filter((project: any) => project.status === 1) // Active projects
      .slice(0, 2)
      .map((project: any) => ({
        id: `project-${project.id}`,
        type: 'approval',
        message: `Project ${project.name} is active`,
        user: 'PMO User',
        time: new Date(project.modifiedAt || project.createdAt).toLocaleDateString(),
        icon: UserCheck
      }))
  ].slice(0, 5);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PMO Dashboard</h1>
          <p className="text-gray-600">Manage and monitor approvals and workflow performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            PMO Review
          </Badge>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{pendingApprovals.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics?.totalInvoices > 0 
                    ? ((metrics?.approvedInvoices || 0) / metrics.totalInvoices * 100).toFixed(1)
                    : '0.0'
                  }%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                <p className="text-2xl font-bold text-gray-900">2.3 days</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoiceList ? 
                    new Set(invoiceList.map((inv: any) => inv.vendorName).filter(Boolean)).size 
                    : 0
                  }
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Widget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Pending Approvals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingApprovals.slice(0, 5).map((invoice: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-gray-900">Invoice #{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-600">{invoice.vendorName} - ${invoice.invoiceValue?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            {pendingApprovals.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">No pending approvals</p>
                <p className="text-sm">All invoices are up to date!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval Rate Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Approval Rate Over Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={approvalRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Rate']} />
                <Line type="monotone" dataKey="approvalRate" stroke="#00C49F" strokeWidth={2} name="Approval Rate" />
                <Line type="monotone" dataKey="rejectionRate" stroke="#FF8042" strokeWidth={2} name="Rejection Rate" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Vendors by Amount */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Top Vendors by Amount</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']} />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Processing Time and Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Processing Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Invoice Processing Time by Project</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processingTimeData.map((project: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{project.name}</span>
                    <span className="text-sm text-gray-600">{project.avgDays.toFixed(1)} days avg</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min((project.avgDays / 6) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {project.completedCount}/{project.invoiceCount} completed
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Activity Feed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityFeed.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <IconComponent className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PMODashboard;
