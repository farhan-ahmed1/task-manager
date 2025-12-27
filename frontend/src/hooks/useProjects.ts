import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectService } from '@/services/projects';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '@/types/api';

// Query keys for cache management
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: () => [...projectKeys.lists()] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  stats: (id: string) => [...projectKeys.all, 'stats', id] as const,
  members: (id: string) => [...projectKeys.all, 'members', id] as const,
};

/**
 * Hook to fetch all projects
 */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: async () => {
      const result = await projectService.getProjects();
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 1000 * 30, // Consider data fresh for 30 seconds
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
}

/**
 * Hook to fetch a single project by ID
 */
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const result = await projectService.getProject(id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!id, // Only run query if ID exists
  });
}

/**
 * Hook to fetch project statistics
 */
export function useProjectStats(projectId: string) {
  return useQuery({
    queryKey: projectKeys.stats(projectId),
    queryFn: async () => {
      const result = await projectService.getProjectStats(projectId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!projectId,
    staleTime: 1000 * 10, // Consider stats fresh for 10 seconds
  });
}

/**
 * Hook to fetch project members
 */
export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: projectKeys.members(projectId),
    queryFn: async () => {
      const result = await projectService.getProjectMembers(projectId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!projectId,
  });
}

/**
 * Hook to create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectData: CreateProjectRequest) => {
      const result = await projectService.createProject(projectData);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (newProject) => {
      // Invalidate projects list to refetch with the new project
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      // Add the new project to cache
      queryClient.setQueryData<Project>(projectKeys.detail(newProject.id), newProject);
      
      // Show success notification
      toast.success('Project created successfully');
    },
  });
}

/**
 * Hook to update an existing project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateProjectRequest }) => {
      const result = await projectService.updateProject(id, updates);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });

      // Snapshot the previous value
      const previousProject = queryClient.getQueryData<Project>(projectKeys.detail(id));

      // Optimistically update the cache
      if (previousProject) {
        queryClient.setQueryData<Project>(projectKeys.detail(id), {
          ...previousProject,
          ...updates,
        });
      }

      return { previousProject };
    },
    onError: (_error, { id }, context) => {
      // Rollback to previous value on error
      if (context?.previousProject) {
        queryClient.setQueryData(projectKeys.detail(id), context.previousProject);
      }
    },
    onSuccess: (updatedProject) => {
      // Update the detail cache
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
      
      // Invalidate lists to show the updated project
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      // Show success notification
      toast.success('Project updated successfully');
    },
  });
}

/**
 * Hook to delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await projectService.deleteProject(id);
      if (!result.success) {
        throw result.error;
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(deletedId) });
      
      // Invalidate lists to refetch without the deleted project
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      // Show success notification
      toast.success('Project deleted successfully');
    },
  });
}

/**
 * Hook to invite a user to a project
 */
export function useInviteUserToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      email, 
      role = 'MEMBER' 
    }: { 
      projectId: string; 
      email: string; 
      role?: 'ADMIN' | 'MEMBER' | 'VIEWER';
    }) => {
      const result = await projectService.inviteUserToProject(projectId, email, role);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (_, { projectId }) => {
      // Invalidate members list to show the new invitation
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) });
    },
  });
}

/**
 * Hook to remove a project member
 */
export function useRemoveProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      const result = await projectService.removeProjectMember(projectId, userId);
      if (!result.success) {
        throw result.error;
      }
      return { projectId, userId };
    },
    onSuccess: ({ projectId }) => {
      // Invalidate members list
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) });
    },
  });
}

/**
 * Hook to accept a project invitation
 */
export function useAcceptProjectInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const result = await projectService.acceptProjectInvitation(token);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate all projects to refetch with newly joined project
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
