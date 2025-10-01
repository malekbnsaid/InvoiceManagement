import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/api/dashboardApi';
import { 
  FolderKanban, 
  FileText, 
  Users, 
  Settings, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  PlusCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    canCreateProject, 
    canApproveProject, 
    canUploadInvoice, 
    canManageUsers,
    hasRole 
  } = usePermissions();
  const navigate = useNavigate();

  // Fetch projects needing approval
  const { data: projectsNeedingApproval, isLoading: approvalLoading } = useQuery({
    queryKey: ['dashboard-projects-approval'],
    queryFn: () => dashboardApi.getProjectsNeedingApproval(3), // Show only 3 for the card
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getRoleBasedContent = () => {
    if (!user) return null;

    switch (user.role) {
      case 'Admin':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage system users and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/settings/users')}
                  className="w-full"
                >
                  Manage Users
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Settings
                </CardTitle>
                <CardDescription>
                  Configure system-wide settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/settings')}
                  variant="outline"
                  className="w-full"
                >
                  System Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Analytics
                </CardTitle>
                <CardDescription>
                  View system analytics and reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/reports')}
                  variant="outline"
                  className="w-full"
                >
                  View Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'Head':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Project Approvals
                </CardTitle>
                <CardDescription>
                  Review and approve pending projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/projects?status=pending')}
                  className="w-full"
                >
                  Review Projects
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Department Overview
                </CardTitle>
                <CardDescription>
                  View department performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/reports')}
                  variant="outline"
                  className="w-full"
                >
                  View Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'PMO':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Project Approvals
                </CardTitle>
                <CardDescription>
                  Review and approve pending projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/projects?status=pending')}
                  className="w-full"
                >
                  Review Projects
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  Project Management
                </CardTitle>
                <CardDescription>
                  Monitor all projects and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/projects')}
                  variant="outline"
                  className="w-full"
                >
                  View All Projects
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'PM':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5" />
                  Create Project
                </CardTitle>
                <CardDescription>
                  Start a new project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/projects/new')}
                  className="w-full"
                >
                  New Project
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  My Projects
                </CardTitle>
                <CardDescription>
                  View and manage your projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/projects')}
                  variant="outline"
                  className="w-full"
                >
                  View Projects
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'Secretary':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Upload Invoice
                </CardTitle>
                <CardDescription>
                  Upload and process new invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/invoices/upload')}
                  className="w-full"
                >
                  Upload Invoice
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Management
                </CardTitle>
                <CardDescription>
                  View and manage invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/invoices')}
                  variant="outline"
                  className="w-full"
                >
                  View Invoices
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'ReadOnly':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  View Projects
                </CardTitle>
                <CardDescription>
                  Browse available projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/projects')}
                  className="w-full"
                >
                  Browse Projects
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  View Invoices
                </CardTitle>
                <CardDescription>
                  Browse available invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/invoices')}
                  variant="outline"
                  className="w-full"
                >
                  Browse Invoices
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Limited Access
              </CardTitle>
              <CardDescription>
                Your role has limited access to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Please contact your administrator to request additional permissions.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.username}!
          </h2>
          <div className="text-gray-600">
            Here's what you can do with your <Badge variant="secondary">{user?.role}</Badge> role
          </div>
        </div>
      </div>

      {getRoleBasedContent()}
    </div>
  );
};
