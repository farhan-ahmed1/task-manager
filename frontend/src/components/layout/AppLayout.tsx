import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

const AppLayout: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
  };

  const getPageTitle = () => {
    const path = location.pathname.replace('/', '') || 'dashboard';
    if (path === 'today') return 'Today';
    if (path === 'inbox') return 'Inbox';
    if (path === 'upcoming') return 'Upcoming';
    if (path === 'completed') return 'Completed';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--background-off)' }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full">
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
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-72">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
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

        {/* Desktop header */}
        <header className="hidden md:block" style={{ 
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)'
        }}>
          <div className="px-6 py-5">
            <div className="flex justify-between items-center">
              <h1 className="text-h2" style={{ color: 'var(--text-primary)' }}>
                {getPageTitle()}
              </h1>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="tm-btn-secondary"
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none" style={{ backgroundColor: 'var(--background)' }}>
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;