import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectEditForm from '../components/projects/ProjectEditForm';

export default function ProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || '0', 10);

  if (!projectId) {
    return <div>Invalid project ID</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Project</h1>
      <ProjectEditForm projectId={projectId} />
    </div>
  );
} 