import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sectionService } from '@/services/sections';
import type { Section, CreateSectionRequest, UpdateSectionRequest } from '@/types/api';

// Query keys for cache management
export const sectionKeys = {
  all: ['sections'] as const,
  lists: () => [...sectionKeys.all, 'list'] as const,
  list: (projectId?: string) => [...sectionKeys.lists(), { projectId }] as const,
  detail: (id: string) => [...sectionKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch sections for a project
 */
export function useSections(projectId?: string) {
  return useQuery({
    queryKey: sectionKeys.list(projectId),
    queryFn: async () => {
      const result = await sectionService.getSections(projectId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!projectId, // Only run query if projectId exists
    staleTime: 1000 * 30, // Consider data fresh for 30 seconds
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
}

/**
 * Hook to fetch a single section by ID
 */
export function useSection(id: string) {
  return useQuery({
    queryKey: sectionKeys.detail(id),
    queryFn: async () => {
      const result = await sectionService.getSection(id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!id, // Only run query if ID exists
  });
}

/**
 * Hook to create a new section
 */
export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sectionData: CreateSectionRequest) => {
      const result = await sectionService.createSection(sectionData);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (newSection) => {
      // Invalidate all section lists to refetch with the new section
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() });
      
      // Add the new section to cache
      queryClient.setQueryData<Section>(sectionKeys.detail(newSection.id), newSection);
    },
  });
}

/**
 * Hook to update an existing section
 */
export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSectionRequest }) => {
      const result = await sectionService.updateSection(id, updates);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: sectionKeys.detail(id) });

      // Snapshot the previous value
      const previousSection = queryClient.getQueryData<Section>(sectionKeys.detail(id));

      // Optimistically update the cache
      if (previousSection) {
        queryClient.setQueryData<Section>(sectionKeys.detail(id), {
          ...previousSection,
          ...updates,
        });
      }

      return { previousSection };
    },
    onError: (_error, { id }, context) => {
      // Rollback to previous value on error
      if (context?.previousSection) {
        queryClient.setQueryData(sectionKeys.detail(id), context.previousSection);
      }
    },
    onSuccess: (updatedSection) => {
      // Update the detail cache
      queryClient.setQueryData(sectionKeys.detail(updatedSection.id), updatedSection);
      
      // Invalidate lists to show the updated section
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() });
    },
  });
}

/**
 * Hook to delete a section
 */
export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await sectionService.deleteSection(id);
      if (!result.success) {
        throw result.error;
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: sectionKeys.detail(deletedId) });
      
      // Invalidate lists to refetch without the deleted section
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() });
    },
  });
}
