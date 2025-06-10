import axios from 'axios';
import { CurrencyType } from '../types/enums';

// Create an axios instance with default config
const API_BASE_URL = 'http://localhost:5274/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      console.error('Status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

// Project API calls
export const projectApi = {
  getAll: async () => {
    const response = await api.get('/Projects');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/Projects/${id}`);
    return response.data;
  },

  getByNumber: async (projectNumber: string) => {
    const response = await api.get(`/Projects/number/${projectNumber}`);
    return response.data;
  },

  create: async (project: any) => {
    try {
      // Log the raw project data
      console.log('Raw project data:', project);
      
      // Format dates to UTC ISO string
      const formatDate = (date: Date | null | string) => {
        if (!date) return null;
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toISOString();
      };

      // Get section details
      const sectionId = project.section ? parseInt(project.section) : (project.sectionId ? parseInt(project.sectionId) : null);
      let sectionDetails = null;
      
      if (sectionId) {
        try {
          const response = await api.get(`/Department/${sectionId}`);
          sectionDetails = response.data;
        } catch (error) {
          console.error('Error fetching section details:', error);
        }
      }

      // Ensure required fields are present and properly formatted
      const formattedProject = {
        Id: 0,
        Name: project.name.trim(),
        Description: (project.description || '').trim(),
        ProjectNumber: project.projectNumber,
        SectionId: sectionId,
        ProjectManagerId: project.projectManagerId ? parseInt(project.projectManagerId) : null,
        Budget: project.budget ? parseFloat(project.budget) : null,
        Cost: project.cost || 0,
        IsApproved: false,
        ExpectedStart: formatDate(project.expectedStart),
        ExpectedEnd: formatDate(project.expectedEnd),
        TenderDate: formatDate(project.tenderDate),
        PaymentPlanLines: (project.paymentPlanLines || []).map((line: any) => ({
          Id: 0,
          Year: parseInt(line.year),
          Amount: parseFloat(line.amount),
          Currency: line.currency,
          PaymentType: line.paymentType,
          Description: (line.description || '').trim(),
          Project: {
            Id: 0,
            Name: project.name.trim(),
            Description: (project.description || '').trim(),
            ProjectNumber: project.projectNumber,
            SectionId: sectionId,
            ProjectManagerId: project.projectManagerId ? parseInt(project.projectManagerId) : null
          }
        })),
        CreatedAt: new Date().toISOString(),
        CreatedBy: 'system',
        ModifiedAt: null,
        ModifiedBy: null
      };

      // Validate required fields before sending
      if (!formattedProject.SectionId) {
        throw new Error('Section is required');
      }

      if (!formattedProject.ProjectManagerId) {
        throw new Error('Project Manager is required');
      }

      if (!formattedProject.Name) {
        throw new Error('Project Name is required');
      }

      // Log the formatted data
      console.log('Formatted project data:', formattedProject);
      
      // Log the actual request being sent
      console.log('Sending request to:', '/Projects');
      console.log('Request payload:', JSON.stringify(formattedProject, null, 2));
      
      const response = await api.post('/Projects', formattedProject);
      console.log('API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating project:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
        console.error('Error data:', error.response.data);
        if (error.response.data?.errors) {
          console.error('Validation errors:', error.response.data.errors);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  },

  update: async (id: number, project: any) => {
    try {
      console.log('Updating project:', id, project);
      const response = await api.put(`/Projects/${id}`, project);
      console.log('Update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating project:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  delete: async (id: number) => {
    const response = await api.delete(`/Projects/${id}`);
    return response.data;
  },

  approve: async (id: number, approvedBy: string) => {
    const response = await api.post(`/Projects/${id}/approve`, { approvedBy });
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

  updateStatus: async (id: number, status: string) => {
    const response = await api.put(`/Projects/${id}/status`, { status });
    return response.data;
  },
};

// Department API calls
export const departmentApi = {
  getAll: async () => {
    try {
      const response = await api.get('/Department');
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },
  getDepartments: async () => {
    try {
      const response = await api.get('/Department/departments');
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },
  getSections: async (departmentNumber: number) => {
    try {
      const response = await api.get(`/Department/sections/${departmentNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sections:', error);
      throw error;
    }
  },
  getUnits: async (sectionNumber: number) => {
    try {
      const response = await api.get(`/Department/units/${sectionNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching units:', error);
      throw error;
    }
  }
};

// Employee API calls
export const employeeApi = {
  getAll: async () => {
    try {
      const response = await api.get('/ERPEmployees');
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },
};

export default api; 