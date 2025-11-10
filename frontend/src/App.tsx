
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';

// Import pages
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import TasksPage from '@/pages/TasksPage';
import ProjectsPage from '@/pages/ProjectsPage';
import IndividualProjectPage from '@/pages/IndividualProjectPage';
import ProfilePage from '@/pages/ProfilePage';
import AddTaskPage from '@/pages/AddTaskPage';
import TodayPage from '@/pages/TodayPage';
import InboxPage from '@/pages/InboxPage';
import UpcomingPage from '@/pages/UpcomingPage';
import CompletedPage from '@/pages/CompletedPage';

// Import components
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/inbox" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="today" element={<TodayPage />} />
            <Route path="upcoming" element={<UpcomingPage />} />
            <Route path="completed" element={<CompletedPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="tasks/new" element={<AddTaskPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:projectId" element={<IndividualProjectPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
