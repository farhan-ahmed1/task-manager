import React, { useState, useEffect, useCallback } from 'react';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import TaskFilters from './TaskFilters';
import TaskDetailsModal from './TaskDetailsModal';
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

  // Handle task navigation in modal
  const handlePreviousTask = () => {
    if (!selectedTask) return;
    
    const currentIndex = filteredAndSortedTasks.findIndex((t: Task) => t.id === selectedTask.id);
    if (currentIndex > 0) {
      setSelectedTask(filteredAndSortedTasks[currentIndex - 1]);
    }
  };

  const handleNextTask = () => {
    if (!selectedTask) return;
    
    const currentIndex = filteredAndSortedTasks.findIndex((t: Task) => t.id === selectedTask.id);
    if (currentIndex < filteredAndSortedTasks.length - 1) {
      setSelectedTask(filteredAndSortedTasks[currentIndex + 1]);
    }
  };

  const getNavigationState = () => {
    if (!selectedTask) return { hasPrevious: false, hasNext: false };
    
    const currentIndex = filteredAndSortedTasks.findIndex((t: Task) => t.id === selectedTask.id);
    return {
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex < filteredAndSortedTasks.length - 1
    };
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 shadow-lg">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-slate-900 mb-1">Loading your tasks</h3>
                <p className="text-sm text-slate-600">Getting everything ready for you...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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

      {/* Header with Enhanced Stats */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Task Management</h1>
                <p className="text-slate-600">Stay organized and productive</p>
              </div>
            </div>
            
            {/* Enhanced Stats Cards */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                  <span className="text-sm font-medium text-slate-700">{stats.total} Total</span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-slate-700">{stats.completed} Completed</span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-slate-700">{stats.inProgress} In Progress</span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                  <span className="text-sm font-medium text-slate-700">{stats.pending} Pending</span>
                </div>
              </div>
              {stats.overdue > 0 && (
                <div className="bg-red-50/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-red-200/60">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-red-700">{stats.overdue} Overdue</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            onClick={() => setShowTaskForm(true)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Task
          </Button>
        </div>
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
        <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200/60">
          <div className="max-w-md mx-auto">
            <div className="text-slate-400 mb-6">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              {tasks.length === 0 
                ? 'Ready to get productive? Create your first task and start organizing your work.'
                : 'Try adjusting your search terms or filter criteria to find what you\'re looking for.'
              }
            </p>
            {tasks.length === 0 && (
              <Button 
                onClick={() => setShowTaskForm(true)}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Task
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
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

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={selectedTask}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onEdit={handleEditTask}
        onDelete={handleDeleteClick}
        onPreviousTask={handlePreviousTask}
        onNextTask={handleNextTask}
        hasPreviousTask={getNavigationState().hasPrevious}
        hasNextTask={getNavigationState().hasNext}
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