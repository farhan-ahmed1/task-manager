import React, { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/page-title';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import TaskFilters from './TaskFilters';
import TaskDetailsModal from './TaskDetailsModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { filterTasks, sortTasks, getTaskStats } from '@/lib/taskUtils';
import type { Task, TaskStatus, TaskPriority } from '@/types/api';
import type { CreateTaskFormData, UpdateTaskFormData } from '@/validation/task';

const TaskList: React.FC = () => {
  // React Query hooks - single source of truth
  const { data: allTasks = [], isLoading } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  
  // UI state only
  const [error, setError] = useState<string | null>(null);
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

  // Handle task creation
  const handleCreateTask = async (data: CreateTaskFormData) => {
    setFormLoading(true);
    try {
      await createTaskMutation.mutateAsync({
        ...data,
        due_date: data.due_date || undefined
      });
      setShowTaskForm(false);
    } catch {
      setError('Failed to create task');
      throw new Error('Failed to create task');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle task update
  const handleUpdateTask = async (data: UpdateTaskFormData) => {
    if (!editingTask) return;
    
    setFormLoading(true);
    try {
      await updateTaskMutation.mutateAsync({
        id: editingTask.id,
        updates: {
          ...data,
          due_date: data.due_date || undefined
        }
      });
      setEditingTask(null);
      setShowTaskForm(false);
    } catch {
      setError('Failed to update task');
      throw new Error('Failed to update task');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle task status change
  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        updates: { status: newStatus }
      });
    } catch {
      setError('Failed to update task');
    }
  };

  // Handle task deletion
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    setDeleteLoading(true);
    try {
      await deleteTaskMutation.mutateAsync(taskToDelete.id);
      setTaskToDelete(null);
      setShowDeleteDialog(false);
    } catch {
      setError('Failed to delete task');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = React.useMemo(() => {
    const filtered = filterTasks(allTasks, {
      search,
      status: statusFilter,
      priority: priorityFilter
    });
    
    return sortTasks(filtered, sortBy, sortOrder);
  }, [allTasks, search, statusFilter, priorityFilter, sortBy, sortOrder]);

  // Task statistics
  const stats = getTaskStats(allTasks);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 shadow-lg">
            <Spinner size="lg" text="Loading your tasks..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-error">
          <AlertCircle className="w-5 h-5 icon-status-error" strokeWidth={2.5} />
          <AlertDescription>
            {error}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-2 h-auto p-0 text-xs underline hover:no-underline"
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
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <svg className="w-6 h-6 text-white icon-enhanced" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <SectionTitle className="mb-1">Task Management</SectionTitle>
                <p style={{ color: 'var(--text-secondary)' }}>Stay organized and productive</p>
              </div>
            </div>
            
            {/* Enhanced Stats Cards */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-200/60 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-400"></div>
                  <span className="text-sm font-medium text-slate-700">{stats.total} Total</span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-200/60 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-success"></div>
                  <span className="text-sm font-medium text-slate-700">{stats.completed} Completed</span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-200/60 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-info"></div>
                  <span className="text-sm font-medium text-slate-700">{stats.inProgress} In Progress</span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-200/60 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-warning"></div>
                  <span className="text-sm font-medium text-slate-700">{stats.pending} Pending</span>
                </div>
              </div>
              {stats.overdue > 0 && (
                <div className="bg-error-light/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-error/60 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-error animate-pulse"></div>
                    <span className="text-sm font-medium text-error">{stats.overdue} Overdue</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            onClick={() => setShowTaskForm(true)}
            size="lg"
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 button-with-icon"
          >
            <Plus className="w-5 h-5 mr-2 icon-enhanced icon-hover" strokeWidth={2.5} />
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
        <EmptyState
          icon={ListTodo}
          title={allTasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
          description={
            allTasks.length === 0 
              ? 'Ready to get productive? Create your first task and start organizing your work.'
              : 'Try adjusting your search terms or filter criteria to find what you\'re looking for.'
          }
          action={allTasks.length === 0 ? {
            label: "Create Your First Task",
            onClick: () => setShowTaskForm(true),
            icon: Plus
          } : undefined}
          iconSize="lg"
          card
        />
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