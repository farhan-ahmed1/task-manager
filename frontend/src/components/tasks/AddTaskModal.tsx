import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Flag, MoreHorizontal, Bell, Inbox, FolderOpen, ChevronDown } from 'lucide-react';
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
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const priorityPickerRef = useRef<HTMLDivElement>(null);
  const projectPickerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priorityPickerRef.current && !priorityPickerRef.current.contains(event.target as Node)) {
        setShowPriorityPicker(false);
      }
      if (projectPickerRef.current && !projectPickerRef.current.contains(event.target as Node)) {
        setShowProjectPicker(false);
      }
    };

    if (showPriorityPicker || showProjectPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPriorityPicker, showProjectPicker]);

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
          console.error('Failed to load projects:', error);
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
      const taskData = {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        project_id: selectedProjectId || undefined,
        priority: priority || 'MEDIUM',
        due_date: dueDate || undefined,
        status: 'PENDING' as const,
      };

      await onSubmit(taskData);
      
      // Reset form
      setTaskTitle('');
      setTaskDescription('');
      setSelectedProjectId(selectedProject || '');
      setPriority(null);
      setDueDate('');
      setShowDatePicker(false);
      setShowPriorityPicker(false);
      setShowProjectPicker(false);
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
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
        onClose();
      }
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'HIGH': return '#EA4335';
      case 'MEDIUM': return '#FF9800';
      case 'LOW': return '#34A853';  
      default: return '#9AA0A6';
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

  const handlePrioritySelection = (priorityValue: 'HIGH' | 'MEDIUM' | 'LOW' | null) => {
    setPriority(priorityValue);
    setShowPriorityPicker(false);
  };

  const handleDateSelection = (dateString: string) => {
    setDueDate(dateString);
  };

  const handleProjectSelection = (projectId: string | null) => {
    setSelectedProjectId(projectId || '');
    setShowProjectPicker(false);
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
        color: '#4285F4' // Blue for projects
      };
    }
    return {
      name: 'Inbox',
      icon: Inbox,
      color: '#EA4335' // Red for inbox
    };
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Invisible backdrop for click outside */}
      <div 
        className="fixed inset-0"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Content */}
        <div className="p-5 space-y-2">
          {/* Main Task Input */}
          <div>
            <textarea
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Take kids to the park after work tom"
              rows={2}
              className="w-full px-0 text-2xl font-semibold border-0 focus:outline-none resize-none bg-transparent block"
              style={{
                color: '#202124',
                lineHeight: '1.1',
                margin: '0',
                padding: '0',
                display: 'block',
                minHeight: 'auto'
              }}
              autoFocus
            />
            
            {/* Description Textarea */}
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Description"
              rows={2}
              className="w-full px-0 text-sm border-0 focus:outline-none resize-none bg-transparent block"
              style={{
                color: '#5F6368',
                lineHeight: '1.4',
                margin: '0',
                padding: '0',
                marginTop: '-8px',
                display: 'block'
              }}
            />
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 py-1">
            {/* Date Button */}
            <div className="relative">
              <button 
                className="flex items-center gap-2 px-3 py-2 bg-gray-25 hover:bg-gray-100 hover:border-gray-200 hover:shadow-sm border border-gray-100 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ color: '#374151', backgroundColor: '#FAFAFA' }}
                onClick={() => setShowDatePicker(true)}
              >
                <Calendar className="w-4 h-4" />
                <span>{dueDate ? new Date(dueDate).toLocaleDateString() : 'Date'}</span>
              </button>

              {/* Date Picker Modal positioned relative to button */}
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
                className="flex items-center gap-2 px-3 py-2 bg-gray-25 hover:bg-gray-100 hover:border-gray-200 hover:shadow-sm border border-gray-100 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ color: priority ? getPriorityColor(priority) : '#374151', backgroundColor: '#FAFAFA' }}
                onClick={() => setShowPriorityPicker(!showPriorityPicker)}
              >
                <Flag className="w-4 h-4" />
                <span>{priority ? priority.charAt(0) + priority.slice(1).toLowerCase() : 'Priority'}</span>
              </button>

              {/* Priority Picker Dropdown */}
              {showPriorityPicker && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="p-2">
                    {getPriorityOptions().map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handlePrioritySelection(option.value)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: option.color }}
                        />
                        <span className="font-medium" style={{ color: '#202124' }}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reminders Button */}
            <button 
              className="flex items-center gap-2 px-3 py-2 bg-gray-25 hover:bg-gray-100 hover:border-gray-200 hover:shadow-sm border border-gray-100 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ color: '#374151', backgroundColor: '#FAFAFA' }}
            >
              <Bell className="w-4 h-4" />
              <span>Reminders</span>
            </button>

            {/* More Button */}
            <button 
              className="flex items-center justify-center w-10 h-10 bg-gray-25 hover:bg-gray-100 hover:border-gray-200 hover:shadow-sm border border-gray-100 rounded-lg transition-all duration-200"
              style={{ color: '#374151', backgroundColor: '#FAFAFA' }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 pt-4 border-t border-gray-100">
          {/* Left: Project Selector */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={projectPickerRef}>
              <button 
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setShowProjectPicker(!showProjectPicker)}
                disabled={projectsLoading}
              >
                {React.createElement(getProjectDisplayInfo().icon, { 
                  className: "w-4 h-4", 
                  style: { color: getProjectDisplayInfo().color } 
                })}
                <span>{projectsLoading ? 'Loading...' : getProjectDisplayInfo().name}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {/* Project Picker Dropdown */}
              {showProjectPicker && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto">
                  <div className="p-2">
                    {/* Inbox Option */}
                    <button
                      onClick={() => handleProjectSelection(null)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <Inbox className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 block truncate">Inbox</span>
                        <span className="text-xs text-gray-500">No project assigned</span>
                      </div>
                      {!selectedProjectId && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </button>

                    {/* Project Options */}
                    {projects.length > 0 && (
                      <>
                        <div className="border-t border-gray-100 my-2" />
                        <div className="space-y-1">
                          {projects.map((project) => (
                            <button
                              key={project.id}
                              onClick={() => handleProjectSelection(project.id)}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors text-left"
                            >
                              <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-gray-900 block truncate">{project.name}</span>
                                {project.description && (
                                  <span className="text-xs text-gray-500 block truncate">{project.description}</span>
                                )}
                              </div>
                              {selectedProjectId === project.id && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {/* No Projects State */}
                    {projects.length === 0 && !projectsLoading && (
                      <>
                        <div className="border-t border-gray-100 my-2" />
                        <div className="px-3 py-4 text-center">
                          <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 mb-1">No projects yet</p>
                          <p className="text-xs text-gray-400">Create a project to organize your tasks</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!taskTitle.trim() || isLoading}
              className="px-6 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                backgroundColor: taskTitle.trim() ? '#4285F4' : '#F3F4F6',
                color: taskTitle.trim() ? '#FFFFFF' : '#9CA3AF'
              }}
            >
              {isLoading ? 'Adding...' : 'Add task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;