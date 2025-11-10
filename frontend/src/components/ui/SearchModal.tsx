import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Calendar, Inbox, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createSearchGroups } from '../../data/searchData';
import type { SearchItem, RecentItem } from '../../types/search';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Create search groups
  const searchGroups = useMemo(() => createSearchGroups(navigate), [navigate]);

  // Mock recent items - in real app, load from localStorage
  useEffect(() => {
    if (isOpen) {
      setRecentItems([
        {
          id: 'recent-upcoming',
          label: 'Upcoming',
          icon: CalendarDays,
          action: () => navigate('/upcoming'),
          timestamp: Date.now(),
        },
        {
          id: 'recent-today',
          label: 'Today',
          icon: Calendar,
          action: () => navigate('/today'),
          timestamp: Date.now() - 1000,
        },
        {
          id: 'recent-inbox',
          label: 'Inbox',
          icon: Inbox,
          action: () => navigate('/inbox'),
          timestamp: Date.now() - 2000,
        },
      ]);
    }
  }, [isOpen, navigate]);

  // Filter items based on query
  const filteredGroups = useMemo(() => {
    if (!query.trim()) {
      return searchGroups;
    }

    const lowerQuery = query.toLowerCase();
    return searchGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(lowerQuery) ||
            item.keywords?.some((keyword) => keyword.toLowerCase().includes(lowerQuery))
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [query, searchGroups]);

  // Get all visible items for keyboard navigation
  const allItems = useMemo(() => {
    const items: Array<{ type: 'recent' | 'search'; item: SearchItem | RecentItem }> = [];
    
    if (!query.trim() && recentItems.length > 0) {
      recentItems.forEach((item) => items.push({ type: 'recent', item }));
    }
    
    filteredGroups.forEach((group) => {
      group.items.forEach((item) => items.push({ type: 'search', item }));
    });
    
    return items;
  }, [query, recentItems, filteredGroups]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (allItems[selectedIndex]) {
            allItems[selectedIndex].item.action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allItems, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    
    const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="animate-in slide-in-from-top-2 duration-200 rounded-lg border shadow-2xl overflow-hidden"
        style={{ width: '750px', maxWidth: '90vw', backgroundColor: 'var(--background)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div 
          className="border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div 
            className="flex items-center gap-3 px-4 py-3"
          >
            <Search className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.border = 'none';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Search or type a command…"
              className="flex-1 bg-transparent text-sm placeholder-gray-400"
              style={{ 
                color: 'var(--text-primary)', 
                boxShadow: 'none',
                outline: 'none',
                border: 'none'
              }}
              autoComplete="off"
            />
            <kbd 
              className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface-hover)',
                borderColor: 'var(--border)'
              }}
            >
              <span>⌘</span>
              <span>K</span>
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="overflow-y-auto"
          style={{ 
            height: '450px'
          }}
        >
          {/* Recently Viewed */}
          {!query.trim() && recentItems.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2">
                <h3 
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Recently viewed
                </h3>
              </div>
              {recentItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    data-index={index}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{
                      backgroundColor: selectedIndex === index ? 'var(--surface-hover)' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedIndex !== index) {
                        e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedIndex !== index) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ color: 'var(--text-secondary)' }}>
                      <Icon className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Filtered Groups */}
          {filteredGroups.map((group) => {
            const groupStartIndex = !query.trim() ? recentItems.length : 0;
            const itemsBeforeGroup = filteredGroups
              .slice(0, filteredGroups.indexOf(group))
              .reduce((acc, g) => acc + g.items.length, groupStartIndex);

            return (
              <div key={group.id} className="py-2">
                <div className="px-4 py-2">
                  <h3 
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {group.label}
                  </h3>
                </div>
                {group.items.map((item, index) => {
                  const Icon = item.icon;
                  const globalIndex = itemsBeforeGroup + index;

                  return (
                    <button
                      key={item.id}
                      data-index={globalIndex}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors"
                      style={{
                        backgroundColor: selectedIndex === globalIndex ? 'var(--surface-hover)' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedIndex !== globalIndex) {
                          e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedIndex !== globalIndex) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div style={{ color: 'var(--text-secondary)' }}>
                          <Icon className="w-5 h-5 flex-shrink-0" />
                        </div>
                        <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                          {item.label}
                        </span>
                      </div>
                      {item.shortcut && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.shortcut.separator === 'then' && (
                            <div className="flex items-center gap-1">
                              {item.shortcut.keys.map((key, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <kbd 
                                    className="px-1.5 py-0.5 text-xs font-medium rounded border"
                                    style={{
                                      color: 'var(--text-secondary)',
                                      backgroundColor: 'var(--surface-hover)',
                                      borderColor: 'var(--border)'
                                    }}
                                  >
                                    {key}
                                  </kbd>
                                  {idx < item.shortcut!.keys.length - 1 && (
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                      then
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {item.shortcut.separator === '+' && (
                            <kbd 
                              className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium rounded border"
                              style={{
                                color: 'var(--text-secondary)',
                                backgroundColor: 'var(--surface-hover)',
                                borderColor: 'var(--border)'
                              }}
                            >
                              {item.shortcut.keys.map((key, idx) => (
                                <span key={idx}>{key}</span>
                              ))}
                            </kbd>
                          )}
                          {!item.shortcut.separator && (
                            <kbd 
                              className="px-1.5 py-0.5 text-xs font-medium rounded border"
                              style={{
                                color: 'var(--text-secondary)',
                                backgroundColor: 'var(--surface-hover)',
                                borderColor: 'var(--border)'
                              }}
                            >
                              {item.shortcut.keys[0]}
                            </kbd>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* No Results */}
          {query.trim() && filteredGroups.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
