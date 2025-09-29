import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProjectTasksLayout from '@/components/projects/ProjectTasksLayout';
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
          <Button 
            onClick={() => navigate('/projects')}
            className="tm-btn-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Back button header */}
      <div className="bg-white border-b border-slate-200/60 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/projects')}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
            <div className="h-4 w-px bg-slate-300" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-slate-600">{project.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Project content using shared layout */}
      <ProjectTasksLayout
        project={project}
        icon={<FolderOpen className="w-5 h-5 mr-2" style={{ color: 'var(--primary)' }} />}
        title={project.name}
        emptyStateTitle="This project is empty"
        emptyStateDescription="Add your first task to start organizing work in this project."
        emptyButtonText="Add your first task"
      />
    </div>
  );
};

export default IndividualProjectPage;