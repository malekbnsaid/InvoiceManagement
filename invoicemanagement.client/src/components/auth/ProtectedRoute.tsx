import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { LoadingPage } from '../ui/LoadingPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [], 
  fallback 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  console.log('🔐 ProtectedRoute: Render state:', { isAuthenticated, user, isLoading });

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('🔐 ProtectedRoute: Not authenticated, redirecting to /auth');
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading while initializing auth
  if (isLoading) {
    console.log('🔐 ProtectedRoute: Showing loading spinner');
    return (
      <LoadingPage 
        message="Initializing..." 
        showSpinner={true}
      />
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    console.log('🔐 ProtectedRoute: Not authenticated, waiting for redirect');
    return null;
  }

  console.log('🔐 ProtectedRoute: Authenticated, showing protected content');

  // If roles are required, check if user has access
  if (requiredRoles.length > 0 && user) {
    const hasAccess = authService.hasAnyRole(requiredRoles);
    
    if (!hasAccess) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center">
            <div className="bg-red-50 border border-red-200 rounded-md p-6">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Access Denied
              </h3>
              <p className="text-sm text-red-600">
                You don't have permission to access this page. 
                Required roles: {requiredRoles.join(', ')}
              </p>
              <p className="text-sm text-red-600 mt-2">
                Your current role: {user.role}
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// Convenience components for specific role requirements
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['Admin']}>
    {children}
  </ProtectedRoute>
);

export const HeadOrAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['Head', 'Admin']}>
    {children}
  </ProtectedRoute>
);

export const PMOOrHigherRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['PMO', 'Head', 'Admin']}>
    {children}
  </ProtectedRoute>
);

export const PMOrHigherRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['PM', 'PMO', 'Head', 'Admin']}>
    {children}
  </ProtectedRoute>
);

export const SecretaryOrHigherRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['Secretary', 'PM', 'PMO', 'Head', 'Admin']}>
    {children}
  </ProtectedRoute>
);
