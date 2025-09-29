import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import ProjectTasksLayout from '@/components/projects/ProjectTasksLayout';
import ProjectHeader from '@/components/layout/ProjectHeader';
import { projectService } from '@/services/projects';
import { useAuth } from '@/context/AuthContext';
import type { Project } from '@/types/api';

const IndividualProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !isAuthenticated) {
      navigate('/projects');
      return;
    }

    const loadProject = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await projectService.getProject(projectId);
        if (result.success) {
          setProject(result.data);
        } else {
          setError(result.error.message);
        }
      } catch {
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, isAuthenticated, navigate]);

  if (loading) {
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
            {error || 'The project you are looking for does not exist or you do not have access to it.'}
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

  const handleEdit = () => {
    // TODO: Implement project editing
    console.log('Edit project:', project?.name);
  };

  const handleDelete = () => {
    // TODO: Implement project deletion
    console.log('Delete project:', project?.name);
  };

  const handleShare = () => {
    // TODO: Implement project sharing
    console.log('Share project:', project?.name);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Project Header */}
      <ProjectHeader 
        project={project}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onShare={handleShare}
      />
      
      {/* Project content using shared layout */}
      <ProjectTasksLayout
        project={project}
        icon={<FolderOpen className="w-5 h-5 mr-2" style={{ color: 'var(--primary)' }} />}
        title={project.name}
        emptyStateTitle="This project is empty"
        emptyStateDescription="Add your first task to start organizing work in this project."
        emptyButtonText="Add your first task"
        onProjectUpdate={(updatedProject) => setProject(updatedProject)}
      />
    </div>
  );
};

export default IndividualProjectPage;