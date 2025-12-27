import React, { useMemo } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InboxTaskItem from '@/components/tasks/InboxTaskItem';
import AddTaskModal from '@/components/tasks/AddTaskModal';
import { useTasks, useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import type { Task, CreateTaskRequest } from '@/types/api';

const TodayPage: React.FC = () => {
  const [showAddTaskModal, setShowAddTaskModal] = React.useState(false);

  // React Query hooks - single source of truth
  const { data: allTasks = [], isLoading } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  // Filter tasks due today
  const todayTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return allTasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && dueDate < tomorrow;
    });
  }, [allTasks]);

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    // Set due date to today by default
    const today = new Date().toISOString().split('T')[0];
    await createTaskMutation.mutateAsync({
      ...taskData,
      due_date: taskData.due_date || today
    });
    setShowAddTaskModal(false);
  };

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await updateTaskMutation.mutateAsync({
      id: task.id,
      updates: { status: newStatus }
    });
  };

  const handleDateUpdate = async (task: Task, date: string) => {
    await updateTaskMutation.mutateAsync({
      id: task.id,
      updates: { due_date: date || undefined }
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
               style={{ borderColor: 'var(--primary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6">
      {/* Page Title */}
      <div className="pt-12 pb-6">
        <h1 className="text-2xl font-bold flex items-center" style={{ color: 'var(--text-primary)' }}>
          <Calendar className="w-6 h-6 mr-2" />
          Today
        </h1>
        <p className="text-[var(--text-secondary)] mt-2">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>
      
      <div className="mb-6">
        {todayTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                 style={{ backgroundColor: 'var(--border-light)' }}>
              <Calendar className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>
              No tasks due today
            </h3>
            <p className="text-body mb-4" style={{ color: 'var(--text-muted)' }}>
              Add tasks with today's date to see them here.
            </p>
            <Button 
              onClick={() => setShowAddTaskModal(true)}
              className="tm-btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add task
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-[var(--border)]">
            {todayTasks.map((task, index) => (
              <div key={task.id}>
                <InboxTaskItem
                  task={task}
                  onEdit={() => {}}
                  onDateUpdate={handleDateUpdate}
                  onToggleComplete={handleToggleComplete}
                  onComment={() => {}}
                  onOptions={() => {}}
                  showDescription={true}
                  showDueDate={true}
                />
                {index < todayTasks.length - 1 && (
                  <hr className="border-0 h-px my-0 opacity-70" 
                      style={{ backgroundColor: 'var(--border-light)' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  );
};

export default TodayPage;