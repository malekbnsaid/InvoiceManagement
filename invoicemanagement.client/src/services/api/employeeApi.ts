import { api } from './api';

export const employeeApi = {
  getAll: async () => {
    try {
      console.log('🔍 EmployeeAPI: Making request to /ERPEmployees');
      const response = await api.get('/ERPEmployees');
      console.log('🔍 EmployeeAPI: Response status:', response.status);
      console.log('🔍 EmployeeAPI: Response data:', response.data);
      console.log('🔍 EmployeeAPI: Data type:', typeof response.data);
      console.log('🔍 EmployeeAPI: Is array:', Array.isArray(response.data));
      
      if (!response.data) {
        console.error('❌ EmployeeAPI: No data in response');
        return [];
      }
      
      // Handle Entity Framework JSON format
      let employees = response.data;
      if (response.data && response.data.$values && Array.isArray(response.data.$values)) {
        console.log('🔍 EmployeeAPI: Extracting employees from $values array');
        employees = response.data.$values;
      }
      
      console.log('🔍 EmployeeAPI: Final employees array:', employees);
      console.log('🔍 EmployeeAPI: Final array length:', employees.length);
      
      return employees;
    } catch (error) {
      console.error('❌ EmployeeAPI: Error fetching employees:', error);
      if (error.response) {
        console.error('❌ EmployeeAPI: Response status:', error.response.status);
        console.error('❌ EmployeeAPI: Response data:', error.response.data);
      }
      throw error;
    }
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