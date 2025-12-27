import React, { useMemo } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
          <CalendarDays className="w-6 h-6 mr-2" />
          Upcoming
        </h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Tasks scheduled for future dates
        </p>
      </div>
      
      <div className="mb-6 space-y-6">
        {upcomingTasksByDate.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                 style={{ backgroundColor: 'var(--border-light)' }}>
              <CalendarDays className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>
              No upcoming tasks
            </h3>
            <p className="text-body mb-4" style={{ color: 'var(--text-muted)' }}>
              Add tasks with future dates to see them here.
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
          <>
            {upcomingTasksByDate.map(({ date, tasks }) => (
              <div key={date}>
                <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
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
                        <hr className="border-0 h-px my-0 opacity-70" 
                            style={{ backgroundColor: 'var(--border-light)' }} />
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
    </div>
  );
};

export default UpcomingPage;