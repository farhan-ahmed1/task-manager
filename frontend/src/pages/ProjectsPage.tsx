import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ProjectCard, ProjectForm, ProjectStats, ProjectTaskView, ProjectSharingDialog, ProjectFilters } from '@/components/projects';
import TaskForm from '@/components/tasks/TaskForm';
import { Plus, AlertCircle, Loader2, BarChart3, FolderOpen, ArrowLeft } from 'lucide-react';
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
        case 'completion_rate': {
          const aStats = projectStats[a.id];
          const bStats = projectStats[b.id];
          const aTotal = aStats ? aStats.PENDING + aStats.IN_PROGRESS + aStats.COMPLETED : 0;
          const bTotal = bStats ? bStats.PENDING + bStats.IN_PROGRESS + bStats.COMPLETED : 0;
          const aRate = aTotal > 0 ? Math.round((aStats.COMPLETED / aTotal) * 100) : 0;
          const bRate = bTotal > 0 ? Math.round((bStats.COMPLETED / bTotal) * 100) : 0;
          comparison = aRate - bRate;
          break;
        }
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [projects, searchQuery, sortBy, sortOrder, projectStats]);

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
  if (viewMode === 'stats' && selectedProject) {
    const stats = projectStats[selectedProject.id];
    
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

          {stats ? (
            <ProjectStats project={selectedProject} stats={stats} />
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200/60">
              <div className="max-w-md mx-auto">
                <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Analytics</h3>
                <p className="text-slate-600">Gathering project statistics...</p>
              </div>
            </div>
          )}
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
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <div className="ml-2">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </Alert>
        )}

        {/* Header with Enhanced Design */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200/60 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Project Management</h1>
                  <p className="text-slate-600">Organize and track your projects</p>
                </div>
              </div>
              
              {/* Enhanced Stats Cards */}
              {projects.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                      <span className="text-sm font-medium text-slate-700">{projects.length} Projects</span>
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-slate-700">
                        {Object.values(projectStats).reduce((acc, stats) => acc + (stats?.COMPLETED || 0), 0)} Tasks Done
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium text-slate-700">
                        {Object.values(projectStats).reduce((acc, stats) => acc + (stats?.IN_PROGRESS || 0), 0)} In Progress
                      </span>
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
    </div>
  );
};

export default ProjectsPage;