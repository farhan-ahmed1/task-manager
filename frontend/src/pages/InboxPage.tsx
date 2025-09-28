import React, { useState, useEffect } from 'react';
import { Plus, Inbox, MessageCircle, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InboxTaskItem from '@/components/tasks/InboxTaskItem';
import InlineAddTask from '@/components/tasks/InlineAddTask';
import AddTaskModal from '@/components/tasks/AddTaskModal';
import TaskDetailDialog from '@/components/tasks/TaskDetailDialog';
import DragOverlay from '@/components/tasks/DragOverlay';
import DropIndicator from '@/components/tasks/DropIndicator';
import SectionHeader from '@/components/tasks/SectionHeader';
import ViewOptionsMenu, { type ViewOptions } from '@/components/tasks/ViewOptionsMenu';
import AddSectionButton from '@/components/tasks/AddSectionButton';
import { taskService } from '@/services/tasks';
import { sectionService } from '@/services/sections';
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
import type { Task, Section, CreateTaskRequest, UpdateTaskRequest } from '@/types/api';

const InboxPage: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [overId, setOverId] = useState<string | number | null>(null);
  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    showCompletedTasks: false,
    showDescriptions: true,
    showDueDates: true,
    groupBy: 'none',
    sortBy: 'created_at',
    sortOrder: 'desc',
    layout: 'list'
  });
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

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

  const loadInboxTasks = React.useCallback(async () => {
    setLoading(true);
    
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    
    try {
      const result = await taskService.getTasks();
      if (result.success) {
        // Inbox tasks are those without a project_id (traditional inbox)
        const inboxTasks = result.data.filter((task: Task) => !task.project_id);
        setTasks(inboxTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // Load sections from backend
  const loadSections = React.useCallback(async () => {
    if (!isAuthenticated || !token) {
      return;
    }
    
    try {
      const result = await sectionService.getSections(); // Get inbox sections (no project_id)
      
      if (result.success) {
        setSections(result.data);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    loadInboxTasks();
    loadSections();
  }, [loadInboxTasks, loadSections]); // Load both tasks and sections

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    try {
      // For inbox tasks: don't set project_id (leave undefined)
      // Sections can exist independently of projects
      const enhancedTaskData: CreateTaskRequest = {
        ...taskData,
        // Don't set project_id for inbox tasks (traditional inbox approach)
        project_id: taskData.project_id, // Keep original if provided, otherwise undefined
        // If adding from a specific section, set the section_id
        section_id: selectedSectionId && selectedSectionId !== 'no-section' ? selectedSectionId : taskData.section_id
      };
      
      const result = await taskService.createTask(enhancedTaskData);
      if (result.success) {
        // Add to local state since it belongs to inbox
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
        
        // Update selected task if it's the one being updated
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

  // Section management functions
  const handleAddSection = async (name: string) => {
    try {
      const result = await sectionService.createSection({ name }); // Create inbox section (no project_id)
      
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
        // Move tasks from deleted section to default inbox (no section_id)
        // This is handled by the backend, but we update the frontend state
        setTasks(prev => prev.map(task =>
          task.section_id === sectionId
            ? { ...task, section_id: undefined }
            : task
        ));
        
        // Remove section from state
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

  // Get tasks that don't belong to any section (default inbox tasks)
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
      {/* Sticky header */}
      <div 
        className="sticky top-0 z-10 px-6 py-4 border-b backdrop-blur-sm"
        style={{ 
          backgroundColor: 'rgba(248, 249, 250, 0.95)',
          borderColor: 'var(--border-light)',
          height: '56px'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Inbox className="w-5 h-5 mr-2" style={{ color: 'var(--primary)' }} />
            <h1 className="text-h2" style={{ color: 'var(--text-primary)' }}>
              Inbox
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <ViewOptionsMenu
              options={viewOptions}
              onOptionsChange={setViewOptions}
            />
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-auto hover:bg-blue-50"
              title="Comments"
              onClick={() => {}}
            >
              <MessageCircle className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-auto hover:bg-blue-50"
              title="Project options"
              onClick={() => {}}
            >
              <MoreHorizontal className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </Button>
            <Button
              onClick={() => setShowAddTaskModal(true)}
              variant="ghost"
              size="sm"
              className="p-2 h-auto hover:bg-blue-50"
              title="Add task"
            >
              <Plus className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content with top spacing for sticky header */}
      <div className="px-6 pt-6">
        {/* Tasks container */}
        <div>
          {tasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: 'var(--border-light)' }}>
                <Inbox className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
              </div>
              <h3 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>
                Your inbox is empty
              </h3>
              <p className="text-body mb-4" style={{ color: 'var(--text-muted)' }}>
                Add your first task to get started with organizing your work.
              </p>
              <Button 
                onClick={() => setShowAddTaskModal(true)}
                className="tm-btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add your first task
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
                    {/* Default inbox tasks (no section) */}
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
                            
                            {/* Inline add task for default inbox */}
                            <div className="px-4 py-3">
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
                              
                              {/* Inline add task for this section */}
                              <div className="px-4 py-3">
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
          <TaskDetailDialog
            open={showTaskDetail}
            onOpenChange={(open) => {
              if (!open) {
                setShowTaskDetail(false);
                setSelectedTask(null);
              }
            }}
            task={selectedTask}
            onEdit={handleEditTask}
            onDelete={() => handleTaskDelete(selectedTask.id)}
          />
        )}
        

      </div>
    </div>
  );
};

export default InboxPage;