import React, { useState } from 'react';
import { Search as SearchIcon, Clock, Hash, CheckCircle2 } from 'lucide-react';

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const recentSearches = [
    'Meeting notes',
    'Design review',  
    'Budget planning',
    'Team sync'
  ];

  const mockResults = searchQuery ? [
    { id: 1, type: 'task', title: 'Design review meeting', project: 'Website Redesign' },
    { id: 2, type: 'project', title: 'Website Redesign', taskCount: 12 },
    { id: 3, type: 'task', title: 'Review user feedback', project: 'Website Redesign' },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Search Input */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                     style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search tasks, projects, and more..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tm-input pl-12 pr-4 py-4 text-body-large"
            style={{
              fontSize: '16px',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Results */}
        <div className="lg:col-span-2">
          <div className="tm-card">
            {searchQuery ? (
              <div>
                <h2 className="text-h3 mb-6" style={{ color: 'var(--text-primary)' }}>
                  Search results for "{searchQuery}"
                </h2>
                {mockResults.length === 0 ? (
                  <div className="text-center py-12">
                    <SearchIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-body" style={{ color: 'var(--text-muted)' }}>
                      No results found for your search
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockResults.map((result) => (
                      <div 
                        key={result.id}
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
                          {result.type === 'task' ? (
                            <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                          ) : (
                            <Hash className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-body font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                            {result.title}
                          </h4>
                          {result.type === 'task' && result.project && (
                            <p className="text-body-small" style={{ color: 'var(--text-muted)' }}>
                              in {result.project}
                            </p>
                          )}
                          {result.type === 'project' && (
                            <p className="text-body-small" style={{ color: 'var(--text-muted)' }}>
                              {result.taskCount} tasks
                            </p>
                          )}
                        </div>
                        <div className="text-caption" style={{ color: 'var(--text-muted)' }}>
                          {result.type === 'task' ? 'Task' : 'Project'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <SearchIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                <h3 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>
                  Search your workspace
                </h3>
                <p className="text-body" style={{ color: 'var(--text-muted)' }}>
                  Find tasks, projects, and everything in between
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Searches */}
          <div className="tm-card">
            <h3 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
              Recent searches
            </h3>
            {recentSearches.length === 0 ? (
              <p className="text-body-small" style={{ color: 'var(--text-muted)' }}>
                No recent searches
              </p>
            ) : (
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    className="flex items-center space-x-3 w-full text-left p-2 transition-all duration-150"
                    style={{ 
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => setSearchQuery(search)}
                  >
                    <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-body" style={{ color: 'var(--text-secondary)' }}>
                      {search}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Tips */}
          <div className="tm-card">
            <h3 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
              Search tips
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-body-small font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Use quotes for exact matches
                </p>
                <p className="text-body-small" style={{ color: 'var(--text-muted)' }}>
                  "team meeting" will find exact phrase
                </p>
              </div>
              <div>
                <p className="text-body-small font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Filter by type
                </p>
                <p className="text-body-small" style={{ color: 'var(--text-muted)' }}>
                  Add "task:" or "project:" to your search
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;