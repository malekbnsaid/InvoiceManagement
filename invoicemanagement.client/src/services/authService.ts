import { api } from './api';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
}

export interface UserInfo {
  userId: number;
  username: string;
  email: string;
  role: string;
  employeeNumber: string;
  isActive: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
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

class AuthService {
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'user_info';

  constructor() {
    // Initialize DevBypass on service creation if enabled
    if (this.isDevBypass()) {
      this.initializeDevBypass();
    }
  }

  // Check if dev bypass is enabled
  private isDevBypass(): boolean {
    // Temporarily disabled for testing real authentication
    console.log('🔐 AuthService: DevBypass temporarily disabled for testing');
    return false;
  }

  // Initialize dev bypass if enabled
  public initializeDevBypass(): void {
    console.log('🔐 AuthService: initializeDevBypass called');
    if (this.isDevBypass()) {
      console.log('🔐 AuthService: DevBypass is enabled, setting up fake user');
      const fakeToken = 'fake-dev-token';
      const fakeUser: UserInfo = {
        userId: 1,
        username: 'admin',
        email: 'admin@company.com',
        role: 'Admin',
        employeeNumber: 'EMP001',
        isActive: true
      };

      localStorage.setItem(this.tokenKey, fakeToken);
      localStorage.setItem(this.refreshTokenKey, 'fake-refresh-token');
      localStorage.setItem(this.userKey, JSON.stringify(fakeUser));
      
      console.log('🔐 AuthService: Fake user set in localStorage');
      console.log('🔐 AuthService: User from localStorage:', this.getUser());
      console.log('🔐 AuthService: Is authenticated:', this.isAuthenticated());
    } else {
      console.log('🔐 AuthService: DevBypass is NOT enabled');
    }
  }

  // Login user
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    if (this.isDevBypass()) {
      this.initializeDevBypass();
      const user = this.getUser();
      return {
        token: 'fake-dev-token',
        refreshToken: 'fake-refresh-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        user: user!
      };
    }

    try {
      console.log('🔐 AuthService: Attempting login to:', '/auth/login');
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      this.setTokens(response.data.token, response.data.refreshToken);
      this.setUser(response.data.user);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // Signup user
  async signup(credentials: SignupRequest): Promise<SignupResponse> {
    try {
      console.log('🔐 AuthService: Attempting signup to:', '/auth/signup');
      const response = await api.post<SignupResponse>('/auth/signup', credentials);
      return response.data;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken(): Promise<LoginResponse> {
    if (this.isDevBypass()) {
      return this.login({ username: 'admin', password: 'password' });
    }

    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post<LoginResponse>('/auth/refresh', { refreshToken });
      this.setTokens(response.data.token, response.data.refreshToken);
      this.setUser(response.data.user);
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  // Logout user
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    console.log('🔐 AuthService: isAuthenticated called');
    console.log('🔐 AuthService: DevBypass enabled:', this.isDevBypass());
    console.log('🔐 AuthService: Token exists:', !!this.getToken());
    
    if (this.isDevBypass()) {
      console.log('🔐 AuthService: DevBypass enabled, returning true');
      return true;
    }
    
    const hasToken = !!this.getToken();
    console.log('🔐 AuthService: No DevBypass, returning:', hasToken);
    return hasToken;
  }

  // Get current user info
  getUser(): UserInfo | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr) as UserInfo;
    } catch {
      return null;
    }
  }

  // Get current token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Set tokens
  private setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  // Set user info
  private setUser(user: UserInfo): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    return user.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    if (!user) return false;
    return roles.includes(user.role);
  }

  // Check if user can perform specific actions based on role hierarchy
  canCreateProject(): boolean {
    return this.hasAnyRole(['PM', 'PMO', 'Head', 'Admin']);
  }

  canApproveProject(): boolean {
    return this.hasAnyRole(['PMO', 'Head', 'Admin']);
  }

  canDeleteProject(): boolean {
    return this.hasAnyRole(['Head', 'Admin']);
  }

  canUploadInvoice(): boolean {
    return this.hasAnyRole(['Secretary', 'PM', 'PMO', 'Head', 'Admin']);
  }

  canManageUsers(): boolean {
    return this.hasAnyRole(['Admin']);
  }

  // Get user's display name
  getDisplayName(): string {
    const user = this.getUser();
    return user ? user.username : 'Guest';
  }

  // Get user's role display name
  getRoleDisplayName(): string {
    const user = this.getUser();
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
}

export const authService = new AuthService();
