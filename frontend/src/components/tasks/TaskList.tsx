import React, { useState, useEffect, useCallback } from 'react';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import TaskFilters from './TaskFilters';
import TaskDetailDialog from './TaskDetailDialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import { taskService, TaskServiceError } from '@/services/tasks';
import { filterTasks, sortTasks, getTaskStats } from '@/lib/taskUtils';
import type { Task, TaskStatus, TaskPriority } from '@/types/api';
import type { CreateTaskFormData, UpdateTaskFormData } from '@/validation/task';

const TaskList: React.FC = () => {
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Detail dialog state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Delete confirmation state
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Filter and sort states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | undefined>();
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'due_date' | 'title' | 'priority'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load tasks
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await taskService.getTasks();
      if (result.success) {
        setTasks(result.data);
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Handle task creation
  const handleCreateTask = async (data: CreateTaskFormData) => {
    try {
      setFormLoading(true);
      
      const result = await taskService.createTask({
        ...data,
        due_date: data.due_date || undefined
      });
      
      if (result.success) {
        setTasks(prev => [result.data, ...prev]);
        setShowTaskForm(false);
      } else {
        throw new Error(result.error.message);
      }
    } catch (err) {
      const message = err instanceof TaskServiceError ? err.message : 'Failed to create task';
      setError(message);
      throw err; // Re-throw to prevent form from closing
    } finally {
      setFormLoading(false);
    }
  };

  // Handle task update
  const handleUpdateTask = async (data: UpdateTaskFormData) => {
    if (!editingTask) return;
    
    try {
      setFormLoading(true);
      
      const result = await taskService.updateTask(editingTask.id, {
        ...data,
        due_date: data.due_date || undefined
      });
      
      if (result.success) {
        setTasks(prev => prev.map(task => 
          task.id === editingTask.id ? result.data : task
        ));
        setEditingTask(null);
        setShowTaskForm(false);
      } else {
        throw new Error(result.error.message);
      }
    } catch (err) {
      const message = err instanceof TaskServiceError ? err.message : 'Failed to update task';
      setError(message);
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  // Handle task status change
  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      const result = await taskService.updateTask(task.id, { status: newStatus });
      
      if (result.success) {
        setTasks(prev => prev.map(t => 
          t.id === task.id ? result.data : t
        ));
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      const message = err instanceof TaskServiceError ? err.message : 'Failed to update task';
      setError(message);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async () => {
    if (!taskToDelete || deleteLoading) return;
    
    const taskId = taskToDelete.id;
    
    try {
      setDeleteLoading(true);
      
      // Optimistic update - remove task from UI immediately
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      const result = await taskService.deleteTask(taskId);
      
      if (result.success) {
        // Task already removed optimistically, just clean up
        setTaskToDelete(null);
        setShowDeleteDialog(false);
      } else {
        // Handle different error types
        if (result.error.code === 'TASK_NOT_FOUND') {
          // Task was already deleted (404), don't restore it
          setTaskToDelete(null);
          setShowDeleteDialog(false);
          // Optionally show a brief success message since the task is gone
        } else {
          // For other errors, restore the task
          setTasks(prev => {
            // Only restore if the task isn't already in the list
            const exists = prev.some(task => task.id === taskId);
            if (!exists && taskToDelete) {
              return [...prev, taskToDelete].sort((a, b) => 
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
              );
            }
            return prev;
          });
          setError(result.error.message);
        }
      }
    } catch (err) {
      // Restore task if request failed (network error, etc.)
      setTasks(prev => {
        const exists = prev.some(task => task.id === taskId);
        if (!exists && taskToDelete) {
          return [...prev, taskToDelete].sort((a, b) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        }
        return prev;
      });
      const message = err instanceof TaskServiceError ? err.message : 'Failed to delete task';
      setError(message);
    } finally {
      setDeleteLoading(false);
      // Always clean up the dialog state
      setTaskToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = React.useMemo(() => {
    const filtered = filterTasks(tasks, {
      search,
      status: statusFilter,
      priority: priorityFilter
    });
    
    return sortTasks(filtered, sortBy, sortOrder);
  }, [tasks, search, statusFilter, priorityFilter, sortBy, sortOrder]);

  // Task statistics
  const stats = getTaskStats(tasks);

  // Handle opening task form for editing
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  // Handle opening task detail dialog
  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowDetailDialog(true);
  };

  // Handle delete confirmation
  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteDialog(true);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter(undefined);
    setPriorityFilter(undefined);
  };

  // Handle sort change
  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy as typeof sortBy);
    setSortOrder(newSortOrder);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-2 h-auto p-0 text-xs underline"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-600">
            {stats.total} total • {stats.completed} completed • 
            {stats.inProgress} in progress • {stats.pending} pending
            {stats.overdue > 0 && ` • ${stats.overdue} overdue`}
          </p>
        </div>
        
        <Button onClick={() => setShowTaskForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        priority={priorityFilter}
        onPriorityChange={setPriorityFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
      />

      {/* Task Grid */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {tasks.length === 0 
                ? 'Get started by creating your first task.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {tasks.length === 0 && (
              <Button onClick={() => setShowTaskForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Task
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteClick}
              onView={handleViewTask}
              onStatusChange={handleStatusChange}
              isDeleting={deleteLoading && taskToDelete?.id === task.id}
            />
          ))}
        </div>
      )}

      {/* Task Form Dialog */}
      <TaskForm
        open={showTaskForm}
        onOpenChange={(open) => {
          setShowTaskForm(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask || undefined}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        loading={formLoading}
      />

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onEdit={handleEditTask}
        onDelete={handleDeleteClick}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Task"
        description={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        onConfirm={handleDeleteTask}
        loading={deleteLoading}
      />
    </div>
  );
};

export default TaskList;