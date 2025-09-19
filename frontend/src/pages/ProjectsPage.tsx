import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ProjectCard, ProjectForm, ProjectStats, ProjectTaskView } from '@/components/projects';
import { Plus, AlertCircle, Loader2, BarChart3, FolderOpen } from 'lucide-react';
import { useProjectStore } from '@/store/useStore';
import { projectService } from '@/services/projects';
import type { Project, CreateProjectRequest, UpdateProjectRequest, Task } from '@/types/api';
import type { ProjectStats as ProjectStatsType } from '@/services/projects';

type ViewMode = 'dashboard' | 'stats' | 'tasks';

const ProjectsPage: React.FC = () => {
  const {
    projects,
    selectedProject,
    isLoading,
    error,
    setProjects,
    addProject,
    updateProject,
    removeProject,
    setSelectedProject,
    setLoading,
    setError,
  } = useProjectStore();

  const [projectStats, setProjectStats] = useState<Record<string, ProjectStatsType>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; project: Project | null }>({
    isOpen: false,
    project: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  // Load projects on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await projectService.getProjects();
        
        if (result.success) {
          setProjects(result.data);
        } else {
          setError(result.error.message);
        }
      } catch {
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [setLoading, setError, setProjects]);

  // Load project stats when projects change
  useEffect(() => {
    if (projects.length > 0) {
      const loadStats = async () => {
        try {
          const statsPromises = projects.map(async (project) => {
            const result = await projectService.getProjectStats(project.id);
            return { projectId: project.id, stats: result.success ? result.data : null };
          });

          const statsResults = await Promise.all(statsPromises);
          const statsMap: Record<string, ProjectStatsType> = {};
          
          statsResults.forEach(({ projectId, stats }) => {
            if (stats) {
              statsMap[projectId] = stats;
            }
          });

          setProjectStats(statsMap);
        } catch (err) {
          console.error('Failed to load project stats:', err);
        }
      };

      loadStats();
    }
  }, [projects]);



  const handleCreateProject = async (data: CreateProjectRequest) => {
    setIsFormSubmitting(true);
    setFormError(null);

    try {
      const result = await projectService.createProject(data);
      
      if (result.success) {
        addProject(result.data);
        setIsFormOpen(false);
        setEditingProject(null);
      } else {
        setFormError(result.error.message);
      }
    } catch {
      setFormError('Failed to create project');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleUpdateProject = async (data: UpdateProjectRequest) => {
    if (!editingProject) return;

    setIsFormSubmitting(true);
    setFormError(null);

    try {
      const result = await projectService.updateProject(editingProject.id, data);
      
      if (result.success) {
        updateProject(editingProject.id, result.data);
        setIsFormOpen(false);
        setEditingProject(null);
      } else {
        setFormError(result.error.message);
      }
    } catch {
      setFormError('Failed to update project');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (isDeleting) return; // Prevent double-delete
    
    setIsDeleting(true);
    
    try {
      const result = await projectService.deleteProject(project.id);
      
      if (result.success) {
        // Remove from local state immediately
        removeProject(project.id);
        
        // Clear selected project if it was the deleted one
        if (selectedProject?.id === project.id) {
          setSelectedProject(null);
        }
        
        // Close dialog and clear any error
        setDeleteDialog({ isOpen: false, project: null });
        setError(null);
      } else {
        setError(result.error.message);
        setDeleteDialog({ isOpen: false, project: null });
      }
    } catch {
      setError('Failed to delete project');
      setDeleteDialog({ isOpen: false, project: null });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleViewTasks = (project: Project) => {
    setSelectedProject(project);
    setViewMode('tasks');
  };

  const handleViewStats = (project: Project) => {
    setSelectedProject(project);
    setViewMode('stats');
  };

  const handleFormSubmit = async (data: CreateProjectRequest | UpdateProjectRequest) => {
    if (editingProject) {
      await handleUpdateProject(data);
    } else {
      await handleCreateProject(data as CreateProjectRequest);
    }
  };

  const EmptyState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <CardTitle className="mb-2">No Projects Yet</CardTitle>
        <CardDescription className="mb-6">
          Create your first project to start organizing your tasks
        </CardDescription>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Project
        </Button>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Stats view
  if (viewMode === 'stats' && selectedProject) {
    const stats = projectStats[selectedProject.id];
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode('dashboard');
                setSelectedProject(null);
              }}
            >
              ← Back to Projects
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Project Analytics</h1>
              <p className="text-muted-foreground">
                Detailed statistics for {selectedProject.name}
              </p>
            </div>
          </div>
        </div>

        {stats ? (
          <ProjectStats project={selectedProject} stats={stats} />
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading project statistics...</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Tasks view
  if (viewMode === 'tasks' && selectedProject) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode('dashboard');
                setSelectedProject(null);
              }}
            >
              ← Back to Projects
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Project Tasks</h1>
              <p className="text-muted-foreground">
                Manage tasks for {selectedProject.name}
              </p>
            </div>
          </div>
        </div>

        <ProjectTaskView
          project={selectedProject}
          onCreateTask={() => {
            // TODO: Implement task creation with project pre-selected
            console.log('Create task for project:', selectedProject.id);
          }}
          onEditTask={(task: Task) => {
            // TODO: Implement task editing
            console.log('Edit task:', task.id);
          }}
        />
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Organize your tasks with projects
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <div className="ml-2">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

        {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              stats={projectStats[project.id]}
              onEdit={handleEditProject}
              onDelete={(project) => {
                // Don't allow delete if already deleting
                if (!isDeleting) {
                  setDeleteDialog({ isOpen: true, project });
                }
              }}
              onViewTasks={handleViewTasks}
              onViewStats={handleViewStats}
            />
          ))}
        </div>
      )}      {/* Project Form Dialog */}
      <ProjectForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProject(null);
          setFormError(null);
        }}
        onSubmit={handleFormSubmit}
        project={editingProject || undefined}
        isSubmitting={isFormSubmitting}
        error={formError}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => !open && !isDeleting && setDeleteDialog({ isOpen: false, project: null })}
        onConfirm={() => deleteDialog.project && handleDeleteProject(deleteDialog.project)}
        title="Delete Project"
        description={
          deleteDialog.project
            ? `Are you sure you want to delete "${deleteDialog.project.name}"? This action cannot be undone and will also delete all tasks in this project.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        loading={isDeleting}
      />
    </div>
  );
};

export default ProjectsPage;