import React from 'react';

const UpcomingPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6">
      {/* Page Title */}
      <div className="pt-12 pb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Upcoming
        </h1>
      </div>
      
      <div className="mb-6">
        <p className="text-[var(--text-secondary)]">Tasks scheduled for future dates.</p>
      </div>
      
      <div className="bg-card rounded-lg border border-[var(--border)] p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Upcoming Tasks</h2>
        <p className="text-muted-foreground">No upcoming tasks</p>
      </div>
    </div>
  );
};

export default UpcomingPage;