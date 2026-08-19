import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BookOpen, LogOut, LogIn, Settings, PlayCircle, X } from 'lucide-react';
import { useAuth, getAccessToken } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { useStore } from '../store/useStore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { saveSQLiteToDrive } from '../lib/sqliteDriveSync';

export const Header = () => {
  const { user, isSigningIn, signInWithGoogle, signOut } = useAuth();
  const { headerContent } = useHeader();
  const { activeTestSessions, tests, attempts, clearActiveTestSession } = useStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Find genuine, valid active test session
  const activeSessionEntry = useMemo(() => {
    if (!activeTestSessions || Object.keys(activeTestSessions).length === 0) return null;

    const now = Date.now();
    const validEntries: Array<{ testId: string; session: any; test: any }> = [];

    for (const [testId, session] of Object.entries(activeTestSessions)) {
      if (!session) continue;
      const test = tests.find(t => t.id === testId);
      if (!test) continue;

      // Check if session has timed out completely
      const isStrict = Boolean(test.settings?.strictSectionalTiming && !test.settings?.allowSectionSwitching);
      if (isStrict && session.sectionTimeLeft) {
        const secValues = Object.values(session.sectionTimeLeft) as number[];
        const hasTimeLeft = secValues.length > 0 && secValues.some(secTime => secTime > 0);
        if (!hasTimeLeft && (session.timeLeft !== undefined && session.timeLeft <= 0)) {
          continue; // All sections expired
        }
      } else if (session.timeLeft !== undefined && session.timeLeft <= 0) {
        continue; // Regular timer expired
      }

      // Check if an attempt was already completed for this test
      const alreadySubmitted = attempts.some(a => 
        a.testId === testId && 
        (a.completed || (a.endTime && a.endTime >= (session.lastUpdated || 0) - 2000))
      );
      if (alreadySubmitted) continue;

      // Stale check: Tests left inactive for over 3 hours are expired
      if (session.lastUpdated && now - session.lastUpdated > 3 * 60 * 60 * 1000) {
        continue;
      }

      validEntries.push({ testId, session, test });
    }

    if (validEntries.length === 0) return null;

    // Pick the most recently updated session
    validEntries.sort((a, b) => (b.session.lastUpdated || 0) - (a.session.lastUpdated || 0));
    return validEntries[0];
  }, [activeTestSessions, tests, attempts]);

  const activeTest = activeSessionEntry?.test || null;
  const isTestPage = location.pathname.startsWith('/test/');

  // Auto-prune expired / submitted / stale sessions in background
  useEffect(() => {
    if (!activeTestSessions) return;
    const now = Date.now();
    let hasCleaned = false;

    for (const [testId, session] of Object.entries(activeTestSessions)) {
      if (!session) continue;
      const test = tests.find(t => t.id === testId);
      const isStrict = Boolean(test?.settings?.strictSectionalTiming && !test?.settings?.allowSectionSwitching);
      let expired = false;

      if (!test) {
        expired = true;
      } else if (isStrict && session.sectionTimeLeft) {
        const secValues = Object.values(session.sectionTimeLeft) as number[];
        if (secValues.length > 0 && secValues.every(v => v <= 0)) {
          expired = true;
        }
      } else if (session.timeLeft !== undefined && session.timeLeft <= 0) {
        expired = true;
      }

      const alreadySubmitted = attempts.some(a => 
        a.testId === testId && 
        (a.completed || (a.endTime && a.endTime >= (session.lastUpdated || 0) - 2000))
      );

      const isStale = Boolean(session.lastUpdated && (now - session.lastUpdated > 3 * 60 * 60 * 1000));

      if (expired || alreadySubmitted || isStale) {
        clearActiveTestSession(testId);
        hasCleaned = true;
      }
    }

    if (hasCleaned) {
      const token = getAccessToken();
      saveSQLiteToDrive(token, useStore.getState(), false);
    }
  }, [activeTestSessions, tests, attempts, clearActiveTestSession]);

  const handleDiscardActiveTest = (e: React.MouseEvent, testId: string) => {
    e.stopPropagation();
    clearActiveTestSession(testId);
    const token = getAccessToken();
    saveSQLiteToDrive(token, useStore.getState(), true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white/80 backdrop-blur-xl h-14 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border-b border-slate-100 relative">
      <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg" aria-label="Go to Dashboard">
        <motion.div 
          whileHover={{ rotate: 10, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-600 p-1.5 rounded-xl shadow-[0_2px_10px_rgba(37,99,235,0.25)] text-white flex items-center justify-center"
        >
          <BookOpen className="h-4 w-4" />
        </motion.div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight">Mockly</h1>
      </Link>

      {/* Centered Active Test Button - Only shown when a genuine active test exists and not on test page */}
      {activeTest && !isTestPage && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center z-30">
          <div className="flex items-center bg-amber-50 hover:bg-amber-100/90 text-amber-800 border border-amber-300/80 rounded-full shadow-sm text-xs sm:text-sm font-semibold transition-all">
            <button
              onClick={() => navigate(`/test/${activeTest.id}`)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-l-full cursor-pointer"
              title={`Resume ${activeTest.title}`}
            >
              <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-amber-500"></span>
              </span>
              <span className="hidden sm:inline">Resume: {activeTest.title.length > 22 ? activeTest.title.substring(0, 22) + '...' : activeTest.title}</span>
              <span className="inline sm:hidden">Active Test</span>
              <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 ml-0.5" />
            </button>
            <button
              onClick={(e) => handleDiscardActiveTest(e, activeTest.id)}
              className="p-1.5 pr-2.5 hover:text-red-600 transition-colors text-amber-600/70 focus:outline-none cursor-pointer"
              title="Discard active session"
              aria-label="Discard active test session"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        {headerContent}
        
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:bg-slate-50 p-1.5 rounded-full transition-colors border border-transparent hover:border-slate-200"
              aria-label="Toggle user menu"
              aria-expanded={isDropdownOpen}
            >
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`} 
                alt={`${user.displayName || 'User'}'s profile`} 
                className="w-8 h-8 rounded-full border border-slate-200 shadow-sm"
              />
              <span className="text-sm font-bold hidden sm:block text-slate-700 pr-2">{user.displayName?.split(' ')[0]}</span>
            </motion.button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-50 py-2 origin-top-right"
                >
                  <div className="px-5 py-3 border-b border-slate-50 mb-1 bg-slate-50/50">
                    <p className="text-sm font-bold text-slate-800 truncate">{user.displayName}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/settings');
                    }}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors w-full text-left"
                  >
                    <Settings className="w-[18px] h-[18px]" />
                    Settings
                  </button>
                  
                  <button 
                    onClick={() => {
                      signOut();
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors w-full text-left mt-1"
                  >
                    <LogOut className="w-[18px] h-[18px]" />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.button 
            whileHover={{ scale: isSigningIn ? 1 : 1.02 }}
            whileTap={{ scale: isSigningIn ? 1 : 0.98 }}
            onClick={signInWithGoogle}
            disabled={isSigningIn}
            className="relative flex items-center justify-center bg-white border border-slate-200 shadow-sm rounded-full text-slate-700 font-bold text-sm h-10 px-4 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Sign in with Google"
          >
            <div className="flex items-center gap-2.5">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 block">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              <span>Sign In</span>
            </div>
          </motion.button>
        )}
      </div>
    </header>
  );
};
