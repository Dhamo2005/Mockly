import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, LogOut, LogIn, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export const Header = () => {
  const { user, isSigningIn, signInWithGoogle, signOut } = useAuth();
  const { headerContent } = useHeader();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
