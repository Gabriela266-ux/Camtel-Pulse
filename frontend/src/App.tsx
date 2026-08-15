import React, { useEffect, useState } from 'react';
import { AuthProvider } from './auth/AuthContext';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('camtel-theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('camtel-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <AuthProvider>
      <AppRoutes isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} />
    </AuthProvider>
  );
};

export default App;