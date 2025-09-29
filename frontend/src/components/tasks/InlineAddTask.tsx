import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Calendar, Flag, Inbox, FolderOpen, ChevronDown } from 'lucide-react';
import DatePickerModal from '@/components/ui/DatePickerModal';
import { projectService } from '@/services/projects';
import { useAuth } from '@/context/AuthContext';
import type { CreateTaskRequest, TaskPriority, Project } from '@/types/api';

interface InlineAddTaskProps {
  onSubmit: (task: CreateTaskRequest) => void;
  sectionId?: string; // Allow passing section ID for section-specific task creation
  currentProject?: Project | null; // Current project context, null for inbox
}

const InlineAddTask: React.FC<InlineAddTaskProps> = ({ 
  onSubmit,
  sectionId,
  currentProject
}) => {
  const { isAuthenticated } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(currentProject || null);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const priorityPickerRef = useRef<HTMLDivElement>(null);
  const projectPickerRef = useRef<HTMLDivElement>(null);

  // Load available projects when component mounts
  useEffect(() => {
    const loadProjects = async () => {
      if (!isAuthenticated) return;
      
      try {
        const result = await projectService.getProjects();
        if (result.success) {
          setAvailableProjects(result.data);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };

    loadProjects();
  }, [isAuthenticated]);

  // Update selected project when currentProject changes
  useEffect(() => {
    setSelectedProject(currentProject || null);
  }, [currentProject]);

  const handleCancel = useCallback(() => {
    if (!taskTitle.trim() && !taskDescription.trim()) {
      setIsExpanded(false);
      setTaskTitle('');
      setTaskDescription('');
      setPriority(null);
      setDueDate('');
      setShowDatePicker(false);
      setShowPriorityPicker(false);
      setShowProjectPicker(false);
      setSelectedProject(currentProject || null); // Reset to original project
    }
  }, [taskTitle, taskDescription, currentProject]);

  // Handle click outside to close pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priorityPickerRef.current && !priorityPickerRef.current.contains(event.target as Node)) {
        setShowPriorityPicker(false);
      }
      if (projectPickerRef.current && !projectPickerRef.current.contains(event.target as Node)) {
        setShowProjectPicker(false);
      }
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleCancel();
      }
    };

    if (showPriorityPicker || showProjectPicker || isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPriorityPicker, showProjectPicker, isExpanded, handleCancel]);

  useEffect(() => {
    if (isExpanded && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = async () => {
    if (!taskTitle.trim()) return;

    setIsLoading(true);
    try {
      const taskData: CreateTaskRequest = {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: priority || 'MEDIUM',
        due_date: dueDate || undefined,
        status: 'PENDING',
        section_id: sectionId, // Include section ID if provided
        project_id: selectedProject?.id // Include selected project ID
      };

      await onSubmit(taskData);
      
      // Reset form
      setTaskTitle('');
      setTaskDescription('');
      setPriority(null);
      setDueDate('');
      setShowDatePicker(false);
      setShowPriorityPicker(false);
      setShowProjectPicker(false);
      setIsExpanded(false);
      setSelectedProject(currentProject || null); // Reset to original project
    } catch (error) {
      console.error('Failed to create task:', error);
      // TODO: Show user-friendly error message (toast/notification)
      alert('Failed to create task. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      if (showPriorityPicker) {
        setShowPriorityPicker(false);
      } else if (showProjectPicker) {
        setShowProjectPicker(false);
      } else {
        handleCancel();
      }
    }
  };



  const getPriorityOptions = () => {
    return [
      { label: 'Priority 1', value: 'HIGH' as const, color: '#EA4335', description: 'High' },
      { label: 'Priority 2', value: 'MEDIUM' as const, color: '#FF9800', description: 'Medium' },
      { label: 'Priority 3', value: 'LOW' as const, color: '#34A853', description: 'Low' },
      { label: 'Priority 4', value: null, color: '#9AA0A6', description: 'No priority' }
    ];
  };

  const handlePrioritySelection = (priorityValue: TaskPriority | null) => {
    setPriority(priorityValue);
    setShowPriorityPicker(false);
  };

  const handleDateSelection = (dateString: string) => {
    setDueDate(dateString);
    setShowDatePicker(false);
  };

  if (!isExpanded) {
    return (
      <div className="px-6 py-4">
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex items-center w-full text-left py-3 hover:opacity-60"
          style={{ 
            backgroundColor: 'transparent',
            color: 'var(--text-muted)'
          }}
        >
          <Plus className="w-4 h-4 mr-4 opacity-50 group-hover:opacity-100" />
          <span className="text-15 font-400">Add task</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="px-6 py-4">
      <div 
        className="border border-gray-100 bg-white rounded-lg p-6 shadow-sm"
        onKeyDown={handleKeyDown}
      >
        {/* Main Task Input */}
        <div className="mb-8">
          <textarea
            ref={titleRef}
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Task name"
            rows={1}
            className="w-full text-lg font-400 border-0 focus:outline-none resize-none bg-transparent block mb-3"
            style={{
              color: 'var(--text-primary)',
              lineHeight: '1.4',
              padding: '0'
            }}
          />
          
          {/* Description Textarea */}
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Description"
            rows={2}
            className="w-full text-sm font-400 border-0 focus:outline-none resize-none bg-transparent block"
            style={{
              color: 'var(--text-secondary)',
              lineHeight: '1.5',
              padding: '0'
            }}
          />
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-4 mb-8">
          {/* Date Button */}
          <div className="relative">
            <button 
              type="button"
              className="flex items-center gap-2 py-2 text-sm hover:opacity-60"
              style={{ 
                color: dueDate ? 'var(--text-primary)' : 'var(--text-muted)',
                backgroundColor: 'transparent'
              }}
              onClick={() => setShowDatePicker(true)}
            >
              <Calendar className="w-4 h-4" />
              <span>{dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Due date'}</span>
            </button>

            {/* Date Picker Modal */}
            {showDatePicker && (
              <DatePickerModal
                isOpen={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onDateSelect={handleDateSelection}
                initialDate={dueDate}
                title="Set Due Date"
              />
            )}
          </div>

          {/* Priority Button */}
          <div className="relative" ref={priorityPickerRef}>
            <button 
              type="button"
              className="flex items-center gap-2 py-2 text-sm hover:opacity-60"
              style={{ 
                color: priority ? 'var(--text-primary)' : 'var(--text-muted)',
                backgroundColor: 'transparent'
              }}
              onClick={() => setShowPriorityPicker(!showPriorityPicker)}
            >
              <Flag className="w-4 h-4" />
              <span>{priority ? `Priority ${priority === 'HIGH' ? '1' : priority === 'MEDIUM' ? '2' : '3'}` : 'Priority'}</span>
            </button>

            {/* Priority Picker Dropdown */}
            {showPriorityPicker && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  {getPriorityOptions().map((option) => (
                    <button
                      key={option.value || 'none'}
                      type="button"
                      onClick={() => handlePrioritySelection(option.value)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 text-left rounded-lg"
                    >
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                      <span style={{ color: 'var(--text-primary)' }}>
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Left: Project selector */}
          <div className="relative" ref={projectPickerRef}>
            <button 
              type="button"
              onClick={() => setShowProjectPicker(!showProjectPicker)}
              className="flex items-center gap-2 py-2 text-sm hover:opacity-60"
              style={{ 
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }}
            >
              {selectedProject ? (
                <>
                  <FolderOpen className="w-4 h-4" />
                  <span>{selectedProject.name}</span>
                </>
              ) : (
                <>
                  <Inbox className="w-4 h-4" />
                  <span>Inbox</span>
                </>
              )}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>

            {/* Project Picker Dropdown */}
            {showProjectPicker && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                <div className="p-2">
                  {/* Inbox option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProject(null);
                      setShowProjectPicker(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 text-left rounded-lg ${
                      !selectedProject ? 'bg-gray-50' : ''
                    }`}
                  >
                    <Inbox className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">Inbox</div>
                    </div>
                  </button>
                  
                  {/* Available projects */}
                  {availableProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        setSelectedProject(project);
                        setShowProjectPicker(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 text-left rounded-lg ${
                        selectedProject?.id === project.id ? 'bg-gray-50' : ''
                      }`}
                    >
                      <FolderOpen className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{project.name}</div>
                        {project.description && (
                          <div className="text-xs opacity-60 truncate">{project.description}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => {
                handleCancel();
                setShowProjectPicker(false);
              }}
              className="py-2 text-sm hover:opacity-60"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={!taskTitle.trim() || isLoading}
              className={`px-4 py-2 text-sm rounded-lg border-0 disabled:opacity-30 hover:opacity-90 ${
                taskTitle.trim() 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isLoading ? 'Adding...' : 'Add task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineAddTask;