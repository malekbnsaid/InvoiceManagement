import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/Button';
import { projectApi } from '../../services/api/projectApi';
import { Textarea } from '../ui/textarea';
import { Project } from '../../types/interfaces';

interface ProjectDeleteDialogProps {
  projectId: number;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isPendingDeletion?: boolean;
  isAdmin?: boolean;
}

export default function ProjectDeleteDialog({
  projectId,
  projectName,
  isOpen,
  onClose,
  onSuccess,
  isPendingDeletion = false,
  isAdmin = false, // TODO: Replace with actual role check
}: ProjectDeleteDialogProps) {
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = React.useState('');
  const { toast } = useToast();

  // Request deletion mutation
  const requestDeletionMutation = useMutation({
    mutationFn: async () => {
      try {
        await projectApi.requestDeletion(projectId);
      } catch (error: any) {
        console.error('Request deletion error:', error);
        throw new Error(error.response?.data?.error || 'Failed to request deletion');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Success",
        description: "Deletion request submitted successfully"
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Approve deletion mutation
  const approveDeletionMutation = useMutation({
    mutationFn: async () => {
      try {
        await projectApi.approveDeletion(projectId);
      } catch (error: any) {
        console.error('Approve deletion error:', error);
        throw new Error(error.response?.data?.error || 'Failed to approve deletion');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Reject deletion mutation
  const rejectDeletionMutation = useMutation({
    mutationFn: async () => {
      try {
        await projectApi.rejectDeletion(projectId, { reason: rejectionReason });
      } catch (error: any) {
        console.error('Reject deletion error:', error);
        throw new Error(error.response?.data?.error || 'Failed to reject deletion');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Success",
        description: "Deletion request rejected"
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleRequestDeletion = () => {
    requestDeletionMutation.mutate();
  };

  const handleApproveDeletion = () => {
    approveDeletionMutation.mutate();
  };

  const handleRejectDeletion = () => {
    if (!rejectionReason) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }
    rejectDeletionMutation.mutate();
  };

  const isLoading = requestDeletionMutation.isPending || 
                    approveDeletionMutation.isPending || 
                    rejectDeletionMutation.isPending;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isPendingDeletion ? 'Review Deletion Request' : 'Delete Project'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPendingDeletion
              ? `Review the deletion request for project "${projectName}". This action cannot be undone.`
              : `Are you sure you want to delete project "${projectName}"? This action requires approval and cannot be undone.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Show rejection reason input only for admins reviewing deletion request */}
        {isPendingDeletion && isAdmin && (
          <div className="space-y-4">
            <Textarea
              placeholder="Enter reason for rejection (required for rejecting deletion)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
        )}

        <AlertDialogFooter className="space-x-2">
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          
          {/* Show different buttons based on state and role */}
          {!isPendingDeletion && (
            <Button
              variant="destructive"
              onClick={handleRequestDeletion}
              disabled={isLoading}
            >
              {requestDeletionMutation.isPending ? 'Requesting...' : 'Request Deletion'}
            </Button>
          )}

          {isPendingDeletion && isAdmin && (
            <>
              <Button
                variant="default"
                onClick={handleApproveDeletion}
                disabled={isLoading}
              >
                {approveDeletionMutation.isPending ? 'Approving...' : 'Approve Deletion'}
              </Button>

              <Button
                variant="secondary"
                onClick={handleRejectDeletion}
                disabled={isLoading || !rejectionReason}
              >
                {rejectDeletionMutation.isPending ? 'Rejecting...' : 'Reject Deletion'}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 