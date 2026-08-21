import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { deleteTestFromFirestore, saveToFirestore } from '../lib/firebaseSync';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Globe, DownloadCloud, Trash2, BookOpen, Clock, AlignLeft, AlarmClock, Database, ArrowLeftRight, Share2, Lock, Calendar } from 'lucide-react';
import { Ripple } from '../components/Ripple';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ShareTestModal } from '../components/ShareTestModal';
import { Test } from '../types';
import { getTestDisplayDate } from '../lib/dateUtils';
import QuestionBank from './QuestionBank';

export default function Tests() {
  const { user } = useAuth();
  const { tests, deleteTest, activeTestSessions } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'imported' | 'online'>('imported');
  const [testToDelete, setTestToDelete] = useState<{ id: string; title: string } | null>(null);
  const [testToShare, setTestToShare] = useState<Test | null>(null);

  const handleDeleteConfirm = async () => {
    if (testToDelete) {
      const idToDelete = testToDelete.id;
      deleteTest(idToDelete);
      setTestToDelete(null);
      if (user?.uid) {
        await deleteTestFromFirestore(idToDelete);
        saveToFirestore(user.uid, null, true);
      }
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
                    className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0 border border-slate-200 group-hover:border-blue-200">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-blue-700 transition-colors">
                          {test.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px]">
                          <span className="flex items-center gap-1 text-slate-600 bg-slate-100/90 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {getTestDisplayDate(test)}
                          </span>
                          <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                            <AlignLeft className="w-3 h-3 text-slate-400" />
                            {test.questions.length} Qs
                          </span>
                          <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {Math.floor(test.timeLimit / 60)}m
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border font-semibold ${
                            isNoNeg ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {isNoNeg ? 'No Neg' : `+${pos.toFixed(1)} / -${neg.toFixed(2)}`}
                          </span>
                          {test.settings?.strictSectionalTiming && !test.settings?.allowSectionSwitching && (
                            <span className="flex items-center gap-1 text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200 font-semibold">
                              <AlarmClock className="w-3 h-3 text-orange-500" />
                              Strict Timing
                            </span>
                          )}
                          {test.settings?.allowSectionSwitching && (
                            <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-semibold">
                              <ArrowLeftRight className="w-3 h-3 text-indigo-500" />
                              Switch Sections
                            </span>
                          )}
                          {activeTestSessions && activeTestSessions[test.id] && (
                            <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
                              <Clock className="w-3 h-3 text-amber-500" />
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 sm:ml-0 ml-10 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTestToShare(test);
                        }}
                        className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                        title="Share Mock Test"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/test-details/${test.id}`);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-xs",
                          activeTestSessions && activeTestSessions[test.id]
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        )}
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> 
                        {activeTestSessions && activeTestSessions[test.id] ? "Resume" : "Start"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTestToDelete({ id: test.id, title: test.title });
                        }}
                        className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        title="Delete Test"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
