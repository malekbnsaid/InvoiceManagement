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
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Modern Header */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Edit Project</h1>
            <p className="text-lg text-gray-600 mt-1">Modify project details and settings</p>
          </div>
        </div>
      </div>
      
      <ProjectEditForm projectId={projectId} />
    </div>
  );
} 