import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ProjectCard, ProjectForm, ProjectStats, ProjectTaskView, ProjectSharingDialog } from '@/components/projects';
import TaskForm from '@/components/tasks/TaskForm';
import { Plus, AlertCircle, Loader2, BarChart3, FolderOpen } from 'lucide-react';
import { useProjectStore, useTaskStore } from '@/store/useStore';
import { projectService } from '@/services/projects';
import { taskService } from '@/services/tasks';
import type { Project, CreateProjectRequest, UpdateProjectRequest, Task, CreateTaskRequest } from '@/types/api';
import type { ProjectStats as ProjectStatsType } from '@/services/projects';
import type { CreateTaskFormData } from '@/validation/task';

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

  const { addTask: addTaskToStore, updateTask: updateTaskInStore } = useTaskStore();

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

  // Project sharing state
  const [sharingProject, setSharingProject] = useState<Project | null>(null);
  const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false);
  const [isInvitingUser, setIsInvitingUser] = useState(false);
  const [sharingError, setSharingError] = useState<string | null>(null);

  // Task management state
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormProjectId, setTaskFormProjectId] = useState<string | undefined>();
  const [isTaskFormSubmitting, setIsTaskFormSubmitting] = useState(false);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);



  // Helper function to load stats for a single project
  const loadProjectStats = async (projectId: string) => {
    try {
      const result = await projectService.getProjectStats(projectId);
      if (result.success) {
        setProjectStats(prev => ({
          ...prev,
          [projectId]: result.data
        }));
      }
    } catch (error) {
      console.error('Failed to load project stats:', error);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount (Zustand setters are stable)

  // Load project stats when projects change (debounced to prevent rapid API calls)
  useEffect(() => {
    if (projects.length > 0) {
      // Debounce the stats loading to prevent rapid successive calls
      const timeoutId = setTimeout(async () => {
        try {
          // Only load stats for projects we don't already have stats for
          const projectsNeedingStats = projects.filter(project => !projectStats[project.id]);
          
          if (projectsNeedingStats.length === 0) {
            return; // No new projects to load stats for
          }

          // Limit concurrent requests to prevent rate limiting
          const BATCH_SIZE = 5;
          const newStatsMap: Record<string, ProjectStatsType> = { ...projectStats };
          
          for (let i = 0; i < projectsNeedingStats.length; i += BATCH_SIZE) {
            const batch = projectsNeedingStats.slice(i, i + BATCH_SIZE);
            
            const statsPromises = batch.map(async (project) => {
              const result = await projectService.getProjectStats(project.id);
              return { projectId: project.id, stats: result.success ? result.data : null };
            });

            const batchResults = await Promise.all(statsPromises);
            
            batchResults.forEach(({ projectId, stats }) => {
              if (stats) {
                newStatsMap[projectId] = stats;
              }
            });

            // Small delay between batches to be respectful to rate limits
            if (i + BATCH_SIZE < projectsNeedingStats.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }

          setProjectStats(newStatsMap);
        } catch (err) {
          console.error('Failed to load project stats:', err);
        }
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]); // projectStats intentionally excluded to prevent infinite loop



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

  const handleShareProject = (project: Project) => {
    setSharingProject(project);
    setSharingError(null);
    setIsSharingDialogOpen(true);
  };

  const handleInviteUser = async (email: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER') => {
    if (!sharingProject) return;

    setIsInvitingUser(true);
    setSharingError(null);

    try {
      const result = await projectService.inviteUserToProject(sharingProject.id, email, role);
      
      if (!result.success) {
        setSharingError(result.error.message);
      }
      // Success is handled by the dialog component
    } catch {
      setSharingError('Failed to invite user');
    } finally {
      setIsInvitingUser(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!sharingProject) return;

    try {
      const result = await projectService.removeProjectMember(sharingProject.id, userId);
      
      if (!result.success) {
        setSharingError(result.error.message);
      }
      // Success is handled by the dialog component
    } catch {
      setSharingError('Failed to remove member');
    }
  };

  const handleCloseSharingDialog = () => {
    setIsSharingDialogOpen(false);
    setSharingProject(null);
    setSharingError(null);
  };

  const handleFormSubmit = async (data: CreateProjectRequest | UpdateProjectRequest) => {
    if (editingProject) {
      await handleUpdateProject(data);
    } else {
      await handleCreateProject(data as CreateProjectRequest);
    }
  };

  // Task management functions
  const handleCreateTask = (projectId?: string) => {
    setEditingTask(null);
    setTaskFormProjectId(projectId);
    setTaskFormError(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormProjectId(task.project_id);
    setTaskFormError(null);
    setIsTaskFormOpen(true);
  };

  const handleTaskFormSubmit = async (data: CreateTaskFormData) => {
    setIsTaskFormSubmitting(true);
    setTaskFormError(null);

    try {
      if (editingTask) {
        // Update existing task
        const result = await taskService.updateTask(editingTask.id, {
          title: data.title,
          description: data.description || undefined,
          status: data.status,
          priority: data.priority,
          due_date: data.due_date || undefined,
          project_id: data.project_id || undefined,
        });

        if (result.success) {
          updateTaskInStore(editingTask.id, result.data);
          setIsTaskFormOpen(false);
          setEditingTask(null);
          setTaskRefreshTrigger(prev => prev + 1);
          
          // Refresh project stats if task was in a project
          if (result.data.project_id) {
            await loadProjectStats(result.data.project_id);
          }
        } else {
          setTaskFormError(result.error.message);
        }
      } else {
        // Create new task
        const taskData: CreateTaskRequest = {
          title: data.title,
          description: data.description || undefined,
          status: data.status || 'PENDING',
          priority: data.priority || 'MEDIUM',
          due_date: data.due_date || undefined,
          project_id: data.project_id || undefined,
        };

        const result = await taskService.createTask(taskData);

        if (result.success) {
          addTaskToStore(result.data);
          setIsTaskFormOpen(false);
          setTaskFormProjectId(undefined);
          setTaskRefreshTrigger(prev => prev + 1);
          
          // Refresh project stats if task was assigned to a project
          if (result.data.project_id) {
            await loadProjectStats(result.data.project_id);
          }
        } else {
          setTaskFormError(result.error.message);
        }
      }
    } catch (error) {
      console.error('Task operation failed:', error);
      setTaskFormError('An unexpected error occurred. Please try again.');
    } finally {
      setIsTaskFormSubmitting(false);
    }
  };

  const handleTaskFormClose = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
    setTaskFormProjectId(undefined);
    setTaskFormError(null);
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
          onCreateTask={() => handleCreateTask(selectedProject.id)}
          onEditTask={handleEditTask}
          refreshTrigger={taskRefreshTrigger}
        />

        {/* Task Form Dialog for Tasks View */}
        <TaskForm
          open={isTaskFormOpen}
          onOpenChange={handleTaskFormClose}
          task={editingTask || undefined}
          onSubmit={handleTaskFormSubmit}
          loading={isTaskFormSubmitting}
          defaultProjectId={taskFormProjectId}
          showProjectSelector={true}
        />

        {/* Task Form Error for Tasks View */}
        {taskFormError && isTaskFormOpen && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <p>{taskFormError}</p>
          </Alert>
        )}
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
              onShare={handleShareProject}
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

      {/* Task Form Dialog */}
      <TaskForm
        open={isTaskFormOpen}
        onOpenChange={handleTaskFormClose}
        task={editingTask || undefined}
        onSubmit={handleTaskFormSubmit}
        loading={isTaskFormSubmitting}
        defaultProjectId={taskFormProjectId}
        showProjectSelector={true}
      />

      {/* Task Form Error */}
      {taskFormError && isTaskFormOpen && (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <p>{taskFormError}</p>
        </Alert>
      )}

      {/* Project Sharing Dialog */}
      {sharingProject && (
        <ProjectSharingDialog
          isOpen={isSharingDialogOpen}
          onClose={handleCloseSharingDialog}
          project={sharingProject}
          onInviteUser={handleInviteUser}
          onRemoveMember={handleRemoveMember}
          isInviting={isInvitingUser}
          error={sharingError}
        />
      )}
    </div>
  );
};

export default ProjectsPage;