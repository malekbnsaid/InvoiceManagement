import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Pencil, Trash2, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/Button';
import ProjectDeleteDialog from './ProjectDeleteDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../ui/use-toast';
import { projectApi } from '../../services/api/projectApi';

interface ProjectActionsProps {
  project: {
    id: number;
    name: string;
    isPendingDeletion?: boolean;
    isApproved?: boolean;
  };
  onRefresh?: () => void;
}

export default function ProjectActions({ project, onRefresh }: ProjectActionsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isAdmin = true; // TODO: Replace with actual role check from auth context

  // Deletion mutations
  const requestDeletionMutation = useMutation({
    mutationFn: async () => {
      await projectApi.requestDeletion(project.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast({
        title: "Success",
        description: "Project deletion requested",
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
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

  const approveDeletionMutation = useMutation({
    mutationFn: async () => {
      await projectApi.approveDeletion(project.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast({
        title: "Success",
        description: "Project deletion approved",
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
      onRefresh?.();
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

  const rejectDeletionMutation = useMutation({
    mutationFn: async (reason: string) => {
      await projectApi.rejectDeletion(project.id, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast({
        title: "Success",
        description: "Project deletion rejected",
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
      onRefresh?.();
    },
    onError: (error: unknown) => {
      console.error('Error rejecting deletion:', error);
      toast({
        title: "Error",
        description: "Failed to reject project deletion",
        variant: "destructive",
      });
    }
  });

  const handleEdit = () => {
    navigate(`/projects/edit/${project.id}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          
          {/* Edit Option */}
          <DropdownMenuItem
            onClick={handleEdit}
            disabled={project.isPendingDeletion}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Project
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Delete Option */}
          {!project.isPendingDeletion && (
            <DropdownMenuItem
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Project
            </DropdownMenuItem>
          )}

          {/* Review Deletion Option for Admins */}
          {project.isPendingDeletion && isAdmin && (
            <DropdownMenuItem
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-amber-600"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Review Deletion Request
            </DropdownMenuItem>
          )}

          {/* Show pending deletion status if applicable */}
          {project.isPendingDeletion && !isAdmin && (
            <DropdownMenuItem className="text-amber-600" disabled>
              <AlertCircle className="mr-2 h-4 w-4" />
              Pending Deletion Approval
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Dialog */}
      <ProjectDeleteDialog
        projectId={project.id}
        projectName={project.name}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={() => {
          onRefresh?.();
          setIsDeleteDialogOpen(false);
        }}
        isPendingDeletion={project.isPendingDeletion}
        isAdmin={isAdmin}
      />
    </>
  );
} 