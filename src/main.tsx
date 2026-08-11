import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { DriveSync } from './components/DriveSync.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <DriveSync />
      <App />
    </AuthProvider>
  </StrictMode>,
);
