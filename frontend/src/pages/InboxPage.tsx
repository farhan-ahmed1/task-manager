import React from 'react';
import { Plus, Filter, ArrowUpDown } from 'lucide-react';

const InboxPage: React.FC = () => {
  const mockTasks = [
    { id: 1, title: 'Review project proposal', priority: 'high', dueDate: 'Today' },
    { id: 2, title: 'Schedule team meeting', priority: 'medium', dueDate: 'Tomorrow' },
    { id: 3, title: 'Update documentation', priority: 'low', dueDate: 'This week' },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Page description */}
      <div className="mb-6">
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          All your unsorted tasks appear here. Organize them into projects or complete them directly.
        </p>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button className="tm-btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add task</span>
          </button>
          <button className="tm-btn-ghost flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="tm-btn-ghost flex items-center space-x-2">
            <ArrowUpDown className="w-4 h-4" />
            <span>Sort</span>
          </button>
        </div>
      </div>
      
      {/* Tasks container */}
      <div className="tm-card">
        <div className="space-y-4">
          {mockTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: 'var(--border-light)' }}>
                <Plus className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
              </div>
              <h3 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>Your inbox is empty</h3>
              <p className="text-body" style={{ color: 'var(--text-muted)' }}>
                Add your first task to get started with organizing your work.
              </p>
            </div>
          ) : (
            mockTasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-center space-x-4 p-4 transition-all duration-150 cursor-pointer"
                style={{ 
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 rounded-full border-2 cursor-pointer hover:bg-gray-50"
                       style={{ borderColor: 'var(--border)' }}>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
                    {task.title}
                  </h4>
                  <p className="text-body-small" style={{ color: 'var(--text-muted)' }}>
                    Due {task.dueDate}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div 
                    className={`w-3 h-3 rounded-full ${
                      task.priority === 'high' ? 'priority-high' : 
                      task.priority === 'medium' ? 'priority-medium' : 
                      'priority-low'
                    }`}
                    style={{
                      backgroundColor: 
                        task.priority === 'high' ? 'var(--error)' :
                        task.priority === 'medium' ? 'var(--warning)' :
                        'var(--success)'
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxPage;