import React, { useEffect, useState } from 'react';
import { AuthProvider } from './auth/AuthProvider';
import { AppRoutes } from './routes/AppRoutes';
import { RealtimeBridge } from './components/RealtimeBridge';

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('camtel-theme');
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('camtel-theme', isDark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'camtel-theme' && event.newValue) {
        setIsDark(event.newValue === 'dark');
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <AuthProvider>
      <RealtimeBridge />
      <AppRoutes isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} />
    </AuthProvider>
  );
};

export default App;
