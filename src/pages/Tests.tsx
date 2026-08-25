import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleDrive } from '../contexts/GoogleDriveContext';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Globe, DownloadCloud, Trash2, BookOpen, Clock, AlignLeft, Database, ArrowLeftRight, Share2, Calendar, Folder, ChevronRight, Home, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { ShareTestModal } from '../components/ShareTestModal';
import { Test } from '../types';
import { getTestDisplayDate } from '../lib/dateUtils';

export default function Tests() {
  const { tests, activeTestSessions } = useStore();
  const { isConnected: isDriveConnected, isSyncing: isDriveSyncing, deleteTest: deleteDriveTest, refreshFromDrive } = useGoogleDrive();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'imported' | 'online'>('imported');
  const [testToDelete, setTestToDelete] = useState<{ id: string; title: string } | null>(null);
  const [testToShare, setTestToShare] = useState<Test | null>(null);
  
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  // Auto-navigate up if current path becomes empty (e.g. after deleting the last test in a category)
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

  const handleDeleteConfirm = async () => {
    if (testToDelete) {
      const idToDelete = testToDelete.id;
      await deleteDriveTest(idToDelete);
      setTestToDelete(null);
    }
  };

  const getFolderContents = (path: string[]) => {
    const folders = new Set<string>();
    const testsInFolder: Test[] = [];

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
        if (testPath.length > path.length) {
          folders.add(testPath[path.length]);
        } else {
          testsInFolder.push(test);
        }
      }
    });

    return {
      folders: Array.from(folders).sort(),
      testsInFolder
    };
  };

  const { folders, testsInFolder } = getFolderContents(currentPath);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between pt-0 md:pt-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Mock Tests</h2>
          <p className="text-slate-500 text-sm mt-1">Select a test to challenge yourself.</p>
        </div>
        {isDriveConnected && (
          <button
            onClick={() => refreshFromDrive()}
            disabled={isDriveSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-100/80 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            title="Refresh latest tests from Google Drive"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDriveSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{isDriveSyncing ? 'Refreshing...' : 'Refresh Drive'}</span>
          </button>
        )}
      </div>

      <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('imported')}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-sm transition-colors rounded-xl outline-none ${activeTab === 'imported' ? 'bg-white text-blue-700 shadow-sm border border-slate-100/80/50' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <DownloadCloud className="w-4 h-4" /> <span>Imported</span>
        </button>
        <button
          onClick={() => setActiveTab('online')}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-sm transition-colors rounded-xl outline-none ${activeTab === 'online' ? 'bg-white text-blue-700 shadow-sm border border-slate-100/80/50' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Globe className="w-4 h-4" /> <span>Online</span>
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'imported' && (
          <div className="flex flex-col gap-4">
            {/* Breadcrumbs */}
            {tests.length > 0 && (
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
            )}

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

              {/* Tests */}
              {testsInFolder.map((test) => {
                const pos = test.positiveMarks ?? (test.examCategory === 'SSC CGL' ? 2.0 : 1.0);
                const neg = test.negativeMarks ?? (test.examCategory === 'SSC CGL' ? 0.5 : 0.25);
                const isNoNeg = neg === 0;
                
                let displayTime = test.timeLimit || 0;
                if (!displayTime || displayTime <= 0) {
                  if (test.sections && test.sections.length > 0) {
                    displayTime = test.sections.reduce((acc, s) => acc + (s.timeLimit || 0), 0);
                  }
                  if (!displayTime || displayTime <= 0) displayTime = 3600;
                }
                
                return (
                  <div 
                    key={test.id} 
                    onClick={() => navigate(`/test-details/${test.id}`)}
                    className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow cursor-pointer flex gap-3.5 group"
                  >
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors rounded-[12px] flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col">
                      <h4 className="font-semibold text-[15px] text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors mb-1.5">
                        {test.title}
                      </h4>
                      
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] mb-1.5">
                        <span className="flex items-center gap-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {getTestDisplayDate(test)}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                          <AlignLeft className="w-3 h-3 text-slate-400" />
                          {test.questions.length} Qs
                        </span>
                        <span className="flex items-center gap-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {Math.floor(displayTime / 60)}m
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] mb-2.5">
                        <span className={`px-1.5 py-0.5 rounded-md border font-medium ${
                          isNoNeg ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100/50' : 'bg-blue-50/50 text-blue-600 border-blue-100/50'
                        }`}>
                          {isNoNeg ? 'No Neg' : `+${pos.toFixed(1)} / -${neg.toFixed(2)}`}
                        </span>
                        {test.settings?.strictSectionalTiming && !test.settings?.allowSectionSwitching && (
                          <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded-md border border-indigo-100/50 font-medium">
                            <ArrowLeftRight className="w-3 h-3 text-indigo-500" />
                            Strict Sections
                          </span>
                        )}
                        {test.settings?.allowSectionSwitching && (
                          <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded-md border border-indigo-100/50 font-medium">
                            <ArrowLeftRight className="w-3 h-3 text-indigo-500" />
                            Switch Sections
                          </span>
                        )}
                        {activeTestSessions && activeTestSessions[test.id] && (
                          <span className="flex items-center gap-1 text-amber-600 bg-amber-50/50 px-1.5 py-0.5 rounded-md border border-amber-100/50 font-medium">
                            <Clock className="w-3 h-3 text-amber-500" />
                            In Progress
                          </span>
                        )}
                      </div>
                      
                      <div className="h-px border-b border-dashed border-slate-100 mb-2.5 w-full" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5 -ml-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTestToShare(test);
                            }}
                            className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                            title="Share Mock Test"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTestToDelete({ id: test.id, title: test.title });
                            }}
                            className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                            title="Delete Test"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/test-details/${test.id}`);
                          }}
                          className={cn(
                            "flex items-center gap-1 px-3.5 py-1.5 rounded-[10px] text-[13px] font-semibold transition-colors",
                            activeTestSessions && activeTestSessions[test.id]
                              ? "bg-slate-50 border border-slate-100/80 text-slate-700 hover:bg-slate-100"
                              : "bg-blue-600 border border-transparent text-white hover:bg-blue-700 shadow-sm"
                          )}
                        >
                          {activeTestSessions && activeTestSessions[test.id] ? null : <PlayCircle className="w-4 h-4" />}
                          {activeTestSessions && activeTestSessions[test.id] ? "Resume" : "Start"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {tests.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
                <div className="w-24 h-24 bg-white shadow-sm border border-slate-100 rounded-[2rem] flex items-center justify-center mb-6 relative z-10">
                  <Database className="w-10 h-10 text-blue-500/80" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight relative z-10">No questions found</h3>
                <p className="text-slate-500 mt-3 mb-8 max-w-sm relative z-10 leading-relaxed">
                  Start practicing by importing a mock test bundle. You can upload custom JSON question banks to get started.
                </p>
                <button
                  onClick={() => navigate('/bank')}
                  className="relative z-10 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.3)] transition-colors flex items-center gap-2"
                >
                  <DownloadCloud className="w-5 h-5" />
                  Import Mock Test
                </button>
              </div>
            )}
            
            {tests.length > 0 && folders.length === 0 && testsInFolder.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
                  <Folder className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Empty Folder</h3>
                <p className="text-slate-500 mt-2">No tests found in this directory.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'online' && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-5">
              <Globe className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Online Tests</h3>
            <p className="text-slate-500 mt-2 max-w-sm text-center leading-relaxed">
              Connect to our online repository to discover and take new tests directly from the cloud. Coming soon!
            </p>
          </div>
        )}
      </div>

      {testToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative z-10">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Delete Test Paper?</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-700">"{testToDelete.title}"</strong>? All associated attempt records will also be permanently deleted.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setTestToDelete(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-100/80 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-sm text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {testToShare && (
        <ShareTestModal
          test={testToShare}
          isOpen={!!testToShare}
          onClose={() => setTestToShare(null)}
        />
      )}
    </div>
  );
}
