import React from 'react';

const TodayPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6">
      {/* Page Title */}
      <div className="pt-12 pb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Today
        </h1>
      </div>
      
      <div className="mb-6">
        <p className="text-[var(--text-secondary)]">Tasks due today will be displayed here.</p>
      </div>
      
      <div className="bg-card rounded-lg border border-[var(--border)] p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Today's Tasks</h2>
        <p className="text-muted-foreground">No tasks due today</p>
      </div>
    </div>
  );
};

export default TodayPage;