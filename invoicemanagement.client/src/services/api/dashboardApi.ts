import { api } from './api';

export interface DashboardStats {
  totalProjects: number;
  totalInvoices: number;
  pendingInvoices: number;
  approvedInvoices: number;
  completedInvoices: number;
  totalBudget: number;
  totalSpent: number;
  budgetUtilization: number;
  recentProjects: number;
  recentInvoices: number;
  remainingBudget: number;
}

export interface RecentProject {
  id: number;
  name: string;
  projectNumber: string;
  section: string;
  department: string;
  status: number;
  budget: number | null;
  createdAt: string;
  modifiedAt: string | null;
  completionPercentage: number;
}

export interface RecentInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  currency: number;
  status: number;
  projectReference: string | null;
  vendorName: string | null;
  createdAt: string;
  vendor: {
    name: string;
    email: string | null;
  } | null;
}

export interface DepartmentBreakdown {
  section: string;
  projectCount: number;
  totalBudget: number;
  spentAmount: number;
}

export interface StatusBreakdown {
  status: number;
  count: number;
  totalValue?: number;
}

export interface MonthlyTrend {
  year: number;
  month: number;
  invoiceCount: number;
  totalValue: number;
  approvedCount: number;
  completedCount: number;
}

class DashboardApi {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/Dashboard/stats');
    return response.data;
  }

  async getRecentProjects(limit: number = 5): Promise<RecentProject[]> {
    const response = await api.get(`/Dashboard/recent-projects?limit=${limit}`);
    return response.data;
  }

  async getRecentInvoices(limit: number = 5): Promise<RecentInvoice[]> {
    const response = await api.get(`/Dashboard/recent-invoices?limit=${limit}`);
    return response.data;
  }

  async getDepartmentBreakdown(): Promise<DepartmentBreakdown[]> {
    const response = await api.get('/Dashboard/department-breakdown');
    return response.data;
  }

  async getStatusBreakdown(): Promise<{
    invoices: StatusBreakdown[];
    projects: StatusBreakdown[];
  }> {
    const response = await api.get('/Dashboard/status-breakdown');
    return response.data;
  }

  async getMonthlyTrends(months: number = 12): Promise<MonthlyTrend[]> {
    const response = await api.get(`/Dashboard/monthly-trends?months=${months}`);
    return response.data;
  }

  async getProjectsNeedingApproval(limit: number = 10): Promise<RecentProject[]> {
    const response = await api.get(`/Dashboard/projects-needing-approval?limit=${limit}`);
    return response.data;
  }
}

export const dashboardApi = new DashboardApi();
