import React from 'react';
import { MemoryRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen, BarChart3, Settings, Upload, CheckSquare, Clock, LogOut, LogIn } from 'lucide-react';
import { useStore } from './store/useStore';
import { useAuth, getAccessToken } from './contexts/AuthContext';
import { loadFromDrive, saveToDrive } from './lib/driveSync';
import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import Dashboard from './pages/Dashboard';
import Tests from './pages/Tests';
import TestDetails from './pages/TestDetails';
import TestAnswers from './pages/TestAnswers';
import MockTestInterface from './pages/MockTestInterface';
import ReviewInterface from './pages/ReviewInterface';
import QuestionBank from './pages/QuestionBank';
import SettingsPage from './pages/Settings';
import { motion } from 'motion/react';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard' },
    { path: '/tests', icon: CheckSquare, label: 'Mock Tests' },
    { path: '/bank', icon: Upload, label: 'Question Bank' }
  ];

  return (
    <aside className="w-[220px] bg-white border-r border-slate-100 flex flex-col hidden md:flex shrink-0 z-10 relative shadow-[1px_0_15px_rgba(0,0,0,0.02)]">
      <nav className="flex-1 py-6 px-4 space-y-2" aria-label="Main Navigation">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            aria-current={isActive(item.path) ? 'page' : undefined}
            className="block outline-none"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`group flex items-center gap-3 px-3 py-3 rounded-2xl font-medium transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <item.icon className={`h-4 w-4 transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110 group-hover:text-blue-500'}`} />
              <span className="text-sm tracking-wide">{item.label}</span>
              {isActive(item.path) && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.div>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

const MobileNav = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard' },
    { path: '/tests', icon: CheckSquare, label: 'Tests' },
    { path: '/bank', icon: Upload, label: 'Bank' }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.03)]" aria-label="Mobile Navigation">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          aria-current={isActive(item.path) ? 'page' : undefined}
          className="block outline-none"
        >
          <motion.div
            whileTap={{ scale: 0.9 }}
            className={`group flex flex-col items-center justify-center gap-1 p-2 w-16 h-14 transition-all duration-300 rounded-2xl relative ${
              isActive(item.path)
                ? 'text-blue-600'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {isActive(item.path) && (
              <motion.div 
                layoutId="mobile-nav-active"
                className="absolute inset-0 bg-blue-50 rounded-2xl -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <item.icon className={`h-5 w-5 transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className={`text-[11px] font-semibold tracking-wide transition-all duration-300 ${isActive(item.path) ? 'opacity-100' : 'opacity-80'}`}>
              {item.label}
            </span>
          </motion.div>
        </Link>
      ))}
    </nav>
  );
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 overflow-hidden font-sans">
      <div className="aria-announcer sr-only" aria-live="polite" aria-atomic="true" id="global-announcer"></div>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 md:rounded-tl-[32px] overflow-hidden relative">
          {!user && (
             <div className="absolute inset-0 bg-slate-50/95 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-3 text-center">
                <div className="bg-white p-6 rounded-3xl max-w-md w-full shadow-lg border border-slate-100 flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <LogIn className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-3">Sign in to Sync</h2>
                  <p className="text-slate-500 mb-6">Sign in with Google to load your tests and progress from Google Drive. Your data is securely synced to your personal Drive.</p>
                </div>
             </div>
          )}
          <div className="flex-1 google-main-stage px-3 py-3 md:p-8 pb-20 md:pb-8 overflow-y-auto">
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
        <Route path="/test-details/:testId" element={<AppLayout><TestDetails /></AppLayout>} />
        <Route path="/test-answers/:testId" element={<AppLayout><TestAnswers /></AppLayout>} />
        <Route path="/test/:testId" element={<MockTestInterface />} />
        <Route path="/review/:attemptId" element={<AppLayout><ReviewInterface /></AppLayout>} />
        <Route path="/bank" element={<AppLayout><QuestionBank /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
      </Routes>
    </Router>
  );
}
