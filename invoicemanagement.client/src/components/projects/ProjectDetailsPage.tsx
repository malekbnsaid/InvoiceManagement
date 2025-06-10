import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { projectApi } from '../../services/api';
import { useToast } from '../ui/use-toast';
import {
  CalendarIcon,
  BanknotesIcon,
  ClockIcon,
  FolderIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { CurrencyType } from '../../types/enums';

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
    paymentType: string;
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
  paymentType: string;
  description: string;
}

interface APIResponse<T> {
  $values?: T[];
  [key: string]: any;
}

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for approval dialog
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await projectApi.getById(parseInt(id!));
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
          paymentType: line.paymentType || 'Annually',
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
    onError: (error) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading project details. Please try again later.</div>
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Approval Status */}
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
        <div className="flex items-center gap-4">
          {project.isApproved ? (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircleIcon className="h-4 w-4" />
              Approved by PMO
            </Badge>
          ) : project.rejectionReason ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircleIcon className="h-4 w-4" />
              Rejected
            </Badge>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="warning" className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                Pending PMO Approval
              </Badge>
              <Button 
                variant="outline"
                onClick={() => {
                  setIsRejecting(false);
                  setIsApprovalDialogOpen(true);
                }}
              >
                Review
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Project Details */}
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
                <p className="font-medium">{project.projectManager.employeeName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="font-medium">{project.budget.toLocaleString()} SAR</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Cost</p>
                <p className="font-medium">{project.cost.toLocaleString()} SAR</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="mt-1">{project.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  {project.actualStart ? format(new Date(project.actualStart), 'PPP') : 'Not started'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Actual End</p>
                <p className="font-medium">
                  {project.actualEnd ? format(new Date(project.actualEnd), 'PPP') : 'In progress'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Information */}
        {(project.isApproved || project.rejectionReason) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Approval Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">
                    {project.isApproved ? 'Approved' : 'Rejected'}
                  </p>
                </div>
                {project.approvalDate && (
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">
                      {format(new Date(project.approvalDate), 'PPP')}
                    </p>
                  </div>
                )}
                {project.approvedBy && (
                  <div>
                    <p className="text-sm text-gray-500">Approved By</p>
                    <p className="font-medium">{project.approvedBy}</p>
                  </div>
                )}
                {project.poNumber && (
                  <div>
                    <p className="text-sm text-gray-500">PO Number</p>
                    <p className="font-medium flex items-center gap-1">
                      <DocumentTextIcon className="h-4 w-4" />
                      {project.poNumber}
                    </p>
                  </div>
                )}
                {project.rejectionReason && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Rejection Reason</p>
                    <p className="font-medium">{project.rejectionReason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
                    {project.paymentPlanLines.map((line, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{line.year}</td>
                        <td className="py-2">{line.amount.toLocaleString()}</td>
                        <td className="py-2">{line.currency}</td>
                        <td className="py-2">{line.paymentType}</td>
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

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRejecting ? 'Reject Project' : 'Approve Project'}
            </DialogTitle>
            <DialogDescription>
              {isRejecting 
                ? 'Please provide a reason for rejecting this project.'
                : 'Please enter the PO number to approve this project.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!isRejecting && (
              <div className="space-y-2">
                <Label htmlFor="poNumber">PO Number</Label>
                <Input
                  id="poNumber"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="Enter PO number"
                />
              </div>
            )}
            
            {isRejecting && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection"
                  rows={4}
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (isRejecting) {
                  setIsRejecting(false);
                } else {
                  setIsApprovalDialogOpen(false);
                }
              }}
            >
              {isRejecting ? 'Back to Approval' : 'Cancel'}
            </Button>
            <div className="flex gap-2">
              {!isRejecting && (
                <Button
                  variant="destructive"
                  onClick={() => setIsRejecting(true)}
                >
                  Reject
                </Button>
              )}
              <Button
                variant={isRejecting ? "destructive" : "default"}
                onClick={() => handleApproval(!isRejecting)}
                disabled={approvalMutation.isLoading}
              >
                {approvalMutation.isLoading
                  ? "Processing..."
                  : isRejecting
                  ? "Confirm Rejection"
                  : "Approve Project"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 