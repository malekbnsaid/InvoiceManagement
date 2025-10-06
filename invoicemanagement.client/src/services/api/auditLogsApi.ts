import { api } from './api';

export interface AuditLog {
  id: number;
  entityName: string;
  action: string;
  userId: string;
  timestamp: string;
  changes: string;
  entityId: string;
}

export interface CreateAuditLog {
  entityName: string;
  entityId: string;
  action: string;
  userId: string;
  changes: string;
}

export interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  thisWeekLogs: number;
  actionBreakdown: { [key: string]: number };
  entityBreakdown: { [key: string]: number };
}

export interface AuditLogsResponse {
  data: AuditLog[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditLogsFilters {
  page?: number;
  pageSize?: number;
  action?: string;
  entityName?: string;
  userId?: string;
  fromDate?: string;
  toDate?: string;
}

export const auditLogsApi = {
  // Get audit logs with pagination and filters
  getAuditLogs: async (filters: AuditLogsFilters = {}): Promise<AuditLogsResponse> => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.action) params.append('action', filters.action);
    if (filters.entityName) params.append('entityName', filters.entityName);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);

    const response = await api.get(`/AuditLogs?${params.toString()}`);
    return response.data;
  },

  // Get audit statistics
  getAuditStats: async (): Promise<AuditStats> => {
    const response = await api.get('/AuditLogs/stats');
    return response.data;
  },

  // Get recent audit logs
  getRecentAuditLogs: async (limit: number = 10): Promise<AuditLog[]> => {
    const response = await api.get(`/AuditLogs/recent?limit=${limit}`);
    return response.data;
  },

  // Create audit log
  createAuditLog: async (auditLog: CreateAuditLog): Promise<void> => {
    await api.post('/AuditLogs/log', auditLog);
  }
};
