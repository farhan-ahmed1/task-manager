import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Calendar, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import type { Project, Task, TaskStatus } from '@/types/api';
import { taskService } from '@/services/tasks';

interface ProjectTaskViewProps {
  project: Project;
  onCreateTask?: () => void;
  onEditTask?: (task: Task) => void;
  className?: string;
}

const ProjectTaskView: React.FC<ProjectTaskViewProps> = ({
  project,
  onCreateTask,
  onEditTask,
  className = '',
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
  }, [project.id]);

  const getTasksByStatus = (status?: TaskStatus) => {
    if (!status) return tasks;
    return tasks.filter(task => task.status === status);
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'PENDING':
        return <Circle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PENDING':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const TaskItem: React.FC<{ task: Task }> = ({ task }) => (
    <Card 
      className="cursor-pointer hover:bg-gray-50 transition-colors"
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
              <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </Badge>
            </div>
          </div>

          {/* Task Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.due_date)}</span>
            </div>
            <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="text-center py-12">
      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {onCreateTask && (
        <Button onClick={onCreateTask} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center text-red-600">
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
            <Button onClick={onCreateTask} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {allTasks.length === 0 ? (
          <EmptyState 
            title="No tasks found" 
            description="This project doesn't have any tasks yet. Create your first task to get started." 
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
                    title="No pending tasks" 
                    description="All tasks in this project have been started or completed." 
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
                    title="No tasks in progress" 
                    description="No tasks are currently being worked on." 
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
                    title="No completed tasks" 
                    description="No tasks have been completed yet." 
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