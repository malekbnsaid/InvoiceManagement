import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, UserInfo } from '../services/authService';

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await authService.login({ username, password });
      
      // After successful login, we should be authenticated
      // Set the user and authentication state directly
      setUser(response.user);
      setIsAuthenticated(true);
      
      console.log('🔐 Login successful, user state updated:', response.user);
      console.log('🔐 Authentication state set to true');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    
    // Clear local state directly
    setUser(null);
    setIsAuthenticated(false);
    
    console.log('🔐 Logout successful, user state cleared');
  };

  const refreshUser = () => {
    const currentUser = authService.getUser();
    const authenticated = authService.isAuthenticated();
    setUser(currentUser);
    setIsAuthenticated(authenticated);
    console.log('🔐 User refreshed:', currentUser, 'Authenticated:', authenticated);
  };

  useEffect(() => {
    // Initialize user state on app load
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        console.log('🔐 DevBypass enabled:', import.meta.env.VITE_DEV_BYPASS === 'true');
        
        // If DevBypass is enabled, initialize it first
        const envValue = import.meta.env.VITE_DEV_BYPASS;
        const nodeEnv = import.meta.env.MODE;
        const isDev = nodeEnv === 'development';
        
        if (envValue === 'true' || (isDev && envValue !== 'false')) {
          console.log('🔐 Initializing DevBypass...');
          // Force DevBypass initialization
          authService.initializeDevBypass();
        }
        
        const currentUser = authService.getUser();
        const authenticated = authService.isAuthenticated();
        
        console.log('🔐 Current user:', currentUser);
        console.log('🔐 Is authenticated:', authenticated);
        
        setUser(currentUser);
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
