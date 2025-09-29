import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X, PanelLeftClose } from 'lucide-react';
import Sidebar from './Sidebar';

const AppLayout: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleLogout = () => {
    logout();
  };

  const getPageTitle = () => {
    const path = location.pathname.replace('/', '') || 'dashboard';
    if (path === 'today') return 'Today';
    if (path === 'inbox') return 'Inbox';
    if (path === 'upcoming') return 'Upcoming';
    if (path === 'completed') return 'Completed';
    if (path === 'tasks') return 'Tasks';
    if (path === 'search') return 'Search';
    if (path === 'projects') return 'Projects';
    if (path.startsWith('projects/')) return 'Project';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const isProjectPage = location.pathname.startsWith('/projects/');

  return (
    <div className="h-screen flex overflow-hidden" style={{ 
      backgroundColor: 'var(--background)' 
    }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="relative flex-1 flex flex-col max-w-[304px] w-full">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <Sidebar onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarOpen(!sidebarOpen)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`transition-all duration-500 ease-out ${sidebarOpen ? 'md:flex md:flex-shrink-0' : 'md:w-0 md:overflow-hidden'} hidden md:block`}>
        <div className="flex flex-col w-[304px]">
          <Sidebar onToggle={() => {
            setSidebarOpen(!sidebarOpen);
          }} />
        </div>
      </div>

      {/* Floating toggle button - visible when sidebar is collapsed */}
      {!sidebarOpen && (
        <div className="fixed top-4 left-4 z-40 hidden md:block animate-in fade-in duration-300">
          <button
            onClick={() => {
              setSidebarOpen(true);
            }}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:bg-opacity-50 hover:scale-110 active:scale-95"
            style={{ 
              color: '#6B7280'
            }}
            title="Open sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className={`flex flex-col w-0 flex-1 overflow-hidden transition-all duration-500 ease-out ${
        !sidebarOpen ? 'md:ml-16' : ''
      }`}>
        {/* Mobile header */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-4 py-3" style={{ 
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--surface)'
          }}>
            <button
              type="button"
              className="flex items-center justify-center h-8 w-8 transition-all duration-150"
              style={{
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {getPageTitle()}
            </h1>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Desktop header - hidden for individual project pages */}
        {!isProjectPage && (
          <header className="hidden md:block" style={{ 
            backgroundColor: 'var(--background)',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div className="px-6 py-8">
              <div className="flex justify-between items-center">
                <h1 className="text-h1" style={{ color: 'var(--text-primary)' }}>
                  {getPageTitle()}
                </h1>
                <button 
                  onClick={handleLogout}
                  className="py-2 px-4 text-sm hover:opacity-60"
                  style={{
                    color: 'var(--text-secondary)',
                    backgroundColor: 'transparent',
                    border: 'none'
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none" style={{ 
          backgroundColor: 'var(--background)' 
        }}>
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;