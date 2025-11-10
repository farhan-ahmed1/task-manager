import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { taskService } from '@/services/tasks';
import { projectService } from '@/services/projects';
import { useAuth } from '@/context/AuthContext';
import ActivitySection from '@/components/activity/ActivitySection';
import '@/components/activity/activity.css';
import type { Task, Project } from '@/types/api';

const CompletedPage: React.FC = () => {
  const { user } = useAuth();
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<{ [key: string]: Project }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const loadCompletedTasks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch completed tasks
        const tasksResult = await taskService.getTasks({ status: 'COMPLETED' });
        if (!tasksResult.success) {
          setError(tasksResult.error.message);
          return;
        }

        const tasks = tasksResult.data;
        setCompletedTasks(tasks);

        // Fetch projects for tasks that have project_id
        const projectIds = [...new Set(tasks.map(task => task.project_id).filter(Boolean))];
        if (projectIds.length > 0) {
          const projectsResult = await projectService.getProjects();
          if (projectsResult.success) {
            const projectsMap: { [key: string]: Project } = {};
            projectsResult.data.forEach(project => {
              if (projectIds.includes(project.id)) {
                projectsMap[project.id] = project;
              }
            });
            setProjects(projectsMap);
          }
        }
      } catch (err) {
        setError('Failed to load completed tasks');
        console.error('Error loading completed tasks:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompletedTasks();
  }, []);

  // Group tasks by completion date (using updated_at as proxy for completion time)
  const groupTasksByDate = (tasks: Task[]) => {
    const grouped: { [key: string]: Task[] } = {};
    
    tasks.forEach(task => {
      const completionDate = new Date(task.updated_at);
      const dateKey = completionDate.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });

    // Sort tasks within each date by completion time (newest first)
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });

    return grouped;
  };

  // Sort dates (newest first)
  const sortedDates = (groupedTasks: { [key: string]: Task[] }) => {
    return Object.keys(groupedTasks).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  };

  if (isLoading) {
    return (
      <div className="W8rBu9M main-view-layout i_TMTDC main-view-layout--narrow _19abae45 a7c6de33 _1e47f652 d607c41c bfa58fdf d19e99ad">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="W8rBu9M main-view-layout i_TMTDC main-view-layout--narrow _19abae45 a7c6de33 _1e47f652 d607c41c bfa58fdf d19e99ad">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-error mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const groupedTasks = groupTasksByDate(completedTasks);
  const dates = sortedDates(groupedTasks);

  return (
    <div className="W8rBu9M main-view-layout i_TMTDC main-view-layout--narrow _19abae45 a7c6de33 _1e47f652 d607c41c bfa58fdf d19e99ad">
      {/* Content - title integrated */}
      <div className="px-6">
        {/* Page Title */}
        <div className="pt-12 pb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Completed
          </h1>
        </div>
      </div>

      {/* Activity Content */}
      <div className="f_4GTlVaXcbEpesBv98J4ZPiL1naWuBg _19abae45 _213145b4">
        <div id="activity_app">
          {dates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-[var(--text-tertiary)] mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No completed tasks yet</h3>
              <p className="text-[var(--text-secondary)]">Tasks you complete will appear here as activity history.</p>
            </div>
          ) : (
            <>
              {dates.map(date => (
                <ActivitySection
                  key={date}
                  date={date}
                  tasks={groupedTasks[date]}
                  projects={projects}
                  userAvatar={undefined}
                  userName={user?.name || 'You'}
                />
              ))}
              
              {/* End message */}
              <div className="_19abae45 a7c6de33 _1e47f652 _43e5f8e9 _8c75067a">
                <hr className="b6f67ff8 _19abae45" />
                <div className="_19abae45 a7c6de33 _194d8611 f88bdaf1">
                  <p className="no_more_results">That's it. No more history to load.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletedPage;