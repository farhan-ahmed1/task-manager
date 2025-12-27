import React, { useMemo } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { PageSpinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import PageContainer from '@/components/ui/page-container';
import InboxTaskItem from '@/components/tasks/InboxTaskItem';
import AddTaskModal from '@/components/tasks/AddTaskModal';
import { useTasks, useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { formatUpcomingDate } from '@/lib/taskUtils';
import type { Task, CreateTaskRequest } from '@/types/api';

const UpcomingPage: React.FC = () => {
  const [showAddTaskModal, setShowAddTaskModal] = React.useState(false);

  // React Query hooks - single source of truth
  const { data: allTasks = [], isLoading } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  // Filter and group tasks by date (upcoming only)
  const upcomingTasksByDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get tasks due after today
    const upcoming = allTasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= tomorrow;
    });

    // Group by date
    const grouped: { [key: string]: Task[] } = {};
    upcoming.forEach(task => {
      const dateKey = task.due_date!;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });

    // Sort dates
    const sortedDates = Object.keys(grouped).sort();
    return sortedDates.map(date => ({
      date,
      tasks: grouped[date]
    }));
  }, [allTasks]);

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    await createTaskMutation.mutateAsync(taskData);
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
      <PageContainer size="narrow" centerContent>
        <PageSpinner text="Loading upcoming tasks..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="narrow">
      {/* Page Title */}
      <PageTitle 
        icon={CalendarDays}
        subtitle="Tasks scheduled for future dates"
      >
        Upcoming
      </PageTitle>
      
      <div className="mb-6 space-y-6">
        {upcomingTasksByDate.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming tasks"
            description="Add tasks with future dates to see them here."
            action={{
              label: "Add task",
              onClick: () => setShowAddTaskModal(true),
              icon: Plus
            }}
          />
        ) : (
          <>
            {upcomingTasksByDate.map(({ date, tasks }) => (
              <div key={date}>
                <h2 className="text-sm font-semibold mb-3 text-text-secondary">
                  {formatUpcomingDate(date)}
                </h2>
                <div className="bg-card rounded-lg border border-[var(--border)]">
                  {tasks.map((task, index) => (
                    <div key={task.id}>
                      <InboxTaskItem
                        task={task}
                        onEdit={() => {}}
                        onDateUpdate={handleDateUpdate}
                        onToggleComplete={handleToggleComplete}
                        showDescription={true}
                        showDueDate={true}
                      />
                      {index < tasks.length - 1 && (
                        <hr className="h-px my-4 bg-border-light border-0 opacity-70" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={handleCreateTask}
      />
    </PageContainer>
  );
};

export default UpcomingPage;