import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/tasks';
import type { Task, CreateTaskRequest, UpdateTaskRequest, TaskStatus } from '@/types/api';

// Query keys for cache management
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: { project_id?: string; status?: TaskStatus }) => 
    [...taskKeys.lists(), filters] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch all tasks with optional filters
 */
export function useTasks(filters?: { project_id?: string; status?: TaskStatus }) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: async () => {
      const result = await taskService.getTasks(filters);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 1000 * 30, // Consider data fresh for 30 seconds
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes (formerly cacheTime)
  });
}

/**
 * Hook to fetch a single task by ID
 */
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const result = await taskService.getTask(id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!id, // Only run query if ID exists
  });
}

/**
 * Hook to create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: CreateTaskRequest) => {
      const result = await taskService.createTask(taskData);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (newTask) => {
      // Invalidate all task lists to refetch with the new task
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      
      // Optionally add the new task to cache optimistically
      queryClient.setQueryData<Task>(taskKeys.detail(newTask.id), newTask);
    },
  });
}

/**
 * Hook to update an existing task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTaskRequest }) => {
      const result = await taskService.updateTask(id, updates);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });

      // Snapshot the previous value
      const previousTask = queryClient.getQueryData<Task>(taskKeys.detail(id));

      // Optimistically update the cache
      if (previousTask) {
        queryClient.setQueryData<Task>(taskKeys.detail(id), {
          ...previousTask,
          ...updates,
        });
      }

      // Return context with previous value
      return { previousTask };
    },
    onError: (_error, { id }, context) => {
      // Rollback to previous value on error
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(id), context.previousTask);
      }
    },
    onSuccess: (updatedTask) => {
      // Update the detail cache
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      
      // Invalidate lists to show the updated task
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

/**
 * Hook to delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await taskService.deleteTask(id);
      if (!result.success) {
        throw result.error;
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(deletedId) });
      
      // Invalidate lists to refetch without the deleted task
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
