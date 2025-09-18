import React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import {
  FolderIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  BanknotesIcon,
  ClockIcon,
  ArrowsPointingOutIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { projectApi } from '../../services/api/projectApi';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '../../utils/formatters';
import { CurrencyType } from '../../types/enums';
import ProjectActions from './ProjectActions';
import { Project } from '../../types/interfaces';
import { Skeleton, SkeletonGrid } from '../ui/skeleton';

interface ProjectListItem {
  id: number;
  name: string;
  projectNumber: string;
  description: string;
  budget?: number;
  expectedStart?: string;
  expectedEnd?: string;
  status?: string;
  projectManager?: {
    employeeName: string;
  };
  section?: {
    id: number;
    name: string;
    abbreviation: string;
  };
  poNumber?: string;
  isPendingDeletion?: boolean;
  isApproved?: boolean;
}

interface APIResponse<T> {
  $values?: T[];
  [key: string]: any;
}

const ProjectsList = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch projects using React Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectApi.getAll() as APIResponse<Project> | Project[];
      const projects = Array.isArray(response) 
        ? response 
        : response.$values || [];
      
      return projects.map((project: any) => ({
        ...project,
        paymentPlanLines: Array.isArray(project.paymentPlanLines)
          ? project.paymentPlanLines
          : project.paymentPlanLines?.$values || []
      }));
    }
  });

  // Filter projects based on search query
  const filteredProjects = data?.filter((project: ProjectListItem) => {
    // Search filter
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectManager?.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.section?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="relative">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Projects Grid Skeleton */}
        <SkeletonGrid count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading projects. Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with title and action buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Projects</h1>
          <p className="text-gray-600 mt-1">Manage and track IT projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-1">
            <FunnelIcon className="h-4 w-4" />
            Filter
          </Button>
          <Link to="/projects/new">
            <Button className="flex items-center gap-1">
              <PlusIcon className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input 
          type="text"
          placeholder="Search projects by name, number, or manager..."
          className="w-full pl-10 pr-4 py-2 border rounded-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects?.map((project: ProjectListItem) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {project.projectNumber}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={project.status === 'In Progress' ? 'default' : 'secondary'}
                      className="px-2 py-1 text-xs"
                    >
                      {project.status}
                    </Badge>
                    <ProjectActions 
                      project={{
                        id: project.id,
                        name: project.name,
                        isPendingDeletion: project.isPendingDeletion,
                        isApproved: project.isApproved
                      }}
                      onRefresh={() => refetch()}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Project details */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-700 font-medium mr-1">Expected:</span>
                      <span className="text-gray-500">
                        {project.expectedStart && format(new Date(project.expectedStart), 'MMM d, yyyy')} - 
                        {project.expectedEnd && format(new Date(project.expectedEnd), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <BanknotesIcon className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-700 font-medium mr-1">Budget:</span>
                      <span className="text-gray-500">{project.budget ? formatCurrency(project.budget, CurrencyType.QAR) : ''}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FolderIcon className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-700 font-medium mr-1">Unit:</span>
                      <span className="text-gray-500">{project.section?.name || ''}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-700 font-medium mr-1">PO Number:</span>
                      <span className="text-gray-500">{project.poNumber || ''}</span>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/projects/${project.id}`}>
                        <ArrowsPointingOutIcon className="h-4 w-4 mr-1" />
                        Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsList; 