import React, { useState, useEffect } from 'react';
import { Plus, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InboxTaskItem from '@/components/tasks/InboxTaskItem';
import InlineAddTask from '@/components/tasks/InlineAddTask';
import AddTaskModal from '@/components/tasks/AddTaskModal';
import TaskDetailDialog from '@/components/tasks/TaskDetailDialog';
import DragOverlay from '@/components/tasks/DragOverlay';
import DropIndicator from '@/components/tasks/DropIndicator';
import { taskService } from '@/services/tasks';
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
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '@/types/api';

const InboxPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [overId, setOverId] = useState<string | number | null>(null);

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

  const loadInboxTasks = async () => {
    setLoading(true);
    try {
      const result = await taskService.getTasks();
      if (result.success) {
        // Filter tasks that don't belong to any project (inbox tasks)
        const inboxTasks = result.data.filter((task: Task) => !task.project_id);
        setTasks(inboxTasks);
      } else {
        console.error('Failed to load tasks:', result.error);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInboxTasks();
  }, []);

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    try {
      const result = await taskService.createTask(taskData);
      if (result.success) {
        // Only add to list if it's an inbox task (no project_id)
        if (!taskData.project_id) {
          setTasks(prev => [result.data, ...prev]);
        }
        setShowAddTaskModal(false);
      } else {
        console.error('Failed to create task:', result.error);
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

  const handleComment = (task: Task) => {
    // Placeholder for comment functionality
    console.log('Comment on task:', task.title);
  };

  const handleOptions = (task: Task) => {
    // Placeholder for options menu
    console.log('Options for task:', task.title);
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
        <div className="tm-card">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
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
                  items={tasks.map(task => task.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-0">
                    {tasks.map((task, index) => (
                      <div key={task.id}>
                        <DropIndicator isVisible={overId === task.id && activeId !== task.id} />
                        <InboxTaskItem
                          task={task}
                          onEdit={handleEditTask}
                          onDateUpdate={handleDateUpdate}
                          onToggleComplete={handleToggleComplete}
                          onComment={handleComment}
                          onOptions={handleOptions}
                        />
                        {index < tasks.length - 1 && (
                          <hr className="border-0 h-px my-0 opacity-70" style={{ backgroundColor: 'var(--border-light)' }} />
                        )}
                      </div>
                    ))}
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
              <InlineAddTask onSubmit={handleCreateTask} placeholder="Add a task..." />
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