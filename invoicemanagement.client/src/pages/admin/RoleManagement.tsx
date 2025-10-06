import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  UserCheck, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Users,
  Settings,
  FileText,
  BarChart,
  FolderKanban,
  Upload,
  Download,
  Eye,
  Lock,
  Unlock
} from 'lucide-react';

const RoleManagement: React.FC = () => {
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // Mock role data
  const roles = [
    {
      id: 1,
      name: 'Admin',
      description: 'Full system access and control',
      userCount: 1,
      permissions: [
        'user_management', 'system_settings', 'audit_logs', 'role_management',
        'project_create', 'project_edit', 'project_delete', 'project_view',
        'invoice_create', 'invoice_edit', 'invoice_delete', 'invoice_view',
        'pmo_review', 'department_management', 'reports_view'
      ],
      isActive: true,
      createdAt: '2024-01-01',
      lastModified: '2024-01-15'
    },
    {
      id: 2,
      name: 'Head',
      description: 'Department head with approval authority',
      userCount: 2,
      permissions: [
        'department_management', 'project_approve', 'project_view',
        'invoice_view', 'reports_view'
      ],
      isActive: true,
      createdAt: '2024-01-01',
      lastModified: '2024-01-10'
    },
    {
      id: 3,
      name: 'PMO',
      description: 'Project Management Office - project approval',
      userCount: 3,
      permissions: [
        'pmo_review', 'project_approve', 'project_view',
        'invoice_view', 'reports_view'
      ],
      isActive: true,
      createdAt: '2024-01-01',
      lastModified: '2024-01-12'
    },
    {
      id: 4,
      name: 'Project Manager',
      description: 'Create and manage projects',
      userCount: 5,
      permissions: [
        'project_create', 'project_edit', 'project_view',
        'invoice_view', 'reports_view'
      ],
      isActive: true,
      createdAt: '2024-01-01',
      lastModified: '2024-01-08'
    },
    {
      id: 5,
      name: 'Secretary',
      description: 'Upload and manage invoices',
      userCount: 4,
      permissions: [
        'invoice_upload', 'invoice_view'
      ],
      isActive: true,
      createdAt: '2024-01-01',
      lastModified: '2024-01-05'
    },
    {
      id: 6,
      name: 'ReadOnly',
      description: 'View-only access to system data',
      userCount: 2,
      permissions: [
        'project_view', 'invoice_view', 'reports_view'
      ],
      isActive: false,
      createdAt: '2024-01-01',
      lastModified: '2024-01-03'
    }
  ];

  const allPermissions = [
    { id: 'user_management', name: 'User Management', description: 'Manage users and accounts' },
    { id: 'system_settings', name: 'System Settings', description: 'Configure system settings' },
    { id: 'audit_logs', name: 'Audit Logs', description: 'View system audit logs' },
    { id: 'role_management', name: 'Role Management', description: 'Manage roles and permissions' },
    { id: 'project_create', name: 'Create Projects', description: 'Create new projects' },
    { id: 'project_edit', name: 'Edit Projects', description: 'Modify existing projects' },
    { id: 'project_delete', name: 'Delete Projects', description: 'Remove projects' },
    { id: 'project_view', name: 'View Projects', description: 'View project information' },
    { id: 'project_approve', name: 'Approve Projects', description: 'Approve project requests' },
    { id: 'invoice_create', name: 'Create Invoices', description: 'Create new invoices' },
    { id: 'invoice_edit', name: 'Edit Invoices', description: 'Modify existing invoices' },
    { id: 'invoice_delete', name: 'Delete Invoices', description: 'Remove invoices' },
    { id: 'invoice_view', name: 'View Invoices', description: 'View invoice information' },
    { id: 'invoice_upload', name: 'Upload Invoices', description: 'Upload invoice documents' },
    { id: 'pmo_review', name: 'PMO Review', description: 'Review PMO-specific items' },
    { id: 'department_management', name: 'Department Management', description: 'Manage departments' },
    { id: 'reports_view', name: 'View Reports', description: 'Access reporting features' }
  ];

  const getPermissionIcon = (permissionId: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      user_management: <Users className="h-4 w-4" />,
      system_settings: <Settings className="h-4 w-4" />,
      audit_logs: <FileText className="h-4 w-4" />,
      role_management: <UserCheck className="h-4 w-4" />,
      project_create: <FolderKanban className="h-4 w-4" />,
      project_edit: <FolderKanban className="h-4 w-4" />,
      project_delete: <FolderKanban className="h-4 w-4" />,
      project_view: <FolderKanban className="h-4 w-4" />,
      project_approve: <FolderKanban className="h-4 w-4" />,
      invoice_create: <FileText className="h-4 w-4" />,
      invoice_edit: <FileText className="h-4 w-4" />,
      invoice_delete: <FileText className="h-4 w-4" />,
      invoice_view: <FileText className="h-4 w-4" />,
      invoice_upload: <Upload className="h-4 w-4" />,
      pmo_review: <Shield className="h-4 w-4" />,
      department_management: <Users className="h-4 w-4" />,
      reports_view: <BarChart className="h-4 w-4" />
    };
    return iconMap[permissionId] || <Shield className="h-4 w-4" />;
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Head': return 'bg-purple-100 text-purple-800';
      case 'PMO': return 'bg-blue-100 text-blue-800';
      case 'Project Manager': return 'bg-green-100 text-green-800';
      case 'Secretary': return 'bg-yellow-100 text-yellow-800';
      case 'ReadOnly': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <UserCheck className="h-8 w-8 mr-3 text-red-600" />
                Role Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage user roles and permissions across the system
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export Roles
              </Button>
              <Button 
                onClick={() => setIsAddRoleOpen(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Roles</p>
                  <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Roles</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {roles.filter(role => role.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {roles.reduce((sum, role) => sum + role.userCount, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Permissions</p>
                  <p className="text-2xl font-bold text-gray-900">{allPermissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => (
            <Card key={role.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Badge className={`mr-2 ${getRoleColor(role.name)}`}>
                      {role.name}
                    </Badge>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRole(role);
                        setIsEditRoleOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{role.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge className={getStatusColor(role.isActive)}>
                      {role.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Users</span>
                    <span className="text-sm text-gray-600">{role.userCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Permissions</span>
                    <span className="text-sm text-gray-600">{role.permissions.length}</span>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 mb-2">Key Permissions:</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission.replace('_', ' ')}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Permissions Overview */}
        <Card>
          <CardHeader>
            <CardTitle>System Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPermissions.map((permission) => (
                <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="text-blue-600 mt-1">
                    {getPermissionIcon(permission.id)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{permission.name}</h4>
                    <p className="text-xs text-gray-500">{permission.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add Role Dialog */}
        <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role with specific permissions and access levels.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="roleName">Role Name</Label>
                <Input id="roleName" placeholder="Enter role name" />
              </div>
              
              <div>
                <Label htmlFor="roleDescription">Description</Label>
                <Input 
                  id="roleDescription" 
                  placeholder="Describe the role's purpose and responsibilities"
                />
              </div>
              
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {allPermissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <input type="checkbox" id={permission.id} className="rounded" />
                      <label htmlFor={permission.id} className="text-sm">
                        {permission.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="isActive" />
                <Label htmlFor="isActive">Active Role</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-red-600 hover:bg-red-700">
                Create Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Modify role permissions and settings.
              </DialogDescription>
            </DialogHeader>
            {selectedRole && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editRoleName">Role Name</Label>
                  <Input id="editRoleName" defaultValue={selectedRole.name} />
                </div>
                
                <div>
                  <Label htmlFor="editRoleDescription">Description</Label>
                  <Input 
                    id="editRoleDescription" 
                    defaultValue={selectedRole.description}
                  />
                </div>
                
                <div>
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                    {allPermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id={`edit-${permission.id}`} 
                          className="rounded"
                          defaultChecked={selectedRole.permissions.includes(permission.id)}
                        />
                        <label htmlFor={`edit-${permission.id}`} className="text-sm">
                          {permission.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="editIsActive" 
                    defaultChecked={selectedRole.isActive}
                  />
                  <Label htmlFor="editIsActive">Active Role</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-red-600 hover:bg-red-700">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RoleManagement;
