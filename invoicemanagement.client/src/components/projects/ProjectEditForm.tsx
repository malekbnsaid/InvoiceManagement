import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Project } from '../../types/interfaces';
import ProjectForm from './ProjectForm';
import { projectApi } from '../../services/api/projectApi';

interface ProjectEditFormProps {
  projectId: number;
  onSuccess?: () => void;
}

interface ValidationErrors {
  [key: string]: string[];
}

interface APIResponse<T> {
  $values?: T[];
  [key: string]: any;
}

export default function ProjectEditForm({ projectId, onSuccess }: ProjectEditFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch project data
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectApi.getById(projectId);
      console.log('Original project data:', response);
      
      // Helper function to handle array data that might be wrapped in $values
      const getArrayData = <T,>(data: T[] | APIResponse<T> | undefined): T[] => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if ('$values' in data) return data.$values || [];
        return [];
      };
      
      // Transform the response to match form data structure
      const transformedData = {
        ...response,
        section: response.sectionId.toString(),
        projectManagerId: response.projectManagerId.toString(),
        budget: response.budget?.toString() || '',
        expectedStart: response.expectedStart ? new Date(response.expectedStart) : null,
        expectedEnd: response.expectedEnd ? new Date(response.expectedEnd) : null,
        tenderDate: response.tenderDate ? new Date(response.tenderDate) : null,
        paymentPlanLines: getArrayData(response.paymentPlanLines),
        // Store the original data separately
        originalData: response
      };

      console.log('Transformed form data:', transformedData);
      return transformedData;
    }
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (formData: any) => {
      console.log('Form data received:', formData);
      
      // Get the original project data to preserve important fields
      const originalProject = project?.originalData;
      console.log('Original project data:', originalProject);

      if (!originalProject) {
        throw new Error('Original project data not found');
      }

      // Transform the data to match the API expectations
      const projectData: Project = {
        id: projectId,
        name: formData.name,
        description: formData.description || '',
        projectNumber: originalProject.projectNumber || '',
        sectionId: parseInt(formData.section),
        projectManagerId: parseInt(formData.projectManagerId),
        budget: formData.budget ? parseFloat(formData.budget) : 0,
        expectedStart: formData.expectedStart,
        expectedEnd: formData.expectedEnd,
        tenderDate: formData.tenderDate,
        // Preserve existing status fields
        isApproved: originalProject.isApproved || false,
        poNumber: originalProject.poNumber || '',
        approvalDate: originalProject.approvalDate,
        approvedBy: originalProject.approvedBy,
        rejectionReason: originalProject.rejectionReason,
        status: originalProject.status,
        actualStartDate: originalProject.actualStartDate,
        actualEndDate: originalProject.actualEndDate,
        cost: originalProject.cost,
        // Section data
        section: {
          id: parseInt(formData.section),
          name: originalProject.section?.name || '',
          abbreviation: originalProject.section?.abbreviation || '',
          departmentNameEnglish: originalProject.section?.departmentNameEnglish || ''
        },
        createdAt: originalProject.createdAt || new Date(),
        createdBy: originalProject.createdBy || '',
        paymentPlanLines: (formData.paymentPlanLines || []).map((line: any) => ({
          year: Number(line.year),
          amount: Number(line.amount),
          currency: line.currency,
          paymentType: line.paymentType,
          description: line.description || ''
        }))
      };

      // Log the exact data being sent
      console.log('Project data being sent:', projectData);
      
      try {
        const response = await projectApi.update(projectId, projectData);
        console.log('API response:', response);
        return response;
      } catch (error: any) {
        console.error('API Error details:', {
          error: error,
          response: error.response?.data,
          status: error.response?.status,
          section: projectData.section
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated successfully');
      onSuccess?.();
      navigate('/projects');
    },
    onError: (error: unknown) => {
      console.error('Update error:', error);
      let errorMessage = 'Failed to update project';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { errors?: ValidationErrors } } };
        if (apiError.response?.data?.errors) {
          const errors = apiError.response.data.errors;
          errorMessage = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n');
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });

  if (isLoadingProject) {
    return <div>Loading...</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  const handleSubmit = async (formData: any) => {
    try {
      console.log('Submit form data:', formData);
      await updateProjectMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <ProjectForm
      onSubmit={handleSubmit}
      isLoading={updateProjectMutation.isLoading}
      initialData={project}
    />
  );
} 