import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useProjectStore, useTaskStore } from '@/store/useStore';
import { projectService } from '@/services/projects';
import { taskService } from '@/services/tasks';
import type { Task } from '@/types/api';
import type { ProjectStats } from '@/services/projects';

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
  const { projects, setProjects, setLoading: setProjectsLoading } = useProjectStore();
  const { tasks, setTasks, setLoading: setTasksLoading } = useTaskStore();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    totalProjects: 0,
    completionRate: 0,
  });
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({});
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setProjectsLoading(true);
      setTasksLoading(true);

      try {
        // Load projects and tasks in parallel
        const [projectsResult, tasksResult] = await Promise.all([
          projectService.getProjects(),
          taskService.getTasks(),
        ]);

        if (projectsResult.success) {
          setProjects(projectsResult.data);
        }

        if (tasksResult.success) {
          setTasks(tasksResult.data);
          
          // Set recent tasks (last 5)
          const sortedTasks = [...tasksResult.data]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);
          setRecentTasks(sortedTasks);
        }

        // Load project stats
        if (projectsResult.success && projectsResult.data.length > 0) {
          const statsPromises = projectsResult.data.map(async (project) => {
            const result = await projectService.getProjectStats(project.id);
            return { projectId: project.id, stats: result.success ? result.data : null };
          });

          const statsResults = await Promise.all(statsPromises);
          const statsMap: Record<string, ProjectStats> = {};
          
          statsResults.forEach(({ projectId, stats }) => {
            if (stats) {
              statsMap[projectId] = stats;
            }
          });

          setProjectStats(statsMap);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
        setProjectsLoading(false);
        setTasksLoading(false);
      }
    };

    loadDashboardData();
  }, [setProjects, setTasks, setProjectsLoading, setTasksLoading]);

  // Calculate dashboard stats
  useEffect(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
    const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length;
    const pendingTasks = tasks.filter(task => task.status === 'PENDING').length;
    const totalProjects = projects.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    setStats({
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      totalProjects,
      completionRate,
    });
  }, [tasks, projects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PENDING':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your tasks and projects.
        </p>
      </div>

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
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              Tasks finished
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</div>
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
                  <div className="text-lg font-bold text-gray-600">{stats.pendingTasks}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">{stats.inProgressTasks}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{stats.completedTasks}</div>
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
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No tasks yet. Create your first task to get started!
                </p>
                <Button onClick={() => navigate('/tasks')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
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
                          <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(task.created_at)}</span>
                        </div>
                        {task.due_date && (
                          <div className="text-xs text-orange-600 mt-1">
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
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No projects yet. Create your first project to organize your tasks!
                </p>
                <Button onClick={() => navigate('/projects')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => {
                    const stats = projectStats[project.id];
                    const totalTasks = stats ? stats.PENDING + stats.IN_PROGRESS + stats.COMPLETED : 0;
                    const completedTasks = stats?.COMPLETED || 0;
                    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                    return (
                      <div
                        key={project.id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
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
                        {totalTasks > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{completionRate}%</span>
                            </div>
                            <Progress value={completionRate} className="h-1" />
                            <div className="text-xs text-muted-foreground">
                              {completedTasks} of {totalTasks} tasks completed
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;