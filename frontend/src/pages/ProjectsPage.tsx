import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ProjectCard, ProjectForm, ProjectTaskView, ProjectSharingDialog, ProjectFilters } from '@/components/projects';
import TaskForm from '@/components/tasks/TaskForm';
import { Plus, AlertCircle, Loader2, BarChart3, FolderOpen, ArrowLeft } from 'lucide-react';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { projectService } from '@/services/projects';
import type { Project, CreateProjectRequest, UpdateProjectRequest, Task, CreateTaskRequest } from '@/types/api';
import type { CreateTaskFormData } from '@/validation/task';

type ViewMode = 'dashboard' | 'stats' | 'tasks';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // React Query hooks - single source of truth
  const { data: projects = [], isLoading, error } = useProjects();
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  // UI state only
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; project: Project | null }>({
    isOpen: false,
    project: null,
  });
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  // Project filtering and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Project sharing state
  const [sharingProject, setSharingProject] = useState<Project | null>(null);
  const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false);
  const [isInvitingUser, setIsInvitingUser] = useState(false);
  const [sharingError, setSharingError] = useState<string | null>(null);

  // Task management state
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormProjectId, setTaskFormProjectId] = useState<string | undefined>();
  const [taskFormError, setTaskFormError] = useState<string | null>(null);



  const handleCreateProject = async (data: CreateProjectRequest) => {
    setFormError(null);

    try {
      await createProjectMutation.mutateAsync(data);
      setIsFormOpen(false);
      setEditingProject(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  const handleUpdateProject = async (data: UpdateProjectRequest) => {
    if (!editingProject) return;

    setFormError(null);

    try {
      await updateProjectMutation.mutateAsync({ id: editingProject.id, updates: data });
      setIsFormOpen(false);
      setEditingProject(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update project');
    }
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      await deleteProjectMutation.mutateAsync(project.id);
      
      // Clear selected project if it was the deleted one
      if (selectedProject?.id === project.id) {
        setSelectedProject(null);
      }
      
      // Close dialog
      setDeleteDialog({ isOpen: false, project: null });
    } catch (err: unknown) {
      console.error('Failed to delete project:', err);
      setDeleteDialog({ isOpen: false, project: null });
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

  const handleNavigateToProject = (project: Project) => {
    navigate(`/projects/${project.id}`);
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
    setTaskFormError(null);

    try {
      if (editingTask) {
        // Update existing task
        await updateTaskMutation.mutateAsync({
          id: editingTask.id,
          updates: {
            title: data.title,
            description: data.description || undefined,
            status: data.status,
            priority: data.priority,
            due_date: data.due_date || undefined,
            project_id: data.project_id || undefined,
          }
        });
        setIsTaskFormOpen(false);
        setEditingTask(null);
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

        await createTaskMutation.mutateAsync(taskData);
        setIsTaskFormOpen(false);
        setTaskFormProjectId(undefined);
      }
    } catch (error) {
      console.error('Task operation failed:', error);
      setTaskFormError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    }
  };

  const handleTaskFormClose = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
    setTaskFormProjectId(undefined);
    setTaskFormError(null);
  };

  // Filter and sort projects
  const filteredAndSortedProjects = React.useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(query) ||
        (project.description && project.description.toLowerCase().includes(query))
      );
    }

    // Sort projects
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'completion_rate':
          // TODO: Re-implement with React Query stats
          comparison = 0;
          break;
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [projects, searchQuery, sortBy, sortOrder]);

  // Handle filter functions
  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSortBy('created_at');
    setSortOrder('desc');
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 shadow-lg">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-slate-900 mb-1">Loading your projects</h3>
                <p className="text-sm text-slate-600">Getting everything ready for you...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

    // Stats view
  // Stats view with React Query
  if (viewMode === 'stats' && selectedProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('dashboard')}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
              <div className="h-4 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{selectedProject.name}</h1>
                <p className="text-sm text-slate-600">Project Analytics</p>
              </div>
            </div>
          </div>

          <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200/60">
            <div className="max-w-md mx-auto">
              <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Project Analytics</h3>
              <p className="text-slate-600">Stats view will be available soon with React Query</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tasks view
  if (viewMode === 'tasks' && selectedProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewMode('dashboard');
                  setSelectedProject(null);
                }}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
              <div className="h-4 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{selectedProject.name}</h1>
                <p className="text-sm text-slate-600">Project Tasks</p>
              </div>
            </div>
          </div>

          <ProjectTaskView
            project={selectedProject}
            onCreateTask={() => handleCreateTask(selectedProject.id)}
            onEditTask={handleEditTask}
            refreshTrigger={0}
          />

          {/* Task Form Dialog for Tasks View */}
          <TaskForm
            open={isTaskFormOpen}
            onOpenChange={handleTaskFormClose}
            task={editingTask || undefined}
            onSubmit={handleTaskFormSubmit}
            loading={createTaskMutation.isPending || updateTaskMutation.isPending}
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
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6 mt-8">
            <AlertCircle className="h-4 w-4" />
            <div className="ml-2">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error instanceof Error ? error.message : 'Failed to load projects'}</p>
            </div>
          </Alert>
        )}

        {/* Header with Enhanced Design - Title integrated into content */}
        <div className="pt-12 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
            <div className="space-y-4">
              {/* Page Title */}
              <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
              
              {/* Enhanced Stats Cards */}
              {projects.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                      <span className="text-sm font-medium text-slate-700">{projects.length} Projects</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Button 
              onClick={() => setIsFormOpen(true)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Project
            </Button>
          </div>
        </div>

        {/* Filters */}
        {projects.length > 0 && (
          <div className="mb-6">
            <ProjectFilters
              search={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        )}

        {/* Project Cards or Empty State */}
        {projects.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200/60">
            <div className="max-w-md mx-auto">
              <div className="text-slate-400 mb-6">
                <FolderOpen className="mx-auto h-16 w-16" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Projects Yet</h3>
              <p className="text-slate-600 mb-6">Create your first project to start organizing your tasks and boost your productivity.</p>
              <Button 
                onClick={() => setIsFormOpen(true)}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Project
              </Button>
            </div>
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200/60">
            <div className="max-w-md mx-auto">
              <div className="text-slate-400 mb-6">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Projects Found</h3>
              <p className="text-slate-600 mb-6">
                {searchQuery ? `No projects match "${searchQuery}". Try adjusting your search.` : 'No projects match your current filters.'}
              </p>
              <Button 
                onClick={handleClearFilters}
                variant="outline"
                size="lg"
                className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-xl"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                stats={undefined}
                onEdit={handleEditProject}
                onDelete={(project) => {
                  // Don't allow delete if already deleting
                  if (!deleteProjectMutation.isPending) {
                    setDeleteDialog({ isOpen: true, project });
                  }
                }}
                onViewTasks={handleViewTasks}
                onViewStats={handleViewStats}
                onShare={handleShareProject}
                onNavigateToProject={handleNavigateToProject}
              />
            ))}
          </div>
        )}

        {/* Project Form Dialog */}
      <ProjectForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProject(null);
          setFormError(null);
        }}
        onSubmit={handleFormSubmit}
        project={editingProject || undefined}
        isSubmitting={createProjectMutation.isPending || updateProjectMutation.isPending}
        error={formError}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => !open && !deleteProjectMutation.isPending && setDeleteDialog({ isOpen: false, project: null })}
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
        loading={deleteProjectMutation.isPending}
      />

      {/* Task Form Dialog */}
      <TaskForm
        open={isTaskFormOpen}
        onOpenChange={handleTaskFormClose}
        task={editingTask || undefined}
        onSubmit={handleTaskFormSubmit}
        loading={createTaskMutation.isPending || updateTaskMutation.isPending}
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
    </div>
  );
};

export default ProjectsPage;