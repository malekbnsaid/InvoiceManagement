import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { projectApi } from '../../services/api/projectApi';
import { useToast } from '../ui/use-toast';
import {
  ClockIcon,
  FolderIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CurrencyType } from '../../types/enums';
import { PMOOrHigher } from '../shared/RoleGuard';


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

export default function ProjectDetailsPage() {
  const { id } = useParams();
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

  const getProjectStatus = () => {
    if (!project) return { label: 'Unknown', color: 'secondary' as const };
    if (project.rejectionReason) return { label: 'Rejected', color: 'danger' as const };
    if (!project.isApproved) return { label: 'Pending Approval', color: 'warning' as const };
    if (!project.actualStartDate) return { label: 'Not Started', color: 'secondary' as const };
    if (project.actualEndDate) return { label: 'Completed', color: 'success' as const };
    return { label: 'In Progress', color: 'default' as const };
  };

  const getTimelineStatus = () => {
    const timeline = [];
    if (project) {
      // Project Creation
      timeline.push({
        date: project.createdAt,
        label: 'Project Created',
        icon: FolderIcon,
        status: 'completed',
        detail: `Created by ${project.createdBy}`
      });

      // Project Approval/Rejection
      if (project.isApproved) {
        timeline.push({
          date: project.approvalDate,
          label: 'Project Approved',
          icon: CheckCircleIcon,
          status: 'completed',
          detail: `Approved by ${project.approvedBy} | PO: ${project.poNumber}`
        });
      } else if (project.rejectionReason) {
        timeline.push({
          date: project.modifiedAt,
          label: 'Project Rejected',
          icon: XCircleIcon,
          status: 'error',
          detail: project.rejectionReason
        });
      }

      // Project Start
      if (project.actualStartDate) {
        timeline.push({
          date: project.actualStartDate,
          label: 'Project Started',
          icon: ArrowPathIcon,
          status: 'completed',
          detail: 'Project work commenced'
        });
      }

      // Project Completion (if cost reaches/exceeds budget)
      if (project.actualEndDate) {
        timeline.push({
          date: project.actualEndDate,
          label: 'Project Completed',
          icon: CheckCircleIcon,
          status: 'completed',
                  detail: project.cost && project.budget
          ? `Final cost: ${project.cost.toLocaleString()} QAR (${((project.cost / project.budget) * 100).toFixed(1)}% of budget)`
            : undefined
        });
      }
    }
    return timeline;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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

  const status = getProjectStatus();
  const progress = calculateProgress();
  const timeline = getTimelineStatus();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Status */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-gray-500">{project.projectNumber}</span>
            {project.poNumber && (
              <Badge variant="outline" className="flex items-center gap-1">
                <DocumentTextIcon className="h-4 w-4" />
                PO: {project.poNumber}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={status.color} className="text-lg px-4 py-2">
            {status.label}
          </Badge>
          <PMOOrHigher>
            {!project.isApproved && !project.rejectionReason && (
              <Button 
                variant="outline"
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

      {/* Project Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Project Progress</span>
            <span className="text-2xl font-bold">{progress.toFixed(1)}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="text-xl font-semibold">{project.budget?.toLocaleString()} QAR</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Cost</p>
                <p className="text-xl font-semibold">{project.cost?.toLocaleString()} QAR</p>
              </div>
            </div>
            {progress >= 100 && (
              <div className="flex items-center gap-2 text-amber-500">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span>Project has reached or exceeded budget</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute top-0 left-4 h-full w-0.5 bg-gray-200"></div>
            <div className="space-y-8">
              {timeline.map((event, index) => (
                <div key={index} className="relative flex items-start gap-4 group">
                  <div className={`absolute left-4 w-0.5 h-full ${index === timeline.length - 1 ? 'bg-transparent' : 'bg-gray-200'}`}></div>
                  <div className={`relative flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                    event.status === 'completed' ? 'bg-green-50 border-green-500 group-hover:bg-green-100' :
                    event.status === 'error' ? 'bg-red-50 border-red-500 group-hover:bg-red-100' :
                    'bg-gray-50 border-gray-500 group-hover:bg-gray-100'
                  }`}>
                    <event.icon className={`h-4 w-4 ${
                      event.status === 'completed' ? 'text-green-500' :
                      event.status === 'error' ? 'text-red-500' :
                      'text-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{event.label}</p>
                      <time className="text-sm text-gray-500">
                        {format(new Date(event.date), 'PPP')}
                      </time>
                    </div>
                    {event.detail && (
                      <p className="mt-1 text-sm text-gray-600">{event.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
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

        {/* Payment Plan */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Payment Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(project?.paymentPlanLines) && project.paymentPlanLines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Year</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Currency</th>
                      <th className="text-left py-2">Payment Type</th>
                      <th className="text-left py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.paymentPlanLines.map((line: PaymentPlanLine, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{line.year}</td>
                        <td className="py-2">{line.amount.toLocaleString()}</td>
                        <td className="py-2">{line.currency}</td>
                        <td className="py-2">Yearly</td>
                        <td className="py-2">{line.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No payment plan lines available
              </div>
            )}
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
                        {project.budget ? `QAR ${project.budget.toLocaleString()}` : 'Not set'}
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