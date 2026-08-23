import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleDrive } from '../contexts/GoogleDriveContext';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Globe, DownloadCloud, Trash2, BookOpen, Clock, AlignLeft, AlarmClock, Database, ArrowLeftRight, Share2, Lock, Calendar, HardDrive, RefreshCw } from 'lucide-react';
import { Ripple } from '../components/Ripple';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ShareTestModal } from '../components/ShareTestModal';
import { Test } from '../types';
import { getTestDisplayDate } from '../lib/dateUtils';
import QuestionBank from './QuestionBank';

export default function Tests() {
  const { user } = useAuth();
  const { tests, activeTestSessions } = useStore();
  const { isConnected: isDriveConnected, isSyncing: isDriveSyncing, deleteTest: deleteDriveTest, refreshFromDrive } = useGoogleDrive();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'imported' | 'online'>('imported');
  const [testToDelete, setTestToDelete] = useState<{ id: string; title: string } | null>(null);
  const [testToShare, setTestToShare] = useState<Test | null>(null);

  const handleDeleteConfirm = async () => {
    if (testToDelete) {
      const idToDelete = testToDelete.id;
      await deleteDriveTest(idToDelete);
      setTestToDelete(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 24 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
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
          className={`relative flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-sm transition-colors rounded-xl outline-none ${activeTab === 'imported' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {activeTab === 'imported' && (
            <motion.div 
              layoutId="tab-indicator"
              className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50"
              transition={{ type: "spring" as any, stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2"><DownloadCloud className="w-4 h-4" /> Imported</span>
        </button>
        <button
          onClick={() => setActiveTab('online')}
          className={`relative flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-sm transition-colors rounded-xl outline-none ${activeTab === 'online' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {activeTab === 'online' && (
            <motion.div 
              layoutId="tab-indicator"
              className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50"
              transition={{ type: "spring" as any, stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2"><Globe className="w-4 h-4" /> Online</span>
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'imported' && (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-2.5"
          >
            <AnimatePresence>
              {tests.map((test, index) => {
                const pos = test.positiveMarks ?? (test.examCategory === 'SSC CGL' ? 2.0 : 1.0);
                const neg = test.negativeMarks ?? (test.examCategory === 'SSC CGL' ? 0.5 : 0.25);
                const isNoNeg = neg === 0;
                
                return (
                  <motion.div 
                    variants={itemVariants}
                    exit="exit"
                    layout
                    key={test.id} 
                    onClick={() => navigate(`/test-details/${test.id}`)}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer flex gap-4 group"
                  >
                    {/* Left Icon */}
                    <div className="shrink-0 mt-0.5">
                      <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    </div>
                    
                    {/* Right Content */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* Title */}
                      <h4 className="font-bold text-base text-slate-800 line-clamp-1 group-hover:text-blue-700 transition-colors mb-2">
                        {test.title}
                      </h4>
                      
                      {/* Info Pills Row 1 */}
                      <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
                        <span className="flex items-center gap-1.5 text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {getTestDisplayDate(test)}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 font-medium">
                          <AlignLeft className="w-3.5 h-3.5 text-slate-500" />
                          {test.questions.length} Qs
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {Math.floor(test.timeLimit / 60)}m
                        </span>
                      </div>
                      
                      {/* Info Pills Row 2 */}
                      <div className="flex items-center gap-2 flex-wrap text-xs mb-3">
                        <span className={`px-2 py-1 rounded border font-medium ${
                          isNoNeg ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {isNoNeg ? 'No Neg' : `+${pos.toFixed(1)} / -${neg.toFixed(2)}`}
                        </span>
                        {test.settings?.strictSectionalTiming && !test.settings?.allowSectionSwitching && (
                          <span className="flex items-center gap-1.5 text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-100 font-medium">
                            <AlarmClock className="w-3.5 h-3.5 text-orange-600" />
                            Strict Timing
                          </span>
                        )}
                        {test.settings?.allowSectionSwitching && (
                          <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 font-medium">
                            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                            Switch Sections
                          </span>
                        )}
                        {activeTestSessions && activeTestSessions[test.id] && (
                          <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100 font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            In Progress
                          </span>
                        )}
                      </div>
                      
                      {/* Divider */}
                      <div className="h-px border-b border-dashed border-slate-200 mb-3 w-full" />
                      
                      {/* Bottom Actions Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 -ml-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTestToShare(test);
                            }}
                            className="p-1.5 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                            title="Share Mock Test"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTestToDelete({ id: test.id, title: test.title });
                            }}
                            className="p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
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
                            "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm",
                            activeTestSessions && activeTestSessions[test.id]
                              ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                              : "bg-blue-600 border border-transparent text-white hover:bg-blue-700"
                          )}
                        >
                          {activeTestSessions && activeTestSessions[test.id] ? null : <PlayCircle className="w-4 h-4" />}
                          {activeTestSessions && activeTestSessions[test.id] ? "Resume" : "Start"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {tests.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden"
              >
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
                  className="relative z-10 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 group"
                >
                  <DownloadCloud className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                  Import Mock Test
                  <Ripple color="bg-white/20" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'online' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm"
          >
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-5">
              <Globe className="w-10 h-10 text-blue-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Online Tests</h3>
            <p className="text-slate-500 mt-2 max-w-sm text-center leading-relaxed">
              Connect to our online repository to discover and take new tests directly from the cloud. Coming soon!
            </p>
          </motion.div>
        )}
      </div>

      {/* Delete Test Confirmation Modal */}
      {createPortal(
        <AnimatePresence>
          {testToDelete && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative z-10"
              >
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
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
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
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
      {/* Google Drive-style Share Test Modal */}
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
