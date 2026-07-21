import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Questions from './pages/Questions';
import Upload from './pages/Upload';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Tests from './pages/Tests';
import Announcements from './pages/Announcements';
import ErrorPages from './pages/ErrorPages';

// Layout shell
import Layout from './components/Layout';

// Authorization Guard
interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('adminToken');
  const userJson = localStorage.getItem('adminUser');

  if (!token || !userJson) {
    // Force relogin if administrative parameters are empty
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const user = JSON.parse(userJson);
    if (user.role !== 'admin') {
      // Access denied if unauthorized tier attempts entry
      return <Navigate to="/admin/403" replace />;
    }
  } catch (err) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect Root path to Admin Dashboard */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Public Login Route */}
        <Route path="/admin/login" element={<Login />} />

        {/* Secure Private Administration Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <ProtectedRoute>
              <Layout>
                <Questions />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/upload"
          element={
            <ProtectedRoute>
              <Layout>
                <Upload />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tests"
          element={
            <ProtectedRoute>
              <Layout>
                <Tests />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute>
              <Layout>
                <Announcements />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Explicit System Error Overlays */}
        <Route path="/admin/403" element={<ErrorPages type="403" />} />
        <Route path="/admin/500" element={<ErrorPages type="500" />} />

        {/* Wildcard Fallback */}
        <Route path="*" element={<ErrorPages type="404" />} />
      </Routes>
    </BrowserRouter>
  );
}
