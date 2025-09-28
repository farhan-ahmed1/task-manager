import React from 'react';
import { Link } from 'react-router-dom';
import ActivityItem from './ActivityItem';
import type { Task, Project } from '@/types/api';

interface ActivitySectionProps {
  date: string;
  tasks: Task[];
  projects: { [key: string]: Project };
  userAvatar?: string;
  userName?: string;
}

const ActivitySection: React.FC<ActivitySectionProps> = ({ 
  date, 
  tasks, 
  projects,
  userAvatar,
  userName 
}) => {
  const formatSectionDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ‧ Today ‧ ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
    }
    
    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ‧ Yesterday ‧ ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
    }
    
    // For other dates
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ‧ ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
  };

  const getSectionId = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <section className="section" aria-label={formatSectionDate(date)} data-testid="section">
      <header>
        <div className="section_head__overflow_actions"></div>
        <h2>
          <div className="_19abae45 a7c6de33 _194d8611 _1e964f8a c68f8bf6">
            <Link to={`/search?date=${getSectionId(date)}`}>
              {formatSectionDate(date)}
            </Link>
          </div>
        </h2>
        <hr className="section-divider" />
      </header>
      
      <ul className="items" id={`day_ul_${new Date(date).toISOString()}`}>
        {tasks.map((task, index) => (
          <React.Fragment key={task.id}>
            <ActivityItem
              task={task}
              project={task.project_id ? projects[task.project_id] : undefined}
              completionTime={task.updated_at}
              userAvatar={userAvatar}
              userName={userName}
            />
            {index < tasks.length - 1 && <hr className="activity-divider" />}
          </React.Fragment>
        ))}
      </ul>
    </section>
  );
};

export default ActivitySection;