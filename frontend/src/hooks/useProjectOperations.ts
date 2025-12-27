import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateProject, useUpdateProject, useDeleteProject } from './useProjects';
import { useCreateTask, useUpdateTask } from './useTasks';
import { projectService } from '@/services/projects';
import type { Project, CreateProjectRequest, UpdateProjectRequest, Task, CreateTaskRequest } from '@/types/api';
import type { CreateTaskFormData } from '@/validation/task';

/**
 * Custom hook to manage all project-related operations
 * Encapsulates CRUD operations, sharing, and navigation logic
 */
export function useProjectOperations() {
  const navigate = useNavigate();
  
  // React Query mutations
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  // UI state for forms and dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [deleteDialog, setDeleteDialog] = useState<{ 
    isOpen: boolean; 
    project: Project | null 
  }>({
    isOpen: false,
    project: null,
  });

  // Task form state
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormProjectId, setTaskFormProjectId] = useState<string | undefined>();
  const [taskFormError, setTaskFormError] = useState<string | null>(null);

  // Sharing state
  const [sharingProject, setSharingProject] = useState<Project | null>(null);
  const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false);
  const [isInvitingUser, setIsInvitingUser] = useState(false);
  const [sharingError, setSharingError] = useState<string | null>(null);

  // Project CRUD operations
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
      await updateProjectMutation.mutateAsync({ 
        id: editingProject.id, 
        updates: data 
      });
      setIsFormOpen(false);
      setEditingProject(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update project');
    }
  };

  const handleDeleteProject = async (project: Project, selectedProjectId?: string) => {
    try {
      await deleteProjectMutation.mutateAsync(project.id);
      setDeleteDialog({ isOpen: false, project: null });
      return selectedProjectId === project.id; // Return true if deleted project was selected
    } catch (err: unknown) {
      console.error('Failed to delete project:', err);
      setDeleteDialog({ isOpen: false, project: null });
      return false;
    }
  };

  const handleFormSubmit = async (data: CreateProjectRequest | UpdateProjectRequest) => {
    if (editingProject) {
      await handleUpdateProject(data);
    } else {
      await handleCreateProject(data as CreateProjectRequest);
    }
  };

  const openEditForm = (project: Project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProject(null);
    setFormError(null);
  };

  const openDeleteDialog = (project: Project) => {
    if (!deleteProjectMutation.isPending) {
      setDeleteDialog({ isOpen: true, project });
    }
  };

  const closeDeleteDialog = () => {
    if (!deleteProjectMutation.isPending) {
      setDeleteDialog({ isOpen: false, project: null });
    }
  };

  // Task operations
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
      } else {
        const taskData: CreateTaskRequest = {
          title: data.title,
          description: data.description || undefined,
          status: data.status || 'PENDING',
          priority: data.priority || 'MEDIUM',
          due_date: data.due_date || undefined,
          project_id: data.project_id || undefined,
        };
        await createTaskMutation.mutateAsync(taskData);
      }
      setIsTaskFormOpen(false);
      setEditingTask(null);
      setTaskFormProjectId(undefined);
    } catch (error) {
      console.error('Task operation failed:', error);
      setTaskFormError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again.'
      );
    }
  };

  const closeTaskForm = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
    setTaskFormProjectId(undefined);
    setTaskFormError(null);
  };

  // Sharing operations
  const openSharingDialog = (project: Project) => {
    setSharingProject(project);
    setSharingError(null);
    setIsSharingDialogOpen(true);
  };

  const closeSharingDialog = () => {
    setIsSharingDialogOpen(false);
    setSharingProject(null);
    setSharingError(null);
  };

  const handleInviteUser = async (email: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER') => {
    if (!sharingProject) return;
    setIsInvitingUser(true);
    setSharingError(null);
    try {
      const result = await projectService.inviteUserToProject(
        sharingProject.id, 
        email, 
        role
      );
      if (!result.success) {
        setSharingError(result.error.message);
      }
    } catch {
      setSharingError('Failed to invite user');
    } finally {
      setIsInvitingUser(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!sharingProject) return;
    try {
      const result = await projectService.removeProjectMember(
        sharingProject.id, 
        userId
      );
      if (!result.success) {
        setSharingError(result.error.message);
      }
    } catch {
      setSharingError('Failed to remove member');
    }
  };

  // Navigation
  const navigateToProject = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  return {
    // Project form state
    isFormOpen,
    editingProject,
    formError,
    isSubmitting: createProjectMutation.isPending || updateProjectMutation.isPending,
    
    // Project form actions
    openCreateForm,
    openEditForm,
    closeForm,
    handleFormSubmit,
    
    // Delete dialog state
    deleteDialog,
    isDeleting: deleteProjectMutation.isPending,
    
    // Delete dialog actions
    openDeleteDialog,
    closeDeleteDialog,
    handleDeleteProject,
    
    // Task form state
    isTaskFormOpen,
    editingTask,
    taskFormProjectId,
    taskFormError,
    isTaskSubmitting: createTaskMutation.isPending || updateTaskMutation.isPending,
    
    // Task form actions
    handleCreateTask,
    handleEditTask,
    handleTaskFormSubmit,
    closeTaskForm,
    
    // Sharing state
    sharingProject,
    isSharingDialogOpen,
    isInvitingUser,
    sharingError,
    
    // Sharing actions
    openSharingDialog,
    closeSharingDialog,
    handleInviteUser,
    handleRemoveMember,
    
    // Navigation
    navigateToProject,
  };
}
