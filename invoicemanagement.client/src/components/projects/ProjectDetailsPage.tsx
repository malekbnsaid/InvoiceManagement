import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { projectApi } from '../../services/api';
import {
  CalendarIcon,
  BanknotesIcon,
  ClockIcon,
  FolderIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { CurrencyType } from '../../types/enums';

interface Project {
  id: number;
  projectNumber: string;
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
        // Transform arrays
        paymentPlanLines: getArrayData(response.paymentPlanLines).map((line: PaymentPlanLine) => ({
          year: Number(line.year),
          amount: Number(line.amount),
          currency: line.currency,
          paymentType: line.paymentType || 'Annually',
          description: line.description || ''
        })),
        invoices: getArrayData(response.invoices),
        lpOs: getArrayData(response.lpOs),
        // Transform nested objects (only if they need transformation)
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
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-gray-500">{project.projectNumber}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={project.status === 'In Progress' ? 'default' : 'secondary'}>
            {project.status}
          </Badge>
          {project.isApproved ? (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircleIcon className="h-4 w-4" />
              Approved
            </Badge>
          ) : (
            <Badge variant="warning" className="flex items-center gap-1">
              <XCircleIcon className="h-4 w-4" />
              Pending Approval
            </Badge>
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
    </div>
  );
} 