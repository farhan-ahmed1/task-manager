import React from 'react';
import { Link } from 'react-router-dom';
import type { Task, Project } from '@/types/api';

interface ActivityItemProps {
  task: Task;
  project?: Project;
  completionTime: string;
  userAvatar?: string;
  userName?: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ 
  task, 
  project, 
  completionTime,
  userAvatar,
  userName = "You"
}) => {
  const getUserColor = (name: string) => {
    // Generate a consistent color based on the user's name
    const colors = [
      '#4285f4', // Blue
      '#ea4335', // Red
      '#34a853', // Green
      '#fbbc04', // Yellow
      '#ff6d01', // Orange
      '#9c27b0', // Purple
      '#00bcd4', // Cyan
      '#795548', // Brown
      '#607d8b', // Blue Grey
      '#e91e63', // Pink
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const formatCompletionTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getProjectName = () => {
    if (project) {
      return project.name;
    }
    return task.project_id ? 'Unknown Project' : 'Inbox';
  };

  const getProjectLink = () => {
    if (project) {
      return `/projects/${project.id}`;
    }
    return task.project_id ? `/projects/${task.project_id}` : '/inbox';
  };

  return (
    <li className="event">
      <div className="large-avatar">
        <div className="avatar-circle">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt={userName}
              className="avatar-image"
            />
          ) : (
            <div 
              className="avatar-placeholder"
              style={{ backgroundColor: getUserColor(userName) }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="completion-badge">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            fill="none" 
            viewBox="0 0 16 16"
          >
            <g clipPath="url(#task-completed-16_svg__a)">
              <rect width="16" height="16" fill="#058527" rx="8"></rect>
              <path 
                stroke="#fff" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeMiterlimit="16" 
                strokeWidth="1.2" 
                d="m4.4 8.3 2.5 2.5 5-5"
              ></path>
            </g>
            <defs>
              <clipPath id="task-completed-16_svg__a">
                <rect width="16" height="16" fill="#fff" rx="8"></rect>
              </clipPath>
            </defs>
          </svg>
        </div>
      </div>
      
      <div className="activity-content">
        <div className="activity-main-line">
          <span className="user-name">{userName}</span>
          <span className="action-text"> completed a task: </span>
          <Link 
            className="task-link" 
            to={`/tasks`}
          >
            <span className="task-title">{task.title}</span>
          </Link>
        </div>
        
        <div className="activity-meta-line">
          <span className="completion-time">
            {formatCompletionTime(completionTime)}
          </span>
          <Link 
            className="project-link" 
            to={getProjectLink()}
          >
            <span className="project-info">
              <span className="project-name">{getProjectName()}</span>
              {!task.project_id ? (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="12" 
                  height="12" 
                  fill="none" 
                  viewBox="0 0 16 16" 
                  aria-hidden="true" 
                  className="project-icon"
                >
                  <path 
                    fill="currentColor" 
                    fillRule="evenodd" 
                    d="M5.509 2h4.982a2 2 0 0 1 1.923 1.45l1.509 5.28q.077.271.077.55V12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.28a2 2 0 0 1 .077-.55l1.509-5.28A2 2 0 0 1 5.509 2m0 1a1 1 0 0 0-.962.726l-1.509 5.28A1 1 0 0 0 3 9.28V12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.28a1 1 0 0 0-.039-.274l-1.508-5.28A1 1 0 0 0 10.49 3zm4.685 7a2.25 2.25 0 0 1-4.388 0H4.5a.5.5 0 1 1 0-1h1.75a.5.5 0 0 1 .5.5 1.25 1.25 0 0 0 2.5 0 .5.5 0 0 1 .5-.5h1.75a.5.5 0 0 1 0 1z" 
                    clipRule="evenodd"
                  ></path>
                </svg>
              ) : (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="12" 
                  height="12" 
                  fill="none" 
                  viewBox="0 0 12 12" 
                  aria-hidden="true" 
                  className="project-icon project-icon--colored"
                >
                  <path 
                    fill="currentColor" 
                    fillRule="evenodd" 
                    d="M4.555 1.003a.5.5 0 0 1 .442.552L4.781 3.5h2.994l.228-2.055a.5.5 0 0 1 .994.11L8.781 3.5H10.5a.5.5 0 0 1 0 1H8.67l-.334 3H10a.5.5 0 0 1 0 1H8.225l-.228 2.055a.5.5 0 0 1-.994-.11L7.22 8.5H4.225l-.228 2.055a.5.5 0 0 1-.994-.11L3.22 8.5H1.5a.5.5 0 0 1 0-1h1.83l.334-3H2a.5.5 0 1 1 0-1h1.775l.228-2.055a.5.5 0 0 1 .552-.442M7.33 7.5l.334-3H4.67l-.334 3z" 
                    clipRule="evenodd"
                  ></path>
                </svg>
              )}
            </span>
          </Link>
        </div>
      </div>
    </li>
  );
};

export default ActivityItem;