import React, { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { 
  ProjectForm, 
  ProjectSharingDialog, 
  ProjectGrid, 
  ProjectStatsView, 
  ProjectTasksView 
} from '@/components/projects';
import { AlertCircle } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useProjectOperations, useProjectFilters } from '@/hooks';
import type { Project } from '@/types/api';

/**
 * View modes for the projects page
 * - dashboard: Main grid view of all projects
 * - stats: Detailed statistics view for a single project
 * - tasks: Task management view for a single project
 */
type ViewMode = 'dashboard' | 'stats' | 'tasks';

const ProjectsPage: React.FC = () => {
  // Data fetching
  const { data: projects = [], isLoading, error } = useProjects();
  
  // View state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  // Custom hooks for business logic
  const operations = useProjectOperations();
  const filters = useProjectFilters(projects);

  // View mode handlers
  const handleViewTasks = (project: Project) => {
    setSelectedProject(project);
    setViewMode('tasks');
  };

  const handleViewStats = (project: Project) => {
    setSelectedProject(project);
    setViewMode('stats');
  };

  const handleBackToDashboard = () => {
    setViewMode('dashboard');
    setSelectedProject(null);
  };

  const handleDeleteProject = async () => {
    if (!operations.deleteDialog.project) return;
    const wasDeleted = await operations.handleDeleteProject(
      operations.deleteDialog.project,
      selectedProject?.id
    );
    if (wasDeleted) {
      setSelectedProject(null);
      setViewMode('dashboard');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 shadow-lg">
            <Spinner size="lg" text="Loading your projects..." />
          </div>
        </div>
      </div>
    );
  }

  // Stats view
  if (viewMode === 'stats' && selectedProject) {
    return (
      <ProjectStatsView 
        project={selectedProject} 
        onBack={handleBackToDashboard} 
      />
    );
  }

  // Tasks view
  if (viewMode === 'tasks' && selectedProject) {
    return (
      <ProjectTasksView
        project={selectedProject}
        isTaskFormOpen={operations.isTaskFormOpen}
        editingTask={operations.editingTask}
        taskFormError={operations.taskFormError}
        isTaskSubmitting={operations.isTaskSubmitting}
        onBack={handleBackToDashboard}
        onCreateTask={() => operations.handleCreateTask(selectedProject.id)}
        onEditTask={operations.handleEditTask}
        onTaskFormSubmit={operations.handleTaskFormSubmit}
        onTaskFormClose={operations.closeTaskForm}
      />
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
              <p className="text-sm">
                {error instanceof Error ? error.message : 'Failed to load projects'}
              </p>
            </div>
          </Alert>
        )}

        {/* Project Grid */}
        <ProjectGrid
          projects={projects}
          filteredProjects={filters.filteredAndSortedProjects}
          searchQuery={filters.searchQuery}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSearchChange={filters.setSearchQuery}
          onSortChange={filters.handleSortChange}
          onClearFilters={filters.handleClearFilters}
          onCreateProject={operations.openCreateForm}
          onEditProject={operations.openEditForm}
          onDeleteProject={operations.openDeleteDialog}
          onViewTasks={handleViewTasks}
          onViewStats={handleViewStats}
          onShareProject={operations.openSharingDialog}
          onNavigateToProject={operations.navigateToProject}
        />

        {/* Project Form Dialog */}
        <ProjectForm
          isOpen={operations.isFormOpen}
          onClose={operations.closeForm}
          onSubmit={operations.handleFormSubmit}
          project={operations.editingProject || undefined}
          isSubmitting={operations.isSubmitting}
          error={operations.formError}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={operations.deleteDialog.isOpen}
          onOpenChange={(open) => !open && operations.closeDeleteDialog()}
          onConfirm={handleDeleteProject}
          title="Delete Project"
          description={
            operations.deleteDialog.project
              ? `Are you sure you want to delete "${operations.deleteDialog.project.name}"? This action cannot be undone and will also delete all tasks in this project.`
              : ''
          }
          confirmText="Delete"
          cancelText="Cancel"
          destructive={true}
          loading={operations.isDeleting}
        />

        {/* Project Sharing Dialog */}
        {operations.sharingProject && (
          <ProjectSharingDialog
            isOpen={operations.isSharingDialogOpen}
            onClose={operations.closeSharingDialog}
            project={operations.sharingProject}
            onInviteUser={operations.handleInviteUser}
            onRemoveMember={operations.handleRemoveMember}
            isInviting={operations.isInvitingUser}
            error={operations.sharingError}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;