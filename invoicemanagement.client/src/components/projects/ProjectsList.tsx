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

// Mock data for projects
const mockProjects = [
  {
    id: 1,
    projectNumber: 'DEV/05/2023/001',
    name: 'Network Infrastructure Upgrade',
    description: 'Upgrade of the core network infrastructure to support higher bandwidth and improve security.',
    unit: 'Network Operations',
    budget: 145000,
    cost: 132750,
    expectedStart: '2023-02-15',
    expectedEnd: '2023-06-30',
    actualStart: '2023-02-20',
    actualEnd: null,
    status: 'In Progress',
    lposCount: 5,
    invoicesCount: 12,
    projectManager: 'John Smith',
    completionPercentage: 70,
    poNumber: 'PO-2023-0156',
    purchaseDate: '2023-02-10',
    paymentPlan: '2023: $100,000\n2024: $45,000'
  },
  {
    id: 2,
    projectNumber: 'EA/03/2023/001',
    name: 'ERP System Implementation',
    description: 'Implementation of a new enterprise resource planning system to streamline business processes.',
    unit: 'Backend Development',
    budget: 275000,
    cost: 195000,
    expectedStart: '2023-03-10',
    expectedEnd: '2023-12-15',
    actualStart: '2023-03-15',
    actualEnd: null,
    status: 'In Progress',
    lposCount: 8,
    invoicesCount: 15,
    projectManager: 'Sarah Johnson',
    completionPercentage: 45,
    poNumber: 'PO-2023-0187',
    purchaseDate: '2023-03-05',
    paymentPlan: '2023: $150,000\n2024: $125,000'
  },
  {
    id: 3,
    projectNumber: 'DEV/01/2023/001',
    name: 'Company Website Redesign',
    description: 'Complete redesign of the company website to improve user experience and mobile compatibility.',
    unit: 'Frontend Development',
    budget: 85000,
    cost: 85000,
    expectedStart: '2023-01-05',
    expectedEnd: '2023-04-15',
    actualStart: '2023-01-10',
    actualEnd: '2023-04-20',
    status: 'Completed',
    lposCount: 3,
    invoicesCount: 6,
    projectManager: 'Mike Wilson',
    completionPercentage: 100,
    poNumber: 'PO-2022-0435',
    purchaseDate: '2022-12-20',
    paymentPlan: '2023: $85,000'
  },
  {
    id: 4,
    projectNumber: 'SEC/04/2023/001',
    name: 'Cybersecurity Enhancement',
    description: 'Strengthening the companys cybersecurity posture through implementation of advanced security measures.',
    unit: 'Security',
    budget: 120000,
    cost: 70000,
    expectedStart: '2023-04-01',
    expectedEnd: '2023-09-30',
    actualStart: '2023-04-10',
    actualEnd: null,
    status: 'In Progress',
    lposCount: 4,
    invoicesCount: 8,
    projectManager: 'Lisa Chen',
    completionPercentage: 58,
    poNumber: 'PO-2023-0201',
    purchaseDate: '2023-03-25',
    paymentPlan: '2023: $90,000\n2024: $30,000'
  },
  {
    id: 5,
    projectNumber: 'INF/02/2023/001',
    name: 'Server Virtualization',
    description: 'Migrating physical servers to a virtualized environment to improve resource utilization and reduce costs.',
    unit: 'System Administration',
    budget: 95000,
    cost: 92000,
    expectedStart: '2023-02-01',
    expectedEnd: '2023-05-15',
    actualStart: '2023-02-05',
    actualEnd: '2023-05-10',
    status: 'Completed',
    lposCount: 2,
    invoicesCount: 5,
    projectManager: 'Robert Taylor',
    completionPercentage: 100,
    poNumber: 'PO-2023-0142',
    purchaseDate: '2023-01-20',
    paymentPlan: '2023: $95,000'
  }
];

type Project = typeof mockProjects[0];

const ProjectsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null as string | null);

  // Filter projects based on search query and status filter
  const filteredProjects = mockProjects.filter((project) => {
    // Search filter
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectManager.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter ? project.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

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

      {/* Status filter buttons */}
      <div className="flex flex-wrap gap-2">
        <Badge 
          className={`cursor-pointer ${!statusFilter ? 'bg-blue-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          onClick={() => setStatusFilter(null)}
        >
          All
        </Badge>
        <Badge 
          className={`cursor-pointer ${statusFilter === 'In Progress' ? 'bg-blue-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          onClick={() => setStatusFilter('In Progress')}
        >
          In Progress
        </Badge>
        <Badge 
          className={`cursor-pointer ${statusFilter === 'Completed' ? 'bg-blue-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          onClick={() => setStatusFilter('Completed')}
        >
          Completed
        </Badge>
      </div>

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <motion.div 
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant={project.status === 'Completed' ? 'success' : 'default'}>
                    {project.status}
                  </Badge>
                  <span className="text-sm font-mono text-gray-500">{project.projectNumber}</span>
                </div>
                <CardTitle className="mt-2 text-xl">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2">{project.description}</CardDescription>
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
                  
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Progress</span>
                      <span>{project.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${project.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${project.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Action button */}
                  <div className="pt-2">
                    <Link to={`/projects/${project.id}`}>
                      <Button variant="outline" className="w-full flex items-center justify-center gap-1">
                        <ArrowsPointingOutIcon className="h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
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