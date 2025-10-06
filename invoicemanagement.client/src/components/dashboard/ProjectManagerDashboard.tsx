import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  FolderOpen, DollarSign, FileText, Clock, TrendingUp,
  CheckCircle, AlertCircle, Calendar, Users
} from 'lucide-react';

interface ProjectManagerDashboardProps {
  invoiceList: any[];
  projectList: any[];
  userList: any[];
  metrics: any;
}

const ProjectManagerDashboard: React.FC<ProjectManagerDashboardProps> = ({ 
  invoiceList, 
  projectList, 
  userList, 
  metrics 
}) => {
  // Project Overview Cards
  const projectOverview = (projectList || []).slice(0, 6).map((project: any) => {
    const projectInvoices = (invoiceList || []).filter((inv: any) => inv.projectReference === project.projectNumber);
    const spentAmount = projectInvoices
      .filter((inv: any) => inv.status === 5)
      .reduce((sum: number, inv: any) => sum + (inv.invoiceValue || 0), 0);
    const utilization = project.budget > 0 ? (spentAmount / project.budget) * 100 : 0;
    const pendingInvoices = projectInvoices.filter((inv: any) => [0, 1, 2, 3, 4].includes(inv.status));
    
    return {
      ...project,
      spentAmount,
      utilization: Math.min(utilization, 100),
      invoiceCount: projectInvoices.length,
      pendingCount: pendingInvoices.length,
      status: utilization > 90 ? 'warning' : utilization > 70 ? 'caution' : 'good'
    };
  });

  // Budget vs Actual Chart Data
  const budgetVsActualData = (projectList || []).slice(0, 8).map((project: any) => {
    const projectInvoices = (invoiceList || []).filter((inv: any) => inv.projectReference === project.projectNumber);
    const spentAmount = projectInvoices
      .filter((inv: any) => inv.status === 5)
      .reduce((sum: number, inv: any) => sum + (inv.invoiceValue || 0), 0);
    
    return {
      name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
      budget: project.budget,
      actual: spentAmount,
      remaining: Math.max(project.budget - spentAmount, 0)
    };
  });

  // Pending Invoices Table
  const pendingInvoices = (invoiceList || [])
    .filter((invoice: any) => [0, 1, 2, 3, 4].includes(invoice.status))
    .slice(0, 10);

  // Invoice Breakdown by Vendor
  const vendorBreakdown = Object.entries(
    (invoiceList || []).reduce((acc: any, invoice: any) => {
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
    .slice(0, 6)
    .map(([, data]: any) => data);

  // Monthly Expense Trend
  const monthlyExpenseData = Object.entries(
    (invoiceList || []).reduce((acc: any, invoice: any) => {
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Manager Dashboard</h1>
          <p className="text-gray-600">Track project budgets, invoices, and pending approvals</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Project Manager
          </Badge>
        </div>
      </div>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectOverview.map((project: any, index: number) => (
          <Card key={index} className={`border-l-4 ${
            project.status === 'warning' ? 'border-l-red-500' : 
            project.status === 'caution' ? 'border-l-yellow-500' : 'border-l-green-500'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="truncate">{project.name}</span>
                <Badge variant={
                  project.status === 'warning' ? 'destructive' : 
                  project.status === 'caution' ? 'secondary' : 'default'
                }>
                  {project.status === 'warning' ? 'Over Budget' : 
                   project.status === 'caution' ? 'Near Limit' : 'On Track'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget Used</span>
                  <span className="font-medium">{project.utilization.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      project.status === 'warning' ? 'bg-red-500' : 
                      project.status === 'caution' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(project.utilization, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Budget</p>
                  <p className="font-semibold">${project.budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Spent</p>
                  <p className="font-semibold">${project.spentAmount.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Invoices</p>
                  <p className="font-semibold">{project.invoiceCount}</p>
                </div>
                <div>
                  <p className="text-gray-600">Pending</p>
                  <p className="font-semibold text-orange-600">{project.pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget vs Actual Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Budget vs Actual Spending</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={budgetVsActualData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']} />
              <Bar dataKey="budget" fill="#8884d8" name="Budget" />
              <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pending Invoices and Vendor Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Pending Invoices</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvoices.map((invoice: any, index: number) => {
                const statusNames = {
                  0: 'Submitted', 1: 'Under Review', 2: 'Approved', 3: 'In Progress', 4: 'PMO Review'
                };
                const statusName = statusNames[invoice.status as keyof typeof statusNames] || 'Unknown';
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-sm">#{invoice.invoiceNumber}</p>
                        <p className="text-xs text-gray-600">{invoice.vendorName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">${invoice.invoiceValue?.toLocaleString()}</p>
                      <Badge variant="outline" className="text-xs">
                        {statusName}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {pendingInvoices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">No pending invoices</p>
                  <p className="text-sm">All invoices are processed!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Breakdown by Vendor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Invoice Breakdown by Vendor</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={vendorBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {vendorBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Expense Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Monthly Expense Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyExpenseData}>
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
  );
};

export default ProjectManagerDashboard;
