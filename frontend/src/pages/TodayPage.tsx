import React, { useMemo, useState } from 'react';
import { Calendar, ChevronDown, ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { PageSpinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import PageContainer from '@/components/ui/page-container';
import InboxTaskItem from '@/components/tasks/InboxTaskItem';
import InlineAddTask from '@/components/tasks/InlineAddTask';
import TaskDetailsModal from '@/components/tasks/TaskDetailsModal';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import type { Task, CreateTaskRequest } from '@/types/api';

const TodayPage: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [overdueCollapsed, setOverdueCollapsed] = useState(false);

  // React Query hooks - single source of truth
  const { data: allTasks = [], isLoading } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  // Separate overdue and today tasks
  const { overdueTasks, todayTasks, totalTaskCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const overdue: Task[] = [];
    const todayList: Task[] = [];

    allTasks.forEach(task => {
      if (!task.due_date || task.status === 'COMPLETED') return;
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        overdue.push(task);
      } else if (dueDate >= today && dueDate < tomorrow) {
        todayList.push(task);
      }
    });

    return { 
      overdueTasks: overdue, 
      todayTasks: todayList,
      totalTaskCount: overdue.length + todayList.length
    };
  }, [allTasks]);

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    const today = new Date().toISOString().split('T')[0];
    await createTaskMutation.mutateAsync({
      ...taskData,
      due_date: taskData.due_date || today
    });
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

  const handleEditTask = async (task: Task) => {
    await updateTaskMutation.mutateAsync({
      id: task.id,
      updates: {
        title: task.title,
        description: task.description,
        priority: task.priority,
        due_date: task.due_date,
        status: task.status
      }
    });
  };

  const handleDeleteTask = async (task: Task) => {
    await deleteTaskMutation.mutateAsync(task.id);
    setSelectedTask(null);
  };

  const handleRescheduleAll = async () => {
    const today = new Date().toISOString().split('T')[0];
    await Promise.all(
      overdueTasks.map(task => 
        updateTaskMutation.mutateAsync({
          id: task.id,
          updates: { due_date: today }
        })
      )
    );
  };

  // Format today's date header like "Dec 27 · Today · Saturday"
  const todayDateHeader = useMemo(() => {
    const today = new Date();
    const monthDay = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
    return `${monthDay} · Today · ${weekday}`;
  }, []);

  if (isLoading) {
    return (
      <PageContainer size="narrow" centerContent>
        <PageSpinner text="Loading today's tasks..." />
      </PageContainer>
    );
  }

  const hasAnyTasks = overdueTasks.length > 0 || todayTasks.length > 0;

  return (
    <PageContainer size="narrow">
      {/* Custom Header - matches inspiration */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Today
        </h1>
        <div className="flex items-center gap-1.5 mt-1">
          <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {totalTaskCount === 0 
              ? 'No tasks' 
              : totalTaskCount === 1 
                ? '1 task' 
                : `${totalTaskCount} tasks`}
          </span>
        </div>
      </div>

      {!hasAnyTasks ? (
        <>
          <EmptyState
            icon={Calendar}
            title="No tasks due today"
            description="Enjoy your free day or add some tasks!"
          />
          <div className="mt-4">
            <InlineAddTask onSubmit={handleCreateTask} />
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Overdue Section */}
          {overdueTasks.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setOverdueCollapsed(!overdueCollapsed)}
                  className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
                >
                  {overdueCollapsed ? (
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                  ) : (
                    <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                  )}
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Overdue
                  </span>
                  <span 
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: 'var(--error-light)', 
                      color: 'var(--error)' 
                    }}
                  >
                    {overdueTasks.length}
                  </span>
                </button>
                <button
                  onClick={handleRescheduleAll}
                  className="flex items-center gap-1.5 text-sm font-medium transition-all hover:opacity-80"
                  style={{ color: 'var(--error)' }}
                  title="Reschedule all overdue tasks to today"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reschedule
                </button>
              </div>
              
              {!overdueCollapsed && (
                <div className="space-y-1">
                  {overdueTasks.map((task) => (
                    <div 
                      key={task.id}
                      className="rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      <InboxTaskItem
                        task={task}
                        onEdit={(task) => setSelectedTask(task)}
                        onDateUpdate={handleDateUpdate}
                        onToggleComplete={handleToggleComplete}
                        showDescription={true}
                        showDueDate={true}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Today Section */}
          <section>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {todayDateHeader}
              </span>
            </div>
            
            {todayTasks.length > 0 ? (
              <div className="space-y-1">
                {todayTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    <InboxTaskItem
                      task={task}
                      onEdit={(task) => setSelectedTask(task)}
                      onDateUpdate={handleDateUpdate}
                      onToggleComplete={handleToggleComplete}
                      showDescription={true}
                      showDueDate={false}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm py-2" style={{ color: 'var(--text-tertiary)' }}>
                No tasks scheduled for today
              </p>
            )}

            {/* Inline Add Task */}
            <div className="mt-2">
              <InlineAddTask onSubmit={handleCreateTask} />
            </div>
          </section>
        </div>
      )}

      <TaskDetailsModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
      />
    </PageContainer>
  );
};

export default TodayPage;