import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Calendar,
  Flag,
  FolderOpen,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Task, Project } from '@/types/api';
import {
  formatDate,
  isTaskOverdue
} from '@/lib/taskUtils';

interface TaskDetailsModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onPreviousTask?: () => void;
  onNextTask?: () => void;
  hasPreviousTask?: boolean;
  hasNextTask?: boolean;
  project?: Project | null;
}

interface ModalState {
  isEditing: boolean;
  editedTitle: string;
  editedDescription: string;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onPreviousTask,
  onNextTask,
  hasPreviousTask = false,
  hasNextTask = false,
  project
}) => {
  const [modalState, setModalState] = useState<ModalState>({
    isEditing: false,
    editedTitle: '',
    editedDescription: ''
  });
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Initialize modal state when task changes
  useEffect(() => {
    if (task) {
      setModalState({
        isEditing: false,
        editedTitle: task.title,
        editedDescription: task.description || ''
      });
    }
  }, [task]);

  const handleCancelEdit = useCallback(() => {
    if (!task) return;
    
    setModalState({
      isEditing: false,
      editedTitle: task.title,
      editedDescription: task.description || ''
    });
  }, [task]);

  // Custom keyboard navigation (Arrow keys for navigation)
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape is handled by Radix Dialog automatically
      if (e.key === 'ArrowLeft' && hasPreviousTask && onPreviousTask && !modalState.isEditing) {
        e.preventDefault();
        onPreviousTask();
      } else if (e.key === 'ArrowRight' && hasNextTask && onNextTask && !modalState.isEditing) {
        e.preventDefault();
        onNextTask();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, modalState.isEditing, hasPreviousTask, hasNextTask, onPreviousTask, onNextTask]);

  const handleCompleteToggle = () => {
    if (!task) return;
    const updatedTask = {
      ...task,
      status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
    } as Task;
    onEdit(updatedTask);
  };

  const handleTitleEdit = () => {
    setModalState(prev => ({ ...prev, isEditing: true }));
    setTimeout(() => titleRef.current?.focus(), 0);
  };

  const handleDescriptionEdit = () => {
    setModalState(prev => ({ ...prev, isEditing: true }));
    setTimeout(() => descriptionRef.current?.focus(), 0);
  };

  const handleSaveEdit = () => {
    if (!task) return;
    
    const updatedTask = {
      ...task,
      title: modalState.editedTitle.trim() || task.title,
      description: modalState.editedDescription.trim() || undefined
    };
    
    onEdit(updatedTask);
    setModalState(prev => ({ ...prev, isEditing: false }));
  };

  const handleKeyDownInEdit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  if (!task) return null;

  const isOverdue = isTaskOverdue(task.due_date);
  const projectName = project?.name || 'Inbox';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        {/* Custom Header with Navigation */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          {/* Left: Breadcrumb */}
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-gray-500" />
            <button 
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              {projectName}
            </button>
          </div>

          {/* Center: Task Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreviousTask}
              disabled={!hasPreviousTask}
              aria-label="Previous task"
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextTask}
              disabled={!hasNextTask}
              aria-label="Next task"
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  Edit task
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(task)}
                  className="text-red-600 focus:text-red-600"
                >
                  Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Body - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-0 max-h-[calc(90vh-80px)] overflow-hidden">
          {/* Main Content Column */}
          <main className="p-6 overflow-y-auto">
            {/* Task Overview Card */}
            <div className="mb-8">
              <div className="flex items-start gap-4">
                {/* Complete Checkbox */}
                <button
                  role="checkbox"
                  aria-checked={task.status === 'COMPLETED'}
                  onClick={handleCompleteToggle}
                  className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    task.status === 'COMPLETED'
                      ? 'bg-green-500 border-green-500 text-white shadow-md'
                      : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                  }`}
                  aria-label={task.status === 'COMPLETED' ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {task.status === 'COMPLETED' && <Check className="h-3 w-3" />}
                </button>

                <div className="flex-1 min-w-0">
                  {/* Editable Title */}
                  {modalState.isEditing ? (
                    <textarea
                      ref={titleRef}
                      value={modalState.editedTitle}
                      onChange={(e) => {
                        setModalState(prev => ({ ...prev, editedTitle: e.target.value }));
                        // Auto-resize textarea
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onKeyDown={handleKeyDownInEdit}
                      onBlur={handleSaveEdit}
                      className="w-full text-2xl font-semibold text-gray-900 bg-transparent border-none outline-none resize-none overflow-hidden"
                      rows={1}
                      style={{ minHeight: '2.5rem' }}
                    />
                  ) : (
                    <button
                      onClick={handleTitleEdit}
                      className="w-full text-left text-2xl font-semibold text-gray-900 hover:bg-gray-50 rounded p-2 -m-2 transition-colors"
                      aria-label="Activate to edit the task name"
                    >
                      {task.title}
                    </button>
                  )}

                  {/* Editable Description */}
                  <div className="mt-4">
                    {modalState.isEditing ? (
                      <textarea
                        ref={descriptionRef}
                        value={modalState.editedDescription}
                        onChange={(e) => {
                          setModalState(prev => ({ ...prev, editedDescription: e.target.value }));
                          // Auto-resize textarea
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onKeyDown={handleKeyDownInEdit}
                        onBlur={handleSaveEdit}
                        placeholder="Add description..."
                        className="w-full text-base text-gray-700 bg-transparent border-none outline-none resize-none overflow-hidden"
                        rows={3}
                      />
                    ) : (
                      <button
                        onClick={handleDescriptionEdit}
                        className="w-full text-left text-base text-gray-700 hover:bg-gray-50 rounded p-2 -m-2 transition-colors min-h-[4rem]"
                        aria-label="Activate to edit the description"
                      >
                        {task.description || 'Add description...'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Sidebar Column */}
          <aside className="bg-gray-50 p-6 border-l border-gray-200 overflow-y-auto">
            <div className="space-y-6">
              {/* Status */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Status
                </h3>
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Priority */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Priority
                </h3>
                <div className="flex items-center gap-2">
                  <Flag className={`h-4 w-4 ${
                    task.priority === 'HIGH' ? 'text-red-500' :
                    task.priority === 'MEDIUM' ? 'text-orange-500' :
                    'text-green-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-900">
                    {task.priority}
                  </span>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Due Date
                </h3>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className={`text-sm font-medium ${
                    isOverdue ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {task.due_date ? formatDate(task.due_date) : 'No due date'}
                  </span>
                </div>
              </div>

              {/* Timestamps */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Created: {formatDate(task.created_at)}</p>
                  <p>Updated: {formatDate(task.updated_at)}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;
