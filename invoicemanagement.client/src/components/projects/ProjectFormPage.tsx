import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProjectForm from './ProjectForm';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/Button';
import { projectApi } from '../../services/api/projectApi';
import { departmentApi } from '../../services/api/departmentApi';
import { useMutation, useQuery } from '@tanstack/react-query';
import React from 'react';
import { useToast } from '../ui/use-toast';
import { Toaster } from '../ui/toaster';
import { CurrencyType } from '../../types/enums';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { ProjectBusinessRules } from '../../services/businessRules';

interface Department {
  id: number;
  sectionName: string;
  sectionAbbreviation: string;
  parentId: number | null;
}

interface PaymentPlanLine {
  year: number;
  amount: number;
  currency: CurrencyType;
  description?: string;
}

interface ProjectFormData {
  name: string;
  description?: string;
  section: string;
  unitId?: string;
  projectManagerId: string;
  budget: string;
  expectedStart: Date | null;
  expectedEnd: Date | null;
  tenderDate: Date | null;
  paymentPlanLines: PaymentPlanLine[];
  initialNotes?: string;
  projectNumber?: string;
}

interface ProjectMutationData {
  name: string;
  description: string;
  sectionId: number;
  unitId: number | null;
  projectManagerId: number;
  budget: number;
  expectedStart: Date | null;
  expectedEnd: Date | null;
  tenderDate: Date | null;
  paymentPlanLines: {
    year: number;
    amount: number;
    currency: CurrencyType;
    paymentType: string;
    description: string;
  }[];
  isApproved: boolean;
  createdBy: string;
  createdAt: string;
}

export default function ProjectFormPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { canCreateProject } = usePermissions();

  // Show access denied message if user doesn't have permission
  if (!canCreateProject) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-12 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              You don't have permission to create projects. Only users with Project Manager role or higher can create projects.
            </p>
            <Button 
              onClick={() => navigate('/projects')}
              className="mt-6"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fetch sections data
  const { data: sectionsData } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const response = await departmentApi.getAll();
      return Array.isArray(response) 
        ? response 
        : response.$values || [];
    }
  });

  // Create project mutation
  const createProject = useMutation({
    mutationFn: async (data: any) => {
      console.log('Mutation function called with data:', data);
      try {
        const response = await projectApi.create(data);
        console.log('API response:', response);
        return response;
      } catch (error) {
        console.error('Error in mutation function:', error);
        throw error;
      }
    },
    onSuccess: (data: ProjectMutationData) => {
      console.log('Mutation succeeded:', data);
      toast({
        title: "Success!",
        description: "Project created successfully.",
        variant: "default",
        duration: 3000,
        className: "bg-green-50 border-green-200",
      });
      
      // Navigate after toast shows
      setTimeout(() => {
        navigate('/projects');
      }, 2000);
    },
    onError: (error: unknown) => {
      console.error('Mutation error:', error);
      let errorMessage = 'An error occurred while creating the project.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      
      setError(`Error: ${errorMessage}. Please try again.`);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const handleSubmit = async (data: ProjectFormData) => {
    console.log('Raw form data:', data);
    setError(null);
    
    try {
      // Transform the data to match the API expectations
      const projectData = {
        name: data.name.trim(),
        description: data.description?.trim() || '',
        sectionId: data.section ? parseInt(data.section) || 0 : 0,
        projectManagerId: data.projectManagerId ? parseInt(data.projectManagerId) || 0 : 0,
        budget: data.budget ? parseFloat(data.budget) : 0,
        expectedStart: data.expectedStart,
        expectedEnd: data.expectedEnd,
        tenderDate: data.tenderDate,
        paymentPlanLines: (data.paymentPlanLines || [])
          .filter(line => {
            const isValid = line.year && line.amount && line.currency;
            if (!isValid) {
              console.log('Filtering out invalid PaymentPlanLine:', line);
            }
            return isValid;
          })
          .map((line: PaymentPlanLine) => {
            const mappedLine = {
              year: line.year && !isNaN(line.year) ? line.year : new Date().getFullYear(),
              amount: line.amount && !isNaN(line.amount) ? line.amount : 0,
              currency: line.currency,
              description: line.description || '',
              project: undefined // Explicitly set Project to undefined to satisfy validation
            };
            console.log('Mapped PaymentPlanLine:', mappedLine);
            return mappedLine;
          }),
        isApproved: false,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        cost: 0,
        projectNumber: data.projectNumber || '',
        // Add section data
        section: {
          id: parseInt(data.section),
          name: sectionsData?.find((s: Department) => s.id.toString() === data.section)?.sectionName || '',
          abbreviation: sectionsData?.find((s: Department) => s.id.toString() === data.section)?.sectionAbbreviation || '',
          departmentNameEnglish: sectionsData?.find((s: Department) => s.id.toString() === data.section)?.sectionName || ''
        }
      };

      // Log the transformed data
      console.log('Transformed project data:', projectData);
      console.log('Raw form data:', data);
      console.log('PaymentPlanLines from form:', data.paymentPlanLines);

      // Validate using business rules
      const validationResult = ProjectBusinessRules.validateProject({
        budget: projectData.budget,
        paymentPlanLines: projectData.paymentPlanLines,
        expectedStart: projectData.expectedStart ?? undefined,
        expectedEnd: projectData.expectedEnd ?? undefined,
        tenderDate: projectData.tenderDate ?? undefined,
        userRole: user?.role || 'User'
      });

      if (!validationResult.valid) {
        throw new Error(validationResult.message || 'Validation failed');
      }

      // Show warning if payment plan exceeds budget but allow continuation
      if (validationResult.warning) {
        console.log('Project validation warning:', validationResult.warning);
        // We could show this as a toast warning here if needed
      }
      
      // Log validation results
      console.log('Validation passed for sectionId:', projectData.sectionId);
      console.log('Validation passed for projectManagerId:', projectData.projectManagerId);
      console.log('PaymentPlanLines count:', projectData.paymentPlanLines.length);
      console.log('PaymentPlanLines validation passed');

      // Convert Date objects to ISO strings for API
      const apiProjectData = {
        ...projectData,
        expectedStart: projectData.expectedStart ? projectData.expectedStart.toISOString() : undefined,
        expectedEnd: projectData.expectedEnd ? projectData.expectedEnd.toISOString() : undefined,
        tenderDate: projectData.tenderDate ? projectData.tenderDate.toISOString() : undefined,
      };

      // Log the final data being sent to the API
      console.log('Final data being sent to API:', apiProjectData);
      console.log('TenderDate type:', typeof apiProjectData.tenderDate);
      console.log('TenderDate value:', apiProjectData.tenderDate);
      
      await createProject.mutateAsync(apiProjectData);
    } catch (err: unknown) {
      console.error('Error in handleSubmit:', err);
      let errorMessage = 'An error occurred while submitting the project request.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const axiosError = err as { response?: { data?: { errors?: Record<string, string[]> } } };
        if (axiosError.response?.data?.errors) {
          // Format validation errors
          const errors = axiosError.response.data.errors;
          errorMessage = Object.entries(errors)
            .map(([key, messages]) => `${key}: ${messages.join(', ')}`)
            .join('\n');
        }
      }
      
      setError(`Error: ${errorMessage}. Please try again.`);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          className="mr-2"
          onClick={() => navigate('/projects')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <h1 className="text-2xl font-bold">New Project</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ProjectForm
          onSubmit={handleSubmit}
          isLoading={createProject.isPending}
        />
      </motion.div>
      
      <Toaster />
    </div>
  );
} 