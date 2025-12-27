import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import ProjectHeader from '@/components/layout/ProjectHeader';
import ProjectTasksLayout from '@/components/projects/ProjectTasksLayout';
import { useProject } from '@/hooks/useProjects';
import type { Project } from '@/types/api';

const IndividualProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [localProject, setLocalProject] = useState<Project | null>(null);

  // React Query hook - single source of truth
  const { data: project, isLoading, error } = useProject(projectId || '');

  // Update local project state when React Query data changes
  React.useEffect(() => {
    if (project) {
      setLocalProject(project);
    }
  }, [project]);

  if (!projectId) {
    navigate('/projects');
    return null;
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
               style={{ borderColor: 'var(--primary)' }} />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
               style={{ backgroundColor: 'var(--border-light)' }}>
            <FolderOpen className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>
            Project Not Found
          </h3>
          <p className="text-body mb-4" style={{ color: 'var(--text-muted)' }}>
            {typeof error === 'string' ? error : 'The project you are looking for does not exist or you do not have access to it.'}
          </p>
          <button 
            onClick={() => navigate('/projects')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Project Header */}
      <ProjectHeader 
        project={localProject || project}
        onEdit={() => {/* TODO */}}
        onDelete={() => {/* TODO */}}
        onShare={() => {/* TODO */}}
      />
      
      {/* Project content with simplified individual project title */}
      <ProjectTasksLayout
        project={localProject || project}
        title={(localProject || project).name}
        emptyStateTitle="This project is empty"
        emptyStateDescription="Add your first task to start organizing work in this project."
        emptyButtonText="Add your first task"
        onProjectUpdate={(updatedProject) => setLocalProject(updatedProject)}
      />
    </div>
  );
};

export default IndividualProjectPage;