import React, { useMemo } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { PageSpinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
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
        <PageSpinner text="Loading today's tasks..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6">
      {/* Page Title */}
      <PageTitle 
        icon={Calendar}
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      >
        Today
      </PageTitle>
      
      <div className="mb-6">
        {todayTasks.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No tasks due today"
            description="Add tasks with today's date to see them here."
            action={{
              label: "Add task",
              onClick: () => setShowAddTaskModal(true),
              icon: Plus
            }}
          />
        ) : (
          <div className="bg-card rounded-lg border border-[var(--border)]">
            {todayTasks.map((task, index) => (
              <div key={task.id}>
                <InboxTaskItem
                  task={task}
                  onEdit={() => {}}
                  onDateUpdate={handleDateUpdate}
                  onToggleComplete={handleToggleComplete}
                  showDescription={true}
                  showDueDate={true}
                />
                {index < todayTasks.length - 1 && (
                  <hr className="h-px my-4 bg-border-light border-0 opacity-70\" />
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