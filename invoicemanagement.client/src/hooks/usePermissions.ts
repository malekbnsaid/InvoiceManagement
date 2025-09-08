import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export interface PermissionConfig {
  requireRoles?: string[];
  requireAnyRole?: string[];
  requireAllRoles?: string[];
  customCheck?: () => boolean;
}

export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const hasAllRoles = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.every(role => user.role === role);
  };

  const canCreateProject = (): boolean => {
    return authService.canCreateProject();
  };

  const canApproveProject = (): boolean => {
    return authService.canApproveProject();
  };

  const canDeleteProject = (): boolean => {
    return authService.canDeleteProject();
  };

  const canUploadInvoice = (): boolean => {
    return authService.canUploadInvoice();
  };

  const canManageUsers = (): boolean => {
    return authService.canManageUsers();
  };

  const checkPermission = (config: PermissionConfig): boolean => {
    if (!user) return false;

    if (config.customCheck) {
      return config.customCheck();
    }

    if (config.requireRoles) {
      return hasRole(config.requireRoles[0]);
    }

    if (config.requireAnyRole) {
      return hasAnyRole(config.requireAnyRole);
    }

    if (config.requireAllRoles) {
      return hasAllRoles(config.requireAllRoles);
    }

    return false;
  };

  return {
    user,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canCreateProject,
    canApproveProject,
    canDeleteProject,
    canUploadInvoice,
    canManageUsers,
    checkPermission,
    isAuthenticated: !!user
  };
};
