import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { 
  FileText, DollarSign, Clock, Users, Bell, TrendingUp,
  CheckCircle, XCircle, AlertCircle, UserCheck
} from 'lucide-react';

interface AdminDashboardProps {
  invoiceList: any[];
  projectList: any[];
  userList: any[];
  metrics: any;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  invoiceList, 
  projectList, 
  userList, 
  metrics 
}) => {
  // Invoice Status Summary Data
  const statusData = Object.entries(
    invoiceList.reduce((acc: any, invoice: any) => {
      const status = invoice.status;
      const statusNames = {
        0: 'Pending', 1: 'Under Review', 2: 'Approved', 3: 'In Progress',
        4: 'PMO Review', 5: 'Completed', 6: 'Rejected', 7: 'Cancelled', 8: 'On Hold'
      };
      const statusName = statusNames[status as keyof typeof statusNames] || 'Unknown';
      acc[statusName] = (acc[statusName] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Budget Utilization per Project
  const budgetData = projectList.slice(0, 8).map((project: any) => {
    const projectInvoices = invoiceList.filter((inv: any) => inv.projectReference === project.projectNumber);
    const spentAmount = projectInvoices
      .filter((inv: any) => inv.status === 5)
      .reduce((sum: number, inv: any) => sum + (inv.invoiceValue || 0), 0);
    const utilization = project.budget > 0 ? (spentAmount / project.budget) * 100 : 0;
    
    return {
      name: project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name,
      budget: project.budget,
      spent: spentAmount,
      utilization: Math.min(utilization, 100)
    };
  });

  // Active Users by Role (using employees data)
  const userRoleData = Object.entries(
    userList.reduce((acc: any, employee: any) => {
      const role = employee.position || employee.department || 'Unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {})
  ).map(([role, count]) => ({ role, count }));

  // Monthly Spending Trend (last 6 months)
  const monthlyTrendData = Object.entries(
    invoiceList.reduce((acc: any, invoice: any) => {
      const date = new Date(invoice.invoiceDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, amount: 0, count: 0 };
      }
      acc[monthKey].amount += invoice.invoiceValue || 0;
      acc[monthKey].count++;
      return acc;
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, data]: any) => data);

  // Recent Notifications (based on real data)
  const recentNotifications = [
    // Recent invoice status changes
    ...invoiceList
      .filter((invoice: any) => invoice.status === 5 || invoice.status === 6) // Completed or Rejected
      .slice(0, 3)
      .map((invoice: any, index: number) => ({
        id: `invoice-${invoice.id}`,
        type: invoice.status === 5 ? 'approval' : 'rejection',
        message: `Invoice #${invoice.invoiceNumber} ${invoice.status === 5 ? 'completed' : 'rejected'}`,
        time: new Date(invoice.createdAt).toLocaleDateString(),
        icon: invoice.status === 5 ? CheckCircle : XCircle
      })),
    // Recent project activities
    ...projectList
      .filter((project: any) => project.status === 1) // Active projects
      .slice(0, 2)
      .map((project: any, index: number) => ({
        id: `project-${project.id}`,
        type: 'approval',
        message: `Project ${project.name} is active`,
        time: new Date(project.createdAt).toLocaleDateString(),
        icon: UserCheck
      }))
  ].slice(0, 5);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor overall activity and system health</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            System Healthy
          </Badge>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.totalInvoices || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">${(metrics?.totalSpent || 0).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Approval Time</p>
                <p className="text-2xl font-bold text-gray-900">2.3 days</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{userList?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Invoice Status Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget Utilization per Project */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Budget Utilization per Project</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Utilization']}
                  labelFormatter={(label) => `Project: ${label}`}
                />
                <Bar dataKey="utilization" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Active Users by Role</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userRoleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ role, percent }) => `${role} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {userRoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Spending Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Monthly Spending Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']} />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Recent Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentNotifications.map((notification) => {
              const IconComponent = notification.icon;
              return (
                <div key={notification.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <IconComponent className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500">{notification.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
