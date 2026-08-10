const fs = require('fs');

const code = `import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen, BarChart3, Settings, Upload, CheckSquare, Clock, LogOut, LogIn } from 'lucide-react';
import { useStore } from './store/useStore';
import { useAuth, getAccessToken } from './contexts/AuthContext';
import { loadFromDrive, saveToDrive } from './lib/driveSync';
import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import Dashboard from './pages/Dashboard';
import Tests from './pages/Tests';
import MockTestInterface from './pages/MockTestInterface';
import ReviewInterface from './pages/ReviewInterface';
import QuestionBank from './pages/QuestionBank';
import SRSInterface from './pages/SRSInterface';
import SettingsPage from './pages/Settings';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  return (
    <aside className="w-[280px] bg-[var(--color-surface)] border-r border-[var(--color-outline-variant)] flex flex-col hidden md:flex shrink-0">
      <nav className="flex-1 py-4 px-3 space-y-1">
        <Link to="/" className={\`flex items-center gap-3 px-4 py-3 rounded-full font-medium transition-colors \${isActive('/') ? 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'}\`}>
          <BarChart3 className="h-5 w-5" /> Dashboard
        </Link>
        <Link to="/tests" className={\`flex items-center gap-3 px-4 py-3 rounded-full font-medium transition-colors \${isActive('/tests') ? 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'}\`}>
          <CheckSquare className="h-5 w-5" /> Mock Tests
        </Link>
        <Link to="/srs" className={\`flex items-center gap-3 px-4 py-3 rounded-full font-medium transition-colors \${isActive('/srs') ? 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'}\`}>
          <Clock className="h-5 w-5" /> Spaced Repetition
        </Link>
        <Link to="/bank" className={\`flex items-center gap-3 px-4 py-3 rounded-full font-medium transition-colors \${isActive('/bank') ? 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'}\`}>
          <Upload className="h-5 w-5" /> Question Bank
        </Link>
      </nav>
    </aside>
  );
};

const MobileNav = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  return (
    <nav className="md:hidden bg-[var(--color-surface)] border-t border-[var(--color-outline-variant)] flex items-center justify-around h-16 shrink-0 pb-[env(safe-area-inset-bottom)] z-20">
      <Link to="/" className={\`flex flex-col items-center gap-1 p-2 transition-colors relative overflow-hidden rounded-xl \${isActive('/') ? 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'}\`}>
        <BarChart3 className="h-5 w-5" />
        <span className="text-[10px] font-medium">Dashboard</span>
      </Link>
      <Link to="/tests" className={\`flex flex-col items-center gap-1 p-2 transition-colors relative overflow-hidden rounded-xl \${isActive('/tests') ? 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'}\`}>
        <CheckSquare className="h-5 w-5" />
        <span className="text-[10px] font-medium">Tests</span>
      </Link>
      <Link to="/srs" className={\`flex flex-col items-center gap-1 p-2 transition-colors relative overflow-hidden rounded-xl \${isActive('/srs') ? 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'}\`}>
        <Clock className="h-5 w-5" />
        <span className="text-[10px] font-medium">Review</span>
      </Link>
      <Link to="/bank" className={\`flex flex-col items-center gap-1 p-2 transition-colors relative overflow-hidden rounded-xl \${isActive('/bank') ? 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'}\`}>
        <Upload className="h-5 w-5" />
        <span className="text-[10px] font-medium">Bank</span>
      </Link>
    </nav>
  );
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--color-surface)] overflow-hidden font-sans">
      <div className="aria-announcer sr-only" aria-live="polite" aria-atomic="true" id="global-announcer"></div>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-[var(--color-surface-container)] md:rounded-tl-[32px] overflow-hidden shadow-inner relative">
          {!user && (
             <div className="absolute inset-0 bg-[var(--color-surface-container)]/95 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-lg border border-gray-100 flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <LogIn className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Sign in to Sync</h2>
                  <p className="text-gray-500 mb-8">Sign in with Google to load your tests and progress from Google Drive. Your data is securely synced to your personal Drive.</p>
                </div>
             </div>
          )}
          <div className="flex-1 google-main-stage p-4 sm:p-8 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/tests" element={<AppLayout><Tests /></AppLayout>} />
        <Route path="/test/:testId" element={<MockTestInterface />} />
        <Route path="/review/:attemptId" element={<AppLayout><ReviewInterface /></AppLayout>} />
        <Route path="/bank" element={<AppLayout><QuestionBank /></AppLayout>} />
        <Route path="/srs" element={<AppLayout><SRSInterface /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
      </Routes>
    </Router>
  );
}
`;

fs.writeFileSync('src/App.tsx', code);
