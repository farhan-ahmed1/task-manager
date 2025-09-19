import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Project } from '@/types/api';
import type { ProjectStats as ProjectStatsType } from '@/services/projects';

interface ProjectStatsProps {
  project: Project;
  stats: ProjectStatsType;
  className?: string;
}

const ProjectStats: React.FC<ProjectStatsProps> = ({
  project,
  stats,
  className = '',
}) => {
  const totalTasks = stats.PENDING + stats.IN_PROGRESS + stats.COMPLETED;
  const completedTasks = stats.COMPLETED;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const inProgressTasks = stats.IN_PROGRESS;
  const pendingTasks = stats.PENDING;

  const getProgressStatus = (rate: number) => {
    if (rate >= 90) return { color: 'text-green-600', status: 'Excellent' };
    if (rate >= 70) return { color: 'text-blue-600', status: 'Good' };
    if (rate >= 50) return { color: 'text-yellow-600', status: 'Fair' };
    return { color: 'text-red-600', status: 'Needs Attention' };
  };

  const progressStatus = getProgressStatus(completionRate);

  const statsCards = [
    {
      title: 'Total Tasks',
      value: totalTasks,
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Completed',
      value: completedTasks,
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'In Progress',
      value: inProgressTasks,
      icon: <Clock className="h-4 w-4" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Pending',
      value: pendingTasks,
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  if (totalTasks === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{project.name} Statistics</CardTitle>
          <CardDescription>Project analytics and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tasks found for this project</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start by creating some tasks to see analytics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Project Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{project.name} Statistics</CardTitle>
          <CardDescription>
            {project.description || 'Project analytics and progress'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={progressStatus.color}>
                    {progressStatus.status}
                  </Badge>
                  <span className="text-lg font-bold">{completionRate}%</span>
                </div>
              </div>
              <Progress value={completionRate} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{completedTasks} of {totalTasks} tasks completed</span>
                <span>{totalTasks - completedTasks} remaining</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <div className={stat.color}>
                    {stat.icon}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Task Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Completed Tasks */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Completed</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{completedTasks}</div>
                <div className="text-xs text-muted-foreground">
                  {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                </div>
              </div>
            </div>

            {/* In Progress Tasks */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">In Progress</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{inProgressTasks}</div>
                <div className="text-xs text-muted-foreground">
                  {totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%
                </div>
              </div>
            </div>

            {/* Pending Tasks */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Pending</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{pendingTasks}</div>
                <div className="text-xs text-muted-foreground">
                  {totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectStats;