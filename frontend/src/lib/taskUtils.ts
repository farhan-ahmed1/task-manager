import type { Task, TaskStatus, TaskPriority } from '@/types/api';

// Format date helper
export const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
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

// Get relative time (e.g., "2 hours ago")
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
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};

// Get task status color
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

// Get task priority color
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

// Check if task is overdue
export const isTaskOverdue = (dueDate?: string): boolean => {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  return due < now;
};

// Sort tasks by different criteria
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

// Filter tasks based on criteria
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

// Get task statistics
export const getTaskStats = (tasks: Task[]) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const pending = tasks.filter(t => t.status === 'PENDING').length;
  const overdue = tasks.filter(t => isTaskOverdue(t.due_date)).length;
  
  return {
    total,
    completed,
    inProgress,
    pending,
    overdue,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  };
};