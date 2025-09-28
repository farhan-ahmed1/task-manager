import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Calendar,
  Flag,
  Tag,
  Bell,
  MapPin,
  Plus,
  MessageCircle,
  Paperclip,
  FolderOpen,
  Crown,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [showMoreActions, setShowMoreActions] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

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

  // Focus trap and keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalState.isEditing) {
          handleCancelEdit();
        } else {
          onOpenChange(false);
        }
      } else if (e.key === 'ArrowLeft' && hasPreviousTask && onPreviousTask) {
        onPreviousTask();
      } else if (e.key === 'ArrowRight' && hasNextTask && onNextTask) {
        onNextTask();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, modalState.isEditing, hasPreviousTask, hasNextTask, onPreviousTask, onNextTask, handleCancelEdit, onOpenChange]);

  // Focus management
  useEffect(() => {
    if (open) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }
    } else if (previousFocusRef.current) {
      // Restore focus when modal closes
      previousFocusRef.current.focus();
    }
  }, [open]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMoreActions) {
        setShowMoreActions(false);
      }
    };

    if (showMoreActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreActions]);

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
    } else if (e.key === 'Tab') {
      // Allow tab navigation within the modal
      e.stopPropagation();
    }
  };

  if (!task) return null;

  const isOverdue = isTaskOverdue(task.due_date);
  const projectName = project?.name || 'Inbox';

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => onOpenChange(false)}
        >
          {/* Modal Container */}
          <div 
            ref={modalRef}
            role="dialog"
            aria-label={task.title}
            tabIndex={-1}
            className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden mx-auto animate-in zoom-in-95 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
            data-open={open}
            data-enter={open}
          >
            {/* Header */}
            <header className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
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
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMoreActions(!showMoreActions)}
                    aria-haspopup="menu"
                    aria-expanded={showMoreActions}
                    className="h-8 w-8 p-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  
                  {showMoreActions && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button 
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          onEdit(task);
                          setShowMoreActions(false);
                        }}
                      >
                        Edit task
                      </button>
                      <button 
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => {
                          onDelete(task);
                          setShowMoreActions(false);
                        }}
                      >
                        Delete task
                      </button>
                    </div>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </header>

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
                          placeholder="Description"
                          className="w-full mt-3 text-gray-600 bg-transparent border-none outline-none resize-none"
                          rows={3}
                        />
                      ) : (
                        <button
                          onClick={handleDescriptionEdit}
                          className="w-full text-left mt-3 text-gray-600 hover:bg-gray-50 rounded p-2 -m-2 transition-colors min-h-[2rem]"
                        >
                          {task.description || (
                            <span className="text-gray-400 italic">Description</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add sub-task
                  </Button>
                </div>

                {/* Comments Panel */}
                <div className="space-y-6">
                  {/* Comments Thread */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">Comments</h3>
                    <div className="text-sm text-gray-500">
                      No comments yet. Start the conversation!
                    </div>
                  </div>

                  {/* Comment Composer */}
                  <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      {/* User Avatar */}
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        U
                      </div>
                      
                      <div className="flex-1 flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-gray-600">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Comment
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600">
                          <Paperclip className="h-4 w-4 mr-2" />
                          Attach file
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </main>

              {/* Sidebar Column */}
              <aside className="bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Project */}
                  <fieldset role="group" aria-label="Project">
                    <legend className="text-xs font-medium text-gray-700 mb-2">Project</legend>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 bg-white border border-gray-200 hover:bg-gray-50"
                      aria-haspopup="listbox"
                    >
                      <FolderOpen className="h-4 w-4 mr-2 text-red-500" />
                      <span className="text-sm">{projectName}</span>
                    </Button>
                  </fieldset>

                  <hr className="border-gray-200" />

                  {/* Due Date */}
                  <fieldset role="group" aria-label="Date">
                    <legend className="text-xs font-medium text-gray-700 mb-2">Date</legend>
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-auto p-3 bg-white border border-gray-200 hover:bg-gray-50"
                        aria-haspopup="dialog"
                      >
                        <Calendar className={`h-4 w-4 mr-2 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`} />
                        <span className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                          {task.due_date ? formatDate(task.due_date) : 'No due date'}
                        </span>
                      </Button>
                      {task.due_date && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Clear date
                        </Button>
                      )}
                    </div>
                  </fieldset>

                  <hr className="border-gray-200" />

                  {/* Deadline (Premium/Upsell) */}
                  <fieldset role="group" aria-label="Deadline">
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-auto p-3 bg-white border border-gray-200 hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-700">Deadline</span>
                      </div>
                      <Crown className="h-4 w-4 text-amber-500" />
                    </Button>
                  </fieldset>

                  <hr className="border-gray-200" />

                  {/* Priority */}
                  <fieldset role="group" aria-label="Priority">
                    <legend className="text-xs font-medium text-gray-700 mb-2">Priority</legend>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 bg-white border border-gray-200 hover:bg-gray-50"
                      aria-haspopup="listbox"
                    >
                      <Flag className={`h-4 w-4 mr-2 ${
                        task.priority === 'HIGH' ? 'text-red-500' :
                        task.priority === 'MEDIUM' ? 'text-orange-500' : 'text-green-500'
                      }`} />
                      <span className="text-sm font-medium">
                        P{task.priority === 'HIGH' ? '1' : task.priority === 'MEDIUM' ? '2' : '4'}
                        <span className="ml-1 text-gray-500 font-normal">
                          ({task.priority.toLowerCase()})
                        </span>
                      </span>
                    </Button>
                  </fieldset>

                  <hr className="border-gray-200" />

                  {/* Labels */}
                  <fieldset role="group" aria-label="Labels">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 bg-white border border-gray-200 hover:bg-gray-50"
                      aria-haspopup="listbox"
                    >
                      <Tag className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-700">Labels</span>
                      <Plus className="h-3 w-3 ml-auto text-gray-400" />
                    </Button>
                  </fieldset>

                  <hr className="border-gray-200" />

                  {/* Reminders */}
                  <fieldset role="group" aria-label="Reminders">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 bg-white border border-gray-200 hover:bg-gray-50"
                    >
                      <Bell className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-700">Add reminder</span>
                    </Button>
                  </fieldset>

                  <hr className="border-gray-200" />

                  {/* Location (Premium/Upsell) */}
                  <fieldset role="group" aria-label="Location">
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-auto p-3 bg-white border border-gray-200 hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-700">Add location</span>
                      </div>
                      <Crown className="h-4 w-4 text-amber-500" />
                    </Button>
                  </fieldset>

                  <hr className="border-gray-200" />

                  {/* Extension Slot */}
                  <div className="h-8" /> {/* Empty space for extensions */}
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskDetailsModal;