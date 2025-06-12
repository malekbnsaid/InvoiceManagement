import { api } from './api';

export const employeeApi = {
  getAll: async () => {
    const response = await api.get('/ERPEmployees');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/ERPEmployees/${id}`);
    return response.data;
  },

  getByNumber: async (employeeNumber: string) => {
    const response = await api.get(`/ERPEmployees/number/${employeeNumber}`);
    return response.data;
  },

  create: async (employee: any) => {
    const response = await api.post('/ERPEmployees', employee);
    return response.data;
  },

  update: async (id: number, employee: any) => {
    const response = await api.put(`/ERPEmployees/${id}`, employee);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/ERPEmployees/${id}`);
    return response.data;
  },

  getByDepartment: async (departmentId: number) => {
    const response = await api.get(`/Employee/department/${departmentId}`);
    return response.data;
  }
}; 