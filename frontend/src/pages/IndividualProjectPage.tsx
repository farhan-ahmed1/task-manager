import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import ProjectHeader from '@/components/layout/ProjectHeader';
import ProjectTasksLayout from '@/components/projects/ProjectTasksLayout';
import { useProject } from '@/hooks/useProjects';
import { useProjectLayoutConfig } from '@/hooks/useLayoutConfig';
import type { Project } from '@/types/api';
import { Spinner } from '@/components/ui/spinner';
import PageContainer from '@/components/ui/page-container';

const IndividualProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [localProject, setLocalProject] = useState<Project | null>(null);

  // React Query hook - single source of truth
  const { data: project, isLoading, error } = useProject(projectId || '');
  const config = useProjectLayoutConfig(localProject || project);

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
      <PageContainer size="standard" centerContent>
        <Spinner size="lg" centered />
      </PageContainer>
    );
  }

  if (error || !project) {
    return (
      <PageContainer size="standard">
        <div className="text-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl mb-4 bg-border-light mx-auto">
            <FolderOpen className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-h3 mb-2 text-text-primary">
            Project Not Found
          </h3>
          <p className="text-body mb-4 text-text-muted">
            {typeof error === 'string' ? error : 'The project you are looking for does not exist or you do not have access to it.'}
          </p>
          <button 
            onClick={() => navigate('/projects')}
            className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </PageContainer>
    );
  }



  return (
    <div className="min-h-screen bg-background">
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
        config={config}
        onProjectUpdate={(updatedProject) => setLocalProject(updatedProject)}
      />
    </div>
  );
};

export default IndividualProjectPage;