import React from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X, PanelLeftClose } from 'lucide-react';
import Sidebar from './Sidebar';
import { SearchModal } from '@/components/ui/SearchModal';
import { useCommandPalette } from '@/hooks/useCommandPalette';

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const { isOpen, close, open } = useCommandPalette();

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
            <Sidebar 
              onClose={() => setSidebarOpen(false)} 
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              onOpenSearch={open}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`transition-all duration-500 ease-out ${sidebarOpen ? 'md:flex md:flex-shrink-0' : 'md:w-0 md:overflow-hidden'} hidden md:block`}>
        <div className="flex flex-col w-[304px]">
          <Sidebar 
            onToggle={() => {
              setSidebarOpen(!sidebarOpen);
            }}
            onOpenSearch={open}
          />
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
        {/* Compact Header - 56px height, similar to Todoist */}
        <header 
          className="flex items-center justify-end px-4 gap-2"
          style={{ 
            height: '56px',
            minHeight: '56px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--background)'
          }}
        >
          {/* Mobile menu button - only on mobile */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center h-8 w-8 transition-all duration-150 mr-auto"
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

          {/* Filter buttons - placeholder for now, can be customized per page */}
          <button 
            className="flex items-center justify-center h-8 w-8 rounded transition-all duration-150"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Filter by collaborator"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path fill="currentColor" fillRule="evenodd" d="M12 13.5c3.323 0 5.803.697 7.427 2.119A2.5 2.5 0 0 1 17.78 20H6.22a2.5 2.5 0 0 1-1.647-4.381C6.197 14.197 8.677 13.5 12 13.5m0 1c-3.102 0-5.353.633-6.768 1.871A1.5 1.5 0 0 0 6.22 19h11.56a1.502 1.502 0 0 0 .989-2.629C17.352 15.133 15.101 14.5 12 14.5M12 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4m0 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6"></path>
            </svg>
          </button>

          <button 
            className="flex items-center justify-center h-8 w-8 rounded transition-all duration-150"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Completed tasks"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path fill="currentColor" fillRule="evenodd" d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18m0-1a8 8 0 1 0 0-16 8 8 0 0 0 0 16m-2.5-5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM8 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M7.5 9a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1z" clipRule="evenodd"></path>
            </svg>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none" style={{ 
          backgroundColor: 'var(--background)' 
        }}>
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Command Palette / Search Modal - Accessible globally with Cmd+K / Ctrl+K */}
      <SearchModal isOpen={isOpen} onClose={close} />
    </div>
  );
};

export default AppLayout;