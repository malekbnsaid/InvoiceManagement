import { api } from './api';

export interface AppUser {
  id: number;
  username: string;
  email: string;
  role: number;
  roleName: string;
  isActive: boolean;
  lastLoginDate?: string;
  createdAt: string;
  modifiedAt?: string;
  employeeNumber: string;
  employeeName?: string;
  department?: string;
}

export interface CreateAppUser {
  username: string;
  email: string;
  password: string;
  role: number;
  employeeNumber?: string;
}

export interface UpdateAppUser {
  username: string;
  email: string;
  password?: string;
  role: number;
  isActive: boolean;
}

export interface Role {
  value: number;
  name: string;
  description: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  roleBreakdown: { [key: string]: number };
}

export const appUserApi = {
  // Get all users
  getAll: async (): Promise<AppUser[]> => {
    try {
      console.log('🔍 AppUserAPI: Making request to /AppUser');
      const response = await api.get('/AppUser');
      console.log('🔍 AppUserAPI: Response status:', response.status);
      console.log('🔍 AppUserAPI: Response data:', response.data);
      
      if (!response.data) {
        console.error('❌ AppUserAPI: No data in response');
        return [];
      }
      
      // Handle Entity Framework JSON format
      let users = response.data;
      if (response.data && response.data.$values && Array.isArray(response.data.$values)) {
        console.log('🔍 AppUserAPI: Extracting users from $values array');
        users = response.data.$values;
      }
      
      console.log('🔍 AppUserAPI: Final users array:', users);
      console.log('🔍 AppUserAPI: Final array length:', users.length);
      
      return users;
    } catch (error) {
      console.error('❌ AppUserAPI: Error fetching users:', error);
      if (error.response) {
        console.error('❌ AppUserAPI: Response status:', error.response.status);
        console.error('❌ AppUserAPI: Response data:', error.response.data);
      }
      throw error;
    }
  },

  // Get user by ID
  getById: async (id: number): Promise<AppUser> => {
    const response = await api.get(`/AppUser/${id}`);
    return response.data;
  },

  // Create new user
  create: async (user: CreateAppUser): Promise<AppUser> => {
    const response = await api.post('/AppUser', user);
    return response.data;
  },

  // Update user
  update: async (id: number, user: UpdateAppUser): Promise<void> => {
    await api.put(`/AppUser/${id}`, user);
  },

  // Delete user (soft delete)
  delete: async (id: number): Promise<void> => {
    await api.delete(`/AppUser/${id}`);
  },

  // Get all roles
  getRoles: async (): Promise<Role[]> => {
    const response = await api.get('/AppUser/roles');
    
    // Handle Entity Framework JSON format
    let roles = response.data;
    if (response.data && response.data.$values && Array.isArray(response.data.$values)) {
      roles = response.data.$values;
    }
    
    return roles;
  },

  // Get user statistics
  getStats: async (): Promise<UserStats> => {
    const response = await api.get('/AppUser/stats');
    
    // Handle Entity Framework JSON format
    let stats = response.data;
    if (response.data && response.data.$values && Array.isArray(response.data.$values)) {
      stats = response.data.$values;
    }
    
    return stats;
  }
};
