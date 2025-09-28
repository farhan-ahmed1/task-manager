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
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="W8rBu9M main-view-layout i_TMTDC main-view-layout--narrow _19abae45 a7c6de33 _1e47f652 d607c41c bfa58fdf d19e99ad">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
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
      {/* Header */}
      <header className="otDtBXB" aria-label="Header: contains title, subtitle, actions and options related to the current view">

        
        {/* Large Header */}
        <div aria-hidden="false" data-testid="large-header" className="U0ZGVo6 IN0iPob WNoOQ_4 _19abae45 a7c6de33 _194d8611 _8ad6a17c f88bdaf1">
          <div className="_19abae45 a7c6de33 _1e47f652 bfa58fdf c68f8bf6 _8c75067a">
            <div className="QmVfZZp _19abae45 a7c6de33 b0e6eab4 _194d8611 _8ad6a17c c68f8bf6 _8c75067a">
              <h1 className="bff24867 b3e14969 _19abae45">Activity:</h1>
              <button className="e3p1Yl1T9aYYJpx5LsAsoSBYH6RbDs_c Q89aac4azgwEO7P9k8KUBkDnuWXMgOSs">
                <span className="simple_content">All projects</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" style={{ paddingTop: '4px' }}>
                  <path fill="currentColor" d="M11.646 5.647a.5.5 0 0 1 .708.707l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 1 1 .708-.707L8 9.294z"></path>
                </svg>
              </button>
            </div>
            
            {/* Filter Buttons moved here to align with title */}
            <div className="nttWE6W _19abae45 a7c6de33 _194d8611 _8ad6a17c _0315ed60">
              {/* Collaborator Filter */}
              <button 
                className="_19abae45 _56a651f6 _3930afa0 aa19cb97 _7246d092" 
                data-testid="person_picker__toggle" 
                title="Filter by collaborator" 
                aria-label="Filter by collaborator"
              >
                <div aria-hidden="true" className="_380e7c73 _19abae45 a7c6de33 _194d8611">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path fill="currentColor" fillRule="evenodd" d="M12 13.5c3.323 0 5.803.697 7.427 2.119A2.5 2.5 0 0 1 17.78 20H6.22a2.5 2.5 0 0 1-1.647-4.381C6.197 14.197 8.677 13.5 12 13.5m0 1c-3.102 0-5.353.633-6.768 1.871A1.5 1.5 0 0 0 6.22 19h11.56a1.502 1.502 0 0 0 .989-2.629C17.352 15.133 15.101 14.5 12 14.5M12 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4m0 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6"></path>
                  </svg>
                </div>
                <span className="_90654824 _19abae45 b7f35b86 _47471e4e">Everyone</span>
              </button>
              
              {/* Activity Type Filter */}
              <button 
                role="combobox" 
                aria-expanded="false" 
                type="button" 
                aria-disabled="false" 
                className="_19abae45 _56a651f6 _3930afa0 aa19cb97 _7246d092"
              >
                <div aria-hidden="true" className="_380e7c73 _19abae45 a7c6de33 _194d8611">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                    <g clipPath="url(#task-completed-16_svg__a)">
                      <rect width="16" height="16" fill="#058527" rx="8"></rect>
                      <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="16" strokeWidth="1.2" d="m4.4 8.3 2.5 2.5 5-5"></path>
                    </g>
                    <defs>
                      <clipPath id="task-completed-16_svg__a">
                        <rect width="16" height="16" fill="#fff" rx="8"></rect>
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                <span className="_90654824 _19abae45 b7f35b86 _47471e4e">Completed tasks</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="AW6uxA5 _19abae45 a7c6de33 _1b0c2c53 _1e47f652 _8ad6a17c f88bdaf1 _8c75067a b50b47ee" style={{ top: '56px' }}></div>
      </header>

      {/* Activity Content */}
      <div className="f_4GTlVaXcbEpesBv98J4ZPiL1naWuBg _19abae45 _213145b4">
        <div id="activity_app">
          {dates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No completed tasks yet</h3>
              <p className="text-gray-600">Tasks you complete will appear here as activity history.</p>
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