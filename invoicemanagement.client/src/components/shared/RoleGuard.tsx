import React from 'react';
import { usePermissions, PermissionConfig } from '../../hooks/usePermissions';

interface RoleGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireRoles?: string[];
  requireAnyRole?: string[];
  requireAllRoles?: string[];
  customCheck?: () => boolean;
  config?: PermissionConfig;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  fallback = null,
  requireRoles,
  requireAnyRole,
  requireAllRoles,
  customCheck,
  config
}) => {
  const { checkPermission, hasAnyRole, hasRole } = usePermissions();

  const hasPermission = () => {
    // Use config if provided
    if (config) {
      return checkPermission(config);
    }

    // Use individual props
    if (customCheck) {
      return customCheck();
    }

    if (requireRoles && requireRoles.length > 0) {
      return requireRoles.some(role => hasRole(role));
    }

    if (requireAnyRole && requireAnyRole.length > 0) {
      return hasAnyRole(requireAnyRole);
    }

    if (requireAllRoles && requireAllRoles.length > 0) {
      return requireAllRoles.every(role => hasRole(role));
    }

    return false;
  };

  return hasPermission() ? <>{children}</> : <>{fallback}</>;
};

// Convenience components for common role checks
export const PMOOrHigher: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard requireAnyRole={['PMO', 'Head', 'Admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const PMOrHigher: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard requireAnyRole={['PM', 'PMO', 'Head', 'Admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const SecretaryOrHigher: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard requireAnyRole={['Secretary', 'PM', 'PMO', 'Head', 'Admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const HeadOrAdmin: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard requireAnyRole={['Head', 'Admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard requireRoles={['Admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);
