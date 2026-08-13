import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from "./ErrorBoundary.tsx";
import { AuthProvider } from './contexts/AuthContext.tsx';
import { DriveSync } from './components/DriveSync.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary><AuthProvider>
      <DriveSync />
      <App />
    </AuthProvider></ErrorBoundary>
  </StrictMode>,
);
