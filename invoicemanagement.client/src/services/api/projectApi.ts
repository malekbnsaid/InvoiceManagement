import { Project } from '../../types/interfaces';
import { api } from './api';

// Format dates to UTC ISO string
const formatDate = (date: Date | string | null) => {
  if (!date) return null;
  console.log('formatDate input:', date, 'type:', typeof date);
  
  // If it's already an ISO string, return it as is
  if (typeof date === 'string' && date.includes('T') && date.includes('Z')) {
    console.log('formatDate output (already ISO string):', date);
    return date;
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const result = dateObj.toISOString();
  console.log('formatDate output:', result);
  return result;
};

// Transform project data for API
const transformProjectForApi = (project: any): Partial<Project> => {
  console.log('Transforming project data for API:', project);
  console.log('TenderDate before transformation:', project.tenderDate, 'type:', typeof project.tenderDate);
  
  const transformed = {
    ...project,
    expectedStart: formatDate(project.expectedStart),
    expectedEnd: formatDate(project.expectedEnd),
    tenderDate: formatDate(project.tenderDate),
    actualStartDate: formatDate(project.actualStartDate),
    actualEndDate: formatDate(project.actualEndDate),
    budget: project.budget ? Number(project.budget) : null,
    sectionId: Number(project.sectionId || project.section),
    projectManagerId: Number(project.projectManagerId),
    paymentPlanLines: (project.paymentPlanLines || []).map((line: any) => ({
      year: Number(line.year),
      amount: Number(line.amount),
      currency: line.currency,
      paymentType: line.paymentType,
      description: line.description || ''
    }))
  };
  
  console.log('Transformed project data:', transformed);
  console.log('TenderDate after transformation:', transformed.tenderDate, 'type:', typeof transformed.tenderDate);
  return transformed;
};

interface ApiError {
  response?: {
    data?: {
      errors?: Record<string, string[]>;
    };
  };
  message?: string;
}

interface ProjectApi {
  getAll: () => Promise<Project[]>;
  getById: (id: number) => Promise<Project>;
  getByNumber: (projectNumber: string) => Promise<Project>;
  create: (project: Project) => Promise<Project>;
  update: (id: number, project: Project) => Promise<Project>;
  delete: (id: number) => Promise<void>;
  approve: (id: number, poNumber: string) => Promise<void>;
  reject: (id: number, reason: string) => Promise<void>;
  requestDeletion: (id: number) => Promise<void>;
  approveDeletion: (id: number) => Promise<void>;
  rejectDeletion: (id: number, reason: string) => Promise<void>;
  updateStatus: (id: number, status: string) => Promise<void>;
  updateCost: (id: number, cost: number) => Promise<void>;
  getBySection: (sectionId: number) => Promise<Project[]>;
  getByManager: (managerId: number) => Promise<Project[]>;
  getBudget: (id: number) => Promise<number>;
  getSpend: (id: number) => Promise<number>;
  getCompletion: (id: number) => Promise<number>;
  updateApprovalStatus: (id: number, data: { isApproved: boolean; poNumber?: string; rejectionReason?: string; approvedBy?: string; approvalDate?: string }) => Promise<void>;
  getProjectsBySection: (sectionId: number) => Promise<Project[]>;
  getProjectNumberPreview: (sectionId: number, startDate?: Date) => Promise<string>;
  getProjectInvoices: (id: number) => Promise<any[]>;
  getProjectsByManager: (managerId: number) => Promise<Project[]>;
  getProjectBudget: (id: number) => Promise<number>;
  getProjectSpend: (id: number) => Promise<number>;
}

export const projectApi: ProjectApi = {
  getAll: async () => {
    try {
      console.log('🔍 ProjectAPI: Fetching projects from /Projects');
      const response = await api.get('/Projects');
      console.log('🔍 ProjectAPI: Response status:', response.status);
      console.log('🔍 ProjectAPI: Response data:', response.data);
      console.log('🔍 ProjectAPI: Data type:', typeof response.data);
      console.log('🔍 ProjectAPI: Is array:', Array.isArray(response.data));
      
      // Handle Entity Framework JSON structure
      let projects = response.data;
      if (projects && projects.$values && Array.isArray(projects.$values)) {
        console.log('🔍 ProjectAPI: Extracting projects from $values array');
        projects = projects.$values;
      } else if (!Array.isArray(projects)) {
        console.log('🔍 ProjectAPI: Converting non-array response to array');
        projects = [projects];
      }
      
      console.log('🔍 ProjectAPI: Final projects array:', projects);
      console.log('🔍 ProjectAPI: Final array length:', projects.length);
      return projects;
    } catch (error: any) {
      console.error('❌ ProjectAPI: Error fetching projects:', error);
      if (error.response) {
        console.error('❌ ProjectAPI: Response status:', error.response.status);
        console.error('❌ ProjectAPI: Response data:', error.response.data);
      }
      throw error;
    }
  },

  getById: async (id: number) => {
    try {
      const response = await api.get(`/Projects/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      throw error;
    }
  },

  getByNumber: async (projectNumber: string) => {
    const response = await api.get(`/Projects/number/${projectNumber}`);
    return response.data;
  },

  create: async (project: Project) => {
    try {
      const transformedData = transformProjectForApi(project);
      console.log('Creating project with data:', transformedData);
      const response = await api.post('/Projects', transformedData);
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  update: async (id: number, project: Project) => {
    try {
      const transformedData = transformProjectForApi(project);
      console.log('Updating project with data:', transformedData);
      const response = await api.put(`/Projects/${id}`, transformedData);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error(`Error updating project ${id}:`, apiError);
      if (apiError.response?.data?.errors) {
        console.error('Validation errors:', apiError.response.data.errors);
      }
      throw error;
    }
  },

  delete: async (id: number) => {
    try {
      await api.delete(`/Projects/${id}`);
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      throw error;
    }
  },

  approve: async (id: number, poNumber: string) => {
    try {
      await api.post(`/Projects/${id}/approve`, { poNumber });
    } catch (error) {
      console.error(`Error approving project ${id}:`, error);
      throw error;
    }
  },

  reject: async (id: number, reason: string) => {
    try {
      await api.post(`/Projects/${id}/reject`, { reason });
    } catch (error) {
      console.error(`Error rejecting project ${id}:`, error);
      throw error;
    }
  },

  requestDeletion: async (id: number) => {
    const response = await api.post(`/Projects/${id}/delete-request`);
    return response.data;
  },

  approveDeletion: async (id: number) => {
    const response = await api.post(`/Projects/${id}/approve-deletion`);
    return response.data;
  },

  rejectDeletion: async (id: number, reason: string) => {
    const response = await api.post(`/Projects/${id}/reject-deletion`, { reason });
    return response.data;
  },

  getProjectsBySection: async (sectionId: number) => {
    try {
      const response = await api.get(`/Projects/section/${sectionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching projects for section ${sectionId}:`, error);
      throw error;
    }
  },

  getProjectsByManager: async (managerId: number) => {
    try {
      const response = await api.get(`/Projects/manager/${managerId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching projects for manager ${managerId}:`, error);
      throw error;
    }
  },

  getProjectBudget: async (id: number) => {
    try {
      const response = await api.get(`/Projects/${id}/budget`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching budget for project ${id}:`, error);
      throw error;
    }
  },

  getProjectSpend: async (id: number) => {
    try {
      const response = await api.get(`/Projects/${id}/spend`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching spend for project ${id}:`, error);
      throw error;
    }
  },

  updateStatus: async (id: number, status: string) => {
    const response = await api.put(`/Projects/${id}/status`, JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  updateCost: async (id: number, cost: number) => {
    const response = await api.put(`/Projects/${id}/cost`, cost);
    return response.data;
  },

  getBySection: async (sectionId: number) => {
    const response = await api.get(`/Projects/section/${sectionId}`);
    return response.data;
  },

  getByManager: async (managerId: number) => {
    const response = await api.get(`/Projects/manager/${managerId}`);
    return response.data;
  },

  getBudget: async (id: number) => {
    const response = await api.get(`/Projects/${id}/budget`);
    return response.data;
  },

  getSpend: async (id: number) => {
    const response = await api.get(`/Projects/${id}/spend`);
    return response.data;
  },

  getCompletion: async (id: number) => {
    const response = await api.get(`/Projects/${id}/completion`);
    return response.data;
  },

  updateApprovalStatus: async (id: number, data: {
    isApproved: boolean;
    poNumber?: string;
    rejectionReason?: string;
    approvedBy?: string;
    approvalDate?: string;
  }) => {
    try {
      console.log('Updating approval status with data:', data);
      if (data.isApproved) {
        await api.post(`/Projects/${id}/approve`, { 
          poNumber: data.poNumber,
          approvedBy: data.approvedBy
        });
      } else {
        await api.post(`/Projects/${id}/reject`, { 
          reason: data.rejectionReason,
          rejectedBy: data.approvedBy
        });
      }
    } catch (error) {
      console.error(`Error updating approval status for project ${id}:`, error);
      throw error;
    }
  },

  getProjectNumberPreview: async (sectionId: number, startDate?: Date) => {
    try {
      const params = new URLSearchParams();
      params.append('sectionId', sectionId.toString());
      if (startDate) {
        // Format date as YYYY-MM-DD to avoid timezone issues
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        console.log(`Frontend: Original date: ${startDate}, Formatted: ${dateString}, Month: ${startDate.getMonth() + 1}`);
        params.append('startDate', dateString);
      }
      
      const response = await api.get(`/Projects/preview-number?${params.toString()}`);
      return response.data.projectNumber;
    } catch (error) {
      console.error('Error getting project number preview:', error);
      throw error;
    }
  },

  getProjectInvoices: async (id: number) => {
    try {
      console.log(`🔍 ProjectAPI: Fetching invoices for project ID: ${id}`);
      const response = await api.get(`/Projects/${id}/invoices`);
      console.log(`🔍 ProjectAPI: Response status: ${response.status}`);
      console.log(`🔍 ProjectAPI: Response data:`, response.data);
      console.log(`🔍 ProjectAPI: Data type:`, typeof response.data);
      console.log(`🔍 ProjectAPI: Is array:`, Array.isArray(response.data));
      
      // Handle Entity Framework JSON structure if needed
      let invoices = response.data;
      if (invoices && invoices.$values && Array.isArray(invoices.$values)) {
        console.log('🔍 ProjectAPI: Extracting invoices from $values array');
        invoices = invoices.$values;
      }
      
      console.log(`🔍 ProjectAPI: Final invoices array:`, invoices);
      console.log(`🔍 ProjectAPI: Final array length:`, invoices.length);
      return invoices;
    } catch (error) {
      console.error(`❌ ProjectAPI: Error fetching invoices for project ${id}:`, error);
      throw error;
    }
  },
}; 