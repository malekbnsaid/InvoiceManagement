import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/Button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../../services/api/projectApi';

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
  isPendingDeletion,
  isAdmin,
}: ProjectDeleteDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');

  // Request deletion mutation
  const requestDeletionMutation = useMutation({
    mutationFn: async () => {
      await projectApi.requestDeletion(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast({
        title: "Success",
        description: "Project deletion requested",
        variant: "default",
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: unknown) => {
      console.error('Error requesting deletion:', error);
      toast({
        title: "Error",
        description: "Failed to request project deletion",
        variant: "destructive",
      });
    }
  });

  // Approve deletion mutation
  const approveDeletionMutation = useMutation({
    mutationFn: async () => {
      await projectApi.approveDeletion(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast({
        title: "Success",
        description: "Project deletion approved",
        variant: "default",
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: unknown) => {
      console.error('Error approving deletion:', error);
      toast({
        title: "Error",
        description: "Failed to approve project deletion",
        variant: "destructive",
      });
    }
  });

  // Reject deletion mutation
  const rejectDeletionMutation = useMutation({
    mutationFn: async () => {
      if (!rejectionReason.trim()) {
        throw new Error('Rejection reason is required');
      }
      await projectApi.rejectDeletion(projectId, rejectionReason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast({
        title: "Success",
        description: "Project deletion rejected",
        variant: "default",
      });
      onSuccess?.();
      onClose();
      setRejectionReason('');
    },
    onError: (error: unknown) => {
      console.error('Error rejecting deletion:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject project deletion",
        variant: "destructive",
      });
    }
  });

  const handleClose = () => {
    setRejectionReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isPendingDeletion
              ? isAdmin
                ? "Review Deletion Request"
                : "Deletion Request Pending"
              : "Delete Project"}
          </DialogTitle>
          <DialogDescription>
            {isPendingDeletion
              ? isAdmin
                ? `Do you want to approve or reject the deletion request for "${projectName}"?`
                : `Your deletion request for "${projectName}" is pending approval.`
              : `Are you sure you want to request deletion of "${projectName}"? This action requires admin approval.`}
          </DialogDescription>
        </DialogHeader>

        {isPendingDeletion && isAdmin && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason (required for rejection)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejecting the deletion request..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            
            {!isPendingDeletion && (
              <Button
                variant="destructive"
                onClick={() => requestDeletionMutation.mutate()}
                disabled={requestDeletionMutation.isPending}
              >
                {requestDeletionMutation.isPending ? "Requesting..." : "Request Deletion"}
              </Button>
            )}

            {isPendingDeletion && isAdmin && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => rejectDeletionMutation.mutate()}
                  disabled={rejectDeletionMutation.isPending || !rejectionReason.trim()}
                >
                  {rejectDeletionMutation.isPending ? "Rejecting..." : "Reject"}
                </Button>
                <Button
                  variant="default"
                  onClick={() => approveDeletionMutation.mutate()}
                  disabled={approveDeletionMutation.isPending}
                >
                  {approveDeletionMutation.isPending ? "Approving..." : "Approve"}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 