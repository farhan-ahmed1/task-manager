import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SectionTitle } from '@/components/ui/page-title';
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
    if (rate >= 90) return { color: 'text-success', status: 'Excellent' };
    if (rate >= 70) return { color: 'text-info', status: 'Good' };
    if (rate >= 50) return { color: 'text-warning', status: 'Fair' };
    return { color: 'text-error', status: 'Needs Attention' };
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
      <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200/60">
        <div className="max-w-md mx-auto">
          <div className="text-slate-400 mb-6">
            <AlertCircle className="mx-auto h-16 w-16" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Tasks Found</h3>
          <p className="text-slate-600 mb-1">This project doesn't have any tasks yet.</p>
          <p className="text-sm text-slate-500">
            Start by creating some tasks to see detailed analytics and progress tracking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Project Header */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 border border-slate-200/60 shadow-sm">
        <div className="space-y-4">
          <div>
            <SectionTitle className="mb-1">{project.name} Analytics</SectionTitle>
            <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
              {project.description || 'Project analytics and progress tracking'}
            </p>
          </div>
          
          {/* Overall Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Overall Progress</span>
              <div className="flex items-center space-x-3">
                <Badge 
                  variant="outline" 
                  className={`${progressStatus.color} border rounded-lg px-2 py-1 text-xs font-medium`}
                >
                  {progressStatus.status}
                </Badge>
                <span className="text-xl sm:text-2xl font-bold text-slate-900">{completionRate}%</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${
                  completionRate >= 80 ? 'bg-green-500' : 
                  completionRate >= 50 ? 'bg-blue-500' : 
                  completionRate >= 25 ? 'bg-yellow-500' : 'bg-slate-300'
                }`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{completedTasks} of {totalTasks} tasks completed</span>
              <span>{totalTasks - completedTasks} remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <div 
            key={index}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 hover:bg-white hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl ${stat.bgColor} border border-slate-200/60`}>
                <div className={stat.color}>
                  {stat.icon}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">{stat.title}</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task Breakdown */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:bg-white hover:shadow-md transition-all duration-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Task Breakdown</h3>
        <div className="space-y-4">
          {/* Completed Tasks */}
          <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-lg border border-green-100">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-slate-700">Completed</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-900">{completedTasks}</div>
              <div className="text-xs text-slate-500">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* In Progress Tasks */}
          <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-slate-700">In Progress</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-900">{inProgressTasks}</div>
              <div className="text-xs text-slate-500">
                {totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg border border-amber-100">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span className="text-sm font-medium text-slate-700">Pending</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-900">{pendingTasks}</div>
              <div className="text-xs text-slate-500">
                {totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectStats;