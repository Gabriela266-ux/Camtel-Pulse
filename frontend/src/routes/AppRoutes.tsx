import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { AdminPage } from '../pages/AdminPage';
import { ModificationsPage } from '../pages/ModificationsPage';
import { WelcomePage } from '../pages/WelcomePage';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';

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
            <ProtectedRoute>
              <DashboardPage isDark={isDark} onToggleTheme={onToggleTheme} />
            </ProtectedRoute>
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
