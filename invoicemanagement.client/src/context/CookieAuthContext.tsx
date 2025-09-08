import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { cookieAuthService, UserInfo } from '../services/cookieAuthService';

interface CookieAuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionId: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const CookieAuthContext = createContext<CookieAuthContextType | undefined>(undefined);

export const useCookieAuth = () => {
  const context = useContext(CookieAuthContext);
  if (context === undefined) {
    throw new Error('useCookieAuth must be used within a CookieAuthProvider');
  }
  return context;
};

interface CookieAuthProviderProps {
  children: ReactNode;
}

export const CookieAuthProvider: React.FC<CookieAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await cookieAuthService.login({ username, password });
      
      // After successful login, set user and authentication state
      setUser(response.user);
      setIsAuthenticated(true);
      setSessionId(response.sessionId);
      
      console.log('🔐 CookieAuth: Login successful, user state updated:', response.user);
      console.log('🔐 CookieAuth: Session ID:', response.sessionId);
    } catch (error) {
      console.error('🔐 CookieAuth: Login failed:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await cookieAuthService.logout();
    } catch (error) {
      console.error('🔐 CookieAuth: Logout error:', error);
    } finally {
      // Clear local state regardless of logout success
      setUser(null);
      setIsAuthenticated(false);
      setSessionId(null);
      
      console.log('🔐 CookieAuth: Logout successful, user state cleared');
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const sessionData = await cookieAuthService.validateSession();
      if (sessionData) {
        setUser(sessionData.user);
        setIsAuthenticated(true);
        setSessionId(sessionData.sessionId);
        console.log('🔐 CookieAuth: User refreshed:', sessionData.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setSessionId(null);
        console.log('🔐 CookieAuth: No valid session found');
      }
    } catch (error) {
      console.error('🔐 CookieAuth: Failed to refresh user:', error);
      setUser(null);
      setIsAuthenticated(false);
      setSessionId(null);
    }
  };

  useEffect(() => {
    // Initialize authentication state on app load
    const initializeAuth = async () => {
      try {
        console.log('🔐 CookieAuth: Initializing authentication...');
        
        // Try to validate current session from cookies
        const sessionData = await cookieAuthService.validateSession();
        
        if (sessionData) {
          setUser(sessionData.user);
          setIsAuthenticated(true);
          setSessionId(sessionData.sessionId);
          console.log('🔐 CookieAuth: Found valid session:', sessionData.sessionId);
          console.log('🔐 CookieAuth: User:', sessionData.user);
        } else {
          console.log('🔐 CookieAuth: No valid session found');
        }
      } catch (error) {
        console.error('🔐 CookieAuth: Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        console.log('🔐 CookieAuth: Attempting automatic token refresh...');
        await cookieAuthService.refreshToken();
        console.log('🔐 CookieAuth: Token refreshed automatically');
      } catch (error) {
        console.log('🔐 CookieAuth: Automatic token refresh failed:', error);
        // If refresh fails, validate session to check if we're still authenticated
        await refreshUser();
      }
    }, 50 * 60 * 1000); // Refresh every 50 minutes (tokens expire in 60 minutes)

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const value: CookieAuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    sessionId,
    login,
    logout,
    refreshUser,
  };

  return (
    <CookieAuthContext.Provider value={value}>
      {children}
    </CookieAuthContext.Provider>
  );
};
