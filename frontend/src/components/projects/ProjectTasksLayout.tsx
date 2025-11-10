import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InboxTaskItem from '@/components/tasks/InboxTaskItem';
import InlineAddTask from '@/components/tasks/InlineAddTask';
import AddTaskModal from '@/components/tasks/AddTaskModal';
import TaskDetailsModal from '@/components/tasks/TaskDetailsModal';
import DragOverlay from '@/components/tasks/DragOverlay';
import DropIndicator from '@/components/tasks/DropIndicator';
import SectionHeader from '@/components/tasks/SectionHeader';

import AddSectionButton from '@/components/tasks/AddSectionButton';
import { type ViewOptions } from '@/components/tasks/ViewOptionsMenu';
import { taskService } from '@/services/tasks';
import { sectionService } from '@/services/sections';
import { projectService } from '@/services/projects';
import { useAuth } from '@/context/AuthContext';
import {
  DndContext,
  DragOverlay as DndDragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import type { Task, Section, CreateTaskRequest, UpdateTaskRequest, Project } from '@/types/api';

interface ProjectTasksLayoutProps {
  project?: Project; // undefined for inbox, defined for specific projects
  icon?: React.ReactNode;
  title: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  emptyButtonText: string;
  onProjectUpdate?: (updatedProject: Project) => void;
}

const ProjectTasksLayout: React.FC<ProjectTasksLayoutProps> = ({
  project,
  icon,
  title,
  emptyStateTitle,
  emptyStateDescription, 
  emptyButtonText,
  onProjectUpdate,
}) => {
  const { isAuthenticated, token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [overId, setOverId] = useState<string | number | null>(null);

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(title);
  const [viewOptions] = useState<ViewOptions>({
    showCompletedTasks: false,
    showDescriptions: true,
    showDueDates: true,
    groupBy: 'none',
    sortBy: 'created_at',
    sortOrder: 'desc',
    layout: 'list'
  });

  // Update editing title when title prop changes
  useEffect(() => {
    setEditingTitle(title);
  }, [title]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (active.id !== over?.id) {
      setTasks((tasks) => {
        const oldIndex = tasks.findIndex((task) => task.id === active.id);
        const newIndex = tasks.findIndex((task) => task.id === over?.id);

        return arrayMove(tasks, oldIndex, newIndex);
      });
    }
  };

  const loadTasks = React.useCallback(async () => {
    setLoading(true);
    
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    
    try {
      // Use task service filtering instead of client-side filtering
      const filters = project 
        ? { project_id: project.id } 
        : {}; // For inbox, get all tasks and filter client-side
      
      const result = await taskService.getTasks(filters);
      if (result.success) {
        // For inbox, filter out tasks that have a project_id
        // For projects, the filtering is already done server-side
        const filteredTasks = project 
          ? result.data 
          : result.data.filter((task: Task) => !task.project_id);
        setTasks(filteredTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, project]);

  // Load sections from backend
  const loadSections = React.useCallback(async () => {
    if (!isAuthenticated || !token) {
      return;
    }
    
    try {
      const result = project 
        ? await sectionService.getSections(project.id) // Project-specific sections
        : await sectionService.getSections(); // Inbox sections (no project_id)
      
      if (result.success) {
        setSections(result.data);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  }, [isAuthenticated, token, project]);

  useEffect(() => {
    loadTasks();
    loadSections();
  }, [loadTasks, loadSections]);

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    try {
      const enhancedTaskData: CreateTaskRequest = {
        ...taskData,
        project_id: project?.id || taskData.project_id, // Set project_id for project view, keep undefined for inbox
        section_id: selectedSectionId && selectedSectionId !== 'no-section' ? selectedSectionId : taskData.section_id
      };
      
      const result = await taskService.createTask(enhancedTaskData);
      if (result.success) {
        setTasks(prev => [result.data, ...prev]);
        setShowAddTaskModal(false);
        setSelectedSectionId(null);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: UpdateTaskRequest) => {
    try {
      const result = await taskService.updateTask(taskId, updates);
      if (result.success) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        ));
        
        if (selectedTask?.id === taskId) {
          setSelectedTask({ ...selectedTask, ...updates });
        }
      } else {
        console.error('Failed to update task:', result.error);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await handleUpdateTask(task.id, { status: newStatus });
  };

  const handleDateUpdate = async (task: Task, date: string) => {
    await handleUpdateTask(task.id, { due_date: date || undefined });
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  // Get all visible tasks for navigation
  const getAllVisibleTasks = () => {
    let allVisibleTasks: Task[] = [];
    
    // Add default tasks
    allVisibleTasks = [...getDefaultTasks()];
    
    // Add tasks from each section
    sections.forEach(section => {
      if (!section.collapsed) {
        allVisibleTasks = [...allVisibleTasks, ...getTasksForSection(section.id)];
      }
    });
    
    return allVisibleTasks;
  };

  const handlePreviousTask = () => {
    if (!selectedTask) return;
    
    const visibleTasks = getAllVisibleTasks();
    const currentIndex = visibleTasks.findIndex((t: Task) => t.id === selectedTask.id);
    if (currentIndex > 0) {
      setSelectedTask(visibleTasks[currentIndex - 1]);
    }
  };

  const handleNextTask = () => {
    if (!selectedTask) return;
    
    const visibleTasks = getAllVisibleTasks();
    const currentIndex = visibleTasks.findIndex((t: Task) => t.id === selectedTask.id);
    if (currentIndex < visibleTasks.length - 1) {
      setSelectedTask(visibleTasks[currentIndex + 1]);
    }
  };

  const getNavigationState = () => {
    if (!selectedTask) return { hasPrevious: false, hasNext: false };
    
    const visibleTasks = getAllVisibleTasks();
    const currentIndex = visibleTasks.findIndex((t: Task) => t.id === selectedTask.id);
    return {
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex < visibleTasks.length - 1
    };
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      const result = await taskService.deleteTask(taskId);
      if (result.success) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        setShowTaskDetail(false);
        setSelectedTask(null);
      } else {
        console.error('Failed to delete task:', result.error);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleComment = () => {
    // Placeholder for comment functionality
  };

  const handleOptions = () => {
    // Placeholder for options menu
  };

  // Title editing functions
  const handleSaveTitle = async () => {
    if (!project || !editingTitle.trim()) return;
    
    try {
      const result = await projectService.updateProject(project.id, { name: editingTitle.trim() });
      if (result.success) {
        setIsEditingTitle(false);
        // Call the callback to update the parent component
        if (onProjectUpdate) {
          onProjectUpdate(result.data);
        }
      } else {
        alert('Failed to update project name: ' + result.error.message);
      }
    } catch (error) {
      console.error('Error updating project name:', error);
      alert('Failed to update project name. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingTitle(title);
    setIsEditingTitle(false);
  };

  // Section management functions
  const handleAddSection = async (name: string) => {
    try {
      const sectionData = project 
        ? { name, project_id: project.id } 
        : { name }; // Inbox sections don't have project_id
      
      const result = await sectionService.createSection(sectionData);
      
      if (result.success) {
        setSections(prev => [...prev, result.data]);
      } else {
        alert('Failed to create section: ' + result.error.message);
      }
    } catch (error) {
      console.error('Error creating section:', error);
      alert('Failed to create section. Please try again.');
    }
  };

  const handleToggleSectionCollapse = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    try {
      const result = await sectionService.updateSection(sectionId, { 
        collapsed: !section.collapsed 
      });
      
      if (result.success) {
        setSections(prev => prev.map(s =>
          s.id === sectionId ? result.data : s
        ));
      }
    } catch (error) {
      console.error('Error toggling section collapse:', error);
    }
  };

  const handleRenameSection = async (sectionId: string, newName: string) => {
    try {
      const result = await sectionService.updateSection(sectionId, { name: newName });
      
      if (result.success) {
        setSections(prev => prev.map(section =>
          section.id === sectionId ? result.data : section
        ));
      } else {
        alert('Failed to rename section: ' + result.error.message);
      }
    } catch (error) {
      console.error('Error renaming section:', error);
      alert('Failed to rename section. Please try again.');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const result = await sectionService.deleteSection(sectionId);
      
      if (result.success) {
        // Move tasks from deleted section to default (no section_id)
        setTasks(prev => prev.map(task =>
          task.section_id === sectionId
            ? { ...task, section_id: undefined }
            : task
        ));
        
        setSections(prev => prev.filter(section => section.id !== sectionId));
      } else {
        alert('Failed to delete section: ' + result.error.message);
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section. Please try again.');
    }
  };

  const handleAddTaskToSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setShowAddTaskModal(true);
  };

  // Utility functions for organizing tasks
  const getTasksForSection = (sectionId: string) => {
    let sectionTasks = tasks.filter(task => 
      task.section_id === sectionId
    );

    // Apply view options filtering
    if (!viewOptions.showCompletedTasks) {
      sectionTasks = sectionTasks.filter(task => task.status !== 'COMPLETED');
    }

    // Apply sorting
    sectionTasks.sort((a, b) => {
      switch (viewOptions.sortBy) {
        case 'due_date': {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return viewOptions.sortOrder === 'asc' 
            ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
            : new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
        }
        case 'priority': {
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return viewOptions.sortOrder === 'asc'
            ? priorityOrder[a.priority] - priorityOrder[b.priority]
            : priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        case 'title': {
          return viewOptions.sortOrder === 'asc'
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        }
        default: {// created_at
          return viewOptions.sortOrder === 'asc'
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      }
    });

    return sectionTasks;
  };

  // Get tasks that don't belong to any section (default tasks)
  const getDefaultTasks = () => {
    let defaultTasks = tasks.filter(task => !task.section_id);

    // Apply view options filtering
    if (!viewOptions.showCompletedTasks) {
      defaultTasks = defaultTasks.filter(task => task.status !== 'COMPLETED');
    }

    // Apply sorting (same logic as section tasks)
    defaultTasks.sort((a, b) => {
      switch (viewOptions.sortBy) {
        case 'due_date': {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return viewOptions.sortOrder === 'asc' 
            ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
            : new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
        }
        case 'priority': {
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return viewOptions.sortOrder === 'asc'
            ? priorityOrder[a.priority] - priorityOrder[b.priority]
            : priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        case 'title': {
          return viewOptions.sortOrder === 'asc'
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        }
        default: {// created_at
          return viewOptions.sortOrder === 'asc'
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      }
    });

    return defaultTasks;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
               style={{ borderColor: 'var(--primary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Title section - integrated into content, not a separate header */}
      <div 
        className="px-6 pt-12 pb-6"
        style={{ 
          backgroundColor: 'var(--background)',
        }}
      >
        <div className="flex items-center">
          {project && isEditingTitle ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                className="text-2xl font-bold bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-300 focus:rounded px-2 py-1"
                style={{ color: 'var(--text-primary)' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTitle();
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto hover:bg-green-50"
                onClick={handleSaveTitle}
              >
                <Check className="w-4 h-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto hover:bg-red-50"
                onClick={handleCancelEdit}
              >
                <X className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center group">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h1>
              {project && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <Edit2 className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="px-6 pb-6">
        {/* Tasks container */}
        <div>
          {tasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: 'var(--border-light)' }}>
                {icon}
              </div>
              <h3 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>
                {emptyStateTitle}
              </h3>
              <p className="text-body mb-4" style={{ color: 'var(--text-muted)' }}>
                {emptyStateDescription}
              </p>
              <Button 
                onClick={() => setShowAddTaskModal(true)}
                className="tm-btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                {emptyButtonText}
              </Button>
            </div>
          ) : (
            <div>
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext 
                  items={[...sections.map(s => s.id), ...tasks.map(t => t.id)]} 
                  strategy={verticalListSortingStrategy}
                >
                  <div>
                    {/* Default tasks (no section) */}
                    <div className="default-tasks-container group/default">
                      {(() => {
                        const defaultTasks = getDefaultTasks();
                        return (
                          <>
                            {defaultTasks.map((task, index) => (
                              <div key={task.id}>
                                <DropIndicator isVisible={overId === task.id && activeId !== task.id} />
                                <InboxTaskItem
                                  task={task}
                                  onEdit={handleEditTask}
                                  onDateUpdate={handleDateUpdate}
                                  onToggleComplete={handleToggleComplete}
                                  onComment={() => handleComment()}
                                  onOptions={() => handleOptions()}
                                  showDescription={viewOptions.showDescriptions}
                                  showDueDate={viewOptions.showDueDates}
                                />
                                {index < defaultTasks.length - 1 && (
                                  <hr className="border-0 h-px my-0 opacity-70" style={{ backgroundColor: 'var(--border-light)' }} />
                                )}
                              </div>
                            ))}
                            
                            {/* Separator line before add task */}
                            {(() => {
                              const defaultTasks = getDefaultTasks();
                              return defaultTasks.length > 0 && (
                                <hr className="border-0 h-px my-0 opacity-70" style={{ backgroundColor: 'var(--border-light)' }} />
                              );
                            })()}
                            
                            {/* Inline add task for default tasks */}
                            <div className="px-4 pt-3 pb-2">
                              <InlineAddTask 
                                onSubmit={handleCreateTask}
                                sectionId={undefined} // Default tasks have no section
                              />
                            </div>
                            
                            {/* Subtle Add Section Button - appears on hover */}
                            <div className="group-hover/default:opacity-100 opacity-0 transition-opacity duration-200">
                              <AddSectionButton 
                                onAddSection={handleAddSection}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Sections */}
                    {sections.map((section) => {
                      const sectionTasks = getTasksForSection(section.id);
                      return (
                        <div key={section.id} className="section-container group/section">
                          <SectionHeader
                            section={section}
                            taskCount={sectionTasks.length}
                            onToggleCollapse={handleToggleSectionCollapse}
                            onRename={handleRenameSection}
                            onDelete={handleDeleteSection}
                            onAddTask={handleAddTaskToSection}
                          />
                          
                          {!section.collapsed && (
                            <div className="section-tasks">
                              {sectionTasks.map((task, index) => (
                                <div key={task.id}>
                                  <DropIndicator isVisible={overId === task.id && activeId !== task.id} />
                                  <InboxTaskItem
                                    task={task}
                                    onEdit={handleEditTask}
                                    onDateUpdate={handleDateUpdate}
                                    onToggleComplete={handleToggleComplete}
                                    onComment={() => handleComment()}
                                    onOptions={() => handleOptions()}
                                    showDescription={viewOptions.showDescriptions}
                                    showDueDate={viewOptions.showDueDates}
                                  />
                                  {index < sectionTasks.length - 1 && (
                                    <hr className="border-0 h-px my-0 opacity-70" style={{ backgroundColor: 'var(--border-light)' }} />
                                  )}
                                </div>
                              ))}
                              
                              {/* Separator line before add task */}
                              {sectionTasks.length > 0 && (
                                <hr className="border-0 h-px my-0 opacity-70" style={{ backgroundColor: 'var(--border-light)' }} />
                              )}
                              
                              {/* Inline add task for this section */}
                              <div className="px-4 pt-3 pb-2">
                                <InlineAddTask 
                                  onSubmit={handleCreateTask}
                                  sectionId={section.id} // Pass section ID for section-specific tasks
                                />
                              </div>
                              
                              {/* Subtle Add Section Button - appears on hover */}
                              <div className="group-hover/section:opacity-100 opacity-0 transition-opacity duration-200">
                                <AddSectionButton 
                                  onAddSection={handleAddSection}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </SortableContext>
                
                <DndDragOverlay>
                  {activeId && tasks.find(task => task.id === activeId) ? (
                    <DragOverlay 
                      task={tasks.find(task => task.id === activeId)!} 
                    />
                  ) : null}
                </DndDragOverlay>
              </DndContext>
            </div>
          )}
        </div>

        {/* Modals */}
        <AddTaskModal
          isOpen={showAddTaskModal}
          onClose={() => setShowAddTaskModal(false)}
          onSubmit={handleCreateTask}
        />

        {selectedTask && (
          <TaskDetailsModal
            open={showTaskDetail}
            onOpenChange={(open: boolean) => {
              if (!open) {
                setShowTaskDetail(false);
                setSelectedTask(null);
              }
            }}
            task={selectedTask}
            onEdit={handleEditTask}
            onDelete={() => handleTaskDelete(selectedTask.id)}
            onPreviousTask={handlePreviousTask}
            onNextTask={handleNextTask}
            hasPreviousTask={getNavigationState().hasPrevious}
            hasNextTask={getNavigationState().hasNext}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectTasksLayout;