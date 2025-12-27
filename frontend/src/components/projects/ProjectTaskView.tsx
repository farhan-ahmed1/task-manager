import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Calendar, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import type { Project, Task, TaskStatus } from '@/types/api';
import { taskService } from '@/services/tasks';
import { getTaskStatusColor, getTaskPriorityColor, formatDate } from '@/lib/taskUtils';

interface ProjectTaskViewProps {
  project: Project;
  onCreateTask?: () => void;
  onEditTask?: (task: Task) => void;
  className?: string;
  refreshTrigger?: number; // Used to trigger a refresh when tasks are created/updated
}

const ProjectTaskView: React.FC<ProjectTaskViewProps> = ({
  project,
  onCreateTask,
  onEditTask,
  className = '',
  refreshTrigger = 0,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks for this project
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await taskService.getTasks({ project_id: project.id });
        if (result.success) {
          setTasks(result.data);
        } else {
          setError(result.error.message);
        }
      } catch {
        setError('Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [project.id, refreshTrigger]);

  const getTasksByStatus = (status?: TaskStatus) => {
    if (!status) return tasks;
    return tasks.filter(task => task.status === status);
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-info" />;
      case 'PENDING':
        return <Circle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-4 w-4 text-error" />;
    }
  };

  const TaskItem: React.FC<{ task: Task }> = ({ task }) => (
    <Card 
      className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
      onClick={() => onEditTask?.(task)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Task Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              {getStatusIcon(task.status)}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{task.title}</h4>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge variant="outline" className={`text-xs ${getTaskPriorityColor(task.priority)}`}>
                {task.priority}
              </Badge>
            </div>
          </div>

          {/* Task Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{task.due_date ? formatDate(task.due_date) : 'No due date'}</span>
            </div>
            <Badge variant="outline" className={`text-xs ${getTaskStatusColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <Spinner size="lg" text="Loading tasks..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center text-error">
            <AlertCircle className="h-8 w-8 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allTasks = getTasksByStatus();
  const pendingTasks = getTasksByStatus('PENDING');
  const inProgressTasks = getTasksByStatus('IN_PROGRESS');
  const completedTasks = getTasksByStatus('COMPLETED');

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{project.name} Tasks</CardTitle>
            <CardDescription>
              {allTasks.length} task{allTasks.length !== 1 ? 's' : ''} in this project
            </CardDescription>
          </div>
          {onCreateTask && (
            <Button 
              onClick={onCreateTask} 
              size="sm"
              variant="primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {allTasks.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="No tasks found"
            description="This project doesn't have any tasks yet. Create your first task to get started."
            action={onCreateTask ? {
              label: "Create Task",
              onClick: onCreateTask,
              icon: Plus
            } : undefined}
            iconSize="md"
          />
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({allTasks.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({inProgressTasks.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {allTasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="pending" className="mt-4">
              <ScrollArea className="h-[400px]">
                {pendingTasks.length === 0 ? (
                  <EmptyState
                    icon={Circle}
                    title="No pending tasks"
                    description="All tasks in this project have been started or completed."
                    action={onCreateTask ? {
                      label: "Create Task",
                      onClick: onCreateTask,
                      icon: Plus
                    } : undefined}
                    iconSize="sm"
                  />
                ) : (
                  <div className="space-y-3">
                    {pendingTasks.map(task => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="in-progress" className="mt-4">
              <ScrollArea className="h-[400px]">
                {inProgressTasks.length === 0 ? (
                  <EmptyState
                    icon={Clock}
                    title="No tasks in progress"
                    description="No tasks are currently being worked on."
                    action={onCreateTask ? {
                      label: "Create Task",
                      onClick: onCreateTask,
                      icon: Plus
                    } : undefined}
                    iconSize="sm"
                  />
                ) : (
                  <div className="space-y-3">
                    {inProgressTasks.map(task => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4">
              <ScrollArea className="h-[400px]">
                {completedTasks.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="No completed tasks"
                    description="No tasks have been completed yet."
                    action={onCreateTask ? {
                      label: "Create Task",
                      onClick: onCreateTask,
                      icon: Plus
                    } : undefined}
                    iconSize="sm"
                  />
                ) : (
                  <div className="space-y-3">
                    {completedTasks.map(task => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectTaskView;