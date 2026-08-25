import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useGoogleDrive } from '../contexts/GoogleDriveContext';
import { PlayCircle, CheckCircle2, Clock, BarChart, Trash2, ArrowRight, Loader2, Calendar, RefreshCw, HardDrive, Home, ChevronRight, Folder, BookOpen, AlignLeft, ArrowLeftRight } from 'lucide-react';
import { getAttemptDate } from '../lib/dateUtils';
import { Test } from '../types';
import { getTestDisplayDate } from '../lib/dateUtils';

export default function Dashboard() {
  const { tests, attempts, isInitialized } = useStore();
  const { isConnected: isDriveConnected, isSyncing: isDriveSyncing, refreshFromDrive, deleteAttempt } = useGoogleDrive();
  const navigate = useNavigate();
  const [attemptToDelete, setAttemptToDelete] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  // Auto-navigate up if current path becomes empty
  React.useEffect(() => {
    if (currentPath.length > 0) {
      let pathHasTests = false;
      for (const test of tests) {
        const testPath = [];
        if (test.examCategory) testPath.push(test.examCategory);
        if (test.exam?.tier) testPath.push(test.exam.tier);
        
        let matches = true;
        for (let i = 0; i < currentPath.length; i++) {
          if (testPath[i] !== currentPath[i]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          pathHasTests = true;
          break;
        }
      }
      
      if (!pathHasTests) {
        setCurrentPath(prev => prev.slice(0, -1));
      }
    }
  }, [tests, currentPath]);

  const getFolderContents = (path: string[]) => {
    const folders = new Set<string>();
    const testsUnderPath: Test[] = [];
    tests.forEach(test => {
      const testPath: string[] = [];
      if (test.examCategory) testPath.push(test.examCategory);
      if (test.exam?.tier) testPath.push(test.exam.tier);
      let matchesPath = true;
      for (let i = 0; i < path.length; i++) {
        if (testPath[i] !== path[i]) {
          matchesPath = false;
          break;
        }
      }
      if (matchesPath) {
        testsUnderPath.push(test);
        if (testPath.length > path.length) {
          folders.add(testPath[path.length]);
        }
      }
    });
    return {
      folders: Array.from(folders).sort(),
      testsUnderPath
    };
  };

  const { folders, testsUnderPath } = getFolderContents(currentPath);
  const testIdsUnderPath = new Set(testsUnderPath.map(t => t.id));
  const pathAttempts = attempts.filter(a => testIdsUnderPath.has(a.testId));

  const completedAttempts = pathAttempts.filter(a => a.completed);
  const totalScore = completedAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
  const averageScore = completedAttempts.length > 0 ? (totalScore / completedAttempts.length).toFixed(1) : 0;

  if (!isInitialized && tests.length === 0 && attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading test database...</p>
      </div>
    );
  }

  if (tests.length === 0 && attempts.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 py-10">
        <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center shadow-inner mb-2">
          <CheckCircle2 className="w-10 h-10 text-blue-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">You're all set!</h2>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm leading-relaxed">
            Your Cloud storage is connected, but it looks a bit empty. Let's import some mock tests to get started.
          </p>
        </div>
        <button
          onClick={() => navigate('/bank')}
          className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 text-sm mt-6 flex items-center gap-2"
        >
          Go to Question Bank <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6">
      <div className="pt-2 md:pt-4 flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h2>
        {isDriveConnected && (
          <button
            onClick={() => refreshFromDrive()}
            disabled={isDriveSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100/80 text-slate-700 hover:bg-slate-50 rounded-full text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            title="Refresh latest tests and attempts from Google Drive"
          >
            <RefreshCw className={`w-4 h-4 ${isDriveSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{isDriveSyncing ? 'Refreshing...' : 'Refresh from Drive'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-[12px] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tests Completed</p>
            <p className="text-2xl font-bold text-slate-800 leading-none">{completedAttempts.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-[12px] flex items-center justify-center shrink-0">
            <BarChart className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg. Score</p>
            <p className="text-2xl font-bold text-slate-800 leading-none">{averageScore}</p>
          </div>
        </div>
      </div>

      {/* Folder Structure */}
      <div className="mt-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-bold text-slate-800">Test Library</h3>
        </div>
        
        {tests.length > 0 ? (
          <div className="space-y-3">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-white px-4 py-3 rounded-xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-x-auto whitespace-nowrap hide-scrollbar">
              <button 
                onClick={() => setCurrentPath([])}
                className={`flex items-center gap-1.5 transition-colors ${currentPath.length === 0 ? 'text-blue-600' : 'hover:text-slate-800'}`}
              >
                <Home className="w-4 h-4" /> Home
              </button>
              {currentPath.map((folder, idx) => (
                <React.Fragment key={folder}>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                  <button 
                    onClick={() => setCurrentPath(currentPath.slice(0, idx + 1))}
                    className={`transition-colors ${idx === currentPath.length - 1 ? 'text-blue-600' : 'hover:text-slate-800'}`}
                  >
                    {folder}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Folders */}
              {folders.map(folder => (
                <div 
                  key={`folder-${folder}`}
                  onClick={() => setCurrentPath([...currentPath, folder])}
                  className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow cursor-pointer flex items-center gap-4 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-50 text-blue-500 rounded-[12px] flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Folder className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[15px] text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {folder}
                    </h4>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-center">
             <p className="text-slate-500 text-[14px]">No tests imported yet. Go to Question Bank to import tests.</p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100/80 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100/80 bg-white/50 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-800">
              Recent Activity {currentPath.length > 0 ? ` in ${currentPath[currentPath.length - 1]}` : ''}
            </h3>
          </div>
          <div className="divide-y divide-slate-100/80">
            {pathAttempts.slice().reverse().slice(0, 5).map((attempt) => {
              const test = tests.find(t => t.id === attempt.testId);
              if (!test) return null;
              
              const positiveMarks = test.positiveMarks ?? (test.examCategory === 'SSC CGL' ? 2.0 : 1.0);
              const maxMarks = (test.questions?.length || 1) * positiveMarks;
              const percentage = Math.max(0, Math.round(((attempt.score || 0) / maxMarks) * 100)) || 0;
              
              return (
                <div 
                  key={attempt.id} 
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-[15px] text-slate-800 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate(`/test-details/${test.id}`)}>
                        {test.title}
                      </h4>
                      {getAttemptDate(attempt) && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100/70 px-1.5 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {getAttemptDate(attempt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[13px]">
                      <div className="flex items-center gap-2 flex-1 max-w-[160px]">
                        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-600 w-8">{percentage}%</span>
                      </div>
                      <span className="text-slate-500 font-medium whitespace-nowrap">
                        Score: <span className="text-slate-700 font-semibold">{attempt.score?.toFixed(1)}</span> / {maxMarks}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0 sm:ml-3">
                    <button 
                      onClick={() => setAttemptToDelete(attempt.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete attempt record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => navigate(`/review/${attempt.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 font-semibold text-[13px] rounded-lg hover:bg-blue-100 transition-colors ml-1"
                    >
                      Analytics
                    </button>
                  </div>
                </div>
              );
            })}
            
            {pathAttempts.length === 0 && (
              <div className="py-10 px-4 text-center text-slate-500 text-[15px]">
                No recent activity in this folder.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Attempt Modal */}
      {attemptToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative z-10">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Delete Attempt Record?</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete this test result? This record cannot be recovered.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setAttemptToDelete(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-100/80 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (attemptToDelete) {
                    deleteAttempt(attemptToDelete);
                    setAttemptToDelete(null);
                  }
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-sm text-sm"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
