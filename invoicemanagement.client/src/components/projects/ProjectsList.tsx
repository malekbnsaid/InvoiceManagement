import { useState } from 'react';
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

// Mock data for projects
const mockProjects = [
  {
    id: 1,
    projectNumber: 'PRJ-2023-001',
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
    completionPercentage: 70
  },
  {
    id: 2,
    projectNumber: 'PRJ-2023-002',
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
    completionPercentage: 45
  },
  {
    id: 3,
    projectNumber: 'PRJ-2023-003',
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
    completionPercentage: 100
  },
  {
    id: 4,
    projectNumber: 'PRJ-2023-004',
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
    completionPercentage: 58
  },
  {
    id: 5,
    projectNumber: 'PRJ-2023-005',
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
    completionPercentage: 100
  }
];

type Project = typeof mockProjects[0];

const ProjectsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>(mockProjects);

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchTerm === '' || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.projectNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUnit = selectedUnit === null || project.unit === selectedUnit;
    const matchesStatus = selectedStatus === null || project.status === selectedStatus;
    
    return matchesSearch && matchesUnit && matchesStatus;
  });

  // Extract unique units and statuses for filters
  const units = [...new Set(projects.map(project => project.unit))];
  const statuses = [...new Set(projects.map(project => project.status))];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <FolderIcon className="h-6 w-6 mr-2 text-primary-500" />
          IT Projects
        </h1>
        <Button className="flex items-center">
          <PlusIcon className="h-4 w-4 mr-1" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
              <div className="relative w-full sm:w-64">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
                  value={selectedUnit || ''}
                  onChange={(e) => setSelectedUnit(e.target.value === '' ? null : e.target.value)}
                >
                  <option value="">All Units</option>
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
                  value={selectedStatus || ''}
                  onChange={(e) => setSelectedStatus(e.target.value === '' ? null : e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4">
              {filteredProjects.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-gray-500 dark:text-gray-400">No projects found matching your criteria.</p>
                </div>
              ) : (
                filteredProjects.map(project => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="overflow-hidden">
                      <div className="flex flex-col lg:flex-row">
                        <div className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={project.status === 'Completed' ? 'success' : 'default'}
                                  className="mb-2"
                                >
                                  {project.status}
                                </Badge>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{project.projectNumber}</span>
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h3>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/projects/${project.id}`}>
                                  <ArrowsPointingOutIcon className="h-4 w-4 mr-1" />
                                  Details
                                </Link>
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">{project.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 flex items-center">
                                <FolderIcon className="h-4 w-4 mr-1" /> Unit
                              </p>
                              <p className="font-medium">{project.unit}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 flex items-center">
                                <BanknotesIcon className="h-4 w-4 mr-1" /> Budget
                              </p>
                              <p className="font-medium">{formatCurrency(project.budget)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" /> Timeline
                              </p>
                              <p className="font-medium">
                                {format(new Date(project.expectedStart), 'MMM d, yyyy')} - {' '}
                                {format(new Date(project.expectedEnd), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" /> Completion
                              </p>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-1.5">
                                <div 
                                  className="bg-primary-600 h-2.5 rounded-full" 
                                  style={{ width: `${project.completionPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 p-4 lg:p-6 bg-gray-50 dark:bg-gray-800 flex flex-row lg:flex-col justify-between items-center lg:items-start gap-4 lg:w-56">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Project Manager</p>
                            <p className="font-medium">{project.projectManager}</p>
                          </div>
                          <div className="flex flex-col items-center lg:items-start">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">LPOs</p>
                                <p className="font-semibold text-lg">{project.lposCount}</p>
                              </div>
                              <div className="h-10 border-l border-gray-300 dark:border-gray-600"></div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Invoices</p>
                                <p className="font-semibold text-lg">{project.invoicesCount}</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full mt-2">
                              Manage Documents
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectsList; 