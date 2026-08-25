import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, CheckSquare } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export const GlobalSearch = () => {
  const { tests } = useStore();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTests = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return tests.filter(
      (test) =>
        (typeof test.title === 'string' ? test.title.toLowerCase().includes(lowerQuery) : String(test.title || '').toLowerCase().includes(lowerQuery)) ||
        (test.description && String(test.description).toLowerCase().includes(lowerQuery)) ||
        (test.examCategory && String(test.examCategory).toLowerCase().includes(lowerQuery))
    ).slice(0, 5); // Limit to top 5 results
  }, [query, tests]);

  return (
    <div className="w-full relative" ref={searchRef}>
      <div className="relative flex items-center w-full">
        <div className="absolute left-3 sm:left-4 text-slate-500">
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for tests..."
          className="w-full h-9 sm:h-[38px] pl-10 sm:pl-11 pr-10 text-[14px] sm:text-[15px] bg-slate-100/80 border-none rounded-full focus:outline-none focus:bg-slate-100 transition-all placeholder:text-slate-500 text-slate-800 font-medium"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 sm:right-4 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            title="Clear search"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query.trim() && (
          <>
            {/* Desktop Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="hidden md:block absolute top-full left-0 mt-2 w-80 md:w-96 bg-white/95 backdrop-blur-md rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-slate-100/80 overflow-hidden z-50 origin-top-left"
            >
              <div className="p-2 border-b border-slate-100/60 bg-transparent">
                <span className="text-[11px] font-semibold text-slate-400 px-2">Results</span>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                {filteredTests.length > 0 ? (
                  filteredTests.map((test) => (
                    <button
                      key={test.id}
                      onClick={() => {
                        navigate(`/test-details/${test.id}`);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="w-full text-left flex items-start gap-3 p-2.5 hover:bg-slate-50 rounded-lg transition-colors focus:outline-none focus:bg-slate-50 group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-100 transition-colors">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-[13px] font-semibold text-slate-800 truncate">{typeof test.title === 'string' ? test.title : String(test.title || 'Untitled Test')}</h4>
                        {test.examCategory && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md">
                            {typeof test.examCategory === 'string' ? test.examCategory : String(test.examCategory || '')}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                      <Search className="w-5 h-5" />
                    </div>
                    <p className="text-[13px] font-medium text-slate-600">No mock tests found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Mobile Full-Screen Overlay */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className="md:hidden fixed inset-0 z-[100] bg-slate-50 flex flex-col"
            >
              {/* Mobile Header */}
              <div className="flex items-center gap-2 p-3 bg-white border-b border-slate-200">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 -ml-2 text-slate-500 rounded-full hover:bg-slate-100 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                </button>
                <div className="relative flex-1 flex items-center">
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for tests..."
                    className="w-full h-10 pl-3 pr-8 text-sm bg-transparent focus:outline-none text-slate-800"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="absolute right-2 text-slate-400 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Mobile Results */}
              <div className="flex-1 overflow-y-auto p-2">
                {filteredTests.length > 0 ? (
                  filteredTests.map((test) => (
                    <button
                      key={test.id}
                      onClick={() => {
                        navigate(`/test-details/${test.id}`);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="w-full text-left flex items-start gap-3 p-3 bg-white mb-2 rounded-xl border border-slate-100 shadow-sm transition-colors focus:outline-none cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <CheckSquare className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-slate-800 truncate">{typeof test.title === 'string' ? test.title : String(test.title || 'Untitled Test')}</h4>
                        {test.examCategory && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md">
                            {typeof test.examCategory === 'string' ? test.examCategory : String(test.examCategory || '')}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-16 text-center">
                    <div className="w-12 h-12 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No mock tests found</p>
                    <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
