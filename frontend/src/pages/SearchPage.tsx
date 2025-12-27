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
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Search tasks, projects, and more..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tm-input pl-12 pr-4 py-4 text-body-large rounded-lg shadow-md"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Results */}
        <div className="lg:col-span-2">
          <div className="tm-card">
            {searchQuery ? (
              <div>
                <h2 className="text-h3 mb-6 text-text-primary">
                  Search results for "{searchQuery}"
                </h2>
                {mockResults.length === 0 ? (
                  <div className="text-center py-12">
                    <SearchIcon className="w-12 h-12 mx-auto mb-4 text-text-muted" />
                    <p className="text-body text-text-muted">
                      No results found for your search
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockResults.map((result) => (
                      <div 
                        key={result.id}
                        className="flex items-center space-x-4 p-4 transition-all duration-150 cursor-pointer rounded-sm border border-transparent hover:bg-surface-hover hover:border-border"
                      >
                        <div className="flex-shrink-0">
                          {result.type === 'task' ? (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          ) : (
                            <Hash className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-body font-medium mb-1 text-text-primary">
                            {result.title}
                          </h4>
                          {result.type === 'task' && result.project && (
                            <p className="text-body-small text-text-muted">
                              in {result.project}
                            </p>
                          )}
                          {result.type === 'project' && (
                            <p className="text-body-small text-text-muted">
                              {result.taskCount} tasks
                            </p>
                          )}
                        </div>
                        <div className="text-caption text-text-muted">
                          {result.type === 'task' ? 'Task' : 'Project'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <SearchIcon className="w-16 h-16 mx-auto mb-4 text-text-muted" />
                <h3 className="text-h3 mb-2 text-text-primary">
                  Search your workspace
                </h3>
                <p className="text-body text-text-muted">
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
            <h3 className="text-h3 mb-4 text-text-primary">
              Recent searches
            </h3>
            {recentSearches.length === 0 ? (
              <p className="text-body-small text-text-muted">
                No recent searches
              </p>
            ) : (
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    className="flex items-center gap-2 w-full text-left p-2 rounded-sm hover:bg-surface-hover transition-colors"
                    onClick={() => setSearchQuery(search)}
                  >
                    <Clock className="w-4 h-4 flex-shrink-0 text-text-muted" />
                    <span className="text-body text-text-secondary">
                      {search}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Tips */}
          <div className="tm-card">
            <h3 className="text-h3 mb-4 text-text-primary">
              Search tips
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-body-small font-medium mb-1 text-text-primary">
                  Use quotes for exact matches
                </p>
                <p className="text-body-small text-text-muted">
                  "team meeting" will find exact phrase
                </p>
              </div>
              <div>
                <p className="text-body-small font-medium mb-1 text-text-primary">
                  Filter by type
                </p>
                <p className="text-body-small text-text-muted">
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