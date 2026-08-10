import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { DriveSync } from './components/DriveSync.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = "420634453219-rair58hugf2uvdoo78ien8b91bu88po8.apps.googleusercontent.com";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <DriveSync />
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
