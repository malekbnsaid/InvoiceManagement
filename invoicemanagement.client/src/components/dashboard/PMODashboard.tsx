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
  AlertCircle, UserCheck, Calendar, Activity, BarChart3, AlertTriangle
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
  // Pending Approvals - Both Invoices and Projects
  const pendingInvoices = (invoiceList || []).filter((invoice: any) => invoice.status === 4); // PMO Review status
  const pendingProjects = (projectList || []).filter((project: any) => !project.isApproved); // Projects not approved yet
  const pendingApprovals = [...pendingInvoices, ...pendingProjects];
  
  // Budget Utilization
  const budgetUtilization = metrics?.budgetUtilization || 0;
  
  // Debug: Show actual data breakdown
  console.log('🔍 PMO Dashboard - Data Breakdown:');
  const statusCounts = (invoiceList || []).reduce((acc: any, invoice: any) => {
    acc[invoice.status] = (acc[invoice.status] || 0) + 1;
    return acc;
  }, {});
  console.log('📊 Invoice Status Counts:', statusCounts);
  console.log('⏳ Pending Invoices:', pendingInvoices.length);
  console.log('🏗️ Pending Projects:', pendingProjects.length);
  console.log('📋 Total Pending Approvals:', pendingApprovals.length);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Enterprise Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-qatar rounded-xl flex items-center justify-center shadow-sm">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                    PMO Executive Dashboard
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Project Management Office • Strategic Oversight
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{projectList?.length || 0}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Active Projects</div>
              </div>
              <div className="w-px h-8 bg-slate-300 dark:bg-slate-600"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{pendingApprovals.length}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pending Reviews</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Executive Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Approval Rate</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {metrics?.totalInvoices > 0 
                    ? ((metrics?.approvedInvoices || 0) / metrics.totalInvoices * 100).toFixed(1)
                    : '0.0'
                  }%
                </p>
                <p className="text-sm text-success mt-1">+12.5% from last month</p>
              </div>
              <div className="w-12 h-12 bg-qatar/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-qatar" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Processing Time</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">2.3 days</p>
                <p className="text-sm text-slate-500 mt-1">Target: 2.0 days</p>
              </div>
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-gold" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Vendors</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {invoiceList ? 
                    new Set(invoiceList.map((inv: any) => inv.vendorName).filter(Boolean)).size 
                    : 0
                  }
                </p>
                <p className="text-sm text-success mt-1">+3 this month</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Budget Utilization</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{budgetUtilization.toFixed(1)}%</p>
                <p className="text-sm text-slate-500 mt-1">{100 - budgetUtilization.toFixed(1)}% remaining</p>
              </div>
              <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-info" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Approval Management */}
          <div className="xl:col-span-2 space-y-6">
            {/* Pending Approvals */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                      <Clock className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pending Approvals</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Items requiring your review and approval</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-warning/10 text-warning text-sm font-medium rounded-full">
                      {pendingApprovals.length} items
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6">

                {pendingApprovals.length > 0 ? (
                  <div className="space-y-3">
                    {pendingApprovals.slice(0, 5).map((item: any, index: number) => {
                      const isProject = !item.invoiceNumber;
                      return (
                        <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                              {isProject ? <Activity className="h-5 w-5 text-warning" /> : <FileText className="h-5 w-5 text-warning" />}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {isProject ? item.name : `Invoice #${item.invoiceNumber}`}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {isProject 
                                  ? `${item.projectNumber} • QAR ${item.budget?.toLocaleString() || 'No budget'}`
                                  : `${item.vendorName} • QAR ${item.invoiceValue?.toLocaleString()}`
                                }
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-medium rounded">
                              {isProject ? 'Project' : 'Invoice'}
                            </span>
                            <button className="px-3 py-1.5 bg-success text-white text-sm font-medium rounded hover:bg-success/90 transition-colors">
                              Approve
                            </button>
                            <button className="px-3 py-1.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {pendingApprovals.length > 5 && (
                      <div className="text-center pt-4">
                        <button className="px-4 py-2 bg-qatar text-white text-sm font-medium rounded hover:bg-qatar/90 transition-colors">
                          View All {pendingApprovals.length} Items
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">All Caught Up</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">No pending approvals at this time</p>
                  </div>
                )}
              </div>
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-qatar/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-qatar" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Approval Trends</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Monthly performance overview</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={approvalRateData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        formatter={(value: any) => [`${value.toFixed(1)}%`, 'Rate']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="approvalRate" 
                        stroke="#8A153E" 
                        strokeWidth={2} 
                        dot={{ fill: '#8A153E', strokeWidth: 2, r: 4 }}
                        name="Approval Rate" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Vendor Analysis</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Top performing vendors</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={vendorData.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        formatter={(value: any) => [`QAR ${value.toLocaleString()}`, 'Amount']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="amount" fill="#8A153E" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Project Monitoring */}
          <div className="space-y-6">
            {/* Project Health */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                    <Activity className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Project Health</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Performance monitoring</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {processingTimeData.slice(0, 4).map((project: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-900 dark:text-white text-sm">{project.name}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{project.avgDays.toFixed(1)}d</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="h-full bg-qatar rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((project.avgDays / 6) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{project.completedCount}/{project.invoiceCount} completed</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          project.avgDays < 3 ? 'bg-success/10 text-success' :
                          project.avgDays < 5 ? 'bg-warning/10 text-warning' :
                          'bg-error/10 text-error'
                        }`}>
                          {project.avgDays < 3 ? 'Excellent' : project.avgDays < 5 ? 'Good' : 'Needs Attention'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Strategic Insights */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-info/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-info" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Strategic Insights</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Key recommendations</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="p-3 bg-qatar/5 rounded-lg border border-qatar/20">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-qatar rounded flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm">Optimization Opportunity</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">Consider automating approval workflows for invoices under QAR 10,000</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-warning/5 rounded-lg border border-warning/20">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-warning rounded flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm">Risk Alert</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">3 projects approaching budget threshold</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-success/5 rounded-lg border border-success/20">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-success rounded flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm">Performance Boost</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">Approval rate improved by 15% this month</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PMODashboard;
