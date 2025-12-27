import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import PageContainer from '@/components/ui/page-container';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Calendar,
  BarChart3,
  Target,
  ArrowUpRight,
  Zap,
  Layout,
  ListTodo
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { getRelativeTime } from '@/lib/taskUtils';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  totalProjects: number;
  completionRate: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  color?: string;
}

const GlassCard = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={cn(
      "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-2xl hover:shadow-primary/20 group",
      className
    )} 
    {...props}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    <div className="relative z-10">{children}</div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, trend, color }: StatCardProps) => (
  <GlassCard className="flex flex-col justify-between h-full">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl bg-white/5 ring-1 ring-white/10", color)}>
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </div>
      )}
    </div>
    <div>
      <h3 className="text-sm font-medium text-slate-400 mb-1">{title}</h3>
      <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
    </div>
  </GlassCard>
);

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  
  const isLoading = projectsLoading || tasksLoading;

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

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'COMPLETED' && t.due_date)
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 3);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0f172a]">
        <Spinner size="lg" text="Loading your workspace..." centered className="text-primary" />
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6 md:p-8 font-sans selection:bg-primary/30">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px] animate-pulse delay-1000" />
      </div>

      <PageContainer size="wide" className="relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-accent">Creator</span>
            </h1>
            <p className="text-slate-400 text-lg">Here's what's happening in your workspace today.</p>
          </div>
          <button 
            onClick={() => navigate('/tasks/new')}
            className="group flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-full font-semibold hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
          >
            <Zap className="w-5 h-5 fill-current" />
            <span>Quick Action</span>
          </button>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {/* Main Stats - Spans 2 cols */}
          <GlassCard className="md:col-span-2 lg:col-span-2 flex flex-col justify-between min-h-[200px]">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-slate-400 font-medium mb-1">Weekly Progress</h3>
                <div className="text-4xl font-bold text-white">{stats.completionRate}%</div>
              </div>
              <div className="p-3 bg-primary/20 rounded-xl text-primary-light">
                <BarChart3 className="w-8 h-8" />
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2 text-slate-400">
                <span>Task Completion</span>
                <span>{stats.completedTasks}/{stats.totalTasks} Tasks</span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          </GlassCard>

          {/* Secondary Stats */}
          <StatCard 
            title="Active Projects" 
            value={stats.totalProjects} 
            icon={Layout} 
            color="text-blue-400"
            trend="+2 this week"
          />
          <StatCard 
            title="Pending Tasks" 
            value={stats.pendingTasks} 
            icon={ListTodo} 
            color="text-amber-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity - Spans 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary-light" />
                Recent Activity
              </h2>
              <button onClick={() => navigate('/tasks')} className="text-sm text-primary-light hover:text-white transition-colors">
                View all
              </button>
            </div>

            <div className="grid gap-4">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <GlassCard 
                    key={task.id} 
                    className="flex items-center justify-between p-4 hover:scale-[1.01] cursor-pointer group"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border border-white/10",
                        task.status === 'COMPLETED' ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                      )}>
                        {task.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-200 group-hover:text-white transition-colors">{task.title}</h4>
                        <p className="text-sm text-slate-500">{task.project_id ? 'Project Task' : 'Inbox'} • {getRelativeTime(task.created_at)}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" />
                  </GlassCard>
                ))
              ) : (
                <GlassCard className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                    <ListTodo className="w-8 h-8 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-300">No recent activity</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mt-2">Start working on tasks to see your activity here.</p>
                </GlassCard>
              )}
            </div>
          </div>

          {/* Upcoming / Quick View - Spans 1 col */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-accent" />
              Upcoming
            </h2>
            
            <div className="space-y-4">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <GlassCard key={task.id} className="p-5 border-l-4 border-l-primary">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-primary-light uppercase tracking-wider">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }) : 'No Date'}
                      </span>
                      {task.priority && (
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          task.priority === 'HIGH' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" : 
                          task.priority === 'MEDIUM' ? "bg-amber-500" : "bg-blue-500"
                        )} />
                      )}
                    </div>
                    <h4 className="font-medium text-slate-200 line-clamp-2 mb-3">{task.title}</h4>
                    <button 
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      View Details <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </GlassCard>
                ))
              ) : (
                <GlassCard className="p-8 text-center">
                  <p className="text-slate-400">No upcoming deadlines.</p>
                  <button 
                    onClick={() => navigate('/tasks/new')}
                    className="mt-4 text-sm text-primary hover:text-primary-light font-medium"
                  >
                    + Add Task
                  </button>
                </GlassCard>
              )}

              {/* Mini Project List */}
              <GlassCard className="mt-8 p-0 overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <h3 className="font-semibold text-white">Quick Projects</h3>
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="p-2">
                    {projects.slice(0, 5).map(project => (
                      <div 
                        key={project.id}
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: project.color || '#6366f1' }}
                        />
                        <span className="text-sm text-slate-300 truncate">{project.name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </GlassCard>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
};

export default DashboardPage;