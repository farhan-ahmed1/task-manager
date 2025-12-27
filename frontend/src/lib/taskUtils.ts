import type { Task, TaskStatus, TaskPriority } from '@/types/api';

/**
 * ============================================================================
 * DATE FORMATTING UTILITIES
 * ============================================================================
 * Centralized date formatting functions to ensure consistency across the app.
 * All date formatting should use these utilities instead of local implementations.
 */

/**
 * Normalizes a date to midnight (00:00:00) for date-only comparisons.
 * Useful when comparing dates without considering time.
 * 
 * @param date - The date to normalize
 * @returns A new Date object set to midnight
 */
const getDateOnly = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

/**
 * Formats a date string for display with smart relative formatting.
 * 
 * Rules:
 * - Shows "Today" or "Yesterday/Tomorrow" for dates within 1 day
 * - Shows day of week for dates within 7 days
 * - Shows "Month Day" for dates within current year
 * - Shows "Month Day, Year" for dates in other years
 * 
 * @param dateString - ISO date string to format
 * @returns Formatted date string, or empty string if invalid
 * 
 * @example
 * formatDate('2024-12-26') // "Today" (if today is 2024-12-26)
 * formatDate('2024-12-27') // "Tomorrow" 
 * formatDate('2024-12-30') // "Monday"
 * formatDate('2024-11-15') // "Nov 15"
 * formatDate('2023-06-20') // "Jun 20, 2023"
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const dateOnly = getDateOnly(date);
  const todayOnly = getDateOnly(now);
  
  const diffTime = Math.abs(dateOnly.getTime() - todayOnly.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return date < now ? 'Yesterday' : 'Tomorrow';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Formats a due date with overdue detection.
 * Similar to formatDate but adds "Overdue" for past due dates.
 * 
 * @param dateString - ISO date string to format
 * @returns Formatted date string with overdue indicator
 * 
 * @example
 * formatDueDate('2024-12-26') // "Today"
 * formatDueDate('2024-12-25') // "Overdue" (if today is 2024-12-26)
 * formatDueDate('2024-12-27') // "Tomorrow"
 */
export const formatDueDate = (dateString?: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const today = new Date();
  const dateOnly = getDateOnly(date);
  const todayOnly = getDateOnly(today);
  
  // Check if overdue (before today, excluding today)
  if (dateOnly < todayOnly) {
    return 'Overdue';
  }
  
  // Check for today
  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Today';
  }
  
  // Check for tomorrow
  const tomorrow = new Date(todayOnly);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateOnly.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  }
  
  // Show day of week for this week
  const daysDiff = Math.ceil((dateOnly.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  
  // Show date for further dates
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Formats a date for the upcoming page with extended formatting.
 * Shows more detailed information for dates within the week.
 * 
 * @param dateString - ISO date string to format
 * @returns Formatted date string
 * 
 * @example
 * formatUpcomingDate('2024-12-27') // "Tomorrow"
 * formatUpcomingDate('2024-12-30') // "Monday"
 * formatUpcomingDate('2025-01-15') // "Wednesday, January 15"
 */
export const formatUpcomingDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const dateOnly = getDateOnly(date);
  const todayOnly = getDateOnly(today);
  
  const tomorrow = new Date(todayOnly);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const diffDays = Math.floor((dateOnly.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
};

/**
 * Formats a date as a simple calendar date.
 * Always shows: "Month Day, Year"
 * 
 * @param dateString - ISO date string to format
 * @returns Formatted date string
 * 
 * @example
 * formatSimpleDate('2024-12-26') // "Dec 26, 2024"
 */
export const formatSimpleDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Gets relative time from now (e.g., "2 hours ago", "Just now").
 * Used for activity feeds and timestamps.
 * 
 * @param dateString - ISO date string
 * @returns Relative time string
 * 
 * @example
 * getRelativeTime('2024-12-26T10:00:00') // "2h ago" (if current time is 12:00)
 * getRelativeTime('2024-12-26T11:59:00') // "Just now" (if current time is 12:00)
 * getRelativeTime('2024-12-25T12:00:00') // "Yesterday"
 */
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};

/**
 * ============================================================================
 * TASK UTILITY FUNCTIONS
 * ============================================================================
 */

/**
 * Checks if a date is overdue (before today at midnight).
 * 
 * @param dueDate - Optional ISO date string
 * @returns true if the date is in the past, false otherwise
 */
export const isDateOverdue = (dueDate?: string): boolean => {
  if (!dueDate) return false;
  
  const date = new Date(dueDate);
  if (isNaN(date.getTime())) return false;
  
  const dateOnly = getDateOnly(date);
  const todayOnly = getDateOnly(new Date());
  
  return dateOnly < todayOnly;
};

/**
 * Gets Tailwind CSS classes for task status badges.
 * Returns background, text, and border color classes.
 * 
 * @param status - Task status
 * @returns Tailwind class string
 */
export const getTaskStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-warning-light text-warning border-warning';
    case 'IN_PROGRESS':
      return 'bg-info-light text-info border-info';
    case 'COMPLETED':
      return 'bg-success-light text-success border-success';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

/**
 * Gets Tailwind CSS classes for task priority badges.
 * Returns background, text, and border color classes.
 * 
 * @param priority - Task priority
 * @returns Tailwind class string
 */
export const getTaskPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case 'HIGH':
      return 'bg-error-light text-error border-error';
    case 'MEDIUM':
      return 'bg-warning-light text-warning border-warning';
    case 'LOW':
      return 'bg-success-light text-success border-success';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

/**
 * @deprecated Use isDateOverdue instead for better date-only comparison
 */
export const isTaskOverdue = (dueDate?: string): boolean => {
  return isDateOverdue(dueDate);
};

/**
 * Sorts an array of tasks by various criteria.
 * 
 * @param tasks - Array of tasks to sort
 * @param sortBy - Sort criterion
 * @param sortOrder - Sort direction (ascending or descending)
 * @returns New sorted array (original array is not modified)
 */
export const sortTasks = (
  tasks: Task[], 
  sortBy: 'created_at' | 'updated_at' | 'due_date' | 'title' | 'priority',
  sortOrder: 'asc' | 'desc' = 'desc'
): Task[] => {
  return [...tasks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'priority': {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      }
      case 'due_date': {
        const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        comparison = aDate - bDate;
        break;
      }
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'updated_at':
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

/**
 * Filters tasks based on multiple criteria.
 * All filters are AND'd together (task must match all provided filters).
 * 
 * @param tasks - Array of tasks to filter
 * @param filters - Filter criteria object
 * @returns Filtered array of tasks
 */
export const filterTasks = (
  tasks: Task[],
  filters: {
    search?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    project_id?: string;
  }
): Task[] => {
  return tasks.filter((task) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        task.title.toLowerCase().includes(searchLower) ||
        (task.description?.toLowerCase().includes(searchLower) ?? false);
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (filters.status && task.status !== filters.status) {
      return false;
    }
    
    // Priority filter
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }
    
    // Project filter
    if (filters.project_id && task.project_id !== filters.project_id) {
      return false;
    }
    
    return true;
  });
};

/**
 * Calculates statistics for an array of tasks.
 * 
 * @param tasks - Array of tasks to analyze
 * @returns Object containing task counts and completion rate
 */
export const getTaskStats = (tasks: Task[]) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const pending = tasks.filter(t => t.status === 'PENDING').length;
  const overdue = tasks.filter(t => isDateOverdue(t.due_date)).length;
  
  return {
    total,
    completed,
    inProgress,
    pending,
    overdue,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  };
};