import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { PageTitle } from '@/components/ui/page-title';
import { EmptyState } from '@/components/ui/empty-state';
import PageContainer from '@/components/ui/page-container';
import { 
  Plus, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  FolderOpen, 
  Calendar,
  BarChart3,
  AlertCircle,
  User,
  Target
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { getTaskStatusColor, getTaskPriorityColor, getRelativeTime } from '@/lib/taskUtils';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  totalProjects: number;
  completionRate: number;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  
  const isLoading = projectsLoading || tasksLoading;

  // Calculate dashboard stats
  const stats = useMemo<DashboardStats>(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
    const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length;
    const pendingTasks = tasks.filter(task => task.status === 'PENDING').length;
    const totalProjects = projects.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      totalProjects,
      completionRate,
    };
  }, [tasks, projects]);

  // Get recent tasks (last 5)
  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [tasks]);

  if (isLoading) {
    return (
      <PageContainer size="wide" centerContent>
        <Spinner size="lg" text="Loading dashboard..." centered />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide">
      <PageTitle 
        icon={BarChart3}
        subtitle="Welcome back! Here's an overview of your tasks and projects."
        className="pt-8 pb-4"
      >
        Dashboard
      </PageTitle>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--success)]">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              Tasks finished
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-[var(--primary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--primary)]">{stats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              Currently working on
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Active projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      {stats.totalTasks > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-lg font-bold">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-[var(--text-secondary)]">{stats.pendingTasks}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[var(--primary)]">{stats.inProgressTasks}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[var(--success)]">{stats.completedTasks}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Tasks</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/tasks')}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <EmptyState
                icon={AlertCircle}
                title="No tasks yet"
                description="Create your first task to get started!"
                action={{
                  label: "Create Task",
                  onClick: () => navigate('/tasks'),
                  icon: Plus
                }}
                iconSize="md"
              />
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between p-3 bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                      onClick={() => navigate('/tasks')}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={`text-xs ${getTaskStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getTaskPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{getRelativeTime(task.created_at)}</span>
                        </div>
                        {task.due_date && (
                          <div className="text-xs text-[var(--warning)] mt-1">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
        
        {/* Active Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Projects</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/projects')}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No projects yet"
                description="Create your first project to organize your tasks!"
                action={{
                  label: "Create Project",
                  onClick: () => navigate('/projects'),
                  icon: Plus
                }}
                iconSize="md"
              />
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => {
                    return (
                      <div
                        key={project.id}
                        className="p-3 bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                        onClick={() => navigate('/projects')}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm truncate">{project.name}</h4>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <BarChart3 className="h-3 w-3" />
                          </div>
                        </div>
                        {project.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                            {project.description}
                          </p>
                        )}
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              View project details
                            </div>
                          </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default DashboardPage;