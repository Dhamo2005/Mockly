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
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-blue-700 rounded-full transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
