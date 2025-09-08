import { api } from './api/api';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: UserInfo;
  expiresAt: string;
  sessionId: string;
  message: string;
}

export interface UserInfo {
  userId: number;
  username: string;
  email: string;
  role: string;
  employeeNumber: string;
  isActive: boolean;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  employeeNumber: string;
  role: string;
}

export interface SignupResponse {
  success: boolean;
  message: string;
  user?: UserInfo;
}

class CookieAuthService {
  private readonly baseURL = '/cookieauth';

  constructor() {
    console.log('🔐 CookieAuthService: Initialized');
  }

  // Login user with HTTP-only cookies
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔐 CookieAuthService: Attempting login to:', `${this.baseURL}/login`);
      
      // Generate session ID for session isolation
      const sessionId = this.generateSessionId();
      
      const response = await api.post<LoginResponse>(`${this.baseURL}/login`, credentials, {
        headers: {
          'X-Session-Id': sessionId
        },
        withCredentials: true // Important: send cookies
      });
      
      if (response.data && response.data.user) {
        console.log('🔐 CookieAuthService: Login successful, session:', response.data.sessionId);
        return response.data;
      }
      
      throw new Error('Invalid login response');
    } catch (error) {
      console.error('🔐 CookieAuthService: Login failed:', error);
      throw error;
    }
  }

  // Refresh token using HTTP-only cookies
  async refreshToken(): Promise<LoginResponse> {
    try {
      console.log('🔐 CookieAuthService: Attempting to refresh token');
      
      const response = await api.post<LoginResponse>(`${this.baseURL}/refresh`, {}, {
        withCredentials: true
      });
      
      if (response.data && response.data.user) {
        console.log('🔐 CookieAuthService: Token refreshed successfully');
        return response.data;
      }
      
      throw new Error('Invalid refresh response');
    } catch (error) {
      console.error('🔐 CookieAuthService: Token refresh failed:', error);
      throw error;
    }
  }

  // Logout user and clear cookies
  async logout(): Promise<void> {
    try {
      console.log('🔐 CookieAuthService: Attempting logout');
      
      await api.post(`${this.baseURL}/logout`, {}, {
        withCredentials: true
      });
      
      console.log('🔐 CookieAuthService: Logout successful');
    } catch (error) {
      console.error('🔐 CookieAuthService: Logout error:', error);
      // Don't throw error on logout - cookies will be cleared anyway
    }
  }

  // Validate current session
  async validateSession(): Promise<{ user: UserInfo; sessionId: string } | null> {
    try {
      console.log('🔐 CookieAuthService: Validating session');
      
      const response = await api.get<{ user: UserInfo; sessionId: string; message: string }>(`${this.baseURL}/validate`, {
        withCredentials: true
      });
      
      if (response.data && response.data.user) {
        console.log('🔐 CookieAuthService: Session is valid, session:', response.data.sessionId);
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.log('🔐 CookieAuthService: Session validation failed:', error);
      return null;
    }
  }

  // Get session information (for debugging)
  async getSessionInfo(): Promise<{
    sessionId: string | null;
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    cookies: string[];
  }> {
    try {
      const response = await api.get<{
        sessionId: string | null;
        hasAccessToken: boolean;
        hasRefreshToken: boolean;
        cookies: string[];
      }>(`${this.baseURL}/session-info`, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      console.error('🔐 CookieAuthService: Failed to get session info:', error);
      return {
        sessionId: null,
        hasAccessToken: false,
        hasRefreshToken: false,
        cookies: []
      };
    }
  }

  // Check if user has specific role
  hasRole(user: UserInfo | null, role: string): boolean {
    if (!user) return false;
    return user.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(user: UserInfo | null, roles: string[]): boolean {
    if (!user) return false;
    return roles.includes(user.role);
  }

  // Permission checks based on role hierarchy
  canCreateProject(user: UserInfo | null): boolean {
    return this.hasAnyRole(user, ['PM', 'PMO', 'Head', 'Admin']);
  }

  canApproveProject(user: UserInfo | null): boolean {
    return this.hasAnyRole(user, ['PMO', 'Head', 'Admin']);
  }

  canDeleteProject(user: UserInfo | null): boolean {
    return this.hasAnyRole(user, ['Head', 'Admin']);
  }

  canUploadInvoice(user: UserInfo | null): boolean {
    return this.hasAnyRole(user, ['Secretary', 'PM', 'PMO', 'Head', 'Admin']);
  }

  canManageUsers(user: UserInfo | null): boolean {
    return this.hasAnyRole(user, ['Admin']);
  }

  // Get user's display name
  getDisplayName(user: UserInfo | null): string {
    return user ? user.username : 'Guest';
  }

  // Get user's role display name
  getRoleDisplayName(user: UserInfo | null): string {
    if (!user) return 'Guest';
    
    const roleNames: Record<string, string> = {
      'Admin': 'Administrator',
      'Head': 'Department Head',
      'PMO': 'Project Management Office',
      'PM': 'Project Manager',
      'Secretary': 'Secretary',
      'ReadOnly': 'Read Only'
    };
    
    return roleNames[user.role] || user.role;
  }

  // Generate session ID for session isolation
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get session ID from cookie (if accessible)
  getSessionIdFromCookie(): string | null {
    try {
      // Try to read session_id cookie (this is not HTTP-only)
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('session_id='));
      
      if (sessionCookie) {
        return sessionCookie.split('=')[1];
      }
    } catch (error) {
      console.log('🔐 CookieAuthService: Could not read session ID from cookie');
    }
    
    return null;
  }
}

export const cookieAuthService = new CookieAuthService();
