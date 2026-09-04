import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { AdminPage } from '../pages/AdminPage';
import { ModificationsPage } from '../pages/ModificationsPage';
import { WelcomePage } from '../pages/WelcomePage';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';
import { SuperAdminPage } from '../pages/SuperAdminPage';

interface AppRoutesProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (user.role !== 'SUPER_ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const DashboardRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'SUPER_ADMIN') return <Navigate to="/super-admin" replace />;
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

export const AppRoutes: React.FC<AppRoutesProps> = ({ isDark, onToggleTheme }) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage isDark={isDark} onToggleTheme={onToggleTheme} />} />
        <Route path="/login" element={<LoginPage isDark={isDark} onToggleTheme={onToggleTheme} />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <DashboardRoute>
              <DashboardPage isDark={isDark} onToggleTheme={onToggleTheme} />
            </DashboardRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage isDark={isDark} onToggleTheme={onToggleTheme} />
            </AdminRoute>
          }
        />
        <Route
          path="/super-admin"
          element={
            <SuperAdminRoute>
              <SuperAdminPage isDark={isDark} onToggleTheme={onToggleTheme} />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/modifications"
          element={
            <ProtectedRoute>
              <ModificationsPage isDark={isDark} onToggleTheme={onToggleTheme} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
