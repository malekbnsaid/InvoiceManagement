import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { sessionAuthService, UserInfo } from '../services/sessionAuthService';
import { sessionStorageService } from '../services/sessionStorageService';

interface SessionAuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
  sessionId: string | null;
}

const SessionAuthContext = createContext<SessionAuthContextType | undefined>(undefined);

export const useSessionAuth = () => {
  const context = useContext(SessionAuthContext);
  if (context === undefined) {
    throw new Error('useSessionAuth must be used within a SessionAuthProvider');
  }
  return context;
};

interface SessionAuthProviderProps {
  children: ReactNode;
}

export const SessionAuthProvider: React.FC<SessionAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await sessionAuthService.login({ username, password });
      
      // After successful login, we should be authenticated
      // Set the user and authentication state directly
      setUser(response.user);
      setIsAuthenticated(true);
      
      console.log('🔐 SessionAuth Login successful, user state updated:', response.user);
      console.log('🔐 SessionAuth Authentication state set to true for session:', sessionStorageService.getSessionId());
    } catch (error) {
      console.error('SessionAuth Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    sessionAuthService.logout();
    
    // Clear local state directly
    setUser(null);
    setIsAuthenticated(false);
    
    console.log('🔐 SessionAuth Logout successful, user state cleared for session:', sessionStorageService.getSessionId());
  };

  const refreshUser = () => {
    const currentUser = sessionAuthService.getUser();
    const authenticated = sessionAuthService.isAuthenticated();
    setUser(currentUser);
    setIsAuthenticated(authenticated);
    console.log('🔐 SessionAuth User refreshed:', currentUser, 'Authenticated:', authenticated, 'Session:', sessionStorageService.getSessionId());
  };

  useEffect(() => {
    // Initialize user state on app load
    const initializeAuth = async () => {
      try {
        const currentSessionId = sessionStorageService.getSessionId();
        setSessionId(currentSessionId);
        
        console.log('🔐 SessionAuth Initializing auth for session:', currentSessionId);
        console.log('🔐 SessionAuth DevBypass enabled:', import.meta.env.VITE_DEV_BYPASS === 'true');
        
        // If DevBypass is enabled, initialize it first
        const envValue = import.meta.env.VITE_DEV_BYPASS;
        const nodeEnv = import.meta.env.MODE;
        const isDev = nodeEnv === 'development';
        
        if (envValue === 'true' || (isDev && envValue !== 'false')) {
          console.log('🔐 SessionAuth Initializing DevBypass for session:', currentSessionId);
          // Force DevBypass initialization
          sessionAuthService.initializeDevBypass();
        }
        
        const currentUser = sessionAuthService.getUser();
        const authenticated = sessionAuthService.isAuthenticated();
        
        console.log('🔐 SessionAuth Current user:', currentUser);
        console.log('🔐 SessionAuth Is authenticated:', authenticated);
        console.log('🔐 SessionAuth Session info:', sessionAuthService.getSessionInfo());
        
        setUser(currentUser);
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error('SessionAuth Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for storage changes from other tabs (optional - for cross-tab logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only handle sessionStorage changes (though they don't propagate between tabs)
      // This is here for future extensibility
      if (e.key === 'session_user_info' && e.newValue === null) {
        console.log('🔐 SessionAuth Detected logout in another context');
        // Don't automatically logout this tab as sessionStorage is tab-isolated
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const value: SessionAuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
    sessionId,
  };

  return (
    <SessionAuthContext.Provider value={value}>
      {children}
    </SessionAuthContext.Provider>
  );
};
