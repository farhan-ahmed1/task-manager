import { useMemo } from 'react';
import type { ProjectLayoutConfig, EmptyStateConfig } from '@/types/layout';
import { DEFAULT_EMPTY_STATES } from '@/types/layout';
import type { Project } from '@/types/api';

/**
 * Hook to generate layout configuration
 * Makes it easy to create consistent layout configs across the app
 */
export const useLayoutConfig = (
  title: string,
  options?: {
    icon?: React.ReactNode;
    emptyState?: EmptyStateConfig | keyof typeof DEFAULT_EMPTY_STATES;
  }
): ProjectLayoutConfig => {
  return useMemo(() => {
    const emptyState = options?.emptyState
      ? typeof options.emptyState === 'string'
        ? DEFAULT_EMPTY_STATES[options.emptyState]
        : options.emptyState
      : DEFAULT_EMPTY_STATES.inbox;

    return {
      title,
      icon: options?.icon,
      emptyState,
    };
  }, [title, options?.icon, options?.emptyState]);
};

/**
 * Hook for project-specific layout configuration
 */
export const useProjectLayoutConfig = (
  project: Project | null | undefined,
  fallbackTitle: string = 'Project'
): ProjectLayoutConfig => {
  return useMemo(() => ({
    title: project?.name || fallbackTitle,
    emptyState: DEFAULT_EMPTY_STATES.project,
  }), [project?.name, fallbackTitle]);
};
