import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
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
import { projectApi } from '../../services/api';
import type { QueryObserverResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

interface Project {
  id: number;
  projectNumber: string;
  name: string;
  description: string;
  unit: string;
  budget: number;
  cost: number;
  expectedStart: string;
  expectedEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  status: string;
  lposCount: number;
  invoicesCount: number;
  projectManager: string;
  poNumber: string;
  purchaseDate: string;
  paymentPlan: string;
}

const ProjectsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch projects using React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectApi.getAll();
      // Transform the response to match our interface
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

  // Filter projects based on search query and status filter
  const filteredProjects = data?.filter((project: Project) => {
    // Search filter
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectManager.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter ? project.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
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
        <div className="text-red-500">Error loading projects. Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with title and action buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-gray-500">Manage and track IT projects</p>
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
        {filteredProjects?.map((project: Project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
                    <CardDescription>{project.projectNumber}</CardDescription>
                  </div>
                  <Badge variant={project.status === 'In Progress' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
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
                        {format(new Date(project.expectedStart), 'MMM d, yyyy')} - {format(new Date(project.expectedEnd), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <BanknotesIcon className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-700 font-medium mr-1">Budget:</span>
                      <span className="text-gray-500">${project.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FolderIcon className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-700 font-medium mr-1">Unit:</span>
                      <span className="text-gray-500">{project.unit}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-700 font-medium mr-1">PO Number:</span>
                      <span className="text-gray-500">{project.poNumber}</span>
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