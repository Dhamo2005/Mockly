import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PlayCircle, CheckCircle2, Clock, BarChart, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { Ripple } from '../components/Ripple';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const { tests, attempts, deleteAttempt, isInitialized } = useStore();
  const navigate = useNavigate();
  const [attemptToDelete, setAttemptToDelete] = useState<string | null>(null);

  const completedAttempts = attempts.filter(a => a.completed);
  const totalScore = completedAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
  const averageScore = completedAttempts.length > 0 ? (totalScore / completedAttempts.length).toFixed(1) : 0;

  const chartData = completedAttempts.slice(-10).map((a, i) => ({
    name: `Test ${i + 1}`,
    score: a.score || 0,
    maxScore: a.totalQuestions
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 24 } }
  };

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading test database...</p>
      </div>
    );
  }

  if (tests.length === 0 && attempts.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 py-10"
      >
        <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center shadow-inner mb-2">
          <CheckCircle2 className="w-10 h-10 text-blue-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">You're all set!</h2>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm leading-relaxed">
            Your Google Drive storage is connected, but it looks a bit empty. Let's import some mock tests to get started.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/bank')}
          className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 text-sm mt-6 flex items-center gap-2"
        >
          Go to Question Bank <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6"
    >
      <motion.div variants={itemVariants} className="pt-0 md:pt-2">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome Back!</h2>
        <p className="text-slate-500 text-sm mt-1">Ready to crush your next test?</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white p-4 md:p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center gap-4 transition-all">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tests Completed</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{completedAttempts.length}</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white p-4 md:p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center gap-4 transition-all">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
            <BarChart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Score</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{averageScore}</p>
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="mt-4 md:mt-8">
        <div className="bg-white p-1 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100">
          <div className="px-4 md:px-5 py-3 md:py-4 border-b border-slate-50">
            <h3 className="text-base font-bold text-slate-800">Recent Activity</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {attempts.slice().reverse().slice(0, 5).map((attempt, index) => {
              const test = tests.find(t => t.id === attempt.testId);
              if (!test) return null;
              
              const positiveMarks = test.positiveMarks ?? (test.examCategory === 'SSC CGL' ? 2.0 : 1.0);
              const maxMarks = (test.questions?.length || 1) * positiveMarks;
              const percentage = Math.max(0, Math.round(((attempt.score || 0) / maxMarks) * 100)) || 0;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.3 }}
                  key={attempt.id} 
                  className="p-3 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 hover:bg-slate-50/50 transition-colors first:rounded-t-none last:rounded-b-2xl"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate(`/test-details/${test.id}`)}>
                      {test.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                        <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600 w-8">{percentage}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <button 
                      onClick={() => setAttemptToDelete(attempt.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Remove attempt record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => navigate(`/review/${attempt.id}`)}
                      className="relative overflow-hidden flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-4 py-2 rounded-full hover:bg-slate-200 hover:text-slate-900 font-semibold transition-all"
                    >
                      Analytics
                      <Ripple color="bg-slate-400/20" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
            {attempts.length === 0 && (
              <div className="px-5 py-8 flex flex-col items-center justify-center text-slate-400">
                <PlayCircle className="w-10 h-10 opacity-20 mb-3" />
                <p className="text-sm font-medium">No recent attempts.</p>
                <p className="text-xs mt-1">Your test history will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Delete Attempt Modal */}
      {createPortal(
        <AnimatePresence>
          {attemptToDelete && (
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
                <h3 className="text-xl font-bold text-slate-800">Delete Attempt Record?</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Are you sure you want to delete this test result? This record cannot be recovered.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setAttemptToDelete(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
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
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}
