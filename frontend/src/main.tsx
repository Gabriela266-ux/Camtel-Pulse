import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Applique le thème avant le premier rendu React pour éviter le flash clair/sombre.
const savedTheme = localStorage.getItem('camtel-theme');
const initialDark = savedTheme
  ? savedTheme === 'dark'
  : window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.classList.toggle('dark', initialDark);
document.documentElement.style.colorScheme = initialDark ? 'dark' : 'light';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
