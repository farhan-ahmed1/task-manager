/**
 * Configuration types for layout components
 * This reduces prop drilling by grouping related configuration into objects
 */

export interface EmptyStateConfig {
  title: string;
  description: string;
  buttonText: string;
  icon?: React.ReactNode;
}

export interface ProjectLayoutConfig {
  title: string;
  icon?: React.ReactNode;
  emptyState: EmptyStateConfig;
}

/**
 * Default configurations for common layout scenarios
 */
export const DEFAULT_EMPTY_STATES = {
  inbox: {
    title: 'Your inbox is empty',
    description: 'Add your first task to get started with organizing your work.',
    buttonText: 'Add your first task',
  },
  project: {
    title: 'This project is empty',
    description: 'Add your first task to start organizing work in this project.',
    buttonText: 'Add your first task',
  },
  completed: {
    title: 'No completed tasks',
    description: 'Complete some tasks to see them here.',
    buttonText: 'View all tasks',
  },
  today: {
    title: 'No tasks for today',
    description: 'Add tasks with today\'s date to see them here.',
    buttonText: 'Add a task',
  },
  upcoming: {
    title: 'No upcoming tasks',
    description: 'Add tasks with future dates to see them here.',
    buttonText: 'Add a task',
  },
} as const;
