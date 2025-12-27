import React, { useState, useEffect } from 'react';
import { Calendar, Flag, Inbox, FolderOpen, ChevronDown } from 'lucide-react';
import { handleError } from '@/utils/errorHandling';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DatePickerModal from '@/components/ui/DatePickerModal';
import { projectService } from '@/services/projects';
import type { CreateTaskRequest, Project } from '@/types/api';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: CreateTaskRequest) => void;
  selectedProject?: string;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedProject 
}) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(selectedProject || '');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load projects when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadProjects = async () => {
        setProjectsLoading(true);
        try {
          const result = await projectService.getProjects();
          if (result.success) {
            setProjects(result.data);
          }
        } catch (error) {
          handleError(error, {
            toastMessage: 'Failed to load projects',
            logToConsole: true
          });
        } finally {
          setProjectsLoading(false);
        }
      };

      loadProjects();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!taskTitle.trim()) return;

    setIsLoading(true);
    try {
      const taskData: CreateTaskRequest = {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        project_id: selectedProjectId || undefined,
        priority: priority || 'MEDIUM',
        due_date: dueDate || undefined,
        status: 'PENDING',
      };

      await onSubmit(taskData);
      
      // Reset form
      setTaskTitle('');
      setTaskDescription('');
      setSelectedProjectId(selectedProject || '');
      setPriority(null);
      setDueDate('');
      setShowDatePicker(false);
      setShowProjectPicker(false);
      onClose();
    } catch (error) {
      handleError(error, {
        toastMessage: 'Failed to create task',
        context: { title: taskTitle, projectId: selectedProjectId }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getPriorityOptions = () => {
    return [
      { label: 'Priority 1', value: 'HIGH' as const, color: 'var(--error)', description: 'High' },
      { label: 'Priority 2', value: 'MEDIUM' as const, color: 'var(--warning)', description: 'Medium' },
      { label: 'Priority 3', value: 'LOW' as const, color: 'var(--success)', description: 'Low' },
      { label: 'Priority 4', value: null, color: 'var(--text-tertiary)', description: 'No priority' }
    ];
  };

  const getSelectedProject = () => {
    return projects.find(p => p.id === selectedProjectId);
  };

  const getProjectDisplayInfo = () => {
    const selectedProject = getSelectedProject();
    if (selectedProject) {
      return {
        name: selectedProject.name,
        icon: FolderOpen,
        color: '#4285F4'
      };
    }
    return {
      name: 'Inbox',
      icon: Inbox,
      color: '#EA4335'
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0" onKeyDown={handleKeyDown}>
        <div className="p-4">
          {/* Main Task Input */}
          <div className="mb-3">
            <textarea
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task name"
              rows={1}
              className="w-full text-lg font-400 border-0 focus:outline-none resize-none bg-transparent block mb-1"
              style={{
                color: 'var(--text-primary)',
                lineHeight: '1.4',
                padding: '0'
              }}
              autoFocus
            />
            
            {/* Description Textarea */}
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Description"
              rows={1}
              className="w-full text-sm font-400 border-0 focus:outline-none resize-none bg-transparent block"
              style={{
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
                padding: '0'
              }}
            />
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-4 mb-3">
            {/* Date Button */}
            <div className="relative z-50">
              <button 
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border transition-all duration-200"
                style={{ 
                  color: dueDate ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)'
                }}
                onClick={() => setShowDatePicker(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  e.currentTarget.style.borderColor = 'var(--text-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--background)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <Calendar className="w-4 h-4" />
                <span>{dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Due date'}</span>
              </button>

              {showDatePicker && (
                <DatePickerModal
                  isOpen={showDatePicker}
                  onClose={() => setShowDatePicker(false)}
                  onDateSelect={(date) => {
                    setDueDate(date);
                    setShowDatePicker(false);
                  }}
                  initialDate={dueDate}
                  title="Set Due Date"
                />
              )}
            </div>

            {/* Priority Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border transition-all duration-200"
                  style={{ 
                    color: priority ? 'var(--text-primary)' : 'var(--text-secondary)',
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    e.currentTarget.style.borderColor = 'var(--text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <Flag className="w-4 h-4" />
                  <span>{priority ? `Priority ${priority === 'HIGH' ? '1' : priority === 'MEDIUM' ? '2' : '3'}` : 'Priority'}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                {getPriorityOptions().map((option) => (
                  <DropdownMenuItem
                    key={option.value || 'none'}
                    onClick={() => setPriority(option.value)}
                    className="flex items-center gap-3"
                  >
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: option.color }}
                    />
                    <span style={{ color: 'var(--text-primary)' }}>
                      {option.description}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Footer - Project Selection and Actions */}
        <DialogFooter className="border-t px-4 py-3 flex items-center justify-between">
          <DropdownMenu open={showProjectPicker} onOpenChange={setShowProjectPicker}>
            <DropdownMenuTrigger asChild>
              <button 
                type="button"
                className="flex items-center gap-2 py-2 text-sm hover:opacity-60"
                style={{ 
                  color: 'var(--text-secondary)',
                  backgroundColor: 'transparent'
                }}
              >
                {getProjectDisplayInfo().icon && React.createElement(getProjectDisplayInfo().icon, { 
                  className: "w-4 h-4"
                })}
                <span>{getProjectDisplayInfo().name}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 max-h-60">
              {/* Inbox Option */}
              <DropdownMenuItem
                onClick={() => setSelectedProjectId('')}
                className="flex items-center gap-3"
              >
                <Inbox className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">Inbox</div>
                </div>
                {!selectedProjectId && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                )}
              </DropdownMenuItem>

              {/* Project Options */}
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className="flex items-center gap-3"
                >
                  <FolderOpen className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{project.name}</div>
                    {project.description && (
                      <div className="text-xs opacity-60 truncate">{project.description}</div>
                    )}
                  </div>
                  {selectedProjectId === project.id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}

              {/* No Projects State */}
              {projects.length === 0 && !projectsLoading && (
                <div className="px-3 py-4 text-center">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>No projects yet</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Create a project to organize your tasks</p>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg transition-all duration-200"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--surface-hover)',
                border: '1px solid var(--border)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              }}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={!taskTitle.trim() || isLoading}
              style={{
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                opacity: taskTitle.trim() && !isLoading ? '1' : '0.4',
                cursor: taskTitle.trim() && !isLoading ? 'pointer' : 'not-allowed',
                border: 'none',
                outline: 'none'
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-opacity duration-200"
              onMouseEnter={(e) => {
                if (taskTitle.trim() && !isLoading) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
                }
              }}
              onMouseLeave={(e) => {
                if (taskTitle.trim() && !isLoading) {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                }
              }}
            >
              {isLoading ? 'Adding...' : 'Add task'}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskModal;
