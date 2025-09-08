import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { projectApi } from '../../services/api/projectApi';
import ProjectActions from './ProjectActions';
import { Project } from '../../types/interfaces';

interface ProjectListItem extends Project {
  projectManager?: {
    employeeName: string;
  };
  isPendingDeletion?: boolean;
}

export default function ProjectList() {
  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const data = await projectApi.getAll();
      return data as ProjectListItem[];
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Project Number</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Project Manager</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects?.map((project: ProjectListItem) => {
            // Calculate progress
            const progress = project.cost && project.budget
              ? Math.min((project.cost / project.budget) * 100, 100)
              : 0;

            return (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>{project.projectNumber}</TableCell>
                <TableCell>{project.section?.name}</TableCell>
                <TableCell>{project.projectManager?.employeeName}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      project.isApproved
                        ? 'success'
                        : project.isPendingDeletion
                        ? 'danger'
                        : 'secondary'
                    }
                  >
                    {project.isPendingDeletion
                      ? 'Pending Deletion'
                      : project.isApproved
                      ? 'Approved'
                      : 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="w-full">
                    <Progress value={progress} className="h-2" />
                    <span className="text-xs text-gray-500 mt-1">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {project.budget?.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'QAR',
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <ProjectActions
                    project={project}
                    onRefresh={refetch}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 