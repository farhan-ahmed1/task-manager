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
import type { ProjectLayoutConfig } from '@/types/layout';
import { handleError } from '@/utils/errorHandling';

import AddSectionButton from '@/components/tasks/AddSectionButton';
import { type ViewOptions } from '@/components/tasks/ViewOptionsMenu';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useUpdateProject } from '@/hooks/useProjects';
import { sectionService } from '@/services/sections';
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
  config: ProjectLayoutConfig;
  onProjectUpdate?: (updatedProject: Project) => void;
}

const ProjectTasksLayout: React.FC<ProjectTasksLayoutProps> = ({
  project,
  config,
  onProjectUpdate,
}) => {
  const { title, icon, emptyState } = config;
  // React Query hooks - single source of truth
  const filters = project ? { project_id: project.id } : {};
  const { data: allTasks = [], isLoading: tasksLoading } = useTasks(filters);
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const updateProjectMutation = useUpdateProject();

  // Filter inbox tasks on client side (tasks without project_id)
  const tasks = project ? allTasks : allTasks.filter(task => !task.project_id);
  
  // UI state only
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
      // TODO: Implement task reordering with backend sync
      // For now, just visual feedback - React Query will sync on refresh
    }
  };

  // Load sections from backend
  const loadSections = React.useCallback(async () => {
    try {
      const result = project 
        ? await sectionService.getSections(project.id) // Project-specific sections
        : await sectionService.getSections(); // Inbox sections (no project_id)
      
      if (result.success) {
        setSections(result.data);
      }
    } catch (error) {
      handleError(error, {
        toastMessage: 'Failed to load sections',
        context: { projectId: project?.id }
      });
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    const enhancedTaskData: CreateTaskRequest = {
      ...taskData,
      project_id: project?.id || taskData.project_id,
      section_id: selectedSectionId && selectedSectionId !== 'no-section' ? selectedSectionId : taskData.section_id
    };
    
    await createTaskMutation.mutateAsync(enhancedTaskData);
    setShowAddTaskModal(false);
    setSelectedSectionId(null);
  };

  const handleUpdateTask = async (taskId: string, updates: UpdateTaskRequest) => {
    await updateTaskMutation.mutateAsync({ id: taskId, updates });
    
    // Update selected task if it's the one being updated
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, ...updates });
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
    await deleteTaskMutation.mutateAsync(taskId);
    setShowTaskDetail(false);
    setSelectedTask(null);
  };

  // Title editing functions
  const handleSaveTitle = async () => {
    if (!project || !editingTitle.trim()) return;
    
    const updatedProject = await updateProjectMutation.mutateAsync({
      id: project.id,
      updates: { name: editingTitle.trim() }
    });
    
    setIsEditingTitle(false);
    if (onProjectUpdate) {
      onProjectUpdate(updatedProject);
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
        handleError(result.error, {
          toastMessage: 'Failed to create section',
          context: { name, projectId: project?.id }
        });
      }
    } catch (error) {
      handleError(error, {
        toastMessage: 'Failed to create section',
        context: { name, projectId: project?.id }
      });
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
      handleError(error, {
        toastMessage: 'Failed to toggle section',
        context: { sectionId }
      });
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
        handleError(result.error, {
          toastMessage: 'Failed to rename section',
          context: { sectionId, newName }
        });
      }
    } catch (error) {
      handleError(error, {
        toastMessage: 'Failed to rename section',
        context: { sectionId, newName }
      });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const result = await sectionService.deleteSection(sectionId);
      
      if (result.success) {
        // Sections will be reloaded, React Query will handle task updates
        setSections(prev => prev.filter(section => section.id !== sectionId));
      } else {
        handleError(result.error, {
          toastMessage: 'Failed to delete section',
          context: { sectionId }
        });
      }
    } catch (error) {
      handleError(error, {
        toastMessage: 'Failed to delete section',
        context: { sectionId }
      });
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

  if (loading || tasksLoading) {
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
                className="p-1 h-auto hover:bg-success-light"
                onClick={handleSaveTitle}
              >
                <Check className="w-4 h-4 text-success" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto hover:bg-error-light"
                onClick={handleCancelEdit}
              >
                <X className="w-4 h-4 text-error" />
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
                {emptyState.title}
              </h3>
              <p className="text-body mb-4" style={{ color: 'var(--text-muted)' }}>
                {emptyState.description}
              </p>
              <Button 
                onClick={() => setShowAddTaskModal(true)}
                className="tm-btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                {emptyState.buttonText}
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
                    <div className="default-tasks-container">
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
                            <div className="px-4 pt-0 pb-1">
                              <InlineAddTask 
                                onSubmit={handleCreateTask}
                                sectionId={undefined} // Default tasks have no section
                              />
                            </div>
                            
                            {/* Subtle Add Section Button - appears on hover */}
                            <div className="group/default">
                              <div className="group-hover/default:opacity-100 opacity-0 transition-opacity duration-200">
                                <AddSectionButton 
                                  onAddSection={handleAddSection}
                                />
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Sections */}
                    {sections.map((section) => {
                      const sectionTasks = getTasksForSection(section.id);
                      return (
                        <div key={section.id} className="section-container">
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
                              <div className="px-4 pt-0 pb-1">
                                <InlineAddTask 
                                  onSubmit={handleCreateTask}
                                  sectionId={section.id} // Pass section ID for section-specific tasks
                                />
                              </div>
                              
                              {/* Subtle Add Section Button - appears on hover */}
                              <div className="group/section">
                                <div className="group-hover/section:opacity-100 opacity-0 transition-opacity duration-200">
                                  <AddSectionButton 
                                    onAddSection={handleAddSection}
                                  />
                                </div>
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