import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { projectApi } from '../../services/api/projectApi';
import { useToast } from '../ui/use-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CurrencyType } from '../../types/enums';
import { PMOOrHigher } from '../shared/RoleGuard';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { formatCurrency } from '../../utils/formatters';
import { 
  Building, 
  User, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Download, 
  Edit, 
  MessageSquare,
  FileText,
  Clock
} from 'lucide-react';


interface Project {
  id: number;
  projectNumber: string;
  poNumber?: string;
  name: string;
  description: string;
  section: {
    sectionName: string;
    sectionAbbreviation: string;
  };
  projectManager: {
    employeeName: string;
    employeeNumber: string;
  };
  budget: number;
  cost: number;
  expectedStart: string;
  expectedEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  status: string;
  isApproved: boolean;
  approvalDate?: string;
  approvedBy?: string;
  rejectionReason?: string;
  paymentPlanLines: Array<{
    year: number;
    amount: number;
    currency: CurrencyType;
    description: string;
  }>;
  invoices: Array<any>;
  lpOs: Array<any>;
  tenderDate: string | null;
}

interface PaymentPlanLine {
  year: number;
  amount: number;
  currency: CurrencyType;
  description: string;
}


interface ProjectDetails extends Omit<Project, 'projectManager' | 'section'> {
  paymentPlanLines: Array<{
    year: number;
    amount: number;
    currency: CurrencyType;
    description: string;
  }>;
  invoices: any[];
  lpOs: any[];
  projectManager: {
    employeeName: string;
    employeeNumber: string;
  };
  actualStartDate: string | null;
  actualEndDate: string | null;
  status: string;
  tenderDate: string | null;
  section: {
    sectionName: string;
    sectionAbbreviation: string;
    departmentNameEnglish: string;
  };
}

// Helper function to create project timeline from existing dates
const getProjectTimeline = (project: Project) => {
  const timeline = [];
  
  if (project.expectedStart) {
    timeline.push({
      title: "Project Started",
      date: project.expectedStart,
      status: project.actualStart ? "completed" : "upcoming",
      description: "Project initiation phase"
    });
  }
  
  if (project.expectedEnd) {
    timeline.push({
      title: "Project Completion",
      date: project.expectedEnd,
      status: project.actualEnd ? "completed" : "upcoming",
      description: "Project delivery phase"
    });
  }
  
  if (project.tenderDate) {
    timeline.push({
      title: "Tender Date",
      date: project.tenderDate,
      status: "completed",
      description: "Tender submission deadline"
    });
  }
  
  return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for approval dialog
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await projectApi.getById(parseInt(id!)) as unknown as ProjectDetails;
      console.log('Raw API response:', response);
      
      // Helper function to handle both array formats
      const getArrayData = (data: any) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (data.$values) return data.$values;
        return [];
      };
      
      // Transform the response to match our interface
      const transformedData = {
        ...response,
        paymentPlanLines: getArrayData(response.paymentPlanLines).map((line: any) => ({
          year: Number(line.year),
          amount: Number(line.amount),
          currency: line.currency,
          description: line.description || ''
        })),
        invoices: getArrayData(response.invoices),
        lpOs: getArrayData(response.lpOs),
        section: response.section.departmentNameEnglish 
          ? {
              sectionName: response.section.departmentNameEnglish,
              sectionAbbreviation: response.section.sectionAbbreviation
            }
          : response.section,
        projectManager: response.projectManager.employeeName 
          ? {
              employeeName: response.projectManager.employeeName,
              employeeNumber: response.projectManager.employeeNumber
            }
          : response.projectManager
      };
      
      console.log('Transformed project data:', transformedData);
      return transformedData;
    }
  });

  // Mutation for approving/rejecting project
  const approvalMutation = useMutation({
    mutationFn: async ({ projectId, isApproved, poNumber, rejectionReason }: { 
      projectId: number; 
      isApproved: boolean; 
      poNumber?: string;
      rejectionReason?: string;
    }) => {
      const response = await projectApi.updateApprovalStatus(projectId, {
        isApproved,
        poNumber,
        rejectionReason,
        approvedBy: "PMO User", // TODO: Get from auth context
        approvalDate: new Date().toISOString()
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project', id]);
      toast({
        title: "Success",
        description: isRejecting 
          ? "Project has been rejected" 
          : "Project has been approved and PO number has been assigned",
        variant: "default",
      });
      setIsApprovalDialogOpen(false);
    },
    onError: (error: unknown) => {
      console.error('Approval mutation error:', error);
      toast({
        title: "Error",
        description: "Failed to update project approval status. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleApproval = async (approved: boolean) => {
    if (!project) return;

    if (approved && !poNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a PO number before approving the project",
        variant: "destructive",
      });
      return;
    }

    if (!approved && !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      await approvalMutation.mutateAsync({
        projectId: project.id,
        isApproved: approved,
        poNumber: approved ? poNumber : undefined,
        rejectionReason: approved ? undefined : rejectionReason
      });
    } catch (error) {
      console.error('Error updating approval status:', error);
    }
  };

  // Calculate project progress and status
  const calculateProgress = () => {
    if (!project) return 0;
    if (project.budget && project.cost) {
      return Math.min((project.cost / project.budget) * 100, 100);
    }
    return 0;
  };


  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>

        {/* Project Info Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Details Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>

            {/* Payment Plan Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Timeline Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <Skeleton className="h-4 w-4 rounded-full mt-1" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Budget Card Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-18" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>

            {/* Project Manager Card Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-20" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }


  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Project not found.</div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Corporate Header */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-3">
        <div>
                <h1 className="text-3xl font-semibold text-gray-900">{project.name}</h1>
                <p className="text-lg text-gray-600 mt-1">{project.projectNumber}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Badge 
                  variant={project.isApproved ? "default" : "secondary"}
                  className="px-3 py-1 text-sm font-medium"
                >
                  {project.isApproved ? "Approved" : "Pending Approval"}
                </Badge>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building className="h-4 w-4" />
                  <span className="text-sm">{project.section.sectionName}</span>
                </div>
            {project.poNumber && (
                  <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 text-sm">
                    <FileText className="h-4 w-4" />
                PO: {project.poNumber}
              </Badge>
            )}
          </div>
        </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <PMOOrHigher>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate(`/projects/edit/${id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </PMOOrHigher>
          <PMOOrHigher>
            {!project.isApproved && !project.rejectionReason && (
              <Button 
                variant="outline"
                    size="sm"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                onClick={() => {
                  setIsRejecting(false);
                  setIsApprovalDialogOpen(true);
                }}
              >
                Review Project
              </Button>
            )}
          </PMOOrHigher>
            </div>
        </div>
      </div>

        {/* Corporate Key Metrics Grid with Minimal Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                  <p className="text-2xl font-semibold text-gray-900">{project.status}</p>
              </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Section</p>
                  <p className="text-2xl font-semibold text-gray-900">{project.section.sectionAbbreviation}</p>
              </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Building className="h-5 w-5 text-green-600" />
            </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Manager</p>
                  <p className="text-lg font-semibold text-gray-900 truncate">
                    {project.projectManager.employeeName.split(' ')[0]}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Budget</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(project.budget, CurrencyType.QAR)}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Mobile Navigation Tabs */}
      <div className="lg:hidden mb-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* Overview content will be shown here on mobile */}
          </TabsContent>
          
          <TabsContent value="budget" className="space-y-4">
            {/* Budget content will be shown here on mobile */}
          </TabsContent>
          
          <TabsContent value="timeline" className="space-y-4">
            {/* Timeline content will be shown here on mobile */}
          </TabsContent>
        </Tabs>
      </div>

        {/* Corporate Budget Display with Minimal Colors */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <DollarSign className="h-5 w-5 text-amber-600" />
              Budget Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-sm font-medium text-blue-700 mb-2">Total Budget</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(project.budget, CurrencyType.QAR)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <p className="text-sm font-medium text-green-700 mb-2">Current Cost</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(project.cost, CurrencyType.QAR)}
                  </p>
                </div>
              </div>
              
              {/* Budget Usage Visualization */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Budget Usage</span>
                  <span className="text-lg font-semibold text-gray-900">{Math.round((project.cost / project.budget) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (project.cost / project.budget) > 0.8 ? 'bg-red-500' : 
                      (project.cost / project.budget) > 0.6 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((project.cost / project.budget) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Used: {formatCurrency(project.cost, CurrencyType.QAR)}</span>
                  <span>Remaining: {formatCurrency(project.budget - project.cost, CurrencyType.QAR)}</span>
                </div>
              </div>
              
            {progress >= 100 && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Budget Alert</p>
                    <p className="text-sm text-red-700">Project has reached or exceeded budget</p>
                  </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

        {/* Corporate Timeline Card with Minimal Colors */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Clock className="h-5 w-5 text-blue-600" />
            Project Timeline
          </CardTitle>
        </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {getProjectTimeline(project).map((item, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="relative flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      item.status === 'completed' ? 'bg-green-500 border-green-500' : 
                      item.status === 'upcoming' ? 'bg-blue-500 border-blue-500' : 
                      'bg-gray-300 border-gray-300'
                    }`} />
                    {index < getProjectTimeline(project).length - 1 && (
                      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-200"></div>
                    )}
                  </div>
                  <div className={`flex-1 rounded-lg p-4 ${
                    item.status === 'completed' ? 'bg-green-50 border border-green-100' :
                    item.status === 'upcoming' ? 'bg-blue-50 border border-blue-100' :
                    'bg-gray-50 border border-gray-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(item.date), 'MMM dd, yyyy')}</span>
                    </div>
                      </div>
                      {item.status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Section</p>
                <p className="font-medium">{project.section.sectionName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Project Manager</p>
                <p className="font-medium">{project.projectManager?.employeeName}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="mt-1">{project.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Project Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Expected Start</p>
                  <p className="font-medium">
                    {project.expectedStart ? format(new Date(project.expectedStart), 'PPP') : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expected End</p>
                  <p className="font-medium">
                    {project.expectedEnd ? format(new Date(project.expectedEnd), 'PPP') : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Actual Start</p>
                  <p className="font-medium">
                    {project.actualStartDate ? format(new Date(project.actualStartDate), 'PPP') : 'Not started'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Actual End</p>
                  <p className="font-medium">
                    {project.actualEndDate ? format(new Date(project.actualEndDate), 'PPP') : 'In progress'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Corporate Payment Plan with Minimal Colors */}
        <Card className="md:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Calendar className="h-5 w-5 text-green-600" />
              Payment Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {Array.isArray(project?.paymentPlanLines) && project.paymentPlanLines.length > 0 ? (
              <div className="space-y-4">
                    {project.paymentPlanLines.map((line: PaymentPlanLine, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center border border-green-300">
                        <span className="text-sm font-semibold text-green-700">{line.year}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{line.description || `Payment for ${line.year}`}</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(line.amount, line.currency)}
                        </p>
                      </div>
                    </div>
                    <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                      {line.currency}
                    </Badge>
                  </div>
                ))}
                
                {/* Total Summary */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-blue-900">Total Planned</p>
                      <p className="text-sm text-blue-700">{project.paymentPlanLines.length} payments</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-gray-900">
                        {formatCurrency(
                          project.paymentPlanLines.reduce((sum: number, line: PaymentPlanLine) => sum + line.amount, 0),
                          project.paymentPlanLines[0]?.currency || CurrencyType.QAR
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Plan</h3>
                <p className="text-gray-500">No payment plan lines available for this project</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

        {/* Corporate Project Manager Section with Minimal Colors */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <User className="h-5 w-5 text-purple-600" />
              Project Manager
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center border border-purple-200">
                <span className="text-lg font-semibold text-purple-700">
                  {project.projectManager.employeeName.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{project.projectManager.employeeName}</h3>
                <p className="text-sm text-gray-600">Employee ID: {project.projectManager.employeeNumber}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200">Project Manager</Badge>
                  <Badge variant="outline" className="text-xs">{project.section.sectionName}</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Approval Dialog */}
      <PMOOrHigher>
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isRejecting ? 'bg-red-100' : 'bg-green-100'}`}>
                  {isRejecting ? (
                    <XCircleIcon className="h-6 w-6 text-red-600" />
                  ) : (
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    {isRejecting ? 'Reject Project' : 'Approve Project'}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    {isRejecting 
                      ? 'Please provide a detailed reason for rejecting this project.'
                      : 'Review the project details and enter the PO number to approve.'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Project Summary Card */}
            {project && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  Project Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Project:</span>
                      <p className="text-gray-900 font-semibold">{project.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Project Number:</span>
                      <p className="text-gray-900">{project.projectNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Manager:</span>
                      <p className="text-gray-900">{project.projectManager.employeeName}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Budget:</span>
                      <p className="text-gray-900 font-semibold">
                        {project.budget ? formatCurrency(project.budget, CurrencyType.QAR) : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Duration:</span>
                      <p className="text-gray-900">
                        {project.expectedStart && project.expectedEnd 
                          ? `${format(new Date(project.expectedStart), 'MMM dd, yyyy')} - ${format(new Date(project.expectedEnd), 'MMM dd, yyyy')}`
                          : 'Not set'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Section:</span>
                      <p className="text-gray-900">{project.section.sectionName}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Section */}
            <div className="space-y-6">
              {!isRejecting && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <Label htmlFor="poNumber" className="text-base font-medium">
                      Purchase Order Number
                    </Label>
                  </div>
                  <Input
                    id="poNumber"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="Enter PO number (e.g., PO-2024-001)"
                    className="h-12 text-base border-2 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    This PO number will be associated with the approved project.
                  </p>
                </div>
              )}
              
              {isRejecting && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <Label htmlFor="rejectionReason" className="text-base font-medium">
                      Rejection Reason
                    </Label>
                  </div>
                  <Textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a detailed reason for rejecting this project. This will help the project manager understand what needs to be improved."
                    rows={5}
                    className="border-2 focus:border-red-500 focus:ring-red-500 resize-none"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    This reason will be shared with the project manager and team.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isRejecting) {
                      setIsRejecting(false);
                      setRejectionReason('');
                    } else {
                      setIsApprovalDialogOpen(false);
                      setPoNumber('');
                    }
                  }}
                  className="flex-1 sm:flex-none"
                  disabled={approvalMutation.isLoading}
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  {isRejecting ? 'Back to Approval' : 'Cancel'}
                </Button>
                
                {!isRejecting && (
                  <Button
                    variant="destructive"
                    onClick={() => setIsRejecting(true)}
                    className="flex-1 sm:flex-none"
                    disabled={approvalMutation.isLoading}
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Reject Project
                  </Button>
                )}
              </div>
              
              <Button
                variant={isRejecting ? "destructive" : "default"}
                onClick={() => handleApproval(!isRejecting)}
                disabled={approvalMutation.isLoading || (!isRejecting && !poNumber.trim()) || (isRejecting && !rejectionReason.trim())}
                className={`flex-1 sm:flex-none min-w-[140px] ${
                  isRejecting 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {approvalMutation.isLoading ? (
                  <div className="flex items-center gap-2">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isRejecting ? (
                      <>
                        <XCircleIcon className="h-4 w-4" />
                        Confirm Rejection
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        Approve Project
                      </>
                    )}
                  </div>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PMOOrHigher>
    </div>
  );
} 