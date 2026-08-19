import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen, BarChart3, Settings, Upload, CheckSquare, Clock, LogIn } from 'lucide-react';
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
import { useAuth } from './contexts/AuthContext';

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isSigningIn, authError, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/20 flex flex-col items-center justify-center p-6 text-center font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/90 backdrop-blur-2xl p-8 md:p-10 rounded-[32px] max-w-md w-full shadow-2xl shadow-blue-500/10 border border-slate-100/80 flex flex-col items-center relative overflow-hidden"
        >
          <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner relative">
            <BookOpen className="w-10 h-10 text-blue-600" />
          </div>

          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Mockly</h1>
          <p className="text-slate-500 text-sm mt-3 leading-relaxed">
            Please sign in with Google to access mock tests, import custom test papers, and sync your progress securely with Firebase.
          </p>

          {authError && (
            <div className="w-full bg-amber-50 text-amber-900 border border-amber-200 text-xs p-4 rounded-2xl mt-4 text-left space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <span>⚠️ Firebase Authorized Domain Required</span>
              </div>
              <p className="text-amber-700 leading-relaxed">
                Your current domain is not yet added to your Firebase project's <strong>Authorized Domains</strong> list.
              </p>
              <div className="bg-white/80 border border-amber-200 rounded-lg p-2 flex items-center justify-between gap-2 font-mono text-[11px] text-slate-800">
                <span className="truncate">{window.location.hostname}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(window.location.hostname)}
                  className="px-2 py-0.5 bg-amber-200/60 hover:bg-amber-200 text-amber-900 rounded text-[10px] font-bold shrink-0 transition-colors"
                >
                  Copy Domain
                </button>
              </div>
              <p className="text-[11px] text-amber-700">
                1. Go to <a href="https://console.firebase.google.com/project/mockly-6950a/authentication/settings" target="_blank" rel="noreferrer" className="underline font-bold text-amber-900 hover:text-amber-950">Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</a>.<br />
                2. Click <strong>Add domain</strong> and paste <code>{window.location.hostname}</code>.<br />
                3. Click <strong>Save</strong> and retry signing in.
              </p>
            </div>
          )}

          <motion.button
            whileHover={{ scale: isSigningIn ? 1 : 1.02 }}
            whileTap={{ scale: isSigningIn ? 1 : 0.98 }}
            onClick={signInWithGoogle}
            disabled={isSigningIn}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-3 text-sm mt-6 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>Sign In with Google</span>
              </>
            )}
          </motion.button>

          <p className="text-xs text-slate-400 mt-6">
            Authentication required to protect tests and sync data.
          </p>
        </motion.div>
      </div>
    );
  };

  return <>{children}</>;
};

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard' },
    { path: '/tests', icon: CheckSquare, label: 'Mock Tests' },
    { path: '/bank', icon: Upload, label: 'Question Bank' }
  ];

  return (
    <aside className="w-[200px] bg-white border-r border-slate-200 flex flex-col hidden md:flex shrink-0 z-10 relative">
      <nav className="flex-1 py-4 px-2 space-y-1" aria-label="Main Navigation">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            aria-current={isActive(item.path) ? 'page' : undefined}
            className="block outline-none"
          >
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isActive(item.path)
                  ? 'bg-blue-50/80 text-blue-700 shadow-xs border border-blue-100/50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <item.icon className={`h-4 w-4 transition-transform duration-300 ${isActive(item.path) ? 'scale-105' : 'group-hover:scale-105 group-hover:text-blue-500'}`} />
              <span className="text-sm tracking-tight">{item.label}</span>
              {isActive(item.path) && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 w-[3px] h-6 bg-blue-600 rounded-r-full"
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
  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 overflow-hidden font-sans">
      <div className="aria-announcer sr-only" aria-live="polite" aria-atomic="true" id="global-announcer"></div>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-hidden relative border-l border-slate-200/50">
          <div className="flex-1 px-3 py-4 md:px-6 md:py-6 pb-20 md:pb-6 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

import { HeaderProvider } from './contexts/HeaderContext';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function App() {
  return (
    <HeaderProvider>
      <Router>
        <AuthGuard>
          <Routes>
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/tests" element={<AppLayout><Tests /></AppLayout>} />
            <Route path="/test-details/:testId" element={<AppLayout><TestDetails /></AppLayout>} />
            <Route path="/test-answers/:testId" element={<AppLayout><TestAnswers /></AppLayout>} />
            <Route path="/test/:testId" element={<MockTestInterface />} />
            <Route path="/review/:attemptId" element={<ReviewInterface />} />
            <Route path="/bank" element={<AppLayout><QuestionBank /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
          </Routes>
        </AuthGuard>
      </Router>
      <Analytics />
      <SpeedInsights />
    </HeaderProvider>
  );
}
