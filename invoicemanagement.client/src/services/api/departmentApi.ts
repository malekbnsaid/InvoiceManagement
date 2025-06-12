import { api } from './api';

export const departmentApi = {
  getAll: async () => {
    const response = await api.get('/Department');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/Department/${id}`);
    return response.data;
  },

  create: async (department: any) => {
    const response = await api.post('/Department', department);
    return response.data;
  },

  update: async (id: number, department: any) => {
    const response = await api.put(`/Department/${id}`, department);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/Department/${id}`);
    return response.data;
  }
}; 