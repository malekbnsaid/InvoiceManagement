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
  private userKey = 'user_info';
  private tokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';

  constructor() {
    // Clear expired tokens on startup
    this.clearExpiredTokens();
    
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

  // Clear expired tokens on startup
  private clearExpiredTokens(): void {
    console.log('🔐 AuthService: Clearing expired tokens on startup');
    
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    
    if (token && this.isTokenExpired(token)) {
      console.log('🔐 AuthService: Clearing expired access token');
      localStorage.removeItem(this.tokenKey);
    }
    
    if (refreshToken && this.isRefreshTokenExpired(refreshToken)) {
      console.log('🔐 AuthService: Clearing expired refresh token');
      localStorage.removeItem(this.refreshTokenKey);
    }
    
    // If both tokens are expired, clear user info too
    if ((!token || this.isTokenExpired(token)) && (!refreshToken || this.isRefreshTokenExpired(refreshToken))) {
      console.log('🔐 AuthService: All tokens expired, clearing user info');
      localStorage.removeItem(this.userKey);
    }
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
      
      // Extract token and user info from response body
      if (response.data && response.data.user) {
        this.setUser(response.data.user);
        
        // Store token in localStorage for persistence
        if (response.data.token) {
          localStorage.setItem(this.tokenKey, response.data.token);
          console.log('🔐 AuthService: Token stored in localStorage');
        } else {
          console.log('🔐 AuthService: No token found in response body');
        }
        
        // Store refresh token if available
        if (response.data.refreshToken) {
          localStorage.setItem(this.refreshTokenKey, response.data.refreshToken);
          console.log('🔐 AuthService: Refresh token stored in localStorage');
        }
        
        // Return the response data
        return {
          token: response.data.token || 'cookie-stored',
          refreshToken: response.data.refreshToken || 'cookie-stored',
          expiresAt: response.data.expiresAt || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          user: response.data.user
        };
      }
      
      throw new Error('Invalid login response');
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
      console.log('🔐 AuthService: Attempting to refresh token via cookies');
      
      // With cookie-based auth, we just need to call the refresh endpoint
      // The backend will handle the refresh token from cookies
      const response = await api.post<LoginResponse>('/auth/refresh');
      
      if (response.data && response.data.user) {
        console.log('🔐 AuthService: Token refreshed successfully');
        
        // Update stored tokens and user info
        if (response.data.token) {
          localStorage.setItem(this.tokenKey, response.data.token);
        }
        if (response.data.refreshToken) {
          localStorage.setItem(this.refreshTokenKey, response.data.refreshToken);
        }
        
        this.setUser(response.data.user);
        return response.data;
      }
      
      throw new Error('Invalid refresh response');
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  // Logout user
  logout(): void {
    // Clear all stored data
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    // Cookies are cleared by the backend
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    console.log('🔐 AuthService: isAuthenticated called');
    console.log('🔐 AuthService: DevBypass enabled:', this.isDevBypass());
    
    if (this.isDevBypass()) {
      console.log('🔐 AuthService: DevBypass enabled, returning true');
      return true;
    }
    
    // Check if we have a user (this indicates successful authentication)
    const user = this.getUser();
    if (!user) {
      console.log('🔐 AuthService: No user found, returning false');
      return false;
    }
    
    // Check if we have a valid token (either real token or cookie-stored)
    const token = this.getToken();
    if (!token) {
      console.log('🔐 AuthService: No token found, returning false');
      return false;
    }
    
    // If token is 'cookie-stored', it means we're using cookie-based auth
    if (token === 'cookie-stored') {
      console.log('🔐 AuthService: Cookie-based token found, returning true');
      return true;
    }
    
    // Check if real token is expired
    if (this.isTokenExpired(token)) {
      console.log('🔐 AuthService: Token is expired, clearing and returning false');
      this.logout();
      return false;
    }
    
    console.log('🔐 AuthService: Valid token found, returning true');
    return true;
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

  // Get current token from localStorage
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get refresh token from localStorage
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Check if token is expired
  private isTokenExpired(token: string): boolean {
    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        console.log('🔐 AuthService: Token expired at:', new Date(payload.exp * 1000));
        console.log('🔐 AuthService: Current time:', new Date(currentTime * 1000));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('🔐 AuthService: Error checking token expiration:', error);
      // If we can't decode the token, assume it's invalid
      return true;
    }
  }

  // Check if refresh token is expired
  private isRefreshTokenExpired(refreshToken: string): boolean {
    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(refreshToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        console.log('🔐 AuthService: Refresh token expired at:', new Date(payload.exp * 1000));
        console.log('🔐 AuthService: Current time:', new Date(currentTime * 1000));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('🔐 AuthService: Error checking refresh token expiration:', error);
      // If we can't decode the token, assume it's invalid
      return true;
    }
  }

  // Set tokens in localStorage
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
