import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen, BarChart3, Settings, Upload, CheckSquare, Clock, LogIn } from 'lucide-react';
import { Header } from './components/Header';
import Dashboard from './pages/Dashboard';
import Tests from './pages/Tests';
import TestDetails from './pages/TestDetails';
import TestAnswers from './pages/TestAnswers';
import TestEditor from './pages/TestEditor';
import MockTestInterface from './pages/MockTestInterface';
import ReviewInterface from './pages/ReviewInterface';
import QuestionBank from './pages/QuestionBank';
import SettingsPage from './pages/Settings';
import { useAuth } from './contexts/AuthContext';

import { initDB } from './lib/db';

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isSigningIn, authError, signInWithGoogle } = useAuth();
  const [dbReady, setDbReady] = React.useState(false);

  React.useEffect(() => {
    initDB().then(() => setDbReady(true)).catch(console.error);
  }, []);

  if (loading || !dbReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/20 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white/90 backdrop-blur-2xl p-8 md:p-10 rounded-[32px] max-w-md w-full shadow-2xl shadow-blue-500/10 border border-slate-100/80 flex flex-col items-center relative overflow-hidden">
          <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner relative">
            <BookOpen className="w-10 h-10 text-blue-600" />
          </div>

          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Mockly</h1>
          <p className="text-slate-500 text-sm mt-3 leading-relaxed">
            Sign in with your Google account to access your mock tests, candidate attempts, and automatically sync your data directly to your personal <strong>Google Drive</strong>.
          </p>

          {authError && (
            <div className="w-full bg-rose-50 text-rose-900 border border-rose-200 text-xs p-4 rounded-2xl mt-4 text-left space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <span>Sign-In Error</span>
              </div>
              <p className="text-rose-700 leading-relaxed">
                {authError}
              </p>
            </div>
          )}

          <button
            onClick={signInWithGoogle}
            disabled={isSigningIn}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/25 transition-colors flex items-center justify-center gap-3 text-sm mt-6 cursor-pointer disabled:cursor-not-allowed"
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
          </button>

          <p className="text-xs text-slate-400 mt-6">
            All your data is securely and privately stored in your Google Drive.
          </p>
        </div>
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
            <div
              className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors relative focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isActive(item.path)
                  ? 'bg-blue-50/80 text-blue-700 font-semibold border border-blue-100/50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              {isActive(item.path) && (
                <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-blue-600 rounded-r-full" />
              )}
              <item.icon className={`h-4 w-4 ${isActive(item.path) ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'}`} />
              <span className="text-sm tracking-tight">{item.label}</span>
            </div>
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.03)]" aria-label="Mobile Navigation">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          aria-current={isActive(item.path) ? 'page' : undefined}
          className="block outline-none"
        >
          <div
            className={`group flex flex-col items-center justify-center gap-1 p-2 w-16 h-14 rounded-2xl relative transition-colors ${
              isActive(item.path)
                ? 'text-blue-600 bg-blue-50/80 font-semibold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[11px] tracking-wide">
              {item.label}
            </span>
          </div>
        </Link>
      ))}
    </nav>
  );
};


const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <div className="aria-announcer sr-only" aria-live="polite" aria-atomic="true" id="global-announcer"></div>
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 min-w-0 bg-[#f8fafc] border-l border-slate-200/50 flex flex-col">
          <div className="flex-1 px-3 py-4 md:px-6 md:py-6 pb-24 md:pb-8">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

import { HeaderProvider } from './contexts/HeaderContext';
import { ActiveTestRedirect } from './components/ActiveTestRedirect';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function App() {
  return (
    <HeaderProvider>
      <Router>
        <AuthGuard>
          <ActiveTestRedirect />
          <Routes>
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/tests" element={<AppLayout><Tests /></AppLayout>} />
            <Route path="/test-details/:testId" element={<AppLayout><TestDetails /></AppLayout>} />
            <Route path="/test-answers/:testId" element={<AppLayout><TestAnswers /></AppLayout>} />
            <Route path="/test-edit/:testId" element={<TestEditor />} />
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
