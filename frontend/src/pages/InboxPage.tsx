import React, { useState, useEffect } from 'react';
import { Plus, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InboxTaskItem from '@/components/tasks/InboxTaskItem';
import AddTaskModal from '@/components/tasks/AddTaskModal';
import TaskDetailDialog from '@/components/tasks/TaskDetailDialog';
import { taskService } from '@/services/tasks';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '@/types/api';

const InboxPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);


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
    <div className="max-w-5xl mx-auto p-6">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-h2" style={{ color: 'var(--text-primary)' }}>
          Inbox
        </h1>
      </div>
      
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
          <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {tasks.map((task) => (
              <InboxTaskItem
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDateUpdate={handleDateUpdate}
                onToggleComplete={handleToggleComplete}
                onComment={handleComment}
                onOptions={handleOptions}
              />
            ))}
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
  );
};

export default InboxPage;