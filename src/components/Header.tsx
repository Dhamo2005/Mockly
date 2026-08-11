import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, LogOut, LogIn, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const Header = () => {
  const { user, signInWithGoogle, signOut } = useAuth();
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
      document.addEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-[var(--color-surface)] h-[64px] flex items-center justify-between px-6 shrink-0 z-10 shadow-sm relative">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <BookOpen className="text-[var(--color-primary)] h-6 w-6" />
        <h1 className="text-lg font-bold text-[var(--color-on-surface)] tracking-tight">Mockly</h1>
      </Link>
      <div className="flex items-center gap-3">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 focus:outline-none hover:bg-[var(--color-surface-container)] p-1.5 rounded-full transition-colors"
            >
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-gray-200"
              />
              <span className="text-sm font-medium hidden sm:block text-[var(--color-on-surface)] pr-2">{user.displayName?.split(' ')[0]}</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-2xl shadow-lg overflow-hidden z-50 py-2">
                <div className="px-4 py-2 border-b border-[var(--color-outline-variant)] mb-2">
                  <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">{user.displayName}</p>
                </div>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors w-full text-left"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button 
                  onClick={() => {
                    signOut();
                    setIsDropdownOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="gsi-material-button relative flex items-center justify-center bg-white border border-[#dadce0] rounded text-[#3c4043] font-medium text-sm h-10 px-3 hover:bg-[#f8fafc] focus:outline-none transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-[18px] h-[18px] block">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              <span>Sign in with Google</span>
            </div>
          </button>
        )}
      </div>
    </header>
  );
};
