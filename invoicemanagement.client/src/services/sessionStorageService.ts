import { UserInfo } from './authService';

/**
 * Session-isolated storage service that uses sessionStorage instead of localStorage
 * This ensures that each browser tab/window has its own authentication state
 */
export class SessionStorageService {
  private userKey = 'session_user_info';
  private tokenKey = 'session_access_token';
  private refreshTokenKey = 'session_refresh_token';
  private sessionIdKey = 'session_id';

  constructor() {
    this.initializeSession();
  }

  // Generate a unique session ID for this tab/window
  private initializeSession(): void {
    if (!sessionStorage.getItem(this.sessionIdKey)) {
      const sessionId = this.generateSessionId();
      sessionStorage.setItem(this.sessionIdKey, sessionId);
      console.log('🔐 SessionStorage: New session initialized:', sessionId);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSessionId(): string | null {
    return sessionStorage.getItem(this.sessionIdKey);
  }

  // User management
  setUser(user: UserInfo): void {
    sessionStorage.setItem(this.userKey, JSON.stringify(user));
    console.log('🔐 SessionStorage: User set for session:', this.getSessionId());
  }

  getUser(): UserInfo | null {
    const userStr = sessionStorage.getItem(this.userKey);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr) as UserInfo;
    } catch {
      return null;
    }
  }

  clearUser(): void {
    sessionStorage.removeItem(this.userKey);
    console.log('🔐 SessionStorage: User cleared for session:', this.getSessionId());
  }

  // Token management
  setToken(token: string): void {
    sessionStorage.setItem(this.tokenKey, token);
    console.log('🔐 SessionStorage: Token set for session:', this.getSessionId());
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    sessionStorage.removeItem(this.tokenKey);
    console.log('🔐 SessionStorage: Token cleared for session:', this.getSessionId());
  }

  // Refresh token management
  setRefreshToken(refreshToken: string): void {
    sessionStorage.setItem(this.refreshTokenKey, refreshToken);
    console.log('🔐 SessionStorage: Refresh token set for session:', this.getSessionId());
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.refreshTokenKey);
  }

  clearRefreshToken(): void {
    sessionStorage.removeItem(this.refreshTokenKey);
    console.log('🔐 SessionStorage: Refresh token cleared for session:', this.getSessionId());
  }

  // Clear all session data
  clearAll(): void {
    sessionStorage.removeItem(this.userKey);
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
    console.log('🔐 SessionStorage: All data cleared for session:', this.getSessionId());
  }

  // Check if session has authentication data
  hasAuthData(): boolean {
    return !!(this.getUser() && this.getToken());
  }

  // Get session info for debugging
  getSessionInfo(): {
    sessionId: string | null;
    hasUser: boolean;
    hasToken: boolean;
    hasRefreshToken: boolean;
    user: UserInfo | null;
  } {
    return {
      sessionId: this.getSessionId(),
      hasUser: !!this.getUser(),
      hasToken: !!this.getToken(),
      hasRefreshToken: !!this.getRefreshToken(),
      user: this.getUser()
    };
  }
}

export const sessionStorageService = new SessionStorageService();
